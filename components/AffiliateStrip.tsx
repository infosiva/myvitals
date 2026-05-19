"use client";

import { AFFILIATES, SITE_CONFIG } from "@/lib/store";

export default function AffiliateStrip() {
  return (
    <section
      style={{
        padding: "32px 24px",
        borderTop: "1px solid rgba(99,102,241,0.15)",
        background: "rgba(99,102,241,0.03)",
      }}
    >
      <p
        style={{
          textAlign: "center",
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(148,163,184,0.6)",
          marginBottom: "20px",
        }}
      >
        Tools that pair well with {SITE_CONFIG.name}
      </p>
      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          flexWrap: "wrap",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {AFFILIATES.map((a) => (
          <a
            key={a.name}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 16px",
              borderRadius: "10px",
              border: "1px solid rgba(51,65,85,0.4)",
              background: "rgba(15,23,42,0.6)",
              textDecoration: "none",
              transition: "border-color 150ms, background 150ms",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = `${a.color}44`;
              (e.currentTarget as HTMLElement).style.background = "rgba(15,23,42,0.9)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(51,65,85,0.4)";
              (e.currentTarget as HTMLElement).style.background = "rgba(15,23,42,0.6)";
            }}
          >
            <span style={{ fontSize: "18px" }}>{a.icon}</span>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#f1f5f9", marginBottom: "1px" }}>
                {a.name}
              </p>
              <p style={{ fontSize: "11px", color: "rgba(148,163,184,0.7)", lineHeight: 1.3 }}>
                {a.tagline}
              </p>
            </div>
            <span
              style={{
                marginLeft: "8px",
                fontSize: "11px",
                fontWeight: 600,
                color: a.color,
                whiteSpace: "nowrap",
              }}
            >
              {a.cta}
            </span>
          </a>
        ))}
      </div>
      <p
        style={{
          textAlign: "center",
          fontSize: "10px",
          color: "rgba(100,116,139,0.4)",
          marginTop: "12px",
        }}
      >
        Sponsored links — we may earn a commission at no cost to you
      </p>
    </section>
  );
}
