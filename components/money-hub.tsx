"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Banknote, CalendarClock, CreditCard, Landmark, Plus, ReceiptText, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { advanceBillDate, createId, loadData, saveData } from "@/lib/storage";
import type { Account, AppData, Bill, Debt, Transaction } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value || 0);

type Tab = "overview" | "transactions" | "bills" | "debts" | "accounts";

export default function MoneyHub() {
  const [data, setData] = useState<AppData | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

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
    const dueBeforePayday = data.financeSettings.nextPayday ? activeBills.filter((x) => x.dueDate <= data.financeSettings.nextPayday) : activeBills;
    const billsDue = dueBeforePayday.reduce((sum, x) => sum + x.amount, 0);
    return { income, expenses, accountBalance, totalDebt, billsDue, safeBalance: accountBalance - billsDue };
  }, [data]);

  function updateData(mutator: (current: AppData) => AppData) {
    setData((current) => current ? mutator(current) : current);
  }

  function addTransaction(entry: Omit<Transaction, "id" | "createdAt">) {
    updateData((current) => ({ ...current, transactions: [{ ...entry, id: createId(), createdAt: new Date().toISOString() }, ...current.transactions] }));
  }

  function addBill(entry: Omit<Bill, "id" | "createdAt" | "active">) {
    updateData((current) => ({ ...current, bills: [...current.bills, { ...entry, id: createId(), active: true, createdAt: new Date().toISOString() }] }));
  }

  function addDebt(entry: Omit<Debt, "id" | "createdAt">) {
    updateData((current) => ({ ...current, debts: [...current.debts, { ...entry, id: createId(), createdAt: new Date().toISOString() }] }));
  }

  function addAccount(entry: Omit<Account, "id" | "createdAt">) {
    updateData((current) => ({ ...current, accounts: [...current.accounts, { ...entry, id: createId(), createdAt: new Date().toISOString() }] }));
  }

  function markBillPaid(bill: Bill) {
    updateData((current) => {
      const transaction: Transaction = { id: createId(), kind: "expense", amount: bill.amount, date: today(), category: "Bills", description: bill.provider, accountId: bill.accountId, createdAt: new Date().toISOString() };
      const bills = current.bills.map((x) => x.id === bill.id ? (x.frequency === "One-time" ? { ...x, active: false } : { ...x, dueDate: advanceBillDate(x.dueDate, x.frequency) }) : x);
      return { ...current, transactions: [transaction, ...current.transactions], bills };
    });
  }

  if (!data || !summary) return <main className="loading-screen">Loading money records…</main>;

  return <div className="shell">
    <header className="topbar"><div className="brand"><h1>Money Hub</h1><p>Cash flow, bills, debts and accounts</p></div><Link href="/" className="notification-button"><ArrowLeft size={17}/>Abrar OS</Link></header>
    <main className="main">
      <div className="family-tabs">{(["overview","transactions","bills","debts","accounts"] as Tab[]).map((item)=><button key={item} className={`quick ${tab===item?"tab-active":""}`} onClick={()=>setTab(item)}>{item[0].toUpperCase()+item.slice(1)}</button>)}</div>

      {tab === "overview" && <>
        <section className="grid three">
          <article className="card"><div className="card-head"><h2>Available balance</h2><Landmark size={20}/></div><div className="stat">{money(summary.accountBalance)}</div></article>
          <article className="card"><div className="card-head"><h2>Safe balance</h2><Banknote size={20}/></div><div className="stat">{money(summary.safeBalance)}</div><p className="muted">After bills before payday</p></article>
          <article className="card"><div className="card-head"><h2>Total debt</h2><CreditCard size={20}/></div><div className="stat">{money(summary.totalDebt)}</div></article>
        </section>
        <section className="grid three section-gap">
          <article className="card"><div className="card-head"><h2>Income</h2><TrendingUp size={20}/></div><div className="stat">{money(summary.income)}</div></article>
          <article className="card"><div className="card-head"><h2>Expenses</h2><TrendingDown size={20}/></div><div className="stat">{money(summary.expenses)}</div></article>
          <article className="card"><div className="card-head"><h2>Bills before payday</h2><CalendarClock size={20}/></div><div className="stat">{money(summary.billsDue)}</div><label className="field">Next payday<input type="date" value={data.financeSettings.nextPayday} onChange={(e)=>updateData((c)=>({...c,financeSettings:{nextPayday:e.target.value}}))}/></label></article>
        </section>
      </>}

      {tab === "transactions" && <div className="grid two"><TransactionForm accounts={data.accounts} onSave={addTransaction}/><List title="Transaction history" empty="No transactions recorded.">{data.transactions.map((x)=><Row key={x.id} title={x.description} detail={`${x.date} • ${x.category}`} right={<><span className={`pill ${x.kind==="income"?"success":"danger"}`}>{x.kind==="income"?"+":"-"}{money(x.amount)}</span><Delete onClick={()=>updateData((c)=>({...c,transactions:c.transactions.filter((t)=>t.id!==x.id)}))}/></>}/>)}</List></div>}

      {tab === "bills" && <div className="grid two"><BillForm accounts={data.accounts} onSave={addBill}/><List title="Bills and direct debits" empty="No bills added.">{data.bills.map((x)=><Row key={x.id} title={x.provider} detail={`${money(x.amount)} • ${x.dueDate} • ${x.frequency}`} right={<>{x.active&&<button className="quick" onClick={()=>markBillPaid(x)}>Paid</button>}<Delete onClick={()=>updateData((c)=>({...c,bills:c.bills.filter((b)=>b.id!==x.id)}))}/></>}/>)}</List></div>}

      {tab === "debts" && <div className="grid two"><DebtForm onSave={addDebt}/><List title="Debt balances" empty="No debts added.">{data.debts.map((x)=><Row key={x.id} title={x.lender} detail={`${money(x.currentBalance)} remaining • minimum ${money(x.minimumPayment)} • ${x.status}`} right={<Delete onClick={()=>updateData((c)=>({...c,debts:c.debts.filter((d)=>d.id!==x.id)}))}/>}/>)}</List></div>}

      {tab === "accounts" && <div className="grid two"><AccountForm onSave={addAccount}/><List title="Accounts" empty="No accounts added.">{data.accounts.map((x)=><Row key={x.id} title={x.name} detail={`${x.type} • opening ${money(x.openingBalance)}`} right={<Delete onClick={()=>updateData((c)=>({...c,accounts:c.accounts.filter((a)=>a.id!==x.id)}))}/>}/>)}</List></div>}
    </main>
  </div>;
}

function List({title,empty,children}:{title:string;empty:string;children:React.ReactNode}){const has=Array.isArray(children)?children.length>0:Boolean(children);return <section className="card"><h2>{title}</h2>{has?<div className="list">{children}</div>:<p className="muted">{empty}</p>}</section>}
function Row({title,detail,right}:{title:string;detail:string;right:React.ReactNode}){return <div className="item"><div><strong>{title}</strong><span>{detail}</span></div><div className="item-actions">{right}</div></div>}
function Delete({onClick}:{onClick:()=>void}){return <button className="icon-button danger-button" onClick={onClick}><Trash2 size={16}/></button>}

function TransactionForm({accounts,onSave}:{accounts:Account[];onSave:(entry:Omit<Transaction,"id"|"createdAt">)=>void}){
  const [kind,setKind]=useState<Transaction["kind"]>("expense"),[amount,setAmount]=useState(0),[date,setDate]=useState(today()),[category,setCategory]=useState(""),[description,setDescription]=useState(""),[accountId,setAccountId]=useState("");
  function submit(e:FormEvent){e.preventDefault();if(amount<=0||!description.trim())return;onSave({kind,amount,date,category:category||"Other",description:description.trim(),accountId:accountId||undefined});setAmount(0);setDescription("")}
  return <Form title="Add income or expense" icon={<Plus size={20}/>} onSubmit={submit}><label className="field">Type<select value={kind} onChange={(e)=>setKind(e.target.value as Transaction["kind"])}><option value="expense">Expense</option><option value="income">Income</option></select></label><Num label="Amount" value={amount} set={setAmount}/><DateField value={date} set={setDate}/><Text label="Category" value={category} set={setCategory}/><Text label="Description" value={description} set={setDescription} full/><label className="field full-field">Account<select value={accountId} onChange={(e)=>setAccountId(e.target.value)}><option value="">Not specified</option>{accounts.map((x)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label></Form>
}

function BillForm({accounts,onSave}:{accounts:Account[];onSave:(entry:Omit<Bill,"id"|"createdAt"|"active">)=>void}){
  const [provider,setProvider]=useState(""),[amount,setAmount]=useState(0),[dueDate,setDueDate]=useState(today()),[frequency,setFrequency]=useState<Bill["frequency"]>("Monthly"),[paymentType,setPaymentType]=useState<Bill["paymentType"]>("Direct debit"),[accountId,setAccountId]=useState("");
  function submit(e:FormEvent){e.preventDefault();if(!provider.trim()||amount<=0)return;onSave({provider:provider.trim(),amount,dueDate,frequency,paymentType,accountId:accountId||undefined,variable:false});setProvider("");setAmount(0)}
  return <Form title="Add bill" icon={<ReceiptText size={20}/>} onSubmit={submit}><Text label="Provider" value={provider} set={setProvider} full/><Num label="Amount" value={amount} set={setAmount}/><DateField value={dueDate} set={setDueDate}/><label className="field">Frequency<select value={frequency} onChange={(e)=>setFrequency(e.target.value as Bill["frequency"])}>{["Weekly","Monthly","Quarterly","Yearly","One-time"].map(x=><option key={x}>{x}</option>)}</select></label><label className="field">Payment type<select value={paymentType} onChange={(e)=>setPaymentType(e.target.value as Bill["paymentType"])}>{["Direct debit","Standing order","Manual bill","Subscription"].map(x=><option key={x}>{x}</option>)}</select></label><label className="field full-field">Account<select value={accountId} onChange={(e)=>setAccountId(e.target.value)}><option value="">Not specified</option>{accounts.map((x)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label></Form>
}

function DebtForm({onSave}:{onSave:(entry:Omit<Debt,"id"|"createdAt">)=>void}){const [lender,setLender]=useState(""),[balance,setBalance]=useState(0),[interestRate,setInterestRate]=useState(0),[minimumPayment,setMinimumPayment]=useState(0),[status,setStatus]=useState<Debt["status"]>("Accepted");function submit(e:FormEvent){e.preventDefault();if(!lender.trim()||balance<=0)return;onSave({lender:lender.trim(),originalBalance:balance,currentBalance:balance,interestRate,minimumPayment,status});setLender("");setBalance(0)}return <Form title="Add debt" icon={<CreditCard size={20}/>} onSubmit={submit}><Text label="Lender or claimant" value={lender} set={setLender} full/><Num label="Balance" value={balance} set={setBalance}/><Num label="Minimum payment" value={minimumPayment} set={setMinimumPayment}/><Num label="Interest rate %" value={interestRate} set={setInterestRate}/><label className="field">Status<select value={status} onChange={(e)=>setStatus(e.target.value as Debt["status"])}>{["Accepted","Claimed / disputed","Informal","Paid off"].map(x=><option key={x}>{x}</option>)}</select></label></Form>}

function AccountForm({onSave}:{onSave:(entry:Omit<Account,"id"|"createdAt">)=>void}){const [name,setName]=useState(""),[type,setType]=useState<Account["type"]>("Current account"),[openingBalance,setOpeningBalance]=useState(0);function submit(e:FormEvent){e.preventDefault();if(!name.trim())return;onSave({name:name.trim(),type,openingBalance});setName("");setOpeningBalance(0)}return <Form title="Add account" icon={<Landmark size={20}/>} onSubmit={submit}><Text label="Account name" value={name} set={setName} full/><label className="field">Type<select value={type} onChange={(e)=>setType(e.target.value as Account["type"])}>{["Current account","Cash","Savings","Credit card","Business","Pakistan account","Other"].map(x=><option key={x}>{x}</option>)}</select></label><Num label="Opening balance" value={openingBalance} set={setOpeningBalance}/></Form>}

function Form({title,icon,onSubmit,children}:{title:string;icon:React.ReactNode;onSubmit:(e:FormEvent)=>void;children:React.ReactNode}){return <section className="card"><div className="card-head"><h2>{title}</h2>{icon}</div><form className="form-grid" onSubmit={onSubmit}>{children}<button className="primary-button full-field">Save</button></form></section>}
function Text({label,value,set,full=false}:{label:string;value:string;set:(v:string)=>void;full?:boolean}){return <label className={`field ${full?"full-field":""}`}>{label}<input value={value} onChange={(e)=>set(e.target.value)} required={label.includes("Description")||label.includes("Provider")||label.includes("Lender")||label.includes("Account")}/></label>}
function Num({label,value,set}:{label:string;value:number;set:(v:number)=>void}){return <label className="field">{label}<input type="number" step="0.01" value={value} onChange={(e)=>set(Number(e.target.value))}/></label>}
function DateField({value,set}:{value:string;set:(v:string)=>void}){return <label className="field">Date<input type="date" value={value} onChange={(e)=>set(e.target.value)}/></label>}
