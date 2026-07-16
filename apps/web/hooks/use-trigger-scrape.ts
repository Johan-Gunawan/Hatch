import { ApiError } from "@/api/client";
import { useState } from "react";

export function useTriggerScrape(action: () => Promise<{ message: string }>) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function trigger() {
    setIsPending(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsPending(false);
    }
  }

  return { trigger, isPending, error };
}
