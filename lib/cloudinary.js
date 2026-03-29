import crypto from "node:crypto";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

function ensureCloudinaryConfig() {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are missing.");
  }
}

function signUploadParams(params) {
  const sortedParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${sortedParams}${apiSecret}`)
    .digest("hex");
}

export async function uploadImageToCloudinary(file, options = {}) {
  ensureCloudinaryConfig();

  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("Image file is required.");
  }

  if (!file.type?.startsWith("image/")) {
    throw new Error("Only image uploads are supported.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    folder: options.folder || "characters",
    timestamp,
  };
  const signature = signUploadParams(params);
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", params.folder);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.error?.message || "Cloudinary upload failed."
    );
  }

  return {
    url: payload.secure_url || payload.url,
    publicId: payload.public_id,
  };
}
