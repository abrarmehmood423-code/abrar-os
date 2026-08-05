"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Download, LockKeyhole, RotateCcw, Settings, ShieldCheck, Upload } from "lucide-react";
import {
  AppSettings,
  clearAllData,
  defaultSettings,
  exportAllData,
  hashPin,
  importAllData,
  loadSettings,
  saveSettings,
} from "@/lib/settings-store";

const SESSION_UNLOCKED_KEY = "abrar-os-session-unlocked";

export default function SettingsCentre() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => setSettings(loadSettings()), []);

  function saveGeneral(event: FormEvent) {
    event.preventDefault();
    saveSettings(settings);
    setMessage("Settings saved on this device.");
  }

  async function savePin(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{4,8}$/.test(pin)) return setMessage("Use a 4 to 8 digit PIN.");
    if (pin !== confirmPin) return setMessage("PIN entries do not match.");
    const updated = { ...settings, pinHash: await hashPin(pin) };
    setSettings(updated);
    saveSettings(updated);
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
    setPin("");
    setConfirmPin("");
    setMessage("Privacy PIN saved. Abrar OS will lock when you leave this page or after the selected inactivity period.");
  }

  function removePin() {
    const updated = { ...settings, pinHash: "" };
    setSettings(updated);
    saveSettings(updated);
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
    setMessage("Privacy PIN removed. The application will no longer show the lock screen.");
  }

  function downloadBackup() {
    const blob = new Blob([exportAllData()], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `abrar-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    const updated = { ...settings, lastBackupAt: new Date().toISOString() };
    setSettings(updated);
    saveSettings(updated);
    setMessage("Backup downloaded. Keep it private.");
  }

  function restoreBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importAllData(String(reader.result));
        setSettings(loadSettings());
        sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
        setMessage("Backup restored. Refresh the app to reload every module.");
      } catch {
        setMessage("That file is not a valid Abrar OS backup.");
      }
    };
    reader.readAsText(file);
  }

  function resetEverything() {
    if (!confirm("This permanently deletes all Abrar OS data stored in this browser. Continue?")) return;
    if (!confirm("Final confirmation: delete tasks, money, health, family, documents and all other records?")) return;
    clearAllData();
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
    setSettings(defaultSettings);
    setMessage("All local Abrar OS data has been deleted.");
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand"><h1>Settings & Privacy</h1><p>Backup, protection and personal preferences</p></div>
        <Link className="notification-button" href="/"><ArrowLeft size={17}/>Home</Link>
      </header>

      <main className="main">
        {message && <section className="card"><span className="pill success">{message}</span></section>}

        <div className="grid two">
          <section className="card">
            <div className="card-head"><h2>General settings</h2><Settings size={20}/></div>
            <form className="form-grid" onSubmit={saveGeneral}>
              <label className="field full-field">Display name<input value={settings.displayName} onChange={(e)=>setSettings({...settings,displayName:e.target.value})}/></label>
              <label className="field">Daily calorie target<input type="number" min="800" max="5000" value={settings.dailyCalories} onChange={(e)=>setSettings({...settings,dailyCalories:Number(e.target.value)})}/></label>
              <label className="field">Daily protein target (g)<input type="number" min="0" max="400" value={settings.dailyProtein} onChange={(e)=>setSettings({...settings,dailyProtein:Number(e.target.value)})}/></label>
              <label className="field">Automatic lock<select value={settings.autoLockMinutes} onChange={(e)=>setSettings({...settings,autoLockMinutes:Number(e.target.value)})}><option value={0}>Off</option><option value={1}>After 1 minute</option><option value={5}>After 5 minutes</option><option value={10}>After 10 minutes</option><option value={30}>After 30 minutes</option></select></label>
              <label className="field">Currency<input value="GBP (£)" disabled/></label>
              <div className="form-actions full-field"><button className="primary-button">Save settings</button></div>
            </form>
          </section>

          <section className="card">
            <div className="card-head"><h2>Privacy PIN</h2><LockKeyhole size={20}/></div>
            <p className="muted">The PIN is hashed before storage. It is not stored as readable text.</p>
            <form className="form-grid" onSubmit={savePin}>
              <label className="field">New PIN<input inputMode="numeric" type="password" value={pin} onChange={(e)=>setPin(e.target.value.replace(/\D/g,""))} maxLength={8} placeholder="4–8 digits"/></label>
              <label className="field">Confirm PIN<input inputMode="numeric" type="password" value={confirmPin} onChange={(e)=>setConfirmPin(e.target.value.replace(/\D/g,""))} maxLength={8}/></label>
              <div className="form-actions full-field"><button type="button" className="quick" onClick={removePin}>Remove PIN</button><button className="primary-button">Save PIN</button></div>
            </form>
            <div className="inline-pills"><span className={`pill ${settings.pinHash ? "success" : "warning"}`}><ShieldCheck size={13}/>{settings.pinHash ? "PIN configured and active" : "No PIN configured"}</span></div>
          </section>
        </div>

        <div className="grid two section-gap">
          <section className="card">
            <div className="card-head"><h2>Backup and restore</h2><Download size={20}/></div>
            <p className="muted">Exports all locally stored Abrar OS modules into one JSON backup. The backup can contain sensitive health, financial and immigration information.</p>
            <div className="quick-grid">
              <button className="quick" onClick={downloadBackup}><Download size={16}/> Download backup</button>
              <label className="quick" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer"}}><Upload size={16}/> Restore backup<input type="file" accept="application/json,.json" onChange={restoreBackup} hidden/></label>
            </div>
            <p className="muted">Last backup: {settings.lastBackupAt ? new Date(settings.lastBackupAt).toLocaleString("en-GB") : "No backup recorded"}</p>
          </section>

          <section className="card">
            <div className="card-head"><h2>Local data status</h2><ShieldCheck size={20}/></div>
            <p className="muted">This version stores information in this browser. Clearing site data, changing browser profiles or losing the device can remove records unless you have a backup.</p>
            <span className="pill warning">Not yet cloud-synchronised</span>
            <div className="section-gap"><button className="primary-button" style={{background:"#b42318"}} onClick={resetEverything}><RotateCcw size={16}/> Delete all local data</button></div>
          </section>
        </div>
      </main>
    </div>
  );
}
