"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, Check, Clock3, GraduationCap, Plus, Trash2 } from "lucide-react";
import { loadWorkData, saveWorkData, workId } from "@/lib/work-storage";
import type { StudyUnit, WorkData, WorkFollowUp, WorkItem, WorkspaceName, WorkStatus } from "@/lib/work-types";

const workspaces: WorkspaceName[] = ["AAA Work", "Embrace", "Level 7"];
const statuses: WorkStatus[] = ["Backlog", "In progress", "Waiting", "Testing", "Completed"];
const today = () => new Date().toISOString().slice(0, 10);
const dateText = (value?: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "No deadline";

export default function WorkCentre() {
  const [data, setData] = useState<WorkData | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceName>("AAA Work");
  const [mode, setMode] = useState<"overview" | "task" | "followup" | "study">("overview");

  useEffect(() => setData(loadWorkData()), []);
  useEffect(() => { if (data) saveWorkData(data); }, [data]);

  const workspaceItems = useMemo(() => (data?.items ?? []).filter(x => x.workspace === workspace), [data, workspace]);
  const activeItems = workspaceItems.filter(x => x.status !== "Completed");
  const overdue = activeItems.filter(x => x.dueDate && x.dueDate < today());
  const waiting = (data?.followUps ?? []).filter(x => x.workspace === workspace && x.status === "Waiting");

  if (!data) return <main className="loading-screen">Loading work centre…</main>;

  function addItem(item: Omit<WorkItem, "id" | "createdAt">) {
    setData(current => current ? { ...current, items: [...current.items, { ...item, id: workId(), createdAt: new Date().toISOString() }] } : current);
    setMode("overview");
  }
  function addFollowUp(item: Omit<WorkFollowUp, "id" | "createdAt">) {
    setData(current => current ? { ...current, followUps: [...current.followUps, { ...item, id: workId(), createdAt: new Date().toISOString() }] } : current);
    setMode("overview");
  }
  function addStudy(item: Omit<StudyUnit, "id" | "createdAt">) {
    setData(current => current ? { ...current, studyUnits: [...current.studyUnits, { ...item, id: workId(), createdAt: new Date().toISOString() }] } : current);
    setMode("overview");
  }
  function moveItem(id: string, status: WorkStatus) {
    setData(current => current ? { ...current, items: current.items.map(x => x.id === id ? { ...x, status, progress: status === "Completed" ? 100 : x.progress, completedAt: status === "Completed" ? new Date().toISOString() : undefined } : x) } : current);
  }
  function remove(collection: "items" | "followUps" | "studyUnits", id: string) {
    setData(current => current ? { ...current, [collection]: current[collection].filter((x: { id: string }) => x.id !== id) } as WorkData : current);
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand"><h1>Work & Study</h1><p>AAA, Embrace and Level 7 in one place</p></div>
        <Link className="notification-button" href="/"><ArrowLeft size={17}/>Dashboard</Link>
      </header>
      <main className="main">
        <section className="card">
          <div className="quick-grid" style={{marginTop:0}}>
            {workspaces.map(name => <button key={name} className={`quick ${workspace === name ? "workspace-active" : ""}`} onClick={() => { setWorkspace(name); setMode("overview"); }}>{name}</button>)}
          </div>
        </section>

        {mode === "overview" && <>
          <section className="grid three section-gap">
            <article className="card"><h2>Open work</h2><div className="stat">{activeItems.length}</div><p className="muted">Items not completed.</p></article>
            <article className="card"><h2>Overdue</h2><div className="stat">{overdue.length}</div><p className="muted">Deadlines requiring action.</p></article>
            <article className="card"><h2>Waiting for replies</h2><div className="stat">{waiting.length}</div><p className="muted">People or organisations to chase.</p></article>
          </section>

          <section className="card section-gap">
            <div className="card-head"><h2>{workspace}</h2><BriefcaseBusiness size={20}/></div>
            <div className="quick-grid">
              <button className="quick" onClick={() => setMode("task")}>Add project/task</button>
              <button className="quick" onClick={() => setMode("followup")}>Add follow-up</button>
              {workspace === "Level 7" && <button className="quick" onClick={() => setMode("study")}>Add unit/assignment</button>}
            </div>
          </section>

          <section className="section-gap kanban">
            {statuses.map(status => <article className="card kanban-column" key={status}>
              <div className="card-head"><h2>{status}</h2><span className="pill">{workspaceItems.filter(x => x.status === status).length}</span></div>
              <div className="list">
                {workspaceItems.filter(x => x.status === status).map(item => <div className="item" key={item.id}>
                  <div className="task-content"><strong>{item.title}</strong><span>{item.owner} • {dateText(item.dueDate)}</span><span>{item.description}</span><div className="progress"><span style={{width:`${item.progress}%`}}/></div><div className="inline-pills"><span className="pill small-pill">{item.priority}</span><span className="pill small-pill">{item.progress}%</span></div></div>
                  <div className="item-actions"><select aria-label="Move item" value={item.status} onChange={e => moveItem(item.id, e.target.value as WorkStatus)}>{statuses.map(s => <option key={s}>{s}</option>)}</select><button className="icon-button danger-button" onClick={() => remove("items", item.id)}><Trash2 size={15}/></button></div>
                </div>)}
                {!workspaceItems.some(x => x.status === status) && <p className="muted">No items.</p>}
              </div>
            </article>)}
          </section>

          <section className="grid two section-gap">
            <article className="card"><div className="card-head"><h2>Follow-ups</h2><Clock3 size={19}/></div><div className="list">
              {data.followUps.filter(x => x.workspace === workspace).map(x => <div className="item" key={x.id}><div><strong>{x.person}: {x.subject}</strong><span>{x.channel} • Next {dateText(x.nextDate)} • {x.status}</span></div><div className="item-actions"><button className="icon-button complete-button" onClick={() => setData(c => c ? {...c, followUps:c.followUps.map(f => f.id === x.id ? {...f,status:"Closed"} : f)} : c)}><Check size={15}/></button><button className="icon-button danger-button" onClick={() => remove("followUps", x.id)}><Trash2 size={15}/></button></div></div>)}
              {!data.followUps.some(x => x.workspace === workspace) && <p className="muted">No follow-ups.</p>}
            </div></article>
            {workspace === "Level 7" && <article className="card"><div className="card-head"><h2>Units & assignments</h2><GraduationCap size={19}/></div><div className="list">{data.studyUnits.map(x => <div className="item" key={x.id}><div className="task-content"><strong>{x.title}</strong><span>{x.status} • Deadline {dateText(x.deadline)}</span><span>{x.wordsDone ?? 0} / {x.wordTarget ?? 0} words • Payment £{x.paymentDue ?? 0}</span></div><button className="icon-button danger-button" onClick={() => remove("studyUnits", x.id)}><Trash2 size={15}/></button></div>)}</div></article>}
          </section>
        </>}

        {mode === "task" && <WorkItemForm workspace={workspace} onSave={addItem} onCancel={() => setMode("overview")}/>} 
        {mode === "followup" && <FollowUpForm workspace={workspace} onSave={addFollowUp} onCancel={() => setMode("overview")}/>} 
        {mode === "study" && <StudyForm onSave={addStudy} onCancel={() => setMode("overview")}/>} 
      </main>
    </div>
  );
}

function WorkItemForm({workspace,onSave,onCancel}:{workspace:WorkspaceName;onSave:(x:Omit<WorkItem,"id"|"createdAt">)=>void;onCancel:()=>void}) {
  const [title,setTitle]=useState(""); const [description,setDescription]=useState(""); const [status,setStatus]=useState<WorkStatus>("Backlog"); const [priority,setPriority]=useState<WorkItem["priority"]>("Medium"); const [dueDate,setDueDate]=useState(""); const [owner,setOwner]=useState("Abrar"); const [progress,setProgress]=useState(0);
  function submit(e:FormEvent){e.preventDefault();if(!title.trim())return;onSave({workspace,title:title.trim(),description,status,priority,dueDate,owner,progress})}
  return <section className="card section-gap"><div className="card-head"><h2>Add {workspace} item</h2><Plus size={20}/></div><form className="form-grid" onSubmit={submit}><label className="field full-field">Title<input required value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="field full-field">Description<textarea value={description} onChange={e=>setDescription(e.target.value)}/></label><label className="field">Status<select value={status} onChange={e=>setStatus(e.target.value as WorkStatus)}>{statuses.map(x=><option key={x}>{x}</option>)}</select></label><label className="field">Priority<select value={priority} onChange={e=>setPriority(e.target.value as WorkItem["priority"])}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label><label className="field">Deadline<input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label><label className="field">Owner<input value={owner} onChange={e=>setOwner(e.target.value)}/></label><label className="field">Progress %<input type="number" min="0" max="100" value={progress} onChange={e=>setProgress(Number(e.target.value))}/></label><div className="form-actions full-field"><button type="button" className="quick" onClick={onCancel}>Cancel</button><button className="primary-button">Save item</button></div></form></section>
}

function FollowUpForm({workspace,onSave,onCancel}:{workspace:WorkspaceName;onSave:(x:Omit<WorkFollowUp,"id"|"createdAt">)=>void;onCancel:()=>void}) {
 const [person,setPerson]=useState("");const [subject,setSubject]=useState("");const [channel,setChannel]=useState<WorkFollowUp["channel"]>("Email");const [contactedDate,setContactedDate]=useState(today());const [nextDate,setNextDate]=useState(today());const [notes,setNotes]=useState("");
 function submit(e:FormEvent){e.preventDefault();if(!person||!subject)return;onSave({workspace,person,subject,channel,contactedDate,nextDate,status:"Waiting",notes})}
 return <section className="card section-gap"><h2>Add follow-up</h2><form className="form-grid" onSubmit={submit}><label className="field">Person/organisation<input required value={person} onChange={e=>setPerson(e.target.value)}/></label><label className="field">Subject<input required value={subject} onChange={e=>setSubject(e.target.value)}/></label><label className="field">Channel<select value={channel} onChange={e=>setChannel(e.target.value as WorkFollowUp["channel"])}><option>Phone</option><option>Email</option><option>WhatsApp</option><option>In person</option><option>Website</option></select></label><label className="field">Contacted<input type="date" value={contactedDate} onChange={e=>setContactedDate(e.target.value)}/></label><label className="field">Next follow-up<input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)}/></label><label className="field full-field">Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)}/></label><div className="form-actions full-field"><button type="button" className="quick" onClick={onCancel}>Cancel</button><button className="primary-button">Save follow-up</button></div></form></section>
}

function StudyForm({onSave,onCancel}:{onSave:(x:Omit<StudyUnit,"id"|"createdAt">)=>void;onCancel:()=>void}) {
 const [title,setTitle]=useState("");const [deadline,setDeadline]=useState("");const [wordTarget,setWordTarget]=useState(0);const [wordsDone,setWordsDone]=useState(0);const [status,setStatus]=useState<StudyUnit["status"]>("Not started");const [paymentDue,setPaymentDue]=useState(0);const [notes,setNotes]=useState("");
 function submit(e:FormEvent){e.preventDefault();if(!title)return;onSave({title,deadline,wordTarget,wordsDone,status,paymentDue,notes})}
 return <section className="card section-gap"><h2>Add Level 7 unit or assignment</h2><form className="form-grid" onSubmit={submit}><label className="field full-field">Title<input required value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="field">Deadline<input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}/></label><label className="field">Status<select value={status} onChange={e=>setStatus(e.target.value as StudyUnit["status"])}><option>Not started</option><option>Researching</option><option>Drafting</option><option>Reviewing</option><option>Submitted</option><option>Completed</option></select></label><label className="field">Word target<input type="number" value={wordTarget} onChange={e=>setWordTarget(Number(e.target.value))}/></label><label className="field">Words completed<input type="number" value={wordsDone} onChange={e=>setWordsDone(Number(e.target.value))}/></label><label className="field">Payment due £<input type="number" value={paymentDue} onChange={e=>setPaymentDue(Number(e.target.value))}/></label><label className="field full-field">Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)}/></label><div className="form-actions full-field"><button type="button" className="quick" onClick={onCancel}>Cancel</button><button className="primary-button">Save study item</button></div></form></section>
}
