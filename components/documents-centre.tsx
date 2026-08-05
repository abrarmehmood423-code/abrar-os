"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { docId, loadDocumentData, saveDocumentData } from "@/lib/documents-storage";
import type { DocumentCategory, DocumentData, ImmigrationRecord, LifeDocument, RenewalStatus } from "@/lib/documents-types";

type Tab = "documents" | "immigration" | "add-document" | "add-immigration";

const categories: DocumentCategory[] = ["Passport","Visa / eVisa","Share code","Driving licence","DBS","Insurance","MOT / vehicle","Employment","Education","Health","Business","Family","Other"];
const statuses: RenewalStatus[] = ["Active","Renew soon","Renewal started","Expired","Not applicable"];

function todayIso(){return new Date().toISOString().slice(0,10)}
function formatDate(value?:string){return value ? new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric"}).format(new Date(`${value}T12:00:00`)) : "Not entered"}
function daysUntil(value?:string){if(!value)return null;const start=new Date(`${todayIso()}T00:00:00`).getTime();const end=new Date(`${value}T00:00:00`).getTime();return Math.ceil((end-start)/86400000)}
function maskReference(value?:string){if(!value)return "Not entered";if(value.length<=4)return "••••";return `${"•".repeat(Math.max(4,value.length-4))}${value.slice(-4)}`}

export default function DocumentsCentre(){
  const [data,setData]=useState<DocumentData|null>(null);
  const [tab,setTab]=useState<Tab>("documents");
  const [showReferences,setShowReferences]=useState(false);
  useEffect(()=>setData(loadDocumentData()),[]);
  useEffect(()=>{if(data)saveDocumentData(data)},[data]);

  const alerts=useMemo(()=>{
    if(!data)return [] as LifeDocument[];
    return data.documents.filter((d)=>{const days=daysUntil(d.expiryDate);return days!==null&&days<=90}).sort((a,b)=>(a.expiryDate??"").localeCompare(b.expiryDate??""));
  },[data]);
  if(!data)return <main className="loading-screen">Loading documents…</main>;

  function addDocument(item:Omit<LifeDocument,"id"|"createdAt">){setData((c)=>c?{...c,documents:[...c.documents,{...item,id:docId(),createdAt:new Date().toISOString()}]}:c);setTab("documents")}
  function addImmigration(item:Omit<ImmigrationRecord,"id"|"createdAt">){setData((c)=>c?{...c,immigration:[...c.immigration,{...item,id:docId(),createdAt:new Date().toISOString()}]}:c);setTab("immigration")}
  function removeDoc(id:string){setData((c)=>c?{...c,documents:c.documents.filter((x)=>x.id!==id)}:c)}
  function removeImmigration(id:string){setData((c)=>c?{...c,immigration:c.immigration.filter((x)=>x.id!==id)}:c)}

  return <div className="shell">
    <header className="topbar"><div className="brand"><h1>Documents & Immigration</h1><p>Expiry control, renewal planning and private references</p></div><Link href="/" className="notification-button"><ArrowLeft size={17}/>Dashboard</Link></header>
    <main className="main">
      <section className="grid three">
        <article className="card"><h2>Documents</h2><div className="stat">{data.documents.length}</div><p className="muted">Passports, visas, insurance, licences and certificates.</p></article>
        <article className="card"><h2>Immigration profiles</h2><div className="stat">{data.immigration.length}</div><p className="muted">Visa route, sponsor and family records.</p></article>
        <article className="card"><h2>Expiry alerts</h2><div className="stat">{alerts.length}</div><p className="muted">Expired or due within 90 days.</p></article>
      </section>

      <section className="card section-gap">
        <div className="quick-grid">
          <button className={`quick ${tab==="documents"?"selected-tab":""}`} onClick={()=>setTab("documents")}>Documents</button>
          <button className={`quick ${tab==="immigration"?"selected-tab":""}`} onClick={()=>setTab("immigration")}>Immigration</button>
          <button className="quick" onClick={()=>setTab("add-document")}><Plus size={15}/> Add document</button>
          <button className="quick" onClick={()=>setTab("add-immigration")}><Plus size={15}/> Add immigration profile</button>
        </div>
      </section>

      {alerts.length>0&&<section className="card section-gap"><div className="card-head"><h2>Needs attention</h2><span className="pill warning">{alerts.length} alerts</span></div><div className="list">{alerts.map((d)=>{const days=daysUntil(d.expiryDate)!;return <div className="item" key={d.id}><div><strong>{d.title}</strong><span>{d.holder} • expires {formatDate(d.expiryDate)}</span></div><span className={`pill small-pill ${days<0?"danger":"warning"}`}>{days<0?`${Math.abs(days)} days expired`:`${days} days left`}</span></div>})}</div></section>}

      {tab==="documents"&&<section className="card section-gap"><div className="card-head"><h2>Document register</h2><button className="notification-button" onClick={()=>setShowReferences((x)=>!x)}><ShieldCheck size={16}/>{showReferences?"Hide references":"Show references"}</button></div>{data.documents.length===0?<p className="muted">No documents entered yet.</p>:<div className="list">{data.documents.slice().sort((a,b)=>(a.expiryDate??"9999").localeCompare(b.expiryDate??"9999")).map((d)=>{const days=daysUntil(d.expiryDate);return <div className="item" key={d.id}><div className="task-content"><strong>{d.title}</strong><span>{d.category} • holder: {d.holder}</span><span>Reference: {showReferences?(d.reference||"Not entered"):maskReference(d.reference)}</span><span>Issued {formatDate(d.issueDate)} • expires {formatDate(d.expiryDate)}</span><div className="inline-pills"><span className={`pill small-pill ${d.renewalStatus==="Expired"?"danger":d.renewalStatus==="Renew soon"||d.renewalStatus==="Renewal started"?"warning":"success"}`}>{d.renewalStatus}</span>{days!==null&&<span className={`pill small-pill ${days<0?"danger":days<=90?"warning":""}`}>{days<0?"Expired":`${days} days`}</span>}</div></div><button className="icon-button danger-button" onClick={()=>removeDoc(d.id)}><Trash2 size={16}/></button></div>})}</div>}</section>}

      {tab==="immigration"&&<section className="card section-gap"><div className="card-head"><h2>Immigration records</h2><ShieldCheck size={20}/></div><div className="list">{data.immigration.map((i)=>{const visaDays=daysUntil(i.visaExpiry);return <div className="item" key={i.id}><div className="task-content"><strong>{i.person}</strong><span>{i.route}{i.sponsor?` • Sponsor: ${i.sponsor}`:""}</span><span>Visa: {formatDate(i.visaStart)} to {formatDate(i.visaExpiry)}</span><span>Passport expiry: {formatDate(i.passportExpiry)}</span><span>CoS/reference: {showReferences?(i.cosReference||"Not entered"):maskReference(i.cosReference)}</span><div className="inline-pills"><span className={`pill small-pill ${i.evisaChecked?"success":"warning"}`}>{i.evisaChecked?"eVisa checked":"eVisa check needed"}</span>{visaDays!==null&&<span className={`pill small-pill ${visaDays<0?"danger":visaDays<=180?"warning":""}`}>{visaDays<0?"Visa expired":`${visaDays} visa days`}</span>}</div></div><button className="icon-button danger-button" onClick={()=>removeImmigration(i.id)}><Trash2 size={16}/></button></div>})}</div></section>}

      {tab==="add-document"&&<DocumentForm onSave={addDocument}/>} 
      {tab==="add-immigration"&&<ImmigrationForm onSave={addImmigration}/>} 
    </main>
  </div>
}

function DocumentForm({onSave}:{onSave:(d:Omit<LifeDocument,"id"|"createdAt">)=>void}){
 const [title,setTitle]=useState("");const [category,setCategory]=useState<DocumentCategory>("Passport");const [holder,setHolder]=useState("Abrar");const [reference,setReference]=useState("");const [issueDate,setIssueDate]=useState("");const [expiryDate,setExpiryDate]=useState("");const [renewalStatus,setRenewalStatus]=useState<RenewalStatus>("Active");const [renewalCost,setRenewalCost]=useState(0);const [notes,setNotes]=useState("");
 function submit(e:FormEvent){e.preventDefault();if(!title.trim()||!holder.trim())return;onSave({title:title.trim(),category,holder:holder.trim(),reference:reference.trim(),issueDate,expiryDate,renewalStatus,renewalCost,reminderDays:[90,60,30,14,7],notes:notes.trim()})}
 return <section className="card section-gap"><div className="card-head"><h2>Add document</h2><FileText size={20}/></div><form className="form-grid" onSubmit={submit}><label className="field full-field">Document title<input value={title} onChange={(e)=>setTitle(e.target.value)} required placeholder="Example: Abrar passport"/></label><label className="field">Category<select value={category} onChange={(e)=>setCategory(e.target.value as DocumentCategory)}>{categories.map((x)=><option key={x}>{x}</option>)}</select></label><label className="field">Holder<input value={holder} onChange={(e)=>setHolder(e.target.value)} required/></label><label className="field">Reference number<input value={reference} onChange={(e)=>setReference(e.target.value)}/></label><label className="field">Renewal status<select value={renewalStatus} onChange={(e)=>setRenewalStatus(e.target.value as RenewalStatus)}>{statuses.map((x)=><option key={x}>{x}</option>)}</select></label><label className="field">Issue date<input type="date" value={issueDate} onChange={(e)=>setIssueDate(e.target.value)}/></label><label className="field">Expiry date<input type="date" value={expiryDate} onChange={(e)=>setExpiryDate(e.target.value)}/></label><label className="field">Renewal cost (£)<input type="number" min="0" step="0.01" value={renewalCost} onChange={(e)=>setRenewalCost(Number(e.target.value))}/></label><label className="field full-field">Notes<textarea value={notes} onChange={(e)=>setNotes(e.target.value)}/></label><div className="form-actions full-field"><button className="primary-button">Save document</button></div></form></section>
}

function ImmigrationForm({onSave}:{onSave:(i:Omit<ImmigrationRecord,"id"|"createdAt">)=>void}){
 const [person,setPerson]=useState("");const [route,setRoute]=useState("Skilled Worker dependant");const [sponsor,setSponsor]=useState("");const [visaStart,setVisaStart]=useState("");const [visaExpiry,setVisaExpiry]=useState("");const [passportExpiry,setPassportExpiry]=useState("");const [cosReference,setCosReference]=useState("");const [evisaChecked,setEvisaChecked]=useState(false);const [shareCodeLastGenerated,setShareCodeLastGenerated]=useState("");const [notes,setNotes]=useState("");
 function submit(e:FormEvent){e.preventDefault();if(!person.trim()||!route.trim())return;onSave({person:person.trim(),route:route.trim(),sponsor:sponsor.trim(),visaStart,visaExpiry,passportExpiry,cosReference:cosReference.trim(),evisaChecked,shareCodeLastGenerated,notes:notes.trim()})}
 return <section className="card section-gap"><div className="card-head"><h2>Add immigration profile</h2><ShieldCheck size={20}/></div><form className="form-grid" onSubmit={submit}><label className="field">Person<input value={person} onChange={(e)=>setPerson(e.target.value)} required/></label><label className="field">Route<input value={route} onChange={(e)=>setRoute(e.target.value)} required/></label><label className="field full-field">Sponsor<input value={sponsor} onChange={(e)=>setSponsor(e.target.value)}/></label><label className="field">Visa start<input type="date" value={visaStart} onChange={(e)=>setVisaStart(e.target.value)}/></label><label className="field">Visa expiry<input type="date" value={visaExpiry} onChange={(e)=>setVisaExpiry(e.target.value)}/></label><label className="field">Passport expiry<input type="date" value={passportExpiry} onChange={(e)=>setPassportExpiry(e.target.value)}/></label><label className="field">CoS/reference<input value={cosReference} onChange={(e)=>setCosReference(e.target.value)}/></label><label className="field">Last share code date<input type="date" value={shareCodeLastGenerated} onChange={(e)=>setShareCodeLastGenerated(e.target.value)}/></label><label className="field">eVisa checked<select value={evisaChecked?"Yes":"No"} onChange={(e)=>setEvisaChecked(e.target.value==="Yes")}><option>No</option><option>Yes</option></select></label><label className="field full-field">Notes<textarea value={notes} onChange={(e)=>setNotes(e.target.value)}/></label><div className="form-actions full-field"><button className="primary-button">Save immigration profile</button></div></form></section>
}
