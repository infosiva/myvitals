"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_KEY = "cookie_consent_v1";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="mv-cookie"
    >
      <div className="mv-cookie-inner">
        <div className="mv-cookie-text">
          <p>
            We use cookies to improve your experience and show relevant ads via{" "}
            <strong className="text-white">Google AdSense</strong>. By clicking
            &ldquo;Accept&rdquo; you consent to our use of cookies.{" "}
            <Link href="/privacy" className="mv-cookie-link">
              Privacy Policy
            </Link>
            {" · "}
            <Link href="/terms" className="mv-cookie-link">
              Terms
            </Link>
          </p>
        </div>
        <div className="mv-cookie-actions">
          <button
            onClick={decline}
            className="mv-cookie-btn mv-cookie-btn--ghost"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="mv-cookie-btn mv-cookie-btn--solid"
          >
            Accept all cookies
          </button>
        </div>
      </div>
    </div>
  );
}
