"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  CircleDollarSign,
  HeartPulse,
  Home,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Plus,
  Repeat2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { createId, loadData, nextRecurringDate, saveData } from "@/lib/storage";
import type { AppData, Priority, Recurrence, Responsibility, Task } from "@/lib/types";

type View = "today" | "schedule" | "add" | "money" | "life";
type AddMode = "task" | "responsibility";

const categories = ["Personal", "Family", "Health", "Money", "Immigration", "AAA Work", "Embrace", "Education", "Car", "Other"];
const recurrenceOptions: Recurrence[] = ["None", "Daily", "Weekly", "Monthly", "Yearly"];

function todayIso() { return new Date().toISOString().slice(0, 10); }
function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}
function priorityClass(priority: Priority) { return priority === "Critical" ? "danger" : priority === "High" ? "warning" : ""; }
function isOverdue(date: string) { return date < todayIso(); }

export default function LifeOS() {
  const [view, setView] = useState<View>("today");
  const [addMode, setAddMode] = useState<AddMode>("task");
  const [data, setData] = useState<AppData | null>(null);
  const [command, setCommand] = useState("");
  const [notifications, setNotifications] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setData(loadData());
    setNotifications("Notification" in window ? Notification.permission : "unsupported");
  }, []);
  useEffect(() => { if (data) saveData(data); }, [data]);

  const todayTasks = useMemo(() => (data?.tasks ?? []).filter((task) => task.date === todayIso() && task.status === "open").sort((a,b)=>(a.time??"23:59").localeCompare(b.time??"23:59")), [data]);
  const upcomingTasks = useMemo(() => (data?.tasks ?? []).filter((task) => task.status === "open").sort((a,b)=>`${a.date}${a.time??""}`.localeCompare(`${b.date}${b.time??""}`)), [data]);
  const overdueTasks = useMemo(() => upcomingTasks.filter((task) => isOverdue(task.date)), [upcomingTasks]);
  const dueResponsibilities = useMemo(() => (data?.responsibilities ?? []).filter((item) => item.active && item.nextDate <= todayIso()), [data]);

  if (!data) return <main className="loading-screen">Loading Abrar OS…</main>;

  function addTask(task: Omit<Task, "id" | "createdAt" | "status">) {
    setData((current) => current ? { ...current, tasks: [...current.tasks, { ...task, id: createId(), status: "open", createdAt: new Date().toISOString() }] } : current);
  }
  function addResponsibility(item: Omit<Responsibility, "id" | "createdAt" | "active">) {
    setData((current) => current ? { ...current, responsibilities: [...current.responsibilities, { ...item, id: createId(), active: true, createdAt: new Date().toISOString() }] } : current);
  }
  function completeTask(id: string) {
    setData((current) => {
      if (!current) return current;
      const original = current.tasks.find((task) => task.id === id);
      if (!original) return current;
      const completed = current.tasks.map((task) => task.id === id ? { ...task, status: "done" as const, completedAt: new Date().toISOString() } : task);
      if (original.recurrence === "None") return { ...current, tasks: completed };
      const next: Task = { ...original, id: createId(), date: nextRecurringDate(original.date, original.recurrence), status: "open", createdAt: new Date().toISOString(), completedAt: undefined };
      return { ...current, tasks: [...completed, next] };
    });
  }
  function deleteTask(id: string) { setData((current) => current ? { ...current, tasks: current.tasks.filter((task) => task.id !== id) } : current); }
  function completeResponsibility(id: string) {
    setData((current) => current ? { ...current, responsibilities: current.responsibilities.map((item) => item.id === id ? { ...item, nextDate: responsibilityNextDate(item.frequency), nextAction: item.nextAction || "Review next action" } : item) } : current);
  }
  function deleteResponsibility(id: string) { setData((current) => current ? { ...current, responsibilities: current.responsibilities.filter((item) => item.id !== id) } : current); }
  function saveBrainDump(text: string) {
    const clean = text.trim(); if (!clean) return;
    setData((current) => current ? { ...current, brainDump: [{ id: createId(), text: clean, createdAt: new Date().toISOString() }, ...current.brainDump] } : current);
  }
  function submitCommand(event: FormEvent) { event.preventDefault(); if (!command.trim()) return; saveBrainDump(command); setCommand(""); setView("life"); }
  async function enableNotifications() {
    if (!("Notification" in window)) return setNotifications("unsupported");
    const permission = await Notification.requestPermission();
    setNotifications(permission);
    if (permission === "granted") new Notification("Abrar OS reminders enabled", { body: "Browser reminders are ready. Keep native alarms for transplant medicines." });
  }

  const dateLabel = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand"><h1>Abrar OS</h1><p>{dateLabel}</p></div>
        <button className="notification-button" onClick={enableNotifications}><Bell size={17} />{notifications === "granted" ? "Reminders on" : "Enable reminders"}</button>
      </header>

      <main className="main">
        {view === "today" && <>
          <section className="card">
            <div className="card-head"><div><span className="pill success">Life command centre</span><h2 className="top-title">Put it out of your mind</h2><p className="muted top-copy">Capture anything immediately. It stays in your private inbox.</p></div><Inbox size={24}/></div>
            <form onSubmit={submitCommand} className="command-row"><input className="command" value={command} onChange={(e)=>setCommand(e.target.value)} placeholder="Example: Chase employer tomorrow about working hours"/><button className="primary-button">Save</button></form>
            <div className="quick-grid"><button className="quick" onClick={()=>{setAddMode("task");setView("add")}}>Add task</button><button className="quick" onClick={()=>{setAddMode("responsibility");setView("add")}}>Add responsibility</button><button className="quick" onClick={()=>setView("schedule")}>Open schedule</button><button className="quick" onClick={()=>setView("life")}>Brain dump</button></div>
          </section>

          <section className="hero section-gap">
            <article className="card"><div className="card-head"><h2>Needs attention</h2><span className={`pill ${(overdueTasks.length+dueResponsibilities.length)?"warning":"success"}`}>{overdueTasks.length+dueResponsibilities.length ? `${overdueTasks.length+dueResponsibilities.length} urgent` : "Clear"}</span></div>
              {overdueTasks.length===0 && dueResponsibilities.length===0 ? <p className="muted">No overdue tasks or responsibilities.</p> : <div className="list">
                {overdueTasks.map((task)=><div className="item" key={task.id}><div><strong>{task.title}</strong><span>Overdue since {formatDate(task.date)}</span></div><span className="pill danger small-pill">Task</span></div>)}
                {dueResponsibilities.map((item)=><div className="item" key={item.id}><div><strong>{item.title}</strong><span>{item.nextAction} • due {formatDate(item.nextDate)}</span></div><span className="pill warning small-pill">Responsibility</span></div>)}
              </div>}
            </article>
            <article className="card"><h2>Responsibility health</h2><div className="stat">{data.responsibilities.filter((x)=>x.active).length}</div><p className="muted">Active life areas being tracked.</p><span className={`pill ${dueResponsibilities.length?"warning":"success"}`}>{dueResponsibilities.length ? `${dueResponsibilities.length} need action` : "Up to date"}</span></article>
          </section>

          <section className="grid three section-gap">
            <article className="card"><div className="card-head"><h2>Today’s tasks</h2><ListTodo size={19}/></div><TaskList tasks={todayTasks.slice(0,4)} onComplete={completeTask} onDelete={deleteTask} empty="Nothing scheduled today."/></article>
            <article className="card"><div className="card-head"><h2>Recurring tasks</h2><Repeat2 size={19}/></div><div className="stat">{data.tasks.filter((x)=>x.status==="open"&&x.recurrence!=="None").length}</div><p className="muted">A new occurrence is created when you complete one.</p></article>
            <article className="card"><div className="card-head"><h2>Brain dump</h2><Inbox size={19}/></div><div className="stat">{data.brainDump.length}</div><p className="muted">Thoughts safely captured.</p><button className="text-button" onClick={()=>setView("life")}>Review inbox</button></article>
          </section>
        </>}

        {view === "schedule" && <section className="card"><div className="card-head"><h2>Schedule</h2><CalendarDays size={20}/></div><TaskList tasks={upcomingTasks} onComplete={completeTask} onDelete={deleteTask} showDate empty="No upcoming tasks."/></section>}

        {view === "add" && <>{addMode === "task" ? <TaskForm onSave={(task)=>{addTask(task);setView("today")}}/> : <ResponsibilityForm onSave={(item)=>{addResponsibility(item);setView("life")}}/>}</>}

        {view === "money" && <section className="card"><div className="card-head"><h2>Money</h2><CircleDollarSign size={20}/></div><div className="empty-state"><strong>Finance module comes next</strong><p className="muted">Accounts, income, direct debits, debts and safe balance will be added here.</p></div></section>}

        {view === "life" && <div className="grid two">
          <section className="card"><div className="card-head"><h2>Responsibilities</h2><ShieldCheck size={20}/></div>{data.responsibilities.length===0?<p className="muted">No responsibilities added.</p>:<div className="list">{data.responsibilities.map((item)=><div className="item" key={item.id}><div className="task-content"><strong>{item.title}</strong><span>{item.area} • {item.owner} • {item.frequency}</span><span>Next: {item.nextAction} — {formatDate(item.nextDate)}</span><span className={`pill small-pill ${priorityClass(item.priority)}`}>{item.priority}</span></div><div className="item-actions"><button className="icon-button complete-button" onClick={()=>completeResponsibility(item.id)}><Check size={16}/></button><button className="icon-button danger-button" onClick={()=>deleteResponsibility(item.id)}><Trash2 size={16}/></button></div></div>)}</div>}</section>
          <section className="card"><div className="card-head"><h2>Brain dump inbox</h2><Inbox size={20}/></div>{data.brainDump.length===0?<p className="muted">Your inbox is empty.</p>:<div className="list">{data.brainDump.map((note)=><div className="item" key={note.id}><div><strong>{note.text}</strong><span>{new Date(note.createdAt).toLocaleString("en-GB")}</span></div><button className="icon-button danger-button" onClick={()=>setData((current)=>current?{...current,brainDump:current.brainDump.filter((x)=>x.id!==note.id)}:current)}><Trash2 size={16}/></button></div>)}</div>}</section>
        </div>}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        <NavButton active={view==="today"} onClick={()=>setView("today")} icon={<LayoutDashboard size={19}/>} label="Today"/>
        <NavButton active={view==="schedule"} onClick={()=>setView("schedule")} icon={<CalendarDays size={19}/>} label="Schedule"/>
        <NavButton active={view==="add"} onClick={()=>setView("add")} icon={<Plus size={19}/>} label="Add"/>
        <NavButton active={view==="money"} onClick={()=>setView("money")} icon={<CircleDollarSign size={19}/>} label="Money"/>
        <NavButton active={view==="life"} onClick={()=>setView("life")} icon={<Home size={19}/>} label="Life"/>
      </nav>
    </div>
  );
}

function responsibilityNextDate(frequency:string){const d=new Date();const f=frequency.toLowerCase();if(f.includes("daily"))d.setDate(d.getDate()+1);else if(f.includes("weekly"))d.setDate(d.getDate()+7);else if(f.includes("year"))d.setFullYear(d.getFullYear()+1);else d.setMonth(d.getMonth()+1);return d.toISOString().slice(0,10)}
function NavButton({active,onClick,icon,label}:{active:boolean;onClick:()=>void;icon:React.ReactNode;label:string}){return <button className={`nav-button ${active?"active":""}`} onClick={onClick}>{icon}{label}</button>}

function TaskList({tasks,onComplete,onDelete,empty,showDate=false}:{tasks:Task[];onComplete:(id:string)=>void;onDelete:(id:string)=>void;empty:string;showDate?:boolean}){
  if(!tasks.length)return <p className="muted">{empty}</p>;
  return <div className="list">{tasks.map((task)=><div className="item" key={task.id}><div className="task-content"><strong>{task.title}</strong><span>{showDate?`${formatDate(task.date)} • `:""}{task.time||"Any time"} • {task.category}</span><div className="inline-pills"><span className={`pill small-pill ${priorityClass(task.priority)}`}>{task.priority}</span>{task.recurrence!=="None"&&<span className="pill small-pill"><Repeat2 size={12}/>{task.recurrence}</span>}{task.reminderMinutes? <span className="pill small-pill"><Bell size={12}/>{task.reminderMinutes}m</span>:null}</div></div><div className="item-actions"><button className="icon-button complete-button" onClick={()=>onComplete(task.id)}><Check size={16}/></button><button className="icon-button danger-button" onClick={()=>onDelete(task.id)}><Trash2 size={16}/></button></div></div>)}</div>
}

function TaskForm({onSave}:{onSave:(task:Omit<Task,"id"|"createdAt"|"status">)=>void}){
  const [title,setTitle]=useState("");const [date,setDate]=useState(todayIso());const [time,setTime]=useState("");const [category,setCategory]=useState("Personal");const [priority,setPriority]=useState<Priority>("Medium");const [recurrence,setRecurrence]=useState<Recurrence>("None");const [reminderMinutes,setReminderMinutes]=useState(0);const [notes,setNotes]=useState("");
  function submit(e:FormEvent){e.preventDefault();if(!title.trim())return;onSave({title:title.trim(),date,time,category,priority,recurrence,reminderMinutes,notes:notes.trim()})}
  return <section className="card"><div className="card-head"><h2>Add task or reminder</h2><Plus size={20}/></div><form className="form-grid" onSubmit={submit}>
    <label className="field full-field">Task title<input value={title} onChange={(e)=>setTitle(e.target.value)} required/></label>
    <label className="field">Date<input type="date" value={date} onChange={(e)=>setDate(e.target.value)} required/></label><label className="field">Time<input type="time" value={time} onChange={(e)=>setTime(e.target.value)}/></label>
    <label className="field">Category<select value={category} onChange={(e)=>setCategory(e.target.value)}>{categories.map((x)=><option key={x}>{x}</option>)}</select></label><label className="field">Priority<select value={priority} onChange={(e)=>setPriority(e.target.value as Priority)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
    <label className="field">Repeat<select value={recurrence} onChange={(e)=>setRecurrence(e.target.value as Recurrence)}>{recurrenceOptions.map((x)=><option key={x}>{x}</option>)}</select></label><label className="field">Remind before<select value={reminderMinutes} onChange={(e)=>setReminderMinutes(Number(e.target.value))}><option value={0}>No browser reminder</option><option value={5}>5 minutes</option><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={1440}>1 day</option></select></label>
    <label className="field full-field">Notes<textarea value={notes} onChange={(e)=>setNotes(e.target.value)}/></label><div className="form-actions full-field"><button className="primary-button">Save task</button></div>
  </form></section>
}

function ResponsibilityForm({onSave}:{onSave:(item:Omit<Responsibility,"id"|"createdAt"|"active">)=>void}){
  const [title,setTitle]=useState("");const [area,setArea]=useState("Family");const [owner,setOwner]=useState("Abrar");const [frequency,setFrequency]=useState("Monthly");const [priority,setPriority]=useState<Priority>("High");const [nextAction,setNextAction]=useState("");const [nextDate,setNextDate]=useState(todayIso());
  function submit(e:FormEvent){e.preventDefault();if(!title.trim()||!nextAction.trim())return;onSave({title:title.trim(),area,owner,frequency,priority,nextAction:nextAction.trim(),nextDate})}
  return <section className="card"><div className="card-head"><h2>Add responsibility</h2><ShieldCheck size={20}/></div><form className="form-grid" onSubmit={submit}>
    <label className="field full-field">Responsibility<input value={title} onChange={(e)=>setTitle(e.target.value)} required placeholder="Example: Manage children’s nursery"/></label><label className="field">Area<select value={area} onChange={(e)=>setArea(e.target.value)}>{categories.map((x)=><option key={x}>{x}</option>)}</select></label><label className="field">Owner<input value={owner} onChange={(e)=>setOwner(e.target.value)}/></label>
    <label className="field">Frequency<select value={frequency} onChange={(e)=>setFrequency(e.target.value)}><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Yearly</option><option>As needed</option></select></label><label className="field">Priority<select value={priority} onChange={(e)=>setPriority(e.target.value as Priority)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
    <label className="field full-field">Next action<input value={nextAction} onChange={(e)=>setNextAction(e.target.value)} required/></label><label className="field">Next review date<input type="date" value={nextDate} onChange={(e)=>setNextDate(e.target.value)}/></label><div className="form-actions full-field"><button className="primary-button">Save responsibility</button></div>
  </form></section>
}
