"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Car, Fuel, Gauge, Receipt, ShieldAlert, Trash2, Wrench } from "lucide-react";
import { carId, loadCarData, saveCarData } from "@/lib/car-storage";
import type { CarData, ParkingCase, Vehicle, VehicleCost, VehicleCostType } from "@/lib/car-types";

const today = () => new Date().toISOString().slice(0, 10);
const money = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n || 0);
const formatDate = (v?: string) => v ? new Date(`${v}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not entered";
const daysUntil = (v?: string) => v ? Math.ceil((new Date(`${v}T12:00:00`).getTime() - new Date(`${today()}T12:00:00`).getTime()) / 86400000) : null;

export default function CarsCentre() {
  const [data, setData] = useState<CarData | null>(null);
  const [selected, setSelected] = useState("prius-2018");
  const [tab, setTab] = useState<"overview" | "cost" | "parking">("overview");

  useEffect(() => setData(loadCarData()), []);
  useEffect(() => { if (data) saveCarData(data); }, [data]);

  const vehicle = data?.vehicles.find((v) => v.id === selected);
  const vehicleCosts = useMemo(() => (data?.costs ?? []).filter((x) => x.vehicleId === selected).sort((a,b)=>b.date.localeCompare(a.date)), [data, selected]);
  const vehicleParking = useMemo(() => (data?.parkingCases ?? []).filter((x) => x.vehicleId === selected).sort((a,b)=>b.incidentDate.localeCompare(a.incidentDate)), [data, selected]);
  const totalCost = vehicleCosts.reduce((s, x) => s + x.amount, 0);
  const fuelCost = vehicleCosts.filter((x) => x.type === "Fuel").reduce((s, x) => s + x.amount, 0);
  const openParking = vehicleParking.filter((x) => x.status === "Open" || x.status === "Appealed").length;

  if (!data || !vehicle) return <main className="loading-screen">Loading Cars & Transport…</main>;

  function updateVehicle(patch: Partial<Vehicle>) {
    setData((current) => current ? { ...current, vehicles: current.vehicles.map((v) => v.id === selected ? { ...v, ...patch } : v) } : current);
  }
  function addCost(cost: Omit<VehicleCost, "id" | "vehicleId">) {
    setData((current) => current ? { ...current, costs: [{ ...cost, id: carId(), vehicleId: selected }, ...current.costs] } : current);
  }
  function addParking(item: Omit<ParkingCase, "id" | "vehicleId">) {
    setData((current) => current ? { ...current, parkingCases: [{ ...item, id: carId(), vehicleId: selected }, ...current.parkingCases] } : current);
  }
  function deleteCost(id: string) { setData((c) => c ? { ...c, costs: c.costs.filter((x) => x.id !== id) } : c); }
  function deleteParking(id: string) { setData((c) => c ? { ...c, parkingCases: c.parkingCases.filter((x) => x.id !== id) } : c); }
  function updateParking(id: string, status: ParkingCase["status"]) { setData((c) => c ? { ...c, parkingCases: c.parkingCases.map((x) => x.id === id ? { ...x, status } : x) } : c); }

  const renewalFields: { label: string; key: keyof Vehicle }[] = [
    { label: "MOT", key: "motExpiry" }, { label: "Road tax", key: "taxExpiry" },
    { label: "Insurance", key: "insuranceExpiry" }, { label: "Breakdown cover", key: "breakdownExpiry" },
    { label: "Next service", key: "nextServiceDate" },
  ];

  return <div className="shell">
    <header className="topbar"><div className="brand"><h1>Cars & Transport</h1><p>Renewals, running costs, repairs and parking cases</p></div><Link className="notification-button" href="/"><ArrowLeft size={17}/>Back</Link></header>
    <main className="main">
      <section className="card">
        <div className="quick-grid">
          {data.vehicles.map((v) => <button key={v.id} className={`quick ${selected === v.id ? "selected-quick" : ""}`} onClick={() => setSelected(v.id)}>{v.name}</button>)}
          <button className="quick" onClick={() => setTab("cost")}>Add cost</button>
          <button className="quick" onClick={() => setTab("parking")}>Add parking case</button>
        </div>
      </section>

      <section className="grid three section-gap">
        <article className="card"><div className="card-head"><h2>Total recorded cost</h2><Receipt size={19}/></div><div className="stat">{money(totalCost)}</div><p className="muted">All entries for this vehicle.</p></article>
        <article className="card"><div className="card-head"><h2>Fuel recorded</h2><Fuel size={19}/></div><div className="stat">{money(fuelCost)}</div><p className="muted">Manual fuel entries.</p></article>
        <article className="card"><div className="card-head"><h2>Open parking cases</h2><ShieldAlert size={19}/></div><div className="stat">{openParking}</div><p className="muted">Open or under appeal.</p></article>
      </section>

      <section className="grid two section-gap">
        <article className="card">
          <div className="card-head"><h2>{vehicle.name}</h2><Car size={20}/></div>
          <div className="form-grid">
            <label className="field">Registration<input value={vehicle.registration || ""} onChange={(e)=>updateVehicle({registration:e.target.value.toUpperCase()})}/></label>
            <label className="field">Current mileage<input type="number" value={vehicle.mileage || ""} onChange={(e)=>updateVehicle({mileage:Number(e.target.value)})}/></label>
            <label className="field">Make<input value={vehicle.make} onChange={(e)=>updateVehicle({make:e.target.value})}/></label>
            <label className="field">Model<input value={vehicle.model} onChange={(e)=>updateVehicle({model:e.target.value})}/></label>
            <label className="field">Year<input type="number" value={vehicle.year || ""} onChange={(e)=>updateVehicle({year:Number(e.target.value)})}/></label>
            <label className="field">Fuel type<input value={vehicle.fuelType || ""} onChange={(e)=>updateVehicle({fuelType:e.target.value})}/></label>
            <label className="field">Next service mileage<input type="number" value={vehicle.nextServiceMileage || ""} onChange={(e)=>updateVehicle({nextServiceMileage:Number(e.target.value)})}/></label>
            <label className="field full-field">Notes<textarea value={vehicle.notes || ""} onChange={(e)=>updateVehicle({notes:e.target.value})}/></label>
          </div>
        </article>

        <article className="card">
          <div className="card-head"><h2>Renewals and servicing</h2><Wrench size={20}/></div>
          <div className="list">
            {renewalFields.map((f) => { const value = vehicle[f.key] as string | undefined; const days = daysUntil(value); return <div className="item" key={f.label}><div className="task-content"><strong>{f.label}</strong><span>{formatDate(value)}{days !== null ? ` • ${days < 0 ? `${Math.abs(days)} days overdue` : `${days} days remaining`}` : ""}</span></div><input type="date" value={value || ""} onChange={(e)=>updateVehicle({[f.key]:e.target.value})} style={{maxWidth:150}}/></div> })}
          </div>
        </article>
      </section>

      <section className="card section-gap">
        <div className="card-head"><h2>Vehicle activity</h2><Gauge size={20}/></div>
        <div className="quick-grid"><button className={`quick ${tab==="overview"?"selected-quick":""}`} onClick={()=>setTab("overview")}>History</button><button className={`quick ${tab==="cost"?"selected-quick":""}`} onClick={()=>setTab("cost")}>Add expense</button><button className={`quick ${tab==="parking"?"selected-quick":""}`} onClick={()=>setTab("parking")}>Parking / PCN</button></div>
        {tab === "overview" && <div className="grid two section-gap">
          <div><h3>Costs and maintenance</h3>{vehicleCosts.length ? <div className="list">{vehicleCosts.map((x)=><div className="item" key={x.id}><div><strong>{x.type}: {x.description}</strong><span>{formatDate(x.date)} • {money(x.amount)}{x.mileage ? ` • ${x.mileage.toLocaleString()} miles` : ""}</span></div><button className="icon-button danger-button" onClick={()=>deleteCost(x.id)}><Trash2 size={15}/></button></div>)}</div>:<p className="muted">No costs recorded.</p>}</div>
          <div><h3>Parking cases</h3>{vehicleParking.length ? <div className="list">{vehicleParking.map((x)=><div className="item" key={x.id}><div className="task-content"><strong>{x.issuer} — {money(x.amount)}</strong><span>{formatDate(x.incidentDate)} • Deadline {formatDate(x.deadline)} • {x.status}</span><select value={x.status} onChange={(e)=>updateParking(x.id,e.target.value as ParkingCase["status"])}><option>Open</option><option>Appealed</option><option>Paid</option><option>Cancelled</option></select></div><button className="icon-button danger-button" onClick={()=>deleteParking(x.id)}><Trash2 size={15}/></button></div>)}</div>:<p className="muted">No parking cases recorded.</p>}</div>
        </div>}
        {tab === "cost" && <CostForm onSave={(x)=>{addCost(x);setTab("overview")}}/>}
        {tab === "parking" && <ParkingForm onSave={(x)=>{addParking(x);setTab("overview")}}/>}
      </section>
    </main>
  </div>;
}

function CostForm({onSave}:{onSave:(x:Omit<VehicleCost,"id"|"vehicleId">)=>void}){
  const [type,setType]=useState<VehicleCostType>("Fuel"),[amount,setAmount]=useState(0),[date,setDate]=useState(today()),[mileage,setMileage]=useState(0),[description,setDescription]=useState("");
  function submit(e:FormEvent){e.preventDefault();if(!amount||!description.trim())return;onSave({type,amount,date,mileage,description:description.trim()})}
  return <form className="form-grid section-gap" onSubmit={submit}><label className="field">Type<select value={type} onChange={(e)=>setType(e.target.value as VehicleCostType)}>{["Fuel","Repair","Service","Insurance","Tax","MOT","Tyres","Breakdown","Parking","Other"].map(x=><option key={x}>{x}</option>)}</select></label><label className="field">Amount (£)<input type="number" step="0.01" value={amount||""} onChange={(e)=>setAmount(Number(e.target.value))}/></label><label className="field">Date<input type="date" value={date} onChange={(e)=>setDate(e.target.value)}/></label><label className="field">Mileage<input type="number" value={mileage||""} onChange={(e)=>setMileage(Number(e.target.value))}/></label><label className="field full-field">Description<input value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Fuel, repair details, service work..."/></label><div className="form-actions full-field"><button className="primary-button">Save vehicle cost</button></div></form>
}

function ParkingForm({onSave}:{onSave:(x:Omit<ParkingCase,"id"|"vehicleId">)=>void}){
  const [issuer,setIssuer]=useState(""),[reference,setReference]=useState(""),[incidentDate,setIncidentDate]=useState(today()),[deadline,setDeadline]=useState(""),[amount,setAmount]=useState(0),[status,setStatus]=useState<ParkingCase["status"]>("Open"),[notes,setNotes]=useState("");
  function submit(e:FormEvent){e.preventDefault();if(!issuer.trim())return;onSave({issuer:issuer.trim(),reference,incidentDate,deadline,amount,status,notes})}
  return <form className="form-grid section-gap" onSubmit={submit}><label className="field">Issuer<input value={issuer} onChange={(e)=>setIssuer(e.target.value)} placeholder="Council, UKPC, ParkingEye..."/></label><label className="field">Reference<input value={reference} onChange={(e)=>setReference(e.target.value)}/></label><label className="field">Incident date<input type="date" value={incidentDate} onChange={(e)=>setIncidentDate(e.target.value)}/></label><label className="field">Appeal/payment deadline<input type="date" value={deadline} onChange={(e)=>setDeadline(e.target.value)}/></label><label className="field">Amount (£)<input type="number" step="0.01" value={amount||""} onChange={(e)=>setAmount(Number(e.target.value))}/></label><label className="field">Status<select value={status} onChange={(e)=>setStatus(e.target.value as ParkingCase["status"])}><option>Open</option><option>Appealed</option><option>Paid</option><option>Cancelled</option></select></label><label className="field full-field">Notes<textarea value={notes} onChange={(e)=>setNotes(e.target.value)}/></label><div className="form-actions full-field"><button className="primary-button">Save parking case</button></div></form>
}
