"use client";

// EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/base-path";

/** What a queue page hands its list: the endpoint and the server-rendered first view. */
export type ServerQueue = {
  endpoint: string;
  initialTotal: number;
  initialCounts: { pending: number; pendingExecutive: number };
};

type Remote<T, C> = { key: string; items: T[]; total: number; counts: C | undefined; failed: boolean };

const RETRY_DELAY_MS = 800;

/**
 * One page of a list the server paginates. The server renders the first view (`atInitialView`)
 * into the page; any other view (another page, filter or search) is fetched from `endpoint`, and
 * fetched again when the server data changes (router.refresh() after a decision hands the page a
 * new `initialItems`). Search text is debounced. While a fetch is in flight the last result stays
 * on screen and `loading` is true. A failed fetch is retried once, then `failed` is true and the
 * last result stays. When a fetched page is empty but the list is not (the last row of the last page
 * was just decided), `onPageOverflow` gets the new last page.
 */
export function useServerPagedList<T, C = undefined>({
  endpoint,
  params,
  atInitialView,
  initialItems,
  initialTotal,
  initialCounts,
  onPageOverflow,
}: {
  endpoint: string;
  params: Record<string, string | number>;
  atInitialView: boolean;
  initialItems: T[];
  initialTotal: number;
  initialCounts?: C;
  onPageOverflow?: (lastPage: number) => void;
}) {
  const key = new URLSearchParams(Object.entries(params).map(([name, value]) => [name, String(value)])).toString();
  const debounce = Boolean(params.q);
  const [remote, setRemote] = useState<Remote<T, C> | null>(null);
  // Views already fetched for the current server data, by query string, so going back to one
  // shows it without a fetch. router.refresh() hands in a new `initialItems`, which empties it.
  // ponytail: no expiry; another staff member's change shows after a refresh or a remount.
  const [visited, setVisited] = useState<{ base: T[]; views: Record<string, Remote<T, C>> }>({
    base: initialItems,
    views: {},
  });
  const hit = atInitialView || visited.base !== initialItems ? undefined : visited.views[key];
  // Shown now, and kept as the last result while the next uncached view loads.
  if (hit && remote !== hit) setRemote(hit);
  const cached = hit !== undefined;

  useEffect(() => {
    if (atInitialView || cached) return;
    const controller = new AbortController();
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const load = async (attempt: number) => {
      try {
        const res = await fetch(withBasePath(`${endpoint}?${key}`), { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { data } = await res.json();
        const view = { key, items: data.items, total: data.total, counts: data.counts, failed: false };
        setRemote(view);
        const query = new URLSearchParams(key);
        if (data.items.length === 0 && data.total > 0 && Number(query.get("page")) > 1) {
          onPageOverflow?.(Math.ceil(data.total / Number(query.get("limit"))));
          return; // a page past the end is not worth keeping
        }
        setVisited((last) => ({
          base: initialItems,
          views: { ...(last.base === initialItems ? last.views : {}), [key]: view },
        }));
      } catch {
        if (controller.signal.aborted) return; // a newer view replaced this one
        if (attempt === 0) {
          retryTimer = setTimeout(() => load(1), RETRY_DELAY_MS);
        } else {
          setRemote((last) => ({
            items: last?.items ?? initialItems,
            total: last?.total ?? initialTotal,
            counts: last?.counts ?? initialCounts,
            key,
            failed: true,
          }));
        }
      }
    };
    const timer = setTimeout(() => load(0), debounce ? 250 : 0);

    return () => {
      clearTimeout(timer);
      clearTimeout(retryTimer);
      controller.abort();
    };
  }, [endpoint, atInitialView, cached, key, debounce, initialItems, initialTotal, initialCounts, onPageOverflow]);

  if (atInitialView) {
    return { items: initialItems, total: initialTotal, counts: initialCounts, loading: false, failed: false };
  }
  return {
    items: remote?.items ?? initialItems,
    total: remote?.total ?? initialTotal,
    counts: remote?.counts ?? initialCounts,
    loading: remote?.key !== key,
    failed: remote?.key === key && remote.failed,
  };
}
