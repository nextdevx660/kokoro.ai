import "server-only";

import { createPayPalOrder, getPayPalPublicConfig } from "@/lib/paypal";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase-server";

function getAccessToken(request) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

async function requireUser(request) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return {
      error: Response.json({ error: "Please sign in first." }, { status: 401 }),
    };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: Response.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      ),
    };
  }

  return { supabase, user };
}

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
    const authResult = await requireUser(request);

    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    const supabase =
      createAdminSupabaseClient() || authResult.supabase;
    const order = await createPayPalOrder();

    const { error: insertError } = await supabase.from("paypal_orders").upsert(
      {
        user_id: user.id,
        paypal_order_id: order.id,
        status: order.status || "CREATED",
        plan: "pro",
        amount: order.purchase_units?.[0]?.amount?.value || "9.99",
        currency: order.purchase_units?.[0]?.amount?.currency_code || "USD",
        raw_response: order,
      },
      {
        onConflict: "paypal_order_id",
      }
    );

    if (insertError) {
      throw insertError;
    }

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
          "Failed to create PayPal order. Check paypal_orders RLS and server Supabase config.",
      },
      { status: 500 }
    );
  }
}
