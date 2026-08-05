"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Check, HeartHandshake, Home, MapPin, Plus, Trash2, Users } from "lucide-react";
import { familyId, loadFamilyData, saveFamilyData } from "@/lib/family-storage";
import type { FamilyAppointment, FamilyData, FamilyEvent, FamilyMember, FamilySupport, HouseholdResponsibility } from "@/lib/family-types";

type Tab = "overview" | "members" | "events" | "appointments" | "responsibilities" | "support";
type AddMode = "member" | "event" | "appointment" | "responsibility" | "support";

const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)) : "Not set";
const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value || 0);

export default function FamilyOS() {
  const [data, setData] = useState<FamilyData | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [addMode, setAddMode] = useState<AddMode | null>(null);

  useEffect(() => setData(loadFamilyData()), []);
  useEffect(() => { if (data) saveFamilyData(data); }, [data]);

  const upcomingEvents = useMemo(() => (data?.events ?? []).filter(x => x.date >= today()).sort((a,b)=>a.date.localeCompare(b.date)), [data]);
  const upcomingAppointments = useMemo(() => (data?.appointments ?? []).filter(x => !x.completed && x.date >= today()).sort((a,b)=>a.date.localeCompare(b.date)), [data]);
  const dueResponsibilities = useMemo(() => (data?.responsibilities ?? []).filter(x => !x.completed && x.nextDate <= today()), [data]);
  const monthlySupport = useMemo(() => {
    const month = today().slice(0,7);
    return (data?.supportPayments ?? []).filter(x => x.date.startsWith(month)).reduce((sum,x)=>sum+x.amount,0);
  }, [data]);

  if (!data) return <main className="loading-screen">Loading family centre…</main>;

  function remove<K extends keyof FamilyData>(key: K, id: string) {
    setData(current => current ? { ...current, [key]: (current[key] as {id:string}[]).filter(x=>x.id!==id) } : current);
  }

  function completeResponsibility(id: string) {
    setData(current => current ? { ...current, responsibilities: current.responsibilities.map(item => item.id===id ? { ...item, completed: true } : item) } : current);
  }

  function completeAppointment(id: string) {
    setData(current => current ? { ...current, appointments: current.appointments.map(item => item.id===id ? { ...item, completed: true } : item) } : current);
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand"><h1>Family Centre</h1><p>People, events, appointments and shared responsibilities</p></div>
        <Link href="/" className="notification-button"><ArrowLeft size={17}/>Abrar OS</Link>
      </header>

      <main className="main">
        <section className="family-tabs">
          {(["overview","members","events","appointments","responsibilities","support"] as Tab[]).map(item => <button key={item} className={`quick ${tab===item?"tab-active":""}`} onClick={()=>{setTab(item);setAddMode(null)}}>{item[0].toUpperCase()+item.slice(1)}</button>)}
        </section>

        {tab === "overview" && <>
          <section className="grid three">
            <article className="card"><div className="card-head"><h2>Family members</h2><Users size={19}/></div><div className="stat">{data.members.length}</div><p className="muted">People and dependants being managed.</p></article>
            <article className="card"><div className="card-head"><h2>Upcoming</h2><CalendarDays size={19}/></div><div className="stat">{upcomingEvents.length+upcomingAppointments.length}</div><p className="muted">Events and appointments ahead.</p></article>
            <article className="card"><div className="card-head"><h2>Parents support</h2><HeartHandshake size={19}/></div><div className="stat">{money(monthlySupport)}</div><p className="muted">Recorded support sent this month.</p></article>
          </section>

          <section className="hero section-gap">
            <article className="card"><div className="card-head"><h2>Needs family attention</h2><span className={`pill ${dueResponsibilities.length?"warning":"success"}`}>{dueResponsibilities.length?`${dueResponsibilities.length} due`:"Clear"}</span></div>{dueResponsibilities.length?<div className="list">{dueResponsibilities.map(item=><div className="item" key={item.id}><div><strong>{item.title}</strong><span>{item.owner} • {item.area} • due {formatDate(item.nextDate)}</span></div></div>)}</div>:<p className="muted">No overdue family responsibilities.</p>}</article>
            <article className="card"><h2>Quick actions</h2><div className="list"><button className="quick" onClick={()=>{setTab("events");setAddMode("event")}}>Add family event</button><button className="quick" onClick={()=>{setTab("appointments");setAddMode("appointment")}}>Add appointment</button><button className="quick" onClick={()=>{setTab("responsibilities");setAddMode("responsibility")}}>Assign responsibility</button></div></article>
          </section>
        </>}

        {tab === "members" && <Module title="Family members" onAdd={()=>setAddMode("member")} addLabel="Add person">
          {addMode==="member" && <MemberForm onSave={item=>{setData({...data,members:[...data.members,item]});setAddMode(null)}}/>}
          <div className="grid three section-gap">{data.members.map(item=><article className="card" key={item.id}><div className="card-head"><h2>{item.name}</h2><button className="icon-button danger-button" onClick={()=>remove("members",item.id)}><Trash2 size={16}/></button></div><span className="pill">{item.relationship}</span><p className="muted">{item.location||"Location not entered"}</p>{item.dateOfBirth&&<p><strong>DOB:</strong> {formatDate(item.dateOfBirth)}</p>}{item.phone&&<p><strong>Phone:</strong> {item.phone}</p>}{item.notes&&<p className="muted">{item.notes}</p>}</article>)}</div>
        </Module>}

        {tab === "events" && <Module title="Family events" onAdd={()=>setAddMode("event")} addLabel="Add event">
          {addMode==="event" && <EventForm onSave={item=>{setData({...data,events:[...data.events,item]});setAddMode(null)}}/>}
          <RecordList empty="No family events added." items={data.events.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(item=>({id:item.id,title:item.title,meta:`${formatDate(item.date)} ${item.time||""} • ${item.people||"Family"} • ${item.location||"No location"}`,extra:item.estimatedCost?money(item.estimatedCost):"",remove:()=>remove("events",item.id)}))}/>
        </Module>}

        {tab === "appointments" && <Module title="Appointments" onAdd={()=>setAddMode("appointment")} addLabel="Add appointment">
          {addMode==="appointment" && <AppointmentForm onSave={item=>{setData({...data,appointments:[...data.appointments,item]});setAddMode(null)}}/>}
          <RecordList empty="No appointments added." items={data.appointments.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(item=>({id:item.id,title:`${item.person}: ${item.title}`,meta:`${formatDate(item.date)} ${item.time||""} • ${item.category} • ${item.location||"No location"}`,extra:item.completed?"Completed":"Open",complete:item.completed?undefined:()=>completeAppointment(item.id),remove:()=>remove("appointments",item.id)}))}/>
        </Module>}

        {tab === "responsibilities" && <Module title="Shared responsibilities" onAdd={()=>setAddMode("responsibility")} addLabel="Add responsibility">
          {addMode==="responsibility" && <ResponsibilityForm onSave={item=>{setData({...data,responsibilities:[...data.responsibilities,item]});setAddMode(null)}}/>}
          <RecordList empty="No shared responsibilities added." items={data.responsibilities.map(item=>({id:item.id,title:item.title,meta:`${item.owner} • ${item.area} • ${item.frequency} • next ${formatDate(item.nextDate)}`,extra:item.completed?"Completed":"Open",complete:item.completed?undefined:()=>completeResponsibility(item.id),remove:()=>remove("responsibilities",item.id)}))}/>
        </Module>}

        {tab === "support" && <Module title="Support to family and parents" onAdd={()=>setAddMode("support")} addLabel="Record support">
          {addMode==="support" && <SupportForm onSave={item=>{setData({...data,supportPayments:[...data.supportPayments,item]});setAddMode(null)}}/>}
          <RecordList empty="No family support payments recorded." items={data.supportPayments.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(item=>({id:item.id,title:`${item.person} — ${money(item.amount)}`,meta:`${formatDate(item.date)} • ${item.country} • ${item.purpose||"Family support"}`,remove:()=>remove("supportPayments",item.id)}))}/>
        </Module>}
      </main>
    </div>
  );
}

function Module({title,onAdd,addLabel,children}:{title:string;onAdd:()=>void;addLabel:string;children:React.ReactNode}){return <section className="card"><div className="card-head"><h2>{title}</h2><button className="primary-button compact-button" onClick={onAdd}><Plus size={16}/>{addLabel}</button></div>{children}</section>}

function RecordList({items,empty}:{items:{id:string;title:string;meta:string;extra?:string;complete?:()=>void;remove:()=>void}[];empty:string}){if(!items.length)return <p className="muted section-gap">{empty}</p>;return <div className="list section-gap">{items.map(item=><div className="item" key={item.id}><div><strong>{item.title}</strong><span>{item.meta}</span>{item.extra&&<span className="pill small-pill">{item.extra}</span>}</div><div className="item-actions">{item.complete&&<button className="icon-button complete-button" onClick={item.complete}><Check size={16}/></button>}<button className="icon-button danger-button" onClick={item.remove}><Trash2 size={16}/></button></div></div>)}</div>}

function MemberForm({onSave}:{onSave:(x:FamilyMember)=>void}){const [name,setName]=useState("");const [relationship,setRelationship]=useState("Child");const [dateOfBirth,setDateOfBirth]=useState("");const [location,setLocation]=useState("United Kingdom");const [phone,setPhone]=useState("");const [notes,setNotes]=useState("");function submit(e:FormEvent){e.preventDefault();onSave({id:familyId(),name,relationship,dateOfBirth,location,phone,notes,createdAt:new Date().toISOString()})}return <form className="form-grid section-gap" onSubmit={submit}><label className="field">Name<input value={name} onChange={e=>setName(e.target.value)} required/></label><label className="field">Relationship<input value={relationship} onChange={e=>setRelationship(e.target.value)} required/></label><label className="field">Date of birth<input type="date" value={dateOfBirth} onChange={e=>setDateOfBirth(e.target.value)}/></label><label className="field">Location<input value={location} onChange={e=>setLocation(e.target.value)}/></label><label className="field">Phone<input value={phone} onChange={e=>setPhone(e.target.value)}/></label><label className="field full-field">Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)}/></label><div className="form-actions full-field"><button className="primary-button">Save person</button></div></form>}

function EventForm({onSave}:{onSave:(x:FamilyEvent)=>void}){const [title,setTitle]=useState("");const [date,setDate]=useState(today());const [time,setTime]=useState("");const [location,setLocation]=useState("");const [people,setPeople]=useState("Family");const [estimatedCost,setEstimatedCost]=useState(0);const [preparation,setPreparation]=useState("");function submit(e:FormEvent){e.preventDefault();onSave({id:familyId(),title,date,time,location,people,estimatedCost,preparation,createdAt:new Date().toISOString()})}return <form className="form-grid section-gap" onSubmit={submit}><label className="field full-field">Event title<input value={title} onChange={e=>setTitle(e.target.value)} required/></label><label className="field">Date<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label><label className="field">Time<input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label><label className="field">Location<input value={location} onChange={e=>setLocation(e.target.value)}/></label><label className="field">People involved<input value={people} onChange={e=>setPeople(e.target.value)}/></label><label className="field">Estimated cost (£)<input type="number" min="0" step="0.01" value={estimatedCost} onChange={e=>setEstimatedCost(Number(e.target.value))}/></label><label className="field full-field">Preparation checklist / notes<textarea value={preparation} onChange={e=>setPreparation(e.target.value)}/></label><div className="form-actions full-field"><button className="primary-button">Save event</button></div></form>}

function AppointmentForm({onSave}:{onSave:(x:FamilyAppointment)=>void}){const [person,setPerson]=useState("Abrar");const [title,setTitle]=useState("");const [date,setDate]=useState(today());const [time,setTime]=useState("");const [location,setLocation]=useState("");const [category,setCategory]=useState<FamilyAppointment["category"]>("GP");const [notes,setNotes]=useState("");function submit(e:FormEvent){e.preventDefault();onSave({id:familyId(),person,title,date,time,location,category,notes,completed:false,createdAt:new Date().toISOString()})}return <form className="form-grid section-gap" onSubmit={submit}><label className="field">Person<input value={person} onChange={e=>setPerson(e.target.value)} required/></label><label className="field">Appointment title<input value={title} onChange={e=>setTitle(e.target.value)} required/></label><label className="field">Date<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label><label className="field">Time<input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label><label className="field">Category<select value={category} onChange={e=>setCategory(e.target.value as FamilyAppointment["category"])}>{["GP","Hospital","Nursery","School","Driving","Immigration","Other"].map(x=><option key={x}>{x}</option>)}</select></label><label className="field">Location<input value={location} onChange={e=>setLocation(e.target.value)}/></label><label className="field full-field">Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)}/></label><div className="form-actions full-field"><button className="primary-button">Save appointment</button></div></form>}

function ResponsibilityForm({onSave}:{onSave:(x:HouseholdResponsibility)=>void}){const [title,setTitle]=useState("");const [owner,setOwner]=useState("Shared");const [area,setArea]=useState<HouseholdResponsibility["area"]>("Children");const [frequency,setFrequency]=useState("Weekly");const [nextDate,setNextDate]=useState(today());const [notes,setNotes]=useState("");function submit(e:FormEvent){e.preventDefault();onSave({id:familyId(),title,owner,area,frequency,nextDate,notes,completed:false,createdAt:new Date().toISOString()})}return <form className="form-grid section-gap" onSubmit={submit}><label className="field full-field">Responsibility<input value={title} onChange={e=>setTitle(e.target.value)} required/></label><label className="field">Owner<select value={owner} onChange={e=>setOwner(e.target.value)}><option>Abrar</option><option>Wife</option><option>Shared</option></select></label><label className="field">Area<select value={area} onChange={e=>setArea(e.target.value as HouseholdResponsibility["area"])}>{["Children","Home","Parents","Transport","Health","Money","Other"].map(x=><option key={x}>{x}</option>)}</select></label><label className="field">Frequency<input value={frequency} onChange={e=>setFrequency(e.target.value)}/></label><label className="field">Next date<input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)} required/></label><label className="field full-field">Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)}/></label><div className="form-actions full-field"><button className="primary-button">Save responsibility</button></div></form>}

function SupportForm({onSave}:{onSave:(x:FamilySupport)=>void}){const [person,setPerson]=useState("Parents");const [country,setCountry]=useState("Pakistan");const [amount,setAmount]=useState(0);const [date,setDate]=useState(today());const [purpose,setPurpose]=useState("");function submit(e:FormEvent){e.preventDefault();onSave({id:familyId(),person,country,amount,date,purpose,createdAt:new Date().toISOString()})}return <form className="form-grid section-gap" onSubmit={submit}><label className="field">Person / family<input value={person} onChange={e=>setPerson(e.target.value)} required/></label><label className="field">Country<input value={country} onChange={e=>setCountry(e.target.value)} required/></label><label className="field">Amount (£)<input type="number" min="0" step="0.01" value={amount} onChange={e=>setAmount(Number(e.target.value))} required/></label><label className="field">Date<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label><label className="field full-field">Purpose / notes<textarea value={purpose} onChange={e=>setPurpose(e.target.value)}/></label><div className="form-actions full-field"><button className="primary-button">Record support</button></div></form>}
