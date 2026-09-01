# MASH

Scaffold for the MASH restaurant site + ordering system. Paired with the full docs in the project doc set (`00-README.md` through `06-deployment-guide.md`) — read those for the reasoning behind what's here.

## What's actually built vs. stubbed

**Working:**
- Loader (`components/Loader.jsx`) and cursor (`components/CustomCursor.jsx`), using your real logo + category stickers, session-gated so the loader plays once per visit.
- Full order status machine (`lib/orderStatus.js`), realtime subscription hook (`lib/useRealtimeOrders.js`).
- Login with role-based redirect (`app/login`).
- Cart (`lib/CartContext.jsx`, localStorage-backed) with add/adjust/remove, wired into the menu category pages (including per-dish variation selection) and a cart icon with live count in the header.
- **Checkout** (`app/order/page.js` + `app/api/checkout/route.js`) — real order creation. Prices and coupon validity are re-checked server-side (service-role key, never trusting the client's numbers) before the order is written.
- Admin order board with realtime new-order notifications, in-house rider assignment dropdown, order detail view (`app/admin/*`).
- Rider dashboard with realtime assigned-deliveries list, "mark delivered", and **live GPS sharing** while a delivery is active (`app/rider/page.js`) — free approach: browser Geolocation API + `rider_locations` table.
- Customer live order tracking with animated status stepper **and a live delivery map** once out for delivery (`app/order/confirmation/[id]`, `components/DeliveryMap.jsx` — Leaflet + OpenStreetMap, no paid API key).
- Complaints queue with case-by-case resolution + optional coupon issuance (`app/admin/complaints`), and a working "Report a problem" action on order history (`app/account/orders`).
- Coupon system — admin issuance (`app/admin/coupons`) and customer-facing list (`app/account/coupons`), applied at checkout.
- Menu management with per-dish variations (`app/admin/menu`) and a combo/meal builder (`app/admin/menu/combos`).
- Full SQL schema + RLS policies, including phase-2 tables (`supabase/schema.sql`).

**Still stubbed:**
- Home page signature-dish spotlight / story strip (category tiles and cart are built; this last visual section isn't — see `01-project-study.md` §2/§4).
- Admin menu photo upload via Cloudinary (menu CRUD exists; image handling doesn't yet).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Cloudinary keys
```

Run the schema against a Supabase project (SQL editor, or the CLI):

```bash
supabase db push   # or paste supabase/schema.sql into the SQL editor
```

Enable Realtime replication on `orders` and `complaints` (Database → Replication in the Supabase dashboard) — the admin/rider/customer live views depend on it.

Then:

```bash
npm run dev
```

## Logo

Drop the actual MASH logo files into `public/logo/` — the loader currently uses a placeholder "M" circle mark (see the comment in `components/Loader.jsx`); swap it for the real reversed/paper version per `02-logo-brief.md`'s usage rules.
