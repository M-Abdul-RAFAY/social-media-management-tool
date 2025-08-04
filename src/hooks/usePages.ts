"use client";

import { useState, useEffect, useCallback } from "react";
import { IPage } from "@/types/db";

interface UsePagesReturn {
  pages: IPage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  syncPages: () => Promise<void>;
}

export function usePages(): UsePagesReturn {
  const [pages, setPages] = useState<IPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/meta/pages");

      if (!response.ok) {
        throw new Error("Failed to fetch pages");
      }

      const data = await response.json();

      if (data.success) {
        setPages(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch pages");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  const syncPages = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch("/api/meta/pages", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to sync pages");
      }

      const data = await response.json();

      if (data.success) {
        setPages(data.data);
      } else {
        throw new Error(data.error || "Failed to sync pages");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  return {
    pages,
    loading,
    error,
    refetch: fetchPages,
    syncPages,
  };
}
