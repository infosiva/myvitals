"use client";

import { useMagicAuth, getStoredUser, isLoggedIn } from "@/lib/auth/useMagicAuth";
export { useMagicAuth, getStoredUser, isLoggedIn };

export const SITE_CONFIG = {
  name: "MyVitals",
  site: "myvitals",
  accentColor: "#10b981",
  freeLimit: 7,
  freeFeature: "free days of tracking",
  lockedFeature: "unlimited history + trends + export",
};

export const AFFILIATES = [
  {
    name: "Notion",
    tagline: "Keep a detailed health journal alongside your metrics",
    cta: "Try Notion →",
    color: "#000000",
    icon: "📝",
    url: "https://notion.so/?affiliate=siva",
  },
  {
    name: "Coursera",
    tagline: "Learn nutrition, fitness and wellness from expert courses",
    cta: "Explore →",
    color: "#0056d2",
    icon: "🎓",
    url: "https://coursera.org/?affiliate=siva",
  },
  {
    name: "Grammarly",
    tagline: "Write clear health goals and share progress with doctors",
    cta: "Try Free →",
    color: "#15803d",
    icon: "✍️",
    url: "https://grammarly.com/?affiliate=siva",
  },
];
