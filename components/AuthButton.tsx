"use client";

import { useState, useEffect } from "react";
import { MagicAuthModal, getStoredUser, clearAuth } from "@siva/shared-ui";
import type { AuthUser } from "@siva/shared-ui";
import { SITE_CONFIG } from "@/lib/store";

export default function AuthButton() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "12px", color: "rgba(148,163,184,0.8)" }}>
          {user.email}
        </span>
        <button
          onClick={() => { clearAuth(); setUser(null); }}
          style={{
            fontSize: "11px",
            padding: "4px 10px",
            borderRadius: "6px",
            border: "1px solid rgba(51,65,85,0.5)",
            background: "transparent",
            color: "rgba(148,163,184,0.7)",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowAuth(true)}
        style={{
          fontSize: "12px",
          fontWeight: 600,
          padding: "6px 14px",
          borderRadius: "8px",
          border: `1px solid ${SITE_CONFIG.accentColor}55`,
          background: `${SITE_CONFIG.accentColor}15`,
          color: SITE_CONFIG.accentColor,
          cursor: "pointer",
          transition: "background 150ms",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = `${SITE_CONFIG.accentColor}25`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = `${SITE_CONFIG.accentColor}15`;
        }}
      >
        Sign in free
      </button>
      <MagicAuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={(u) => { setUser(u); setShowAuth(false); }}
        site={SITE_CONFIG.site}
        accentColor={SITE_CONFIG.accentColor}
      />
    </>
  );
}
