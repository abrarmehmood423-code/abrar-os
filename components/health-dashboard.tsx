"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Cigarette, Droplets, HeartPulse, Plus, Scale, Trash2, Utensils } from "lucide-react";
import { healthId, loadHealthData, saveHealthData } from "@/lib/health-storage";
import type { FoodEntry, HealthData, HealthMeasurement, Medicine } from "@/lib/health-types";

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const fmt = (value?: string) => value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)) : "Not set";

type Tab = "overview" | "medicine" | "diet" | "progress";

export default function HealthDashboard() {
  const [data, setData] = useState<HealthData | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => setData(loadHealthData()), []);
  useEffect(() => { if (data) saveHealthData(data); }, [data]);

  const todayFood = useMemo(() => (data?.food ?? []).filter((item) => item.date === today()), [data]);
  const latest = useMemo(() => [...(data?.measurements ?? [])].sort((a, b) => b.date.localeCompare(a.date))[0], [data]);
  const calories = todayFood.reduce((sum, item) => sum + item.calories, 0);
  const protein = todayFood.reduce((sum, item) => sum + item.protein, 0);
  const sugar = todayFood.reduce((sum, item) => sum + item.sugar, 0);

  function updateData(updater: (current: HealthData) => HealthData) {
    setData((current) => current ? updater(current) : current);
  }

  function addMedicine(entry: Omit<Medicine, "id" | "createdAt" | "active">) {
    updateData((current) => ({ ...current, medicines: [...current.medicines, { ...entry, id: healthId(), active: true, createdAt: new Date().toISOString() }] }));
  }

  function markTaken(medicineId: string, scheduledTime: string) {
    updateData((current) => ({
      ...current,
      medicineLogs: [...current.medicineLogs, { id: healthId(), medicineId, date: today(), scheduledTime, takenTime: nowTime(), status: "taken", createdAt: new Date().toISOString() }],
    }));
  }

  function addFood(entry: Omit<FoodEntry, "id" | "createdAt">) {
    updateData((current) => ({ ...current, food: [{ ...entry, id: healthId(), createdAt: new Date().toISOString() }, ...current.food] }));
  }

  function addMeasurement(entry: Omit<HealthMeasurement, "id" | "createdAt">) {
    updateData((current) => ({ ...current, measurements: [{ ...entry, id: healthId(), createdAt: new Date().toISOString() }, ...current.measurements] }));
  }

  function incrementToday(field: "waterMl" | "cigarettes", amount: number) {
    updateData((current) => {
      const existing = current.measurements.find((item) => item.date === today());
      if (!existing) {
        return { ...current, measurements: [{ id: healthId(), date: today(), [field]: amount, createdAt: new Date().toISOString() }, ...current.measurements] };
      }
      return {
        ...current,
        measurements: current.measurements.map((item) => item.id === existing.id ? { ...item, [field]: (item[field] ?? 0) + amount } : item),
      };
    });
  }

  if (!data) return <main className="loading-screen">Loading health records…</main>;

  const activeMedicines = data.medicines.filter((medicine) => medicine.active);
  const dueDoses = activeMedicines.flatMap((medicine) => medicine.scheduledTimes.map((time) => ({ medicine, time })));
  const todayMeasurement = data.measurements.find((item) => item.date === today());

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand"><h1>Health</h1><p>Medicines, diet and progress</p></div>
        <Link href="/" className="notification-button"><ArrowLeft size={17}/>Abrar OS</Link>
      </header>
      <main className="main">
        <div className="life-tabs">
          {(["overview", "medicine", "diet", "progress"] as const).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}
        </div>

        {tab === "overview" && <>
          <section className="grid three">
            <article className="card"><div className="card-head"><h2>Medicines today</h2><HeartPulse size={19}/></div><div className="stat">{dueDoses.length}</div><p className="muted">Scheduled doses</p><button className="text-button" onClick={() => setTab("medicine")}>Open medicines</button></article>
            <article className="card"><div className="card-head"><h2>Diet today</h2><Utensils size={19}/></div><div className="stat">{calories} kcal</div><p className="muted">{protein}g protein • {sugar}g sugar</p><button className="text-button" onClick={() => setTab("diet")}>Open diet</button></article>
            <article className="card"><div className="card-head"><h2>Latest progress</h2><Scale size={19}/></div><div className="stat">{latest?.weight ?? "—"} kg</div><p className="muted">Waist {latest?.waist ?? "—"} cm • HbA1c {latest?.hba1c ?? "—"}</p><button className="text-button" onClick={() => setTab("progress")}>Open progress</button></article>
          </section>
          <section className="grid two section-gap">
            <article className="card"><div className="card-head"><h2>Water</h2><Droplets size={19}/></div><div className="stat">{todayMeasurement?.waterMl ?? 0} ml</div><p className="muted">Target {data.settings.waterTargetMl} ml</p><div className="inline-pills"><button className="quick" onClick={() => incrementToday("waterMl", 250)}>+250 ml</button><button className="quick" onClick={() => incrementToday("waterMl", 500)}>+500 ml</button></div></article>
            <article className="card"><div className="card-head"><h2>Smoking</h2><Cigarette size={19}/></div><div className="stat">{todayMeasurement?.cigarettes ?? 0}</div><p className="muted">Cigarettes logged today</p><button className="quick" onClick={() => incrementToday("cigarettes", 1)}>Log one</button></article>
          </section>
        </>}

        {tab === "medicine" && <div className="grid two">
          <section className="card"><div className="card-head"><h2>Today’s doses</h2><HeartPulse size={20}/></div>{dueDoses.length === 0 ? <p className="muted">No medicines added.</p> : <div className="list">{dueDoses.map(({ medicine, time }) => { const log = data.medicineLogs.find((item) => item.medicineId === medicine.id && item.date === today() && item.scheduledTime === time); return <div className="item" key={`${medicine.id}-${time}`}><div><strong>{medicine.name} {medicine.dose}</strong><span>{time} • {medicine.instructions || "No instructions"}</span></div>{log ? <span className="pill success">Taken {log.takenTime}</span> : <button className="icon-button complete-button" onClick={() => markTaken(medicine.id, time)}><Check size={16}/></button>}</div>; })}</div>}</section>
          <MedicineForm onSave={addMedicine}/>
          <section className="card full-span"><h2>Medicine stock and refills</h2>{data.medicines.length === 0 ? <p className="muted">No medicines added.</p> : <div className="list">{data.medicines.map((medicine) => <div className="item" key={medicine.id}><div><strong>{medicine.name} {medicine.dose}</strong><span>{medicine.scheduledTimes.join(", ")} • Stock {medicine.stock} • Refill {fmt(medicine.refillDate)}</span></div><button className="icon-button danger-button" onClick={() => updateData((current) => ({ ...current, medicines: current.medicines.filter((item) => item.id !== medicine.id) }))}><Trash2 size={16}/></button></div>)}</div>}</section>
        </div>}

        {tab === "diet" && <div className="grid two">
          <section className="card"><h2>Today’s totals</h2><div className="stat">{calories} / {data.settings.calorieTarget}</div><p className="muted">Calories</p><div className="stat smaller-stat">{protein} / {data.settings.proteinTarget}g</div><p className="muted">Protein • Sugar {sugar}g</p>{todayFood.length === 0 ? <p className="muted">No food logged today.</p> : <div className="list">{todayFood.map((entry) => <div className="item" key={entry.id}><div><strong>{entry.name}</strong><span>{entry.time} • {entry.quantity || ""} • {entry.calories} kcal • {entry.protein}g protein</span></div><button className="icon-button danger-button" onClick={() => updateData((current) => ({ ...current, food: current.food.filter((item) => item.id !== entry.id) }))}><Trash2 size={16}/></button></div>)}</div>}</section>
          <FoodForm onSave={addFood}/>
        </div>}

        {tab === "progress" && <div className="grid two">
          <MeasurementForm onSave={addMeasurement}/>
          <section className="card"><h2>Progress history</h2>{data.measurements.length === 0 ? <p className="muted">No measurements added.</p> : <div className="list">{[...data.measurements].sort((a, b) => b.date.localeCompare(a.date)).map((entry) => <div className="item" key={entry.id}><div><strong>{fmt(entry.date)}</strong><span>Weight {entry.weight ?? "—"} kg • Waist {entry.waist ?? "—"} cm • HbA1c {entry.hba1c ?? "—"}</span><span>Water {entry.waterMl ?? 0} ml • Cigarettes {entry.cigarettes ?? 0}</span></div><button className="icon-button danger-button" onClick={() => updateData((current) => ({ ...current, measurements: current.measurements.filter((item) => item.id !== entry.id) }))}><Trash2 size={16}/></button></div>)}</div>}</section>
        </div>}
      </main>
    </div>
  );
}

function MedicineForm({ onSave }: { onSave: (entry: Omit<Medicine, "id" | "createdAt" | "active">) => void }) {
  const [name, setName] = useState(""); const [dose, setDose] = useState(""); const [times, setTimes] = useState("09:00"); const [instructions, setInstructions] = useState(""); const [stock, setStock] = useState(0); const [refillDate, setRefillDate] = useState("");
  function submit(event: FormEvent) { event.preventDefault(); if (!name.trim() || !dose.trim()) return; onSave({ name: name.trim(), dose: dose.trim(), scheduledTimes: times.split(",").map((item) => item.trim()).filter(Boolean), instructions: instructions.trim(), stock, refillDate }); setName(""); setDose(""); }
  return <section className="card"><div className="card-head"><h2>Add medicine</h2><Plus size={20}/></div><form className="form-grid" onSubmit={submit}><label className="field">Medicine<input value={name} onChange={(event) => setName(event.target.value)} required/></label><label className="field">Dose<input value={dose} onChange={(event) => setDose(event.target.value)} required/></label><label className="field full-field">Times, comma separated<input value={times} onChange={(event) => setTimes(event.target.value)} placeholder="09:00, 21:00"/></label><label className="field">Stock remaining<input type="number" value={stock} onChange={(event) => setStock(Number(event.target.value))}/></label><label className="field">Refill date<input type="date" value={refillDate} onChange={(event) => setRefillDate(event.target.value)}/></label><label className="field full-field">Instructions<textarea value={instructions} onChange={(event) => setInstructions(event.target.value)}/></label><button className="primary-button full-field">Save medicine</button></form></section>;
}

function FoodForm({ onSave }: { onSave: (entry: Omit<FoodEntry, "id" | "createdAt">) => void }) {
  const [name, setName] = useState(""); const [date, setDate] = useState(today()); const [time, setTime] = useState(nowTime()); const [quantity, setQuantity] = useState(""); const [calories, setCalories] = useState(0); const [protein, setProtein] = useState(0); const [carbs, setCarbs] = useState(0); const [sugar, setSugar] = useState(0); const [notes, setNotes] = useState("");
  function submit(event: FormEvent) { event.preventDefault(); if (!name.trim()) return; onSave({ name: name.trim(), date, time, quantity, calories, protein, carbs, sugar, notes }); setName(""); setQuantity(""); }
  return <section className="card"><div className="card-head"><h2>Log food or drink</h2><Plus size={20}/></div><form className="form-grid" onSubmit={submit}><label className="field full-field">Food / drink<input value={name} onChange={(event) => setName(event.target.value)} required/></label><label className="field">Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)}/></label><label className="field">Time<input type="time" value={time} onChange={(event) => setTime(event.target.value)}/></label><label className="field full-field">Quantity<input value={quantity} onChange={(event) => setQuantity(event.target.value)}/></label><label className="field">Calories<input type="number" value={calories} onChange={(event) => setCalories(Number(event.target.value))}/></label><label className="field">Protein g<input type="number" value={protein} onChange={(event) => setProtein(Number(event.target.value))}/></label><label className="field">Carbohydrates g<input type="number" value={carbs} onChange={(event) => setCarbs(Number(event.target.value))}/></label><label className="field">Sugar g<input type="number" value={sugar} onChange={(event) => setSugar(Number(event.target.value))}/></label><label className="field full-field">Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)}/></label><button className="primary-button full-field">Save entry</button></form></section>;
}

function MeasurementForm({ onSave }: { onSave: (entry: Omit<HealthMeasurement, "id" | "createdAt">) => void }) {
  const [date, setDate] = useState(today()); const [weight, setWeight] = useState(0); const [waist, setWaist] = useState(0); const [hba1c, setHba1c] = useState(0); const [waterMl, setWaterMl] = useState(0); const [cigarettes, setCigarettes] = useState(0); const [notes, setNotes] = useState("");
  function submit(event: FormEvent) { event.preventDefault(); onSave({ date, weight: weight || undefined, waist: waist || undefined, hba1c: hba1c || undefined, waterMl, cigarettes, notes }); }
  return <section className="card"><div className="card-head"><h2>Add health measurement</h2><Scale size={20}/></div><form className="form-grid" onSubmit={submit}><label className="field full-field">Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)}/></label><label className="field">Weight kg<input type="number" step="0.1" value={weight} onChange={(event) => setWeight(Number(event.target.value))}/></label><label className="field">Waist cm<input type="number" step="0.1" value={waist} onChange={(event) => setWaist(Number(event.target.value))}/></label><label className="field">HbA1c mmol/mol<input type="number" step="0.1" value={hba1c} onChange={(event) => setHba1c(Number(event.target.value))}/></label><label className="field">Water ml<input type="number" value={waterMl} onChange={(event) => setWaterMl(Number(event.target.value))}/></label><label className="field">Cigarettes<input type="number" value={cigarettes} onChange={(event) => setCigarettes(Number(event.target.value))}/></label><label className="field full-field">Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)}/></label><button className="primary-button full-field">Save measurement</button></form></section>;
}
