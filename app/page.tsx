import Link from "next/link";
import LifeOS from "@/components/life-os";

export default function HomePage() {
  return (
    <>
      <LifeOS />
      <Link
        href="/health"
        style={{
          position: "fixed",
          right: 18,
          bottom: 94,
          zIndex: 40,
          padding: "11px 15px",
          borderRadius: 14,
          background: "#067647",
          color: "white",
          fontWeight: 800,
          boxShadow: "0 12px 30px rgba(0,0,0,.18)",
        }}
      >
        Health
      </Link>
    </>
  );
}
