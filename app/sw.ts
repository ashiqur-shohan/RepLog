/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, StaleWhileRevalidate, CacheFirst, NetworkOnly } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Exercise library API — stale-while-revalidate, 24h max-age
    {
      matcher: /^https?:\/\/[^/]+\/app\/library\/.*/i,
      handler: new StaleWhileRevalidate({
        cacheName: "exercise-library",
        plugins: [
          {
            cacheKeyWillBeUsed: async ({ request }) => request,
            cacheWillUpdate: async ({ response }) =>
              response.status === 200 ? response : null,
            cachedResponseWillBeUsed: async ({ cachedResponse }) => {
              if (!cachedResponse) return null;
              const date = cachedResponse.headers.get("date");
              if (date) {
                const ageMs = Date.now() - new Date(date).getTime();
                if (ageMs > 24 * 60 * 60 * 1000) return null;
              }
              return cachedResponse;
            },
          },
        ],
      }),
    },
    // Supabase Storage images — cache-first, 7 days
    {
      matcher: ({ url }) =>
        url.hostname.endsWith(".supabase.co") &&
        url.pathname.startsWith("/storage/v1/object/public"),
      handler: new CacheFirst({
        cacheName: "supabase-images",
        plugins: [
          {
            cacheKeyWillBeUsed: async ({ request }) => request,
            cacheWillUpdate: async ({ response }) =>
              response.status === 200 ? response : null,
            cachedResponseWillBeUsed: async ({ cachedResponse }) => {
              if (!cachedResponse) return null;
              const date = cachedResponse.headers.get("date");
              if (date) {
                const ageMs = Date.now() - new Date(date).getTime();
                if (ageMs > 7 * 24 * 60 * 60 * 1000) return null;
              }
              return cachedResponse;
            },
          },
        ],
      }),
    },
    // All POST mutations / Server Actions — network only, never cache
    {
      matcher: ({ request }) => request.method === "POST",
      handler: new NetworkOnly(),
    },
    // Default cache strategies from @serwist/next (fonts, static assets, etc.)
    ...defaultCache,
  ],
});

serwist.addEventListeners();
