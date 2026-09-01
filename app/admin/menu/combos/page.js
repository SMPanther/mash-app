"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

// A combo is itself a menu_items row (category = Deals & combos); what
// makes it a combo is the combo_items rows attached to it — each names a
// component dish, optionally a specific variation of it, and a quantity.
// See 07-phase2-features.md §7.
export default function ComboBuilder() {
  const supabase = createClient();
  const [comboCategoryId, setComboCategoryId] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [variationsByItem, setVariationsByItem] = useState({});

  const [comboName, setComboName] = useState("");
  const [comboPrice, setComboPrice] = useState("");
  const [rows, setRows] = useState([{ menu_item_id: "", variation_id: "", quantity: 1 }]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: cat } = await supabase
        .from("menu_categories")
        .select("id")
        .eq("slug", "deals-combos")
        .single();
      setComboCategoryId(cat?.id || null);

      const { data: items } = await supabase.from("menu_items").select("id, name, category_id").order("name");
      setAllItems(items || []);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadVariations(itemId) {
    if (variationsByItem[itemId]) return;
    const { data } = await supabase.from("menu_item_variations").select("*").eq("menu_item_id", itemId);
    setVariationsByItem((v) => ({ ...v, [itemId]: data || [] }));
  }

  function updateRow(index, patch) {
    setRows((r) => r.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((r) => [...r, { menu_item_id: "", variation_id: "", quantity: 1 }]);
  }

  function removeRow(index) {
    setRows((r) => r.filter((_, i) => i !== index));
  }

  async function saveCombo() {
    setMessage("");
    if (!comboCategoryId) {
      setMessage('No "Deals & combos" category found — create it in menu_categories first.');
      return;
    }
    if (!comboName || !comboPrice || rows.some((r) => !r.menu_item_id)) {
      setMessage("Fill in the combo name, price, and every component dish.");
      return;
    }

    const { data: combo, error } = await supabase
      .from("menu_items")
      .insert({ name: comboName, price: Number(comboPrice), category_id: comboCategoryId })
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    const comboItemRows = rows.map((r) => ({
      combo_menu_item_id: combo.id,
      component_menu_item_id: r.menu_item_id,
      component_variation_id: r.variation_id || null,
      quantity: Number(r.quantity) || 1,
    }));
    const { error: itemsError } = await supabase.from("combo_items").insert(comboItemRows);

    if (itemsError) {
      setMessage(itemsError.message);
    } else {
      setMessage(`"${comboName}" created with ${rows.length} item(s).`);
      setComboName("");
      setComboPrice("");
      setRows([{ menu_item_id: "", variation_id: "", quantity: 1 }]);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-medium text-char mb-6">Build a combo / meal</h1>

      <div className="border border-smoke/30 rounded-lg p-4 mb-6 flex gap-2 flex-wrap">
        <input
          placeholder="Combo name (e.g. Family Feast)"
          value={comboName}
          onChange={(e) => setComboName(e.target.value)}
          className="flex-1 min-w-[180px] border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
        />
        <input
          type="number"
          placeholder="Combo price"
          value={comboPrice}
          onChange={(e) => setComboPrice(e.target.value)}
          className="w-32 border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
        />
      </div>

      <h2 className="font-medium text-char mb-3">What's in it</h2>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="border border-smoke/20 rounded-lg p-3 flex gap-2 flex-wrap items-center">
            <select
              value={row.menu_item_id}
              onChange={(e) => {
                updateRow(i, { menu_item_id: e.target.value, variation_id: "" });
                if (e.target.value) loadVariations(e.target.value);
              }}
              className="flex-1 min-w-[140px] border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
            >
              <option value="">Choose dish…</option>
              {allItems
                .filter((it) => it.category_id !== comboCategoryId) // don't nest combos in combos
                .map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
            </select>

            {row.menu_item_id && variationsByItem[row.menu_item_id]?.length > 0 && (
              <select
                value={row.variation_id}
                onChange={(e) => updateRow(i, { variation_id: e.target.value })}
                className="border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
              >
                <option value="">Any variation</option>
                {variationsByItem[row.menu_item_id].map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}

            <input
              type="number"
              min="1"
              value={row.quantity}
              onChange={(e) => updateRow(i, { quantity: e.target.value })}
              className="w-16 border border-smoke/30 rounded-md px-2 py-2 bg-white text-sm"
            />
            <button onClick={() => removeRow(i)} className="text-sm text-smoke">
              Remove
            </button>
          </div>
        ))}
      </div>

      <button onClick={addRow} className="text-sm text-chili mt-3 mb-6">
        + Add another item
      </button>

      {message && <p className="text-sm text-chili mb-3">{message}</p>}
      <button onClick={saveCombo} className="bg-chili text-paper rounded-full px-5 py-2.5 text-sm font-medium">
        Save combo
      </button>
    </div>
  );
}
