"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Banknote, CalendarClock, CreditCard, Landmark, Plus, ReceiptText, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { advanceBillDate, createId, loadData, saveData } from "@/lib/storage";
import type { Account, AppData, Bill, Debt, Transaction } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value || 0);

export default function MoneyHub() {
  const [data, setData] = useState<AppData | null>(null);
  const [tab, setTab] = useState<"overview" | "transactions" | "bills" | "debts" | "accounts">("overview");

  useEffect(() => setData(loadData()), []);
  useEffect(() => { if (data) saveData(data); }, [data]);

  const summary = useMemo(() => {
    if (!data) return null;
    const income = data.transactions.filter((x) => x.kind === "income").reduce((sum, x) => sum + x.amount, 0);
    const expenses = data.transactions.filter((x) => x.kind === "expense").reduce((sum, x) => sum + x.amount, 0);
    const opening = data.accounts.reduce((sum, x) => sum + x.openingBalance, 0);
    const accountBalance = opening + income - expenses;
    const totalDebt = data.debts.reduce((sum, x) => sum + x.currentBalance, 0);
    const activeBills = data.bills.filter((x) => x.active);
    const dueBeforePayday = data.financeSettings.nextPayday
      ? activeBills.filter((x) => x.dueDate <= data.financeSettings.nextPayday)
      : activeBills;
    const billsDue = dueBeforePayday.reduce((sum, x) => sum + x.amount, 0);
    return { income, expenses, accountBalance, totalDebt, billsDue, safeBalance: accountBalance - billsDue };
  }, [data]);

  if (!data || !summary) return <main className="loading-screen">Loading money records…</main>;

  const update = (next: AppData) => setData(next);

  function addTransaction(entry: Omit<Transaction, "id" | "createdAt">) {
    update({ ...data, transactions: [{ ...entry, id: createId(), createdAt: new Date().toISOString() }, ...data.transactions] });
  }

  function addBill(entry: Omit<Bill, "id" | "createdAt" | "active">) {
    update({ ...data, bills: [...data.bills, { ...entry, id: createId(), active: true, createdAt: new Date().toISOString() }] });
  }

  function addDebt(entry: Omit<Debt, "id" | "createdAt">) {
    update({ ...data, debts: [...data.debts, { ...entry, id: createId(), createdAt: new Date().toISOString() }] });
  }

  function addAccount(entry: Omit<Account, "id" | "createdAt">) {
    update({ ...data, accounts: [...data.accounts, { ...entry, id: createId(), createdAt: new Date().toISOString() }] });
  }

  function markBillPaid(bill: Bill) {
    addTransaction({ kind: "expense", amount: bill.amount, date: today(), category: "Bills", description: bill.provider, accountId: bill.accountId });
    const bills = data.bills.map((x) => x.id === bill.id
      ? x.frequency === "One-time" ? { ...x, active: false } : { ...x, dueDate: advanceBillDate(x.dueDate, x.frequency) }
      : x);
    update({ ...data, bills });
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand"><h1>Money Hub</h1><p>Cash flow, bills, debts and accounts</p></div>
        <Link href="/" className="notification-button"><ArrowLeft size={17}/>Abrar OS</Link>
      </header>

      <main className="main">
        <div className="family-tabs">
          {(["overview","transactions","bills","debts","accounts"] as const).map((item) => (
            <button key={item} className={`quick ${tab === item ? "tab-active" : ""}`} onClick={() => setTab(item)}>{item[0].toUpperCase()+item.slice(1)}</button>
          ))}
        </div>

        {tab === "overview" && <>
          <section className="grid three">
            <article className="card"><div className="card-head"><h2>Available balance</h2><Landmark size={20}/></div><div className="stat">{money(summary.accountBalance)}</div><p className="muted">Opening balances plus income minus expenses</p></article>
            <article className="card"><div className="card-head"><h2>Safe balance</h2><Banknote size={20}/></div><div className="stat">{money(summary.safeBalance)}</div><p className="muted">After bills due before payday</p></article>
            <article className="card"><div className="card-head"><h2>Total debt</h2><CreditCard size={20}/></div><div className="stat">{money(summary.totalDebt)}</div><p className="muted">Accepted, disputed and informal balances</p></article>
          </section>
          <section className="grid three section-gap">
            <article className="card"><div className="card-head"><h2>Total income</h2><TrendingUp size={20}/></div><div className="stat">{money(summary.income)}</div></article>
            <article className="card"><div className="card-head"><h2>Total expenses</h2><TrendingDown size={20}/></div><div className="stat">{money(summary.expenses)}</div></article>
            <article className="card"><div className="card-head"><h2>Bills before payday</h2><CalendarClock size={20}/></div><div className="stat">{money(summary.billsDue)}</div><label className="field section-gap">Next payday<input type="date" value={data.financeSettings.nextPayday} onChange={(e)=>update({...data,financeSettings:{nextPayday:e.target.value}})}/></label></article>
          </section>
          <section className="card section-gap"><h2>Next bills</h2>{data.bills.filter((x)=>x.active).length===0?<p className="muted">No bills added yet.</p>:<div className="list">{data.bills.filter((x)=>x.active).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,5).map((x)=><div className="item" key={x.id}><div><strong>{x.provider}</strong><span>{money(x.amount)} • due {x.dueDate} • {x.paymentType}</span></div><button className="quick" onClick={()=>markBillPaid(x)}>Mark paid</button></div>)}</div>}</section>
        </>}

        {tab === "transactions" && <div className="grid two"><TransactionForm accounts={data.accounts} onSave={addTransaction}/><section className="card"><h2>Transaction history</h2>{data.transactions.length===0?<p className="muted">No income or expenses recorded.</p>:<div className="list">{data.transactions.map((x)=><div className="item" key={x.id}><div><strong>{x.description}</strong><span>{x.date} • {x.category}</span></div><div className="item-actions"><span className={`pill ${x.kind === "income" ? "success" : "danger"}`}>{x.kind === "income" ? "+" : "-"}{money(x.amount)}</span><button className="icon-button danger-button" onClick={()=>update({...data,transactions:data.transactions.filter((t)=>t.id!==x.id)})}><Trash2 size={16}/></button></div></div>)}</div>}</section></div>}

        {tab === "bills" && <div className="grid two"><BillForm accounts={data.accounts} onSave={addBill}/><section className="card"><h2>Bills and direct debits</h2>{data.bills.length===0?<p className="muted">No bills added.</p>:<div className="list">{data.bills.map((x)=><div className="item" key={x.id}><div><strong>{x.provider}</strong><span>{money(x.amount)} • {x.dueDate} • {x.frequency} • {x.paymentType}</span></div><div className="item-actions">{x.active&&<button className="quick" onClick={()=>markBillPaid(x)}>Paid</button>}<button className="icon-button danger-button" onClick={()=>update({...data,bills:data.bills.filter((b)=>b.id!==x.id)})}><Trash2 size={16}/></button></div></div>)}</div>}</section></div>}

        {tab === "debts" && <div className="grid two"><DebtForm onSave={addDebt}/><section className="card"><h2>Debt balances</h2>{data.debts.length===0?<p className="muted">No debts added.</p>:<div className="list">{data.debts.map((x)=><div className="item" key={x.id}><div className="task-content"><strong>{x.lender}</strong><span>{money(x.currentBalance)} remaining • minimum {money(x.minimumPayment)} • {x.status}</span><div className="progress"><span style={{width:`${Math.max(0,Math.min(100,100-(x.currentBalance/x.originalBalance)*100))}%`}}/></div></div><button className="icon-button danger-button" onClick={()=>update({...data,debts:data.debts.filter((d)=>d.id!==x.id)})}><Trash2 size={16}/></button></div>)}</div>}</section></div>}

        {tab === "accounts" && <div className="grid two"><AccountForm onSave={addAccount}/><section className="card"><h2>Accounts</h2>{data.accounts.length===0?<p className="muted">No accounts added.</p>:<div className="list">{data.accounts.map((x)=><div className="item" key={x.id}><div><strong>{x.name}</strong><span>{x.type} • opening balance {money(x.openingBalance)}</span></div><button className="icon-button danger-button" onClick={()=>update({...data,accounts:data.accounts.filter((a)=>a.id!==x.id)})}><Trash2 size={16}/></button></div>)}</div>}</section></div>}
      </main>
    </div>
  );
}

function TransactionForm({accounts,onSave}:{accounts:Account[];onSave:(entry:Omit<Transaction,"id"|"createdAt">)=>void}){
  const [kind,setKind]=useState<Transaction["kind"]>("expense");const [amount,setAmount]=useState(0);const [date,setDate]=useState(today());const [category,setCategory]=useState("");const [description,setDescription]=useState("");const [accountId,setAccountId]=useState("");
  function submit(e:FormEvent){e.preventDefault();if(amount<=0||!description.trim())return;onSave({kind,amount,date,category:category||"Other",description:description.trim(),accountId:accountId||undefined});setAmount(0);setDescription("")}
  return <section className="card"><div className="card-head"><h2>Add income or expense</h2><Plus size={20}/></div><form className="form-grid" onSubmit={submit}><label className="field">Type<select value={kind} onChange={(e)=>setKind(e.target.value as Transaction["kind"])}><option value="expense">Expense</option><option value="income">Income</option></select></label><label className="field">Amount<input type="number" step="0.01" min="0" value={amount} onChange={(e)=>setAmount(Number(e.target.value))}/></label><label className="field">Date<input type="date" value={date} onChange={(e)=>setDate(e.target.value)}/></label><label className="field">Category<input value={category} onChange={(e)=>setCategory(e.target.value)} placeholder="Fuel, wages, food"/></label><label className="field full-field">Description<input value={description} onChange={(e)=>setDescription(e.target.value)} required/></label><label className="field full-field">Account<select value={accountId} onChange={(e)=>setAccountId(e.target.value)}><option value="">Not specified</option>{accounts.map((x)=><option value={x.id} key={x.id}>{x.name}</option>)}</select></label><button className="primary-button full-field">Save transaction</button></form></section>
}

function BillForm({accounts,onSave}:{accounts:Account[];onSave:(entry:Omit<Bill,"id"|"createdAt"|"active">)=>void}){
  const [provider,setProvider]=useState("");const [amount,setAmount]=useState(0);const [dueDate,setDueDate]=useState(today());const [frequency,setFrequency]=useState<Bill["frequency"]>("Monthly");const [paymentType,setPaymentType]=useState<Bill["paymentType"]>("Direct debit");const [accountId,setAccountId]=useState("");
  function submit(e:FormEvent){e.preventDefault();if(!provider.trim()||amount<=0)return;onSave({provider:provider.trim(),amount,dueDate,frequency,paymentType,accountId:accountId||undefined,variable:false});setProvider("");setAmount(0)}
  return <section className="card"><div className="card-head"><h2>Add bill</h2><ReceiptText size={20}/></div><form className="form-grid" onSubmit={submit}><label className="field full-field">Provider<input value={provider} onChange={(e)=>setProvider(e.target.value)} required/></label><label className="field">Amount<input type="number" step="0.01" min="0" value={amount} onChange={(e)=>setAmount(Number(e.target.value))}/></label><label className="field">Due date<input type="date" value={dueDate} onChange={(e)=>setDueDate(e.target.value)}/></label><label className="field">Frequency<select value={frequency} onChange={(e)=>setFrequency(e.target.value as Bill["frequency"])}><option>Weekly</option><option>Monthly</option><option>Quarterly</option><option>Yearly</option><option>One-time</option></select></label><label className="field">Payment type<select value={paymentType} onChange={(e)=>setPaymentType(e.target.value as Bill["paymentType"])}><option>Direct debit</option><option>Standing order</option><option>Manual bill</option><option>Subscription</option></select></label><label className="field full-field">Account<select value={accountId} onChange={(e)=>setAccountId(e.target.value)}><option value="">Not specified</option>{accounts.map((x)=><option value={x.id} key={x.id}>{x.name}</option>)}</select></label><button className="primary-button full-field">Save bill</button></form></section>
}

function DebtForm({onSave}:{onSave:(entry:Omit<Debt,"id"|"createdAt">)=>void}){
  const [lender,setLender]=useState("");const [balance,setBalance]=useState(0);const [interestRate,setInterestRate]=useState(0);const [minimumPayment,setMinimumPayment]=useState(0);const [status,setStatus]=useState<Debt["status"]>("Accepted");
  function submit(e:FormEvent){e.preventDefault();if(!lender.trim()||balance<=0)return;onSave({lender:lender.trim(),originalBalance:balance,currentBalance:balance,interestRate,minimumPayment,status});setLender("");setBalance(0)}
  return <section className="card"><div className="card-head"><h2>Add debt</h2><CreditCard size={20}/></div><form className="form-grid" onSubmit={submit}><label className="field full-field">Lender or claimant<input value={lender} onChange={(e)=>setLender(e.target.value)} required/></label><label className="field">Balance<input type="number" step="0.01" min="0" value={balance} onChange={(e)=>setBalance(Number(e.target.value))}/></label><label className="field">Minimum payment<input type="number" step="0.01" min="0" value={minimumPayment} onChange={(e)=>setMinimumPayment(Number(e.target.value))}/></label><label className="field">Interest rate %<input type="number" step="0.01" min="0" value={interestRate} onChange={(e)=>setInterestRate(Number(e.target.value))}/></label><label className="field">Status<select value={status} onChange={(e)=>setStatus(e.target.value as Debt["status"])}><option>Accepted</option><option>Claimed / disputed</option><option>Informal</option><option>Paid off</option></select></label><button className="primary-button full-field">Save debt</button></form></section>
}

function AccountForm({onSave}:{onSave:(entry:Omit<Account,"id"|"createdAt">)=>void}){
  const [name,setName]=useState("");const [type,setType]=useState<Account["type"]>("Current account");const [openingBalance,setOpeningBalance]=useState(0);
  function submit(e:FormEvent){e.preventDefault();if(!name.trim())return;onSave({name:name.trim(),type,openingBalance});setName("");setOpeningBalance(0)}
  return <section className="card"><div className="card-head"><h2>Add account</h2><Landmark size={20}/></div><form className="form-grid" onSubmit={submit}><label className="field full-field">Account name<input value={name} onChange={(e)=>setName(e.target.value)} required/></label><label className="field">Type<select value={type} onChange={(e)=>setType(e.target.value as Account["type"])}><option>Current account</option><option>Cash</option><option>Savings</option><option>Credit card</option><option>Business</option><option>Pakistan account</option><option>Other</option></select></label><label className="field">Opening balance<input type="number" step="0.01" value={openingBalance} onChange={(e)=>setOpeningBalance(Number(e.target.value))}/></label><button className="primary-button full-field">Save account</button></form></section>
}
