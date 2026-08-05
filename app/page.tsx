import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  HeartPulse,
  Home,
  LayoutDashboard,
  ListTodo,
  Plus,
  WalletCards,
} from "lucide-react";

const todayItems = [
  { title: "Review today’s priorities", meta: "Personal • High priority", icon: CheckCircle2 },
  { title: "Add transplant medicines", meta: "Health setup required", icon: HeartPulse },
  { title: "Enter bills and direct debits", meta: "Money setup required", icon: CircleDollarSign },
];

const weekItems = [
  "Complete Abrar OS setup",
  "Add loan and credit-card balances",
  "Add visa and document expiry dates",
  "Add Prius and Corsa renewal dates",
];

export default function HomePage() {
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <h1>Abrar OS</h1>
          <p>{dateLabel}</p>
        </div>
        <div className="avatar" aria-label="Abrar profile">A</div>
      </header>

      <main className="main">
        <section className="card">
          <div className="card-head">
            <div>
              <span className="pill success">Life command centre</span>
              <h2 style={{ marginTop: 12 }}>Put it out of your mind</h2>
              <p className="muted" style={{ marginTop: -6 }}>
                Capture a task, bill, medicine, meal, family event or follow-up.
              </p>
            </div>
            <Plus size={24} />
          </div>
          <input
            className="command"
            placeholder="Example: Pay nursery £210 on Friday from Barclays"
            aria-label="Quick command"
          />
          <div className="quick-grid">
            <button className="quick">Add task</button>
            <button className="quick">Log medicine</button>
            <button className="quick">Add expense</button>
            <button className="quick">Brain dump</button>
          </div>
        </section>

        <section className="hero section-gap">
          <article className="card">
            <div className="card-head">
              <h2>Needs attention</h2>
              <span className="pill warning">3 setup actions</span>
            </div>
            <div className="list">
              {todayItems.map(({ title, meta, icon: Icon }) => (
                <div className="item" key={title}>
                  <div className="row">
                    <div className="icon-box"><Icon size={18} /></div>
                    <div><strong>{title}</strong><span>{meta}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="card">
            <h2>Safe balance</h2>
            <div className="stat">£0.00</div>
            <p className="muted">Available money minus payments due before payday.</p>
            <span className="pill">Add accounts and income</span>
          </article>
        </section>

        <section className="grid three section-gap">
          <article className="card">
            <div className="card-head"><h2>Today’s tasks</h2><ListTodo size={19} /></div>
            <div className="list">
              <div className="item"><div><strong>Review today’s priorities</strong><span>09:00 • Personal</span></div></div>
            </div>
          </article>

          <article className="card">
            <div className="card-head"><h2>Medicines</h2><HeartPulse size={19} /></div>
            <p className="muted">No medicines added yet.</p>
            <span className="pill warning">Critical setup</span>
          </article>

          <article className="card">
            <div className="card-head"><h2>Diet today</h2><WalletCards size={19} /></div>
            <div className="stat">0 kcal</div>
            <p className="muted">Target and protein tracking will appear here.</p>
          </article>
        </section>

        <section className="card section-gap">
          <div className="card-head"><h2>Next actions for this week</h2><CalendarDays size={19} /></div>
          <div className="list">
            {weekItems.map((item, index) => (
              <div className="item" key={item}>
                <div className="row">
                  <div className="icon-box">{index + 1}</div>
                  <div><strong>{item}</strong><span>Foundation setup</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        <button className="nav-button active"><LayoutDashboard size={19} />Today</button>
        <button className="nav-button"><CalendarDays size={19} />Schedule</button>
        <button className="nav-button"><Plus size={19} />Add</button>
        <button className="nav-button"><CircleDollarSign size={19} />Money</button>
        <button className="nav-button"><Home size={19} />Life</button>
      </nav>
    </div>
  );
}
