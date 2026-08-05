"use client";

import Link from "next/link";
import { BookOpenCheck, Car, ChevronDown, FileText, HeartPulse, Menu, PoundSterling, Settings, Sparkles, Users, X } from "lucide-react";
import { useState } from "react";

const modules = [
  { href: "/money", label: "Money", description: "Accounts, bills, debts and cash flow", icon: PoundSterling, tone: "green" },
  { href: "/health", label: "Health", description: "Medicines, diet and progress", icon: HeartPulse, tone: "green" },
  { href: "/family", label: "Family", description: "Events, appointments and support", icon: Users, tone: "purple" },
  { href: "/documents", label: "Documents", description: "Visas, passports and renewals", icon: FileText, tone: "blue" },
  { href: "/cars", label: "Cars", description: "Prius, Corsa, MOT and costs", icon: Car, tone: "orange" },
  { href: "/work", label: "Work & Study", description: "AAA, Embrace and Level 7", icon: BookOpenCheck, tone: "slate" },
  { href: "/life", label: "Life Hub", description: "Contacts, shopping and notes", icon: Sparkles, tone: "pink" },
  { href: "/settings", label: "Settings", description: "PIN, backups and preferences", icon: Settings, tone: "grey" },
] as const;

export default function ModuleLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`module-launcher ${open ? "open" : ""}`}>
      {open && <button className="module-backdrop" aria-label="Close module menu" onClick={() => setOpen(false)} />}

      <div className="module-panel" aria-hidden={!open}>
        <div className="module-panel-head">
          <div>
            <strong>Life modules</strong>
            <span>Open any part of Abrar OS</span>
          </div>
          <button className="icon-button" aria-label="Close module menu" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="module-grid">
          {modules.map(({ href, label, description, icon: Icon, tone }) => (
            <Link key={href} href={href} className={`module-card module-${tone}`} onClick={() => setOpen(false)}>
              <span className="module-icon"><Icon size={20} /></span>
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <button className="module-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {open ? <ChevronDown size={19} /> : <Menu size={19} />}
        <span>{open ? "Close" : "All modules"}</span>
      </button>
    </div>
  );
}
