"use client";

import { Analytics } from "@vercel/analytics/react";

function stripQueryFromUrl(url) {
  if (!url || typeof url !== "string") return url;
  try {
    const u = new URL(url, "https://nutrisculpt.local");
    u.search = "";
    u.hash = "";
    return `${u.pathname}`;
  } catch {
    return url.split("?")[0].split("#")[0];
  }
}

export default function PrivacyAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = event?.url || "";
        let path = "";
        try {
          path = new URL(url, "https://nutrisculpt.local").pathname;
        } catch {
          path = String(url).split("?")[0];
        }

        // Exclude admin routes from analytics collection
        if (path.startsWith("/admin")) {
          return null;
        }

        // Strip query parameters from expert-connect pageviews/events
        // to avoid sending service category, goal, or source values
        if (path === "/expert-connect") {
          return { ...event, url: stripQueryFromUrl(url) };
        }

        return event;
      }}
    />
  );
}
