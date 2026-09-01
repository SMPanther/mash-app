"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import OrderStatusStepper from "@/components/OrderStatusStepper";

// Client components use the useParams() hook rather than the `params`
// prop — in Next.js 15, `params` became a Promise (for Server Components
// that need to await it), and this hook sidesteps that entirely rather
// than needing React.use() to unwrap it.
export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setOrder(data));
    supabase
      .from("order_items")
      .select("*, menu_items(name)")
      .eq("order_id", id)
      .then(({ data }) => setItems(data || []));
  }, [id]);

  if (!order) return <p className="text-smoke">Loading order…</p>;

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-medium text-char mb-1">Order #{order.id.slice(0, 8)}</h1>
      <p className="text-smoke mb-6">{order.address}</p>

      <OrderStatusStepper status={order.status} />

      <ul className="mt-8 divide-y divide-smoke/20">
        {items.map((item) => (
          <li key={item.id} className="py-2 flex justify-between text-sm">
            <span>
              {item.quantity}× {item.menu_items?.name}
            </span>
            <span>Rs. {item.price_at_order}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
