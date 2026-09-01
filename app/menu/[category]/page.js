"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// The category-tile-grid version of /menu/[category] is gone — the whole
// browsing experience now lives on /menu itself (wheel + item panel), with
// the active category held in a ?category= query param instead of the
// URL path. This stub just forwards any old bookmarked/shared links.
export default function LegacyCategoryRedirect() {
  const { category } = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/menu?category=${category}`);
  }, [category, router]);

  return null;
}
