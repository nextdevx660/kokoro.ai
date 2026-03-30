"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { getFirebaseAccessToken } from "@/lib/auth-client";
import { useUser } from "@/context/UserContext";

function loadPayPalScript({ clientId, currency }) {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve(window.paypal);
      return;
    }

    const existingScript = document.querySelector(
      'script[data-paypal-sdk="kokoro-paypal"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.paypal));
      existingScript.addEventListener("error", () =>
        reject(new Error("Failed to load PayPal SDK."))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`;
    script.async = true;
    script.setAttribute("data-paypal-sdk", "kokoro-paypal");
    script.setAttribute("data-sdk-integration-source", "developer-studio");
    script.onload = () => resolve(window.paypal);
    script.onerror = () => reject(new Error("Failed to load PayPal SDK."));
    document.body.appendChild(script);
  });
}

export default function PayPalUpgradeButton({
  disabled = false,
  onSuccess,
  onError,
}) {
  const { setUserData } = useUser();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const containerRef = useRef(null);

  async function syncFirebasePlan(accessToken) {
    const response = await fetch("/api/billing/sync-plan", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.error || "Failed to sync plan.");
    }

    return payload?.profile || null;
  }

  useEffect(() => {
    let active = true;

    async function loadConfig() {
      try {
        const response = await fetch("/api/paypal/create-order");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load PayPal config.");
        }

        if (active) {
          setConfig(payload);
        }
      } catch (error) {
        if (active) {
          const nextMessage = error.message || "PayPal is not configured.";
          setIsError(true);
          setMessage(nextMessage);
          onError?.(nextMessage);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadConfig();

    return () => {
      active = false;
    };
  }, [onError]);

  useEffect(() => {
    let active = true;

    async function renderButtons() {
      if (!config?.clientId || !containerRef.current || disabled) {
        return;
      }

      try {
        const paypal = await loadPayPalScript(config);

        if (!paypal?.Buttons || !active) {
          return;
        }

        containerRef.current.innerHTML = "";

        paypal
          .Buttons({
            style: {
              layout: "vertical",
              shape: "pill",
              color: "gold",
              label: "paypal",
            },
            async createOrder() {
              setMessage("");
              setIsError(false);

              const accessToken = await getFirebaseAccessToken();

              if (!accessToken) {
                throw new Error("Please sign in before upgrading.");
              }

              const response = await fetch("/api/paypal/create-order", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });
              const payload = await response.json();

              if (!response.ok || !payload?.id) {
                throw new Error(payload.error || "Failed to create order.");
              }

              return payload.id;
            },
            async onApprove(data) {
              const accessToken = await getFirebaseAccessToken();

              if (!accessToken) {
                throw new Error("Please sign in again before capturing payment.");
              }

              const response = await fetch("/api/paypal/capture-order", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  orderId: data.orderID,
                }),
              });
              const payload = await response.json();

              if (!response.ok) {
                throw new Error(payload.error || "Payment capture failed.");
              }

              const syncedProfile = await syncFirebasePlan(accessToken).catch(
                () => payload.profile
              );

              setUserData(syncedProfile || payload.profile);
              setIsError(false);
              setMessage("Payment completed. Your Pro plan is active now.");
              onSuccess?.({
                ...payload,
                profile: syncedProfile || payload.profile,
              });
            },
            onError(error) {
              const nextMessage =
                error?.message || "PayPal checkout failed. Please try again.";
              setIsError(true);
              setMessage(nextMessage);
              onError?.(nextMessage);
            },
          })
          .render(containerRef.current);
      } catch (error) {
        if (active) {
          const nextMessage =
            error.message || "Unable to start PayPal checkout.";
          setIsError(true);
          setMessage(nextMessage);
          onError?.(nextMessage);
        }
      }
    }

    renderButtons();

    return () => {
      active = false;
    };
  }, [config, disabled, onError, onSuccess, setUserData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading PayPal checkout...
      </div>
    );
  }

  if (!config?.clientId) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
        {message || "PayPal client ID is missing."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className={disabled ? "pointer-events-none opacity-60" : ""}
      />
      {message ? (
        <div
          className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
            isError
              ? "border border-red-200 bg-red-50 text-red-600"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {!isError ? <CheckCircle2 className="h-4 w-4" /> : null}
          {message}
        </div>
      ) : null}
    </div>
  );
}
