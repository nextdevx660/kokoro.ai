import "server-only";

import { saveBillingProfile } from "@/lib/billing-storage";
import { serverDb } from "@/lib/firebase-admin";
import { requireFirebaseUser } from "@/lib/firebase-server-auth";
import { capturePayPalOrder } from "@/lib/paypal";
import {
  ensureUserProfile,
  updateUserProfile,
} from "@/lib/user-storage-server";

export async function POST(request) {
  try {
    const authResult = await requireFirebaseUser(request);

    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    await ensureUserProfile(user);
    const body = await request.json().catch(() => null);
    const orderId = String(body?.orderId || "").trim();

    if (!orderId) {
      return Response.json(
        { error: "PayPal order ID is required." },
        { status: 400 }
      );
    }

    const capture = await capturePayPalOrder(orderId);

    if (capture.status !== "COMPLETED") {
      return Response.json(
        { error: "PayPal payment is not completed yet." },
        { status: 400 }
      );
    }

    const captureId =
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;
    const payerEmail = capture.payer?.email_address || null;
    const amount =
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || "9.99";
    const currency =
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code ||
      "USD";

    await serverDb.collection("paypal_orders").doc(orderId).set(
      {
        id: orderId,
        user_id: user.id,
        paypal_order_id: orderId,
        plan: "pro",
        status: "COMPLETED",
        paypal_capture_id: captureId,
        payer_email: payerEmail,
        captured_at: new Date().toISOString(),
        amount,
        currency,
        raw_response: capture,
      },
      { merge: true }
    );

    await saveBillingProfile(user.id, {
      plan: "pro",
      provider: "paypal",
      status: "COMPLETED",
      paypalOrderId: orderId,
      paypalCaptureId: captureId,
      payerEmail,
      amount,
      currency,
      activatedAt: new Date().toISOString(),
    });

    const profile = await updateUserProfile(user.id, {
      plan: "pro",
    });

    return Response.json({
      success: true,
      profile: {
        ...profile,
        plan: "pro",
      },
      payment: {
        orderId,
        captureId,
        status: "COMPLETED",
      },
    });
  } catch (error) {
    console.error("PayPal capture error:", error);

    return Response.json(
      {
        error:
          error.message ||
          "Failed to capture PayPal payment.",
      },
      { status: 500 }
    );
  }
}
