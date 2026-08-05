"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Cigarette, Droplets, HeartPulse, Plus, Scale, Trash2, Utensils } from "lucide-react";
import { healthId, loadHealthData, saveHealthData } from "@/lib/health-storage";
import type { FoodEntry, HealthData, HealthMeasurement, Medicine } from "@/lib/health-types";

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const fmt = (value?: string) => value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)) : "Not set";

export default function HealthDashboard() {
  const [data, setData] = useState<HealthData | null>(null);
  const [tab, setTab] = useState<"overview" | "medicine" | "diet" | "progress">("overview");

  useEffect(() => setData(loadHealthData()), []);
  useEffect(() => { if (data) saveHealthData(data); }, [data]);

  const todayFood = useMemo(() => (data?.food ?? []).filter((x) => x.date === today()), [data]);
  const calories = todayFood.reduce((sum, x) => sum + x.calories, 0);
  const protein = todayFood.reduce((sum, x) => sum + x.protein, 0);
  const sugar = todayFood.reduce((sum, x) => sum + x.sugar, 0);
  const latest = useMemo(() => [...(data?.measurements ?? [])].sort((a,b) => b.date.localeCompare(a.date))[0], [data]);

  if (!data) return <main className="loading-screen">Loading health records…</main>;

  const activeMedicines = data.medicines.filter((m) => m.active);
  const dueDoses = activeMedicines.flatMap((m) => m.scheduledTimes.map((time) => ({ medicine: m, time })));

  function addMedicine(medicine: Omit<Medicine, "id" | "createdAt" | "active">) {
    setData((current) => current ? { ...current, medicines: [...current.medicines, { ...medicine, id: healthId(), active: true, createdAt: new Date().toISOString() }] } : current);
  }

  function markTaken(medicineId: string, scheduledTime: string) {
    setData((current) => current ? { ...current, medicineLogs: [...current.medicineLogs, { id: healthId(), medicineId, date: today(), scheduledTime, takenTime: nowTime(), status: "taken", createdAt: new Date().toISOString() }] } : current);
  }

  function addFood(entry: Omit<FoodEntry, "id" | "createdAt">) {
    setData((current) => current ? { ...current, food: [{ ...entry, id: healthId(), createdAt: new Date().toISOString() }, ...current.food] } : current);
  }

  function addMeasurement(entry: Omit<HealthMeasurement, "id" | "createdAt">) {
    setData((current) => current ? { ...current, measurements: [{ ...entry, id: healthId(), createdAt: new Date().toISOString() }, ...current.measurements] } : current);
  }

  function addWater(amount: number) {
    const existing = data.measurements.find((x) => x.date === today());
    if (existing) {
      setData({ ...data, measurements: data.measurements.map((x) => x.id === existing.id ? { ...x, waterMl: (x.waterMl ?? 0) + amount } : x) });
    } else addMeasurement({ date: today(), waterMl: amount });
  }

  function addCigarette() {
    const existing = data.measurements.find((x) => x.date === today());
    if (existing) setData({ ...data, measurements: data.measurements.map((x) => x.id === existing.id ? { ...x, cigarettes: (x.cigarettes ?? 0) + 1 } : x) });
    else addMeasurement({ date: today(), cigarettes: 1 });
  }

  const todayMeasurement = data.measurements.find((x) => x.date === today());

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand"><h1>Health</h1><p>Medicines, diet and progress</p></div>
        <Link href="/" className="notification-button"><ArrowLeft size={17}/>Abrar OS</Link>
      </header>
      <main className="main">
        <div className="life-tabs">
          {(["overview","medicine","diet","progress"] as const).map((item) => <button key={item} className={tab===item?"active":""} onClick={()=>setTab(item)}>{item[0].toUpperCase()+item.slice(1)}</button>)}
        </div>

        {tab === "overview" && <>
          <section className="grid three">
            <article className="card"><div className="card-head"><h2>Medicines today</h2><HeartPulse size={19}/></div><div className="stat">{dueDoses.length}</div><p className="muted">Scheduled doses</p><button className="text-button" onClick={()=>setTab("medicine")}>Open medicines</button></article>
            <article className="card"><div className="card-head"><h2>Diet today</h2><Utensils size={19}/></div><div className="stat">{calories} kcal</div><p className="muted">{protein}g protein • {sugar}g sugar</p><button className="text-button" onClick={()=>setTab("diet")}>Open diet</button></article>
            <article className="card"><div className="card-head"><h2>Latest progress</h2><Scale size={19}/></div><div className="stat">{latest?.weight ?? "—"} kg</div><p className="muted">Waist {latest?.waist ?? "—"} cm • HbA1c {latest?.hba1c ?? "—"}</p><button className="text-button" onClick={()=>setTab("progress")}>Open progress</button></article>
          </section>
          <section className="grid two section-gap">
            <article className="card"><div className="card-head"><h2>Water</h2><Droplets size={19}/></div><div className="stat">{todayMeasurement?.waterMl ?? 0} ml</div><p className="muted">Target {data.settings.waterTargetMl} ml</p><div className="inline-pills"><button className="quick" onClick={()=>addWater(250)}>+250 ml</button><button className="quick" onClick={()=>addWater(500)}>+500 ml</button></div></article>
            <article className="card"><div className="card-head"><h2>Smoking</h2><Cigarette size={19}/></div><div className="stat">{todayMeasurement?.cigarettes ?? 0}</div><p className="muted">Cigarettes logged today</p><button className="quick" onClick={addCigarette}>Log one</button></article>
          </section>
        </>}

        {tab === "medicine" && <div className="grid two">
          <section className="card"><div className="card-head"><h2>Today’s doses</h2><HeartPulse size={20}/></div>{dueDoses.length===0?<p className="muted">No medicines added.</p>:<div className="list">{dueDoses.map(({medicine,time})=>{const log=data.medicineLogs.find((x)=>x.medicineId===medicine.id&&x.date===today()&&x.scheduledTime===time);return <div className="item" key={`${medicine.id}-${time}`}><div><strong>{medicine.name} {medicine.dose}</strong><span>{time} • {medicine.instructions||"No instructions"}</span></div>{log?<span className="pill success">Taken {log.takenTime}</span>:<button className="icon-button complete-button" onClick={()=>markTaken(medicine.id,time)}><Check size={16}/></button>}</div>})}</div>}</section>
          <MedicineForm onSave={addMedicine}/>
          <section className="card full-span"><h2>Medicine stock and refills</h2>{data.medicines.length===0?<p className="muted">No medicines added.</p>:<div className="list">{data.medicines.map((m)=><div className="item" key={m.id}><div><strong>{m.name} {m.dose}</strong><span>{m.scheduledTimes.join(", ")} • Stock {m.stock} • Refill {fmt(m.refillDate)}</span></div><button className="icon-button danger-button" onClick={()=>setData({...data,medicines:data.medicines.filter((x)=>x.id!==m.id)})}><Trash2 size={16}/></button></div>)}</div>}</section>
        </div>}

        {tab === "diet" && <div className="grid two">
          <section className="card"><h2>Today’s totals</h2><div className="stat">{calories} / {data.settings.calorieTarget}</div><p className="muted">Calories</p><div className="stat smaller-stat">{protein} / {data.settings.proteinTarget}g</div><p className="muted">Protein • Sugar {sugar}g</p>{todayFood.length===0?<p className="muted">No food logged today.</p>:<div className="list">{todayFood.map((x)=><div className="item" key={x.id}><div><strong>{x.name}</strong><span>{x.time} • {x.quantity||""} • {x.calories} kcal • {x.protein}g protein</span></div><button className="icon-button danger-button" onClick={()=>setData({...data,food:data.food.filter((f)=>f.id!==x.id)})}><Trash2 size={16}/></button></div>)}</div>}</section>
          <FoodForm onSave={addFood}/>
        </div>}

        {tab === "progress" && <div className="grid two">
          <MeasurementForm onSave={addMeasurement}/>
          <section className="card"><h2>Progress history</h2>{data.measurements.length===0?<p className="muted">No measurements added.</p>:<div className="list">{[...data.measurements].sort((a,b)=>b.date.localeCompare(a.date)).map((x)=><div className="item" key={x.id}><div><strong>{fmt(x.date)}</strong><span>Weight {x.weight??"—"} kg • Waist {x.waist??"—"} cm • HbA1c {x.hba1c??"—"}</span><span>Water {x.waterMl??0} ml • Cigarettes {x.cigarettes??0}</span></div><button className="icon-button danger-button" onClick={()=>setData({...data,measurements:data.measurements.filter((m)=>m.id!==x.id)})}><Trash2 size={16}/></button></div>)}</div>}</section>
        </div>}
      </main>
    </div>
  );
}

function MedicineForm({onSave}:{onSave:(medicine:Omit<Medicine,"id"|"createdAt"|"active">)=>void}){
  const [name,setName]=useState("");const [dose,setDose]=useState("");const [times,setTimes]=useState("09:00");const [instructions,setInstructions]=useState("");const [stock,setStock]=useState(0);const [refillDate,setRefillDate]=useState("");
  function submit(e:FormEvent){e.preventDefault();if(!name.trim()||!dose.trim())return;onSave({name:name.trim(),dose:dose.trim(),scheduledTimes:times.split(",").map((x)=>x.trim()).filter(Boolean),instructions:instructions.trim(),stock,refillDate});setName("");setDose("")}
  return <section className="card"><div className="card-head"><h2>Add medicine</h2><Plus size={20}/></div><form className="form-grid" onSubmit={submit}><label className="field">Medicine<input value={name} onChange={(e)=>setName(e.target.value)} required/></label><label className="field">Dose<input value={dose} onChange={(e)=>setDose(e.target.value)} required/></label><label className="field full-field">Times, comma separated<input value={times} onChange={(e)=>setTimes(e.target.value)} placeholder="09:00, 21:00"/></label><label className="field">Stock remaining<input type="number" value={stock} onChange={(e)=>setStock(Number(e.target.value))}/></label><label className="field">Refill date<input type="date" value={refillDate} onChange={(e)=>setRefillDate(e.target.value)}/></label><label className="field full-field">Instructions<textarea value={instructions} onChange={(e)=>setInstructions(e.target.value)}/></label><button className="primary-button full-field">Save medicine</button></form><p className="muted">This records the schedule you enter. It does not change or recommend any prescribed dose.</p></section>
}

function FoodForm({onSave}:{onSave:(entry:Omit<FoodEntry,"id"|"createdAt">)=>void}){
  const [name,setName]=useState("");const [date,setDate]=useState(today());const [time,setTime]=useState(nowTime());const [quantity,setQuantity]=useState("");const [calories,setCalories]=useState(0);const [protein,setProtein]=useState(0);const [carbs,setCarbs]=useState(0);const [sugar,setSugar]=useState(0);const [notes,setNotes]=useState("");
  function submit(e:FormEvent){e.preventDefault();if(!name.trim())return;onSave({name:name.trim(),date,time,quantity,calories,protein,carbs,sugar,notes});setName("");setQuantity("")}
  return <section className="card"><div className="card-head"><h2>Log food or drink</h2><Plus size={20}/></div><form className="form-grid" onSubmit={submit}><label className="field full-field">Food / drink<input value={name} onChange={(e)=>setName(e.target.value)} required/></label><label className="field">Date<input type="date" value={date} onChange={(e)=>setDate(e.target.value)}/></label><label className="field">Time<input type="time" value={time} onChange={(e)=>setTime(e.target.value)}/></label><label className="field full-field">Quantity<input value={quantity} onChange={(e)=>setQuantity(e.target.value)}/></label><label className="field">Calories<input type="number" value={calories} onChange={(e)=>setCalories(Number(e.target.value))}/></label><label className="field">Protein g<input type="number" value={protein} onChange={(e)=>setProtein(Number(e.target.value))}/></label><label className="field">Carbohydrates g<input type="number" value={carbs} onChange={(e)=>setCarbs(Number(e.target.value))}/></label><label className="field">Sugar g<input type="number" value={sugar} onChange={(e)=>setSugar(Number(e.target.value))}/></label><label className="field full-field">Notes<textarea value={notes} onChange={(e)=>setNotes(e.target.value)}/></label><button className="primary-button full-field">Save entry</button></form></section>
}

function MeasurementForm({onSave}:{onSave:(entry:Omit<HealthMeasurement,"id"|"createdAt">)=>void}){
  const [date,setDate]=useState(today());const [weight,setWeight]=useState(0);const [waist,setWaist]=useState(0);const [hba1c,setHba1c]=useState(0);const [waterMl,setWaterMl]=useState(0);const [cigarettes,setCigarettes]=useState(0);const [notes,setNotes]=useState("");
  function submit(e:FormEvent){e.preventDefault();onSave({date,weight:weight||undefined,waist:waist||undefined,hba1c:hba1c||undefined,waterMl,cigarettes,notes})}
  return <section className="card"><div className="card-head"><h2>Add health measurement</h2><Scale size={20}/></div><form className="form-grid" onSubmit={submit}><label className="field full-field">Date<input type="date" value={date} onChange={(e)=>setDate(e.target.value)}/></label><label className="field">Weight kg<input type="number" step="0.1" value={weight} onChange={(e)=>setWeight(Number(e.target.value))}/></label><label className="field">Waist cm<input type="number" step="0.1" value={waist} onChange={(e)=>setWaist(Number(e.target.value))}/></label><label className="field">HbA1c mmol/mol<input type="number" step="0.1" value={hba1c} onChange={(e)=>setHba1c(Number(e.target.value))}/></label><label className="field">Water ml<input type="number" value={waterMl} onChange={(e)=>setWaterMl(Number(e.target.value))}/></label><label className="field">Cigarettes<input type="number" value={cigarettes} onChange={(e)=>setCigarettes(Number(e.target.value))}/></label><label className="field full-field">Notes<textarea value={notes} onChange={(e)=>setNotes(e.target.value)}/></label><button className="primary-button full-field">Save measurement</button></form></section>
}
