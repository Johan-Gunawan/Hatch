"use client";

import { trackVisit } from "@/api/track";
import { useEffect } from "react";

export function PageViewTracker({ path }: { path: string }) {
  useEffect(() => {
    trackVisit(path);
  }, [path]);
  return null;
}
