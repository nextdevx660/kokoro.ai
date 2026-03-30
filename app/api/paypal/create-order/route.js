import "server-only";

import { createPayPalOrder, getPayPalPublicConfig } from "@/lib/paypal";
import { serverDb } from "@/lib/firebase-admin";
import { requireFirebaseUser } from "@/lib/firebase-server-auth";

export async function GET() {
  try {
    return Response.json(getPayPalPublicConfig());
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to load PayPal config." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authResult = await requireFirebaseUser(request);

    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    const order = await createPayPalOrder();

    await serverDb.collection("paypal_orders").doc(order.id).set(
      {
        id: order.id,
        user_id: user.id,
        paypal_order_id: order.id,
        status: order.status || "CREATED",
        plan: "pro",
        amount: order.purchase_units?.[0]?.amount?.value || "9.99",
        currency: order.purchase_units?.[0]?.amount?.currency_code || "USD",
        raw_response: order,
      }
    );

    return Response.json({
      id: order.id,
      status: order.status,
    });
  } catch (error) {
    console.error("PayPal create order error:", error);

    return Response.json(
      {
        error:
          error.message ||
          "Failed to create PayPal order.",
      },
      { status: 500 }
    );
  }
}
