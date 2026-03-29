import "server-only";

import { saveBillingProfile } from "@/lib/billing-storage";
import { capturePayPalOrder } from "@/lib/paypal";
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

async function ensureUserRow(supabase, user) {
  const { data: existingProfile, error: existingError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingProfile) {
    return existingProfile;
  }

  const fallbackName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email ||
    "User";

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: user.id,
      email: user.email,
      name: fallbackName,
      plan: "free",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function activateProPlan({ writeSupabase, userSupabase, userId }) {
  if (writeSupabase !== userSupabase) {
    const { data, error } = await writeSupabase
      .from("users")
      .update({
        plan: "pro",
      })
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Failed to activate Pro plan for user ${userId}: ${error.message}`
      );
    }

    return data;
  }

  const { data, error } = await userSupabase.rpc("activate_pro_plan", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error(
      `Failed to activate Pro plan for user ${userId}: ${error.message}`
    );
  }

  return data;
}

export async function POST(request) {
  try {
    const authResult = await requireUser(request);

    if (authResult.error) {
      return authResult.error;
    }

    const { supabase: userSupabase, user } = authResult;
    const writeSupabase =
      createAdminSupabaseClient() || userSupabase;
    await ensureUserRow(writeSupabase, user);
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

    const { error: paymentError } = await writeSupabase
      .from("paypal_orders")
      .upsert(
        {
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
        {
          onConflict: "paypal_order_id",
        }
      );

    if (paymentError) {
      throw paymentError;
    }

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

    let profile;

    try {
      profile = await activateProPlan({
        writeSupabase,
        userSupabase,
        userId: user.id,
      });
    } catch (planActivationError) {
      console.error("Supabase plan activation warning:", planActivationError);
      profile = {
        id: user.id,
        email: user.email,
        name:
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email ||
          "User",
        plan: "pro",
      };
    }

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
          "Failed to capture PayPal payment. Check users table RLS and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 500 }
    );
  }
}
