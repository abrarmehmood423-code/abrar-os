"use client";

import Link from "next/link";
import { Cloud, LogIn } from "lucide-react";

export default function AccountShortcut() {
  return (
    <Link
      href="/account"
      aria-label="Open cloud account and sign in"
      style={{
        position: "fixed",
        top: 18,
        right: 190,
        zIndex: 60,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minHeight: 44,
        padding: "0 16px",
        border: "1px solid rgba(15, 23, 42, 0.12)",
        borderRadius: 14,
        background: "white",
        color: "#0f172a",
        fontWeight: 800,
        textDecoration: "none",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.10)",
      }}
    >
      <Cloud size={17} />
      <span>Cloud account</span>
      <LogIn size={16} />
    </Link>
  );
}
