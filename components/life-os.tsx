"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CircleDollarSign,
  HeartPulse,
  Home,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Plus,
  Trash2,
} from "lucide-react";
import { createId, loadData, saveData } from "@/lib/storage";
import type { AppData, Priority, Task } from "@/lib/types";

type View = "today" | "schedule" | "add" | "money" | "life";

const categories = [
  "Personal",
  "Family",
  "Health",
  "Money",
  "Immigration",
  "AAA Work",
  "Embrace",
  "Education",
  "Car",
  "Other",
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function priorityClass(priority: Priority) {
  return priority === "Critical"
    ? "danger"
    : priority === "High"
      ? "warning"
      : "";
}

export default function LifeOS() {
  const [view, setView] = useState<View>("today");
  const [data, setData] = useState<AppData | null>(null);
  const [command, setCommand] = useState("");

  useEffect(() => setData(loadData()), []);
  useEffect(() => {
    if (data) saveData(data);
  }, [data]);

  const todayTasks = useMemo(
    () =>
      (data?.tasks ?? [])
        .filter((task) => task.date === todayIso() && task.status === "open")
        .sort((a, b) => (a.time ?? "23:59").localeCompare(b.time ?? "23:59")),
    [data],
  );

  const upcomingTasks = useMemo(
    () =>
      (data?.tasks ?? [])
        .filter((task) => task.status === "open")
        .sort((a, b) => `${a.date}${a.time ?? ""}`.localeCompare(`${b.date}${b.time ?? ""}`)),
    [data],
  );

  if (!data) {
    return <main className="loading-screen">Loading Abrar OS…</main>;
  }

  function addTask(task: Omit<Task, "id" | "createdAt" | "status">) {
    setData((current) =>
      current
        ? {
            ...current,
            tasks: [
              ...current.tasks,
              {
                ...task,
                id: createId(),
                status: "open",
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : current,
    );
  }

  function completeTask(id: string) {
    setData((current) =>
      current
        ? {
            ...current,
            tasks: current.tasks.map((task) =>
              task.id === id
                ? { ...task, status: "done", completedAt: new Date().toISOString() }
                : task,
            ),
          }
        : current,
    );
  }

  function deleteTask(id: string) {
    setData((current) =>
      current ? { ...current, tasks: current.tasks.filter((task) => task.id !== id) } : current,
    );
  }

  function saveBrainDump(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setData((current) =>
      current
        ? {
            ...current,
            brainDump: [
              { id: createId(), text: clean, createdAt: new Date().toISOString() },
              ...current.brainDump,
            ],
          }
        : current,
    );
  }

  function submitCommand(event: FormEvent) {
    event.preventDefault();
    if (!command.trim()) return;
    saveBrainDump(command);
    setCommand("");
    setView("life");
  }

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
        {view === "today" && (
          <>
            <section className="card">
              <div className="card-head">
                <div>
                  <span className="pill success">Life command centre</span>
                  <h2 className="top-title">Put it out of your mind</h2>
                  <p className="muted top-copy">
                    Save anything immediately. Abrar OS will keep it in your private inbox.
                  </p>
                </div>
                <Inbox size={24} />
              </div>
              <form onSubmit={submitCommand} className="command-row">
                <input
                  className="command"
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                  placeholder="Example: Chase employer tomorrow about working hours"
                  aria-label="Quick brain dump"
                />
                <button className="primary-button" type="submit">Save</button>
              </form>
              <div className="quick-grid">
                <button className="quick" onClick={() => setView("add")}>Add task</button>
                <button className="quick" onClick={() => setView("life")}>Open brain dump</button>
                <button className="quick" disabled>Log medicine soon</button>
                <button className="quick" disabled>Add expense soon</button>
              </div>
            </section>

            <section className="hero section-gap">
              <article className="card">
                <div className="card-head">
                  <h2>Needs attention</h2>
                  <span className={`pill ${todayTasks.length ? "warning" : "success"}`}>
                    {todayTasks.length ? `${todayTasks.length} due today` : "Clear"}
                  </span>
                </div>
                <TaskList
                  tasks={todayTasks}
                  onComplete={completeTask}
                  onDelete={deleteTask}
                  empty="No open tasks due today."
                />
              </article>

              <article className="card">
                <h2>Safe balance</h2>
                <div className="stat">£0.00</div>
                <p className="muted">Finance tracking is the next module.</p>
                <span className="pill">No accounts added</span>
              </article>
            </section>

            <section className="grid three section-gap">
              <article className="card">
                <div className="card-head"><h2>Today’s tasks</h2><ListTodo size={19} /></div>
                <TaskList
                  tasks={todayTasks.slice(0, 4)}
                  onComplete={completeTask}
                  onDelete={deleteTask}
                  empty="Nothing scheduled today."
                />
              </article>

              <article className="card">
                <div className="card-head"><h2>Medicines</h2><HeartPulse size={19} /></div>
                <p className="muted">Medicine schedules will be added after tasks and reminders are stable.</p>
                <span className="pill warning">Critical setup pending</span>
              </article>

              <article className="card">
                <div className="card-head"><h2>Brain dump</h2><Inbox size={19} /></div>
                <div className="stat">{data.brainDump.length}</div>
                <p className="muted">Unstructured thoughts safely captured.</p>
                <button className="text-button" onClick={() => setView("life")}>Review inbox</button>
              </article>
            </section>
          </>
        )}

        {view === "schedule" && (
          <section className="card">
            <div className="card-head"><h2>Schedule</h2><CalendarDays size={20} /></div>
            <TaskList
              tasks={upcomingTasks}
              onComplete={completeTask}
              onDelete={deleteTask}
              showDate
              empty="No upcoming tasks."
            />
          </section>
        )}

        {view === "add" && (
          <TaskForm
            onSave={(task) => {
              addTask(task);
              setView("today");
            }}
          />
        )}

        {view === "money" && (
          <section className="card">
            <div className="card-head"><h2>Money</h2><CircleDollarSign size={20} /></div>
            <div className="empty-state">
              <strong>Finance module is next</strong>
              <p className="muted">Accounts, income, direct debits, credit cards, loans and safe balance will live here.</p>
            </div>
          </section>
        )}

        {view === "life" && (
          <section className="card">
            <div className="card-head"><h2>Brain dump inbox</h2><Inbox size={20} /></div>
            {data.brainDump.length === 0 ? (
              <p className="muted">Your inbox is empty.</p>
            ) : (
              <div className="list">
                {data.brainDump.map((note) => (
                  <div className="item" key={note.id}>
                    <div>
                      <strong>{note.text}</strong>
                      <span>{new Date(note.createdAt).toLocaleString("en-GB")}</span>
                    </div>
                    <button
                      className="icon-button danger-button"
                      aria-label="Delete note"
                      onClick={() =>
                        setData((current) =>
                          current
                            ? {
                                ...current,
                                brainDump: current.brainDump.filter((item) => item.id !== note.id),
                              }
                            : current,
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        <NavButton active={view === "today"} onClick={() => setView("today")} icon={<LayoutDashboard size={19} />} label="Today" />
        <NavButton active={view === "schedule"} onClick={() => setView("schedule")} icon={<CalendarDays size={19} />} label="Schedule" />
        <NavButton active={view === "add"} onClick={() => setView("add")} icon={<Plus size={19} />} label="Add" />
        <NavButton active={view === "money"} onClick={() => setView("money")} icon={<CircleDollarSign size={19} />} label="Money" />
        <NavButton active={view === "life"} onClick={() => setView("life")} icon={<Home size={19} />} label="Life" />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}>{icon}{label}</button>;
}

function TaskList({ tasks, onComplete, onDelete, empty, showDate = false }: {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  empty: string;
  showDate?: boolean;
}) {
  if (tasks.length === 0) return <p className="muted">{empty}</p>;

  return (
    <div className="list">
      {tasks.map((task) => (
        <div className="item" key={task.id}>
          <div className="task-content">
            <strong>{task.title}</strong>
            <span>
              {showDate ? `${formatDate(task.date)} • ` : ""}
              {task.time || "Any time"} • {task.category}
            </span>
            <span className={`pill small-pill ${priorityClass(task.priority)}`}>{task.priority}</span>
          </div>
          <div className="item-actions">
            <button className="icon-button complete-button" aria-label="Complete task" onClick={() => onComplete(task.id)}><Check size={16} /></button>
            <button className="icon-button danger-button" aria-label="Delete task" onClick={() => onDelete(task.id)}><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskForm({ onSave }: { onSave: (task: Omit<Task, "id" | "createdAt" | "status">) => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("Personal");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [notes, setNotes] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), date, time, category, priority, notes: notes.trim() });
  }

  return (
    <section className="card">
      <div className="card-head"><h2>Add task</h2><Plus size={20} /></div>
      <form className="form-grid" onSubmit={submit}>
        <label className="field full-field">Task title<input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Example: Pay credit-card minimum" /></label>
        <label className="field">Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        <label className="field">Time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
        <label className="field">Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field">Priority<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
        <label className="field full-field">Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional details" /></label>
        <div className="form-actions full-field"><button className="primary-button" type="submit">Save task</button></div>
      </form>
    </section>
  );
}
