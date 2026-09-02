"use client";

import { useState } from "react";

// Cloudinary's unsigned upload lets the browser POST a file directly to
// Cloudinary using only the public cloud name + a named upload preset —
// no API secret involved client-side, so this doesn't need a server
// route the way checkout/profile updates do. The preset itself is
// configured in the Cloudinary dashboard (Settings → Upload → Upload
// presets → add one, set signing mode to "Unsigned") — see
// .env.example for the env var this expects.
export default function ImageUpload({ onUploaded, currentUrl }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) {
      setError("Cloudinary isn't configured yet — see .env.example.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload failed");
      onUploaded(data.secure_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {currentUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentUrl} alt="" className="w-10 h-10 rounded object-cover" />
      )}
      <label className="text-xs px-3 py-1.5 rounded-full border border-smoke/30 cursor-pointer" data-cursor-hover>
        {uploading ? "Uploading…" : currentUrl ? "Change photo" : "Add photo"}
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
      </label>
      {error && <span className="text-xs text-chili">{error}</span>}
    </div>
  );
}
