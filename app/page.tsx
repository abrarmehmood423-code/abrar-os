import Link from "next/link";
import LifeOS from "@/components/life-os";

const moduleLinks = [
  { href: "/health", label: "Health", color: "#067647" },
  { href: "/family", label: "Family", color: "#7f56d9" },
  { href: "/documents", label: "Documents", color: "#175cd3" },
  { href: "/cars", label: "Cars", color: "#b54708" },
  { href: "/work", label: "Work & Study", color: "#344054" },
];

export default function HomePage() {
  return (
    <>
      <LifeOS />
      <div
        style={{
          position: "fixed",
          right: 18,
          bottom: 94,
          zIndex: 40,
          display: "grid",
          gap: 8,
          maxHeight: "60vh",
          overflowY: "auto",
        }}
      >
        {moduleLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              padding: "11px 15px",
              borderRadius: 14,
              background: item.color,
              color: "white",
              fontWeight: 800,
              boxShadow: "0 12px 30px rgba(0,0,0,.18)",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </>
  );
}
