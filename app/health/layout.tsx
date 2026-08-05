export default function HealthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .life-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
        .life-tabs button{border:1px solid var(--border);background:var(--surface-strong);color:var(--text);border-radius:13px;padding:10px 14px;font-weight:800;text-transform:capitalize}
        .life-tabs button.active{background:var(--primary);color:white}
        .grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}
        .full-span{grid-column:1/-1}
        .smaller-stat{font-size:25px}
        .notification-button{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--border);background:var(--surface-strong);color:var(--text);border-radius:13px;padding:9px 12px;font-weight:800}
        @media(max-width:900px){.grid.two{grid-template-columns:1fr}.full-span{grid-column:auto}}
        @media(prefers-color-scheme:dark){.life-tabs button.active{color:#101828}}
      `}</style>
      {children}
    </>
  );
}
