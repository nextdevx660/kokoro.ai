import "server-only";

const paypalEnvironment = (process.env.PAYPAL_ENVIRONMENT || "sandbox").toLowerCase();
const paypalBaseUrl =
  paypalEnvironment === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const paypalClientId =
  process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
const paypalCurrency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "USD";
const paypalPlanPrice = process.env.PAYPAL_PRO_PRICE || "9.99";

function requirePayPalConfig() {
  if (!paypalClientId || !paypalClientSecret) {
    throw new Error(
      "PayPal environment variables are missing. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET."
    );
  }
}

export function getPayPalPublicConfig() {
  return {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    currency: paypalCurrency,
    price: paypalPlanPrice,
    environment: paypalEnvironment,
  };
}

export async function getPayPalAccessToken() {
  requirePayPalConfig();

  const authorization = Buffer.from(
    `${paypalClientId}:${paypalClientSecret}`
  ).toString("base64");

  const response = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || "Failed to authenticate with PayPal.");
  }

  return payload.access_token;
}

export async function createPayPalOrder() {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: "Kokoro Pro Upgrade",
          amount: {
            currency_code: paypalCurrency,
            value: paypalPlanPrice,
          },
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.id) {
    throw new Error(payload?.message || "Failed to create PayPal order.");
  }

  return payload;
}

export async function capturePayPalOrder(orderId) {
  if (!orderId) {
    throw new Error("PayPal order ID is required.");
  }

  const accessToken = await getPayPalAccessToken();
  const response = await fetch(
    `${paypalBaseUrl}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Failed to capture PayPal order.");
  }

  return payload;
}
