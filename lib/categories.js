// Single source of truth for category slugs + display names + icons.
// Both app/page.js (home strip) and app/menu/page.js (wheel) import this
// so the two never drift apart. The slug here must match menu_categories.slug
// in the database — see supabase/seed.sql.
export const CATEGORIES = [
  { name: "Burgers", slug: "burgers", icon: "/assets/category/burgers.png" },
  { name: "Ramen", slug: "ramen", icon: "/assets/category/ramen.png" },
  { name: "Pizzas", slug: "pizzas", icon: "/assets/category/pizzas.png" },
  { name: "BBQ & Grills", slug: "bbq-grills", icon: "/assets/category/bbq-grills.png" },
  { name: "Pakistani Cuisine", slug: "pakistani-cuisine", icon: "/assets/category/pakistani-cuisine.png" },
  { name: "Desserts", slug: "desserts", icon: "/assets/category/desserts.png" },
  { name: "Drinks", slug: "drinks", icon: "/assets/category/drinks.png" },
  { name: "Deals & Combos", slug: "deals-combos", icon: "/assets/category/deals-combos.png" },
];
