import Link from "next/link";
import { ArrowLeft, Cloud } from "lucide-react";
import AuthPanel from "@/components/auth-panel";

export default function AccountPage() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand"><h1>Cloud Account</h1><p>Secure login and cross-device data</p></div>
        <Link href="/" className="notification-button"><ArrowLeft size={17}/>Abrar OS</Link>
      </header>
      <main className="main">
        <section className="grid two">
          <AuthPanel />
          <article className="card">
            <div className="card-head"><h2>Data protection</h2><Cloud size={20}/></div>
            <p className="muted">Your cloud records are stored under your unique Firebase user ID. Firestore rules will prevent one account from reading another account’s data.</p>
            <p className="muted section-gap">Local browser storage remains available as an offline fallback. Regular JSON backups remain recommended.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
