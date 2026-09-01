import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabaseAdmin";

// All the trust-sensitive work happens here, server-side:
//   1. who the customer actually is comes from their auth session, not
//      from anything the client sent in the request body
//   2. item prices are re-read from the database, not taken from the
//      cart payload (the cart's `price` is only ever a display value)
//   3. a coupon, if any, is fully re-validated here before being applied
// See 07-phase2-features.md §6 for why this can't be client-side math.
export async function POST(request) {
  const { items, address, couponCode } = await request.json();

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Log in to place an order." }, { status: 401 });
  }

  const admin = createAdminClient();

  // Re-price every line from the database — never trust the client's price.
  let subtotal = 0;
  const orderItemsToInsert = [];
  for (const line of items) {
    let unitPrice;
    if (line.variationId) {
      const { data: variation } = await admin
        .from("menu_item_variations")
        .select("price")
        .eq("id", line.variationId)
        .single();
      if (!variation) return NextResponse.json({ error: "Invalid item variation." }, { status: 400 });
      unitPrice = variation.price;
    } else {
      const { data: menuItem } = await admin
        .from("menu_items")
        .select("price, is_available")
        .eq("id", line.menuItemId)
        .single();
      if (!menuItem || !menuItem.is_available) {
        return NextResponse.json({ error: "An item in your cart is no longer available." }, { status: 400 });
      }
      unitPrice = menuItem.price;
    }
    subtotal += unitPrice * line.quantity;
    orderItemsToInsert.push({
      menu_item_id: line.menuItemId,
      variation_id: line.variationId || null,
      quantity: line.quantity,
      price_at_order: unitPrice,
    });
  }

  // Validate the coupon, if one was supplied.
  let appliedCoupon = null;
  let total = subtotal;
  if (couponCode) {
    const { data: coupon } = await admin
      .from("coupons")
      .select("*")
      .eq("code", couponCode)
      .eq("customer_id", user.id)
      .single();

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found for your account." }, { status: 400 });
    }
    if (coupon.is_used) {
      return NextResponse.json({ error: "This coupon has already been used." }, { status: 400 });
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: "This coupon has expired." }, { status: 400 });
    }
    if (subtotal < coupon.min_order_amount) {
      return NextResponse.json(
        { error: `This coupon needs an order of at least Rs. ${coupon.min_order_amount}.` },
        { status: 400 }
      );
    }

    const discount =
      coupon.discount_type === "percentage" ? subtotal * (coupon.discount_value / 100) : coupon.discount_value;
    total = Math.max(0, subtotal - discount);
    appliedCoupon = coupon;
  }

  // Create the order.
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({ customer_id: user.id, address, total })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  const { error: itemsError } = await admin
    .from("order_items")
    .insert(orderItemsToInsert.map((i) => ({ ...i, order_id: order.id })));

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  if (appliedCoupon) {
    await admin
      .from("coupons")
      .update({ is_used: true, used_on_order_id: order.id })
      .eq("id", appliedCoupon.id);
  }

  return NextResponse.json({ orderId: order.id, total });
}
