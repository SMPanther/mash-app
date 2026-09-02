"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import ImageUpload from "@/components/ImageUpload";

// Base dish CRUD + per-dish variations (e.g. Pizza: Small/Medium/Large,
// each its own price) + photo upload + hero-spotlight toggle. Combo/meal
// building is a separate flow — see /admin/menu/combos, since a combo
// assembles existing dishes rather than being a dish itself. See
// 07-phase2-features.md §7–8.
export default function AdminMenuManagement() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [variationsByItem, setVariationsByItem] = useState({});
  const [expandedItem, setExpandedItem] = useState(null);
  const [newVariation, setNewVariation] = useState({ name: "", price: "" });
  const [newItem, setNewItem] = useState({ name: "", price: "", category_id: "", image_url: "" });

  const supabase = createClient();

  async function loadAll() {
    const { data: cats } = await supabase.from("menu_categories").select("*").order("sort_order");
    setCategories(cats || []);
    const { data: menuItems } = await supabase
      .from("menu_items")
      .select("*, menu_categories(name)")
      .order("name");
    setItems(menuItems || []);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadVariations(itemId) {
    const { data } = await supabase
      .from("menu_item_variations")
      .select("*")
      .eq("menu_item_id", itemId)
      .order("sort_order");
    setVariationsByItem((v) => ({ ...v, [itemId]: data || [] }));
  }

  async function toggleExpand(itemId) {
    if (expandedItem === itemId) {
      setExpandedItem(null);
      return;
    }
    setExpandedItem(itemId);
    if (!variationsByItem[itemId]) await loadVariations(itemId);
  }

  async function addVariation(itemId) {
    if (!newVariation.name || !newVariation.price) return;
    await supabase.from("menu_item_variations").insert({
      menu_item_id: itemId,
      name: newVariation.name,
      price: Number(newVariation.price),
    });
    setNewVariation({ name: "", price: "" });
    loadVariations(itemId);
  }

  async function addItem(e) {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.category_id) return;
    await supabase.from("menu_items").insert({
      name: newItem.name,
      price: Number(newItem.price),
      category_id: newItem.category_id,
      image_url: newItem.image_url || null,
    });
    setNewItem({ name: "", price: "", category_id: "", image_url: "" });
    loadAll();
  }

  async function updateItemImage(itemId, url) {
    await supabase.from("menu_items").update({ image_url: url }).eq("id", itemId);
    setItems((current) => current.map((i) => (i.id === itemId ? { ...i, image_url: url } : i)));
  }

  async function setFeatured(itemId) {
    // Only one dish is the hero spotlight at a time — unset any previous
    // one first (see the featured column's comment in schema.sql: this
    // "exactly one" rule is enforced here, not by a DB constraint).
    await supabase.from("menu_items").update({ featured: false }).eq("featured", true);
    await supabase.from("menu_items").update({ featured: true }).eq("id", itemId);
    loadAll();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-char">Menu</h1>
        <a href="/admin/menu/combos" className="text-sm text-chili">
          Build a combo/meal →
        </a>
      </div>

      <form onSubmit={addItem} className="border border-smoke/30 rounded-lg p-4 mb-8 flex gap-2 flex-wrap items-center">
        <input
          placeholder="Dish name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          className="flex-1 min-w-[140px] border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
        />
        <input
          type="number"
          placeholder="Base price"
          value={newItem.price}
          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          className="w-28 border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
        />
        <select
          value={newItem.category_id}
          onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
          className="border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
        >
          <option value="">Category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <ImageUpload currentUrl={newItem.image_url} onUploaded={(url) => setNewItem({ ...newItem, image_url: url })} />
        <button className="bg-chili text-paper rounded-full px-4 py-2 text-sm font-medium">Add dish</button>
      </form>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="border border-smoke/20 rounded-lg p-3">
            <div className="flex justify-between items-center gap-3">
              <button
                onClick={() => toggleExpand(item.id)}
                className="flex-1 flex justify-between items-center text-left min-w-0"
              >
                <span className="truncate">
                  <span className="font-medium text-char">{item.name}</span>
                  <span className="text-smoke text-sm"> · {item.menu_categories?.name}</span>
                  {item.featured && <span className="text-xs text-chili ml-2">★ Featured</span>}
                </span>
                <span className="text-sm text-smoke whitespace-nowrap ml-2">Rs. {item.price} · variations ▾</span>
              </button>
            </div>

            {expandedItem === item.id && (
              <div className="mt-3 pt-3 border-t border-smoke/20 space-y-3">
                <ImageUpload currentUrl={item.image_url} onUploaded={(url) => updateItemImage(item.id, url)} />

                <button
                  onClick={() => setFeatured(item.id)}
                  disabled={item.featured}
                  className="text-xs px-3 py-1.5 rounded-full border border-chili/40 text-chili disabled:opacity-40"
                >
                  {item.featured ? "★ This is the hero spotlight" : "Set as hero spotlight"}
                </button>

                {(variationsByItem[item.id] || []).map((v) => (
                  <div key={v.id} className="flex justify-between text-sm py-1">
                    <span>{v.name}</span>
                    <span className="text-smoke">Rs. {v.price}</span>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    placeholder="e.g. Large"
                    value={newVariation.name}
                    onChange={(e) => setNewVariation({ ...newVariation, name: e.target.value })}
                    className="flex-1 border border-smoke/30 rounded-md px-2 py-1.5 bg-white text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={newVariation.price}
                    onChange={(e) => setNewVariation({ ...newVariation, price: e.target.value })}
                    className="w-24 border border-smoke/30 rounded-md px-2 py-1.5 bg-white text-sm"
                  />
                  <button
                    onClick={() => addVariation(item.id)}
                    className="text-sm px-3 py-1.5 rounded-full bg-ember text-paper"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
