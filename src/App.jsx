import { useState, useEffect, useRef, Fragment } from "react";

const GAS_URL = "https://script.google.com/macros/s/AKfycbxzhntAQ9r4TZxQb57nOKkXWSetKoAMivuyGWHe-qBhuyc9asHDhO_9RjtBBX8V0Sry/exec";

const PALETTE = ["#4f7cac","#6dbf9e","#f0a500","#e07a5f","#9c89b8","#f18f01","#44bba4","#e94f37","#adb5bd","#5c677d","#b5838d","#6d6875"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const DEFAULT_CATS = ["Groceries","Dining out","Daily","Activities","Kids","Online","Dogu","Health","Utilities","Clothing","Transport","Government","Rent","Travel","Insurance","Asset","Other","Job"];
const DEFAULT_BIZ_CATS = ["Online","Transport","Supplies","Entertainment","Advertising","Outsourcing","Rent","Utilities","Other"];
const DEFAULT_CAT_PAYEES = {
  "Groceries":["Supermarket","Konbini","Costco"],
  "Dining out":["Cafe","Restaurant","Fast food"],
  "Daily":["Drug store","Home center","100 yen"],
  "Online":["Docomo","Apple","Google","Netflix","Spotify","Amazon"],
  "Transport":["Train/Bus","Taxi","Shinkansen"],
  "Health":["Hospital","Pharmacy","Dentist"],
  "Utilities":["Electric","Gas","Water"],
  "Clothing":["Uniqlo","ZARA","GU"],
};
const DEFAULT_BIZ_PAYEES = {
  "Online":["Docomo","AWS","Google"],
  "Transport":["Train/Bus","Taxi","Shinkansen"],
  "Supplies":["Amazon","Staples"],
};

const pad = n => String(n).padStart(2,"0");
const fmtYen = n => "¥" + Number(n).toLocaleString();
const todayStr = () => { const d=new Date(); return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); };
const normDate = d => { if(!d) return ""; const s=String(d); if(s.includes("T")||s.includes("Z")){ const dt=new Date(s); return dt.getFullYear()+"-"+pad(dt.getMonth()+1)+"-"+pad(dt.getDate()); } return s.slice(0,10); };
const gasPost = async body => { if(!GAS_URL) return {ok:false}; const r=await fetch(GAS_URL,{method:"POST",body:JSON.stringify(body)}); return r.json(); };

// ── TagEditor ─────────────────────────────────────────────────────────────────
function TagEditor({ title, items, onSave, onClose }) {
  const [list, setList] = useState([...items]);
  const [inp, setInp] = useState("");
  const add = () => { const v=inp.trim(); if(v&&!list.includes(v)){setList([...list,v]);setInp("");} };
  const up = i => { if(i===0) return; const l=[...list]; [l[i-1],l[i]]=[l[i],l[i-1]]; setList(l); };
  const dn = i => { if(i===list.length-1) return; const l=[...list]; [l[i],l[i+1]]=[l[i+1],l[i]]; setList(l); };
  return (
    <div style={M.overlay}>
      <div style={M.modal}>
        <h3 style={M.mTitle}>{title}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14}}>
          {list.map((item,i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"#f7f7f4",borderRadius:8}}>
              <span style={{flex:1,fontSize:14}}>{item}</span>
              <button style={M.sortBtn} onClick={()=>up(i)} disabled={i===0}>↑</button>
              <button style={M.sortBtn} onClick={()=>dn(i)} disabled={i===list.length-1}>↓</button>
              <button style={M.xBtn} onClick={()=>setList(list.filter((_,j)=>j!==i))}>×</button>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <input style={M.inp} value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="新しい項目" />
          <button style={M.addBtn} onClick={add}>追加</button>
        </div>
        <div style={M.btns}>
          <button style={M.cancel} onClick={onClose}>キャンセル</button>
          <button style={M.save} onClick={()=>{onSave(list);onClose();}}>保存</button>
        </div>
      </div>
    </div>
  );
}

// ── CatPayeeEditor ────────────────────────────────────────────────────────────
function CatPayeeEditor({ cats, payees, onSave, onClose }) {
  const [map, setMap] = useState(()=>{ const m={}; cats.forEach(c=>{m[c]=[...(payees[c]||[])]}); return m; });
  const [sel, setSel] = useState(cats[0]||"");
  const [inp, setInp] = useState("");
  const add = () => { const v=inp.trim(); if(v&&sel&&!(map[sel]||[]).includes(v)){setMap(m=>({...m,[sel]:[...(m[sel]||[]),v]}));setInp("");} };
  return (
    <div style={M.overlay}>
      <div style={{...M.modal,maxWidth:520}}>
        <h3 style={M.mTitle}>支払い先の編集</h3>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:12}}>
          {cats.map(c => <button key={c} style={{...M.catTab,...(sel===c?M.catTabOn:{})}} onClick={()=>setSel(c)}>{c}</button>)}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12,minHeight:32}}>
          {(map[sel]||[]).map((p,i) => (
            <span key={i} style={M.tag}>{p}<button style={M.xBtn} onClick={()=>setMap(m=>({...m,[sel]:m[sel].filter((_,j)=>j!==i)}))}>×</button></span>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <input style={M.inp} value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder={"支払い先を追加"} />
          <button style={M.addBtn} onClick={add}>追加</button>
        </div>
        <div style={M.btns}>
          <button style={M.cancel} onClick={onClose}>キャンセル</button>
          <button style={M.save} onClick={()=>{onSave(map);onClose();}}>保存</button>
        </div>
      </div>
    </div>
  );
}

// ── FixedEditor ───────────────────────────────────────────────────────────────
function FixedEditor({ fixed, cats, catColors, onSave, onClose }) {
  const [list, setList] = useState(fixed.map(f=>({...f})));
  const [f, setF] = useState({name:"",amount:"",category:"",payee:"",day:1});
  const add = () => {
    if(!f.name||!f.amount||!f.category) return;
    setList([...list,{id:Date.now(),...f,amount:Number(f.amount)}]);
    setF({name:"",amount:"",category:"",payee:"",day:1});
  };
  return (
    <div style={M.overlay}>
      <div style={{...M.modal,maxWidth:520}}>
        <h3 style={M.mTitle}>固定費の管理</h3>
        <div style={{marginBottom:14}}>
          {list.map((item,i) => (
            <div key={item.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid #f0f0ec"}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:catColors[item.category]||"#aaa",display:"inline-block",flexShrink:0}} />
              <span style={{flex:1,fontSize:14,fontWeight:600}}>{item.name}</span>
              <span style={{fontSize:12,color:"#888"}}>毎月{item.day}日</span>
              <span style={{fontSize:14,fontWeight:700,marginLeft:8}}>{fmtYen(item.amount)}</span>
              <button style={M.xBtn} onClick={()=>setList(list.filter((_,j)=>j!==i))}>×</button>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <input style={M.inp} placeholder="名称" value={f.name} onChange={e=>setF(v=>({...v,name:e.target.value}))} />
          <input style={M.inp} type="number" placeholder="金額" value={f.amount} onChange={e=>setF(v=>({...v,amount:e.target.value}))} />
          <select style={M.inp} value={f.category} onChange={e=>setF(v=>({...v,category:e.target.value}))}>
            <option value="">カテゴリー</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select style={M.inp} value={f.day} onChange={e=>setF(v=>({...v,day:Number(e.target.value)}))}>
            {Array.from({length:28},(_,i)=>i+1).map(d => <option key={d} value={d}>{d}日</option>)}
          </select>
        </div>
        <input style={{...M.inp,width:"100%",boxSizing:"border-box",marginBottom:8}} placeholder="支払い先（任意）" value={f.payee} onChange={e=>setF(v=>({...v,payee:e.target.value}))} />
        <button style={{...M.addBtn,width:"100%",padding:"10px"}} onClick={add}>追加</button>
        <div style={{...M.btns,marginTop:14}}>
          <button style={M.cancel} onClick={onClose}>キャンセル</button>
          <button style={M.save} onClick={()=>{onSave(list);onClose();}}>保存</button>
        </div>
      </div>
    </div>
  );
}

// ── EditModal ─────────────────────────────────────────────────────────────────
function EditModal({ rec, cats, catColors, bizCats, bizCatColors, catPayees, onSave, onClose }) {
  const [r, setR] = useState({...rec});
  const payees = r.category ? (catPayees[r.category]||[]) : [];
  return (
    <div style={M.overlay}>
      <div style={{...M.modal,maxHeight:"90vh",overflowY:"auto"}}>
        <h3 style={M.mTitle}>記録を編集</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
          <div>
            <label style={M.label}>日付</label>
            <input style={{...M.inp,width:"100%",boxSizing:"border-box"}} type="date" value={r.date} onChange={e=>setR(v=>({...v,date:e.target.value}))} />
          </div>
          <div>
            <label style={M.label}>金額</label>
            <input style={{...M.inp,textAlign:"right",fontWeight:700}} type="number" value={r.amount} onChange={e=>setR(v=>({...v,amount:e.target.value}))} />
          </div>
        </div>
        <label style={M.label}>カテゴリー</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
          {cats.map(c => <button key={c} style={{...M.chip,...(r.category===c?{background:catColors[c],color:"#fff",borderColor:catColors[c]}:{})}} onClick={()=>setR(v=>({...v,category:c,payee:""}))}>{c}</button>)}
        </div>
        {payees.length>0 && (
          <div>
            <label style={M.label}>支払い先</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:6}}>
              {payees.map(p => <button key={p} style={{...M.chip,...(r.payee===p?{background:"#333",color:"#fff",borderColor:"#333"}:{})}} onClick={()=>setR(v=>({...v,payee:p}))}>{p}</button>)}
            </div>
          </div>
        )}
        <input style={{...M.inp,width:"100%",boxSizing:"border-box",marginBottom:4}} placeholder="支払い先を直接入力" value={r.payee||""} onChange={e=>setR(v=>({...v,payee:e.target.value}))} />
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"10px 0"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:"#fafaf8",borderRadius:10,border:"1px solid #eeeee9",cursor:"pointer"}} onClick={()=>setR(v=>({...v,isFixed:!v.isFixed}))}>
            <span style={{fontSize:13,color:"#333"}}>固定費</span>
            <div style={{width:36,height:22,borderRadius:11,background:r.isFixed?"#4f7cac":"#ddd",position:"relative",flexShrink:0}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:r.isFixed?16:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}} />
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:"#fafaf8",borderRadius:10,border:"1px solid #eeeee9",cursor:"pointer"}} onClick={()=>setR(v=>({...v,isBiz:!v.isBiz,bizCategory:v.isBiz?"":v.bizCategory}))}>
            <span style={{fontSize:13,color:"#333"}}>事業経費</span>
            <div style={{width:36,height:22,borderRadius:11,background:r.isBiz?"#3aaa82":"#ddd",position:"relative",flexShrink:0}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:r.isBiz?16:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}} />
            </div>
          </div>
        </div>
        {r.isBiz && (
          <div style={{background:"#edfaf5",borderRadius:10,padding:12,border:"1px solid #b2e0d0",marginBottom:8}}>
            <label style={{...M.label,color:"#3aaa82",marginTop:0}}>事業カテゴリー</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {bizCats.map(c => <button key={c} style={{...M.chip,...(r.bizCategory===c?{background:bizCatColors[c],color:"#fff",borderColor:bizCatColors[c]}:{borderColor:"#6dbf9e",color:"#3aaa82"})}} onClick={()=>setR(v=>({...v,bizCategory:v.bizCategory===c?"":c}))}>{c}</button>)}
            </div>
          </div>
        )}
        <label style={M.label}>メモ</label>
        <input style={{...M.inp,width:"100%",boxSizing:"border-box"}} placeholder="メモ" value={r.memo||""} onChange={e=>setR(v=>({...v,memo:e.target.value}))} />
        <div style={{...M.btns,marginTop:16}}>
          <button style={M.cancel} onClick={onClose}>キャンセル</button>
          <button style={M.save} onClick={()=>onSave({...r,amount:Number(r.amount)})}>保存</button>
        </div>
      </div>
    </div>
  );
}

// ── FixedCandidateRow ─────────────────────────────────────────────────────────
function FixedCandidateRow({ item, catColors, isRecorded, viewYear, viewMonth, onRecord }) {
  const [amount, setAmount] = useState(String(item.amount));
  const [date, setDate] = useState(viewYear+"-"+pad(viewMonth)+"-"+pad(item.day));
  const [open, setOpen] = useState(false);
  return (
    <div style={{border:"1px solid #eeeee9",borderRadius:12,marginBottom:8,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px"}}>
        <span style={{width:10,height:10,borderRadius:"50%",background:catColors[item.category]||"#aaa",display:"inline-block",flexShrink:0}} />
        <div style={{flex:1}}>
          <div style={{fontWeight:600,fontSize:14}}>{item.name}</div>
          <div style={{fontSize:11,color:"#aaa",marginTop:2}}>{item.category}{item.payee?" · "+item.payee:""}</div>
        </div>
        <div style={{fontSize:15,fontWeight:700,marginRight:8}}>{fmtYen(item.amount)}</div>
        {isRecorded
          ? <span style={{fontSize:12,color:"#6dbf9e",fontWeight:600,padding:"4px 10px",border:"1px solid #6dbf9e",borderRadius:20}}>記録済み ✓</span>
          : <button style={{padding:"6px 14px",background:"#1a1a1a",color:"#fff",border:"none",borderRadius:20,fontSize:13,fontWeight:600,cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>{open?"閉じる":"記録する"}</button>
        }
      </div>
      {open && !isRecorded && (
        <div style={{background:"#f7f7f4",borderTop:"1px solid #eeeee9",padding:"12px 14px",display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div style={{flex:"1 1 120px"}}>
            <label style={{...M.label,marginTop:0}}>日付</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{...M.inp,width:"100%",boxSizing:"border-box"}} />
          </div>
          <div style={{flex:"1 1 100px"}}>
            <label style={{...M.label,marginTop:0}}>金額</label>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={{...M.inp,textAlign:"right"}} />
          </div>
          <button style={{padding:"8px 20px",background:"#4f7cac",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}} onClick={()=>{if(amount&&date){onRecord(item,amount,date);setOpen(false);}}}>この金額で記録</button>
        </div>
      )}
    </div>
  );
}

// ── MonthlyList ──────────────────────────────────────────────────────────────
function MonthlyList({ mRecs, today, catColors, bizCatColors, onEdit, onDelete }) {
  const grouped = {};
  [...mRecs].forEach(r=>{ const d=normDate(r.date); if(!grouped[d]) grouped[d]=[]; grouped[d].push(r); });
  const dates = Object.keys(grouped).sort().reverse();
  return (
    <div style={{marginTop:20}}>
      <p style={{fontSize:11,fontWeight:700,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>当月の記録一覧（{mRecs.length}件）</p>
      {dates.map(date=>{
        const dow = DAYS[new Date(date).getDay()];
        const isSun = new Date(date).getDay()===0;
        const isSat = new Date(date).getDay()===6;
        const dateColor = isSun?"#e07a5f":isSat?"#4f7cac":"#333";
        const dayTotal = grouped[date].reduce((s,r)=>s+Number(r.amount),0);
        return (
          <div key={date} style={{marginBottom:14,borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
            {/* 日付ヘッダー */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",background:"#f0f0ec"}}>
              <span style={{fontSize:14,fontWeight:700,color:dateColor}}>
                {date.slice(5).replace("-","/")}
                <span style={{fontSize:12,fontWeight:500,marginLeft:6,opacity:.8}}>{dow}</span>
                {date===today&&<span style={{marginLeft:8,fontSize:10,background:"#4f7cac",color:"#fff",borderRadius:4,padding:"1px 6px"}}>today</span>}
              </span>
              <span style={{fontSize:13,fontWeight:700,color:"#555"}}>{fmtYen(dayTotal)}</span>
            </div>
            {/* 各レコード */}
            {grouped[date].map((r,i)=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",background:"#fff",borderBottom:i<grouped[date].length-1?"1px solid #f5f5f2":"none"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span style={{fontSize:14,fontWeight:500,color:"#1a1a1a"}}>{r.payee||"—"}</span>
                    {r.isFixed&&<span style={{fontSize:10,background:"#f0f0ec",color:"#999",borderRadius:4,padding:"1px 6px"}}>固定費</span>}
                    {r.isBiz&&<span style={{fontSize:10,background:"#edfaf5",color:"#3aaa82",borderRadius:4,padding:"1px 6px",fontWeight:600}}>事業経費</span>}
                    {r.memo&&<span style={{fontSize:11,color:"#bbb"}}>— {r.memo}</span>}
                  </div>
                </div>
                <span style={{fontSize:13,fontWeight:600,flexShrink:0,color:"#333"}}>{fmtYen(r.amount)}</span>
                <button style={{background:"none",border:"1px solid #e0e0dc",borderRadius:6,color:"#aaa",cursor:"pointer",fontSize:10,padding:"2px 7px",flexShrink:0,fontFamily:"inherit"}} onClick={()=>onEdit(r)}>編集</button>
                <button style={{background:"none",border:"none",color:"#ddd",cursor:"pointer",fontSize:16,padding:"0 2px",flexShrink:0,lineHeight:1}} onClick={()=>onDelete(r.id)}>×</button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── DetailPanel ───────────────────────────────────────────────────────────────
function DetailPanel({ expandedDate, monthRecords, onClose, onDelete }) {
  if(!expandedDate || !expandedDate.includes(":")) return null;
  const sep = expandedDate.indexOf(":");
  const epDate = expandedDate.slice(0, sep);
  const epCat  = expandedDate.slice(sep + 1);
  const epDow  = DAYS[new Date(epDate).getDay()];
  const epRecs = monthRecords.filter(r => normDate(r.date)===epDate && r.category===epCat);
  if(!epRecs.length) return null;
  const sub = epRecs.reduce((s,r)=>s+Number(r.amount),0);
  return (
    <div style={{marginTop:8,background:"#f7f7f4",borderRadius:10,padding:"14px 16px",border:"1px solid #eeeee9"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:700,color:"#555"}}>{epDate.slice(5).replace("-","/")} {epDow} · {epCat}</span>
        <button style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:20,padding:"0 2px"}} onClick={onClose}>×</button>
      </div>
      {epRecs.map(r => (
        <div key={r.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:"1px solid #eaeae5",fontSize:13}}>
          <span style={{color:"#444",fontWeight:500,flexShrink:0}}>{r.payee||"—"}</span>
          {r.memo && <span style={{color:"#aaa",flex:1}}>「{r.memo}」</span>}
          {r.isFixed && <span style={{fontSize:10,background:"#eef4fb",color:"#4f7cac",borderRadius:4,padding:"1px 5px",fontWeight:600}}>固定</span>}
          {r.isBiz && <span style={{fontSize:10,background:"#edfaf5",color:"#3aaa82",borderRadius:4,padding:"1px 5px",fontWeight:600}}>事業</span>}
          <span style={{fontWeight:700,marginLeft:"auto",flexShrink:0}}>{fmtYen(r.amount)}</span>
          <button style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:16,padding:"0 2px"}} onClick={()=>onDelete(r.id,epRecs.length)}>×</button>
        </div>
      ))}
      {epRecs.length>1 && <div style={{textAlign:"right",fontSize:13,fontWeight:700,marginTop:8,color:"#333"}}>小計 {fmtYen(sub)}</div>}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ label, on, color, onChange }) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:"#fafaf8",borderRadius:10,border:"1px solid #eeeee9",cursor:"pointer"}} onClick={onChange}>
      <span style={{fontSize:13,color:"#555"}}>{label}</span>
      <div style={{width:36,height:22,borderRadius:11,background:on?color:"#ddd",position:"relative",flexShrink:0,transition:"background .2s"}}>
        <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:on?16:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}} />
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]           = useState("input");
  const [syncing, setSyncing]   = useState(false);
  const [records, setRecords]   = useState([]);
  const [cats, setCats]         = useState(DEFAULT_CATS);
  const [catPayees, setCatPayees] = useState(DEFAULT_CAT_PAYEES);
  const [bizCats, setBizCats]   = useState(DEFAULT_BIZ_CATS);
  const [bizPayees, setBizPayees] = useState(DEFAULT_BIZ_PAYEES);
  const [fixed, setFixed]       = useState([]);
  const [form, setForm]         = useState({date:todayStr(),amount:"",category:"",payee:"",memo:"",isFixed:false,isBiz:false,bizCategory:""});
  const [editCat, setEditCat]   = useState(false);
  const [editCatP, setEditCatP] = useState(false);
  const [editBizCat, setEditBizCat] = useState(false);
  const [editBizP, setEditBizP] = useState(false);
  const [editFixed, setEditFixed] = useState(false);
  const [editRec, setEditRec]   = useState(null);
  const [vYear, setVYear]       = useState(new Date().getFullYear());
  const [vMonth, setVMonth]     = useState(new Date().getMonth()+1);
  const [bzYear, setBzYear]     = useState(new Date().getFullYear());
  const [bzMonth, setBzMonth]   = useState(new Date().getMonth()+1);
  const [expDate, setExpDate]   = useState(null);
  const [expCat, setExpCat]     = useState(null);
  const [toast, setToast]       = useState("");
  const writing = useRef(false);

  const catColors    = {}; cats.forEach((c,i)=>{catColors[c]=PALETTE[i%PALETTE.length];});
  const bizCatColors = {}; bizCats.forEach((c,i)=>{bizCatColors[c]=PALETTE[(i+4)%PALETTE.length];});

  const showToast = (msg,dur=2200) => { setToast(msg); setTimeout(()=>setToast(""),dur); };

  const fetchAll = async () => {
    if(!GAS_URL) return;
    setSyncing(true);
    try {
      const res = await (await fetch(GAS_URL+"?action=getAll")).json();
      if(res.ok && !writing.current) {
        if(res.records && res.records.length>0) {
          setRecords(res.records.map(r=>({...r,date:normDate(r.date),amount:Number(r.amount),isFixed:r.isFixed===true||r.isFixed==="TRUE",isBiz:r.isBiz===true||r.isBiz==="TRUE",bizCategory:r.bizCategory||""})));
        }
        const s=res.settings||{};
        if(s.categories)    setCats(s.categories);
        if(s.catPayees)     setCatPayees(s.catPayees);
        if(s.bizCategories) setBizCats(s.bizCategories);
        if(s.bizCatPayees)  setBizPayees(s.bizCatPayees);
        if(s.fixedCosts)    setFixed(s.fixedCosts);
      }
    } catch(e) { console.warn(e); }
    setSyncing(false);
  };

  useEffect(()=>{
    if(!GAS_URL) return;
    fetchAll();
    const t = setInterval(fetchAll, 30000);
    return ()=>clearInterval(t);
  },[]);

  const sync = async body => {
    if(!GAS_URL) return;
    writing.current = true;
    setSyncing(true);
    try { await gasPost(body); } catch(e){ console.warn(e); }
    setTimeout(()=>{ writing.current=false; }, 3000);
    setSyncing(false);
  };

  const saveSetting = (key,val) => { if(GAS_URL) sync({action:"saveAllSettings",settings:{[key]:val}}); };

  const addRecord = () => {
    const cat = form.isBiz ? (form.bizCategory||form.category) : form.category;
    if(!form.amount||!cat||!form.date){ showToast("日付・金額・カテゴリーは必須です"); return; }
    const rec = {id:Date.now(),date:normDate(form.date),amount:Number(form.amount),category:form.category,bizCategory:form.isBiz?form.bizCategory:"",payee:form.payee||"",memo:form.memo||"",isFixed:form.isFixed,isBiz:form.isBiz};
    setRecords(p=>[...p,rec]);
    if(form.isFixed){
      const name=form.memo||cat;
      if(!fixed.some(f=>f.name===name)){
        const nf={id:Date.now()+1,name,amount:Number(form.amount),category:form.category,bizCategory:rec.bizCategory,payee:form.payee||"",day:Number(normDate(form.date).split("-")[2])};
        const upd=[...fixed,nf]; setFixed(upd); saveSetting("fixedCosts",upd);
        showToast("「"+name+"」を固定費候補に追加しました ✓");
      } else { showToast("記録しました ✓"); }
    } else { showToast("記録しました ✓"); }
    setForm(f=>({...f,amount:"",memo:"",payee:"",isFixed:false,isBiz:false,bizCategory:""}));
    sync({action:"addRecord",record:rec});
  };

  const delRecord = id => { setRecords(p=>p.filter(r=>r.id!==id)); sync({action:"deleteRecord",id}); };

  const updRecord = upd => {
    setRecords(p=>p.map(r=>r.id===upd.id?{...upd,amount:Number(upd.amount)}:r));
    setEditRec(null); showToast("更新しました ✓");
    sync({action:"deleteRecord",id:upd.id});
    sync({action:"addRecord",record:{...upd,amount:Number(upd.amount)}});
  };

  const applyFixed = () => {
    const pfx=vYear+"-"+pad(vMonth);
    if(records.some(r=>r.date.startsWith(pfx)&&r.isFixed)){ showToast("今月はすでに適用済みです"); return; }
    const newR=fixed.map(f=>({id:Date.now()+Math.random(),isFixed:true,isBiz:false,date:pfx+"-"+pad(f.day),amount:f.amount,category:f.category,bizCategory:f.bizCategory||"",payee:f.payee||"",memo:f.name}));
    setRecords(p=>[...p,...newR]);
    showToast(newR.length+"件の固定費を記録しました");
    sync({action:"addRecords",records:newR});
  };

  // 月間データ（締め日サイクル）
  const prevMonth = vMonth===1 ? 12 : vMonth-1;
  const prevYear  = vMonth===1 ? vYear-1 : vYear;
  const csStr = prevYear+"-"+pad(prevMonth)+"-19";
  const ceStr = vYear+"-"+pad(vMonth)+"-18";
  const mRecs = records.filter(r=>{ const d=normDate(r.date); return d>=csStr&&d<=ceStr; });
  const byDate = {}; mRecs.forEach(r=>{ const d=normDate(r.date); if(!byDate[d])byDate[d]={}; byDate[d][r.category]=(byDate[d][r.category]||0)+Number(r.amount); });
  const mTotal = mRecs.reduce((s,r)=>s+Number(r.amount),0);
  const usedCats = cats.filter(c=>mRecs.some(r=>r.category===c));
  const catTotals = {}; usedCats.forEach(c=>{catTotals[c]=mRecs.filter(r=>r.category===c).reduce((s,r)=>s+Number(r.amount),0);});

  // 年間データ
  const yRecs = records.filter(r=>normDate(r.date).startsWith(String(vYear)));
  const byMonth = {}; for(let m=1;m<=12;m++) byMonth[m]={};
  yRecs.forEach(r=>{ const m=Number(normDate(r.date).split("-")[1]); byMonth[m][r.category]=(byMonth[m][r.category]||0)+Number(r.amount); });
  const yUsedCats = cats.filter(c=>yRecs.some(r=>r.category===c));

  // 事業経費データ
  const bizRecs = records.filter(r=>r.isBiz&&r.bizCategory);
  const bzMRecs = bizRecs.filter(r=>{ const d=normDate(r.date); const [y,m]=d.split("-").map(Number); return y===bzYear&&m===bzMonth; });
  const bzMTotal = bzMRecs.reduce((s,r)=>s+Number(r.amount),0);
  const bzUsed   = bizCats.filter(c=>bzMRecs.some(r=>(r.bizCategory||r.category)===c));
  const bzTotals = {}; bzUsed.forEach(c=>{bzTotals[c]=bzMRecs.filter(r=>(r.bizCategory||r.category)===c).reduce((s,r)=>s+Number(r.amount),0);});
  const bzYRecs  = bizRecs.filter(r=>normDate(r.date).startsWith(String(bzYear)));
  const bzByM    = {}; for(let m=1;m<=12;m++) bzByM[m]={};
  bzYRecs.forEach(r=>{ const m=Number(normDate(r.date).split("-")[1]); const c=r.bizCategory||r.category; bzByM[m][c]=(bzByM[m][c]||0)+Number(r.amount); });
  const bzYUsed  = bizCats.filter(c=>bzYRecs.some(r=>(r.bizCategory||r.category)===c));

  const today    = todayStr();
  const fixTotal = fixed.reduce((s,f)=>s+f.amount,0);
  const payeesToShow = form.category ? (catPayees[form.category]||[]) : [];

  const navMonth = (dir) => {
    setExpDate(null); setExpCat(null);
    if(dir>0){ if(vMonth===12){setVMonth(1);setVYear(y=>y+1);}else setVMonth(m=>m+1); }
    else { if(vMonth===1){setVMonth(12);setVYear(y=>y-1);}else setVMonth(m=>m-1); }
  };

  return (
    <div style={S.app}>
      {toast && <div style={S.toast}>{toast}</div>}

      <header style={S.header}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={S.logo}>家計簿</span>
          {syncing && <span style={S.sync}>同期中...</span>}
        </div>
        <nav style={S.nav}>
          {[["input","入力"],["monthly","月間"],["yearly","年間"],["biz","事業経費"],["fixed","固定費"]].map(([k,l])=>(
            <button key={k} style={{...S.navBtn,...(tab===k?S.navOn:{})}} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </nav>
        <button style={S.refreshBtn} onClick={fetchAll} title="更新">↺</button>
      </header>

      <main style={S.main}>

        {/* ══ 入力 ══ */}
        {tab==="input" && (
          <div style={S.card}>
            <h2 style={S.cardTitle}>支出を記録</h2>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <div style={{flex:"1 1 140px",minWidth:140}}>
                <label style={S.label}>日付</label>
                <input style={{...S.inp,width:"100%",boxSizing:"border-box"}} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
              </div>
              <div style={{flex:"1 1 120px",minWidth:120}}>
                <label style={S.label}>金額（円）</label>
                <input style={{...S.inp,fontSize:20,fontWeight:700,textAlign:"right",width:"100%",boxSizing:"border-box"}} type="number" inputMode="numeric" placeholder="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
              </div>
            </div>

            <div style={S.rowLabel}>
              <label style={{...S.label,marginTop:0}}>カテゴリー</label>
              <button style={S.editLink} onClick={()=>setEditCat(true)}>編集</button>
            </div>
            <div style={S.chips}>
              {cats.map(c=><button key={c} style={{...S.chip,...(form.category===c?{background:catColors[c],color:"#fff",borderColor:catColors[c]}:{})}} onClick={()=>setForm(f=>({...f,category:c,payee:""}))}>{c}</button>)}
            </div>

            {payeesToShow.length>0 && (
              <div>
                <div style={S.rowLabel}>
                  <label style={{...S.label,marginTop:0}}>支払い先</label>
                  <button style={S.editLink} onClick={()=>setEditCatP(true)}>編集</button>
                </div>
                <div style={S.chips}>
                  {payeesToShow.map(p=><button key={p} style={{...S.chip,...(form.payee===p?{background:"#333",color:"#fff",borderColor:"#333"}:{})}} onClick={()=>setForm(f=>({...f,payee:p}))}>{p}</button>)}
                </div>
              </div>
            )}
            {payeesToShow.length===0 && form.category && (
              <button style={{...S.editLink,marginTop:8,display:"block"}} onClick={()=>setEditCatP(true)}>+ 支払い先を登録する</button>
            )}

            {form.isBiz && (
              <div style={{background:"#edfaf5",borderRadius:10,padding:12,marginTop:10,border:"1px solid #b2e0d0"}}>
                <div style={S.rowLabel}>
                  <label style={{...S.label,marginTop:0,color:"#3aaa82"}}>事業カテゴリー</label>
                  <button style={S.editLink} onClick={()=>setEditBizCat(true)}>編集</button>
                </div>
                <div style={S.chips}>
                  {bizCats.map(c=><button key={c} style={{...S.chip,...(form.bizCategory===c?{background:bizCatColors[c],color:"#fff",borderColor:bizCatColors[c]}:{borderColor:"#6dbf9e",color:"#3aaa82"})}} onClick={()=>setForm(f=>({...f,bizCategory:f.bizCategory===c?"":c}))}>{c}</button>)}
                </div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14}}>
              <Toggle label="固定費" on={form.isFixed} color="#4f7cac" onChange={()=>setForm(f=>({...f,isFixed:!f.isFixed}))} />
              <Toggle label="事業経費" on={form.isBiz} color="#3aaa82" onChange={()=>setForm(f=>({...f,isBiz:!f.isBiz,bizCategory:""}))} />
            </div>

            <label style={S.label}>メモ</label>
            <input style={{...S.inp,width:"100%",boxSizing:"border-box"}} placeholder="任意" value={form.memo} onChange={e=>setForm(f=>({...f,memo:e.target.value}))} />
            <button style={S.primaryBtn} onClick={addRecord}>記録する</button>

            {records.length>0 && (
              <div style={{marginTop:24}}>
                <p style={S.secTitle}>最近の記録</p>
                {[...records].reverse().slice(0,10).map(r=>(
                  <div key={r.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",borderBottom:"1px solid #f0f0ec"}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:(r.isBiz?bizCatColors:catColors)[r.bizCategory||r.category]||"#aaa",marginTop:5,flexShrink:0,display:"inline-block"}} />
                    <div style={{flex:1,fontSize:14}}>
                      <span style={{fontWeight:600}}>{r.category}</span>
                      {r.isBiz&&r.bizCategory&&<span style={{fontSize:10,background:"#edfaf5",color:"#3aaa82",borderRadius:4,padding:"1px 5px",fontWeight:600,marginLeft:4}}>{r.bizCategory}</span>}
                      {r.payee&&<span style={{color:"#666"}}> · {r.payee}</span>}
                      {r.memo&&<span style={{color:"#aaa"}}> — {r.memo}</span>}
                      <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
                        <span style={{fontSize:11,color:"#bbb"}}>{normDate(r.date)}</span>
                        {r.isFixed&&<span style={{fontSize:10,background:"#eef4fb",color:"#4f7cac",borderRadius:4,padding:"1px 5px",fontWeight:600}}>固定費</span>}
                        {r.isBiz&&<span style={{fontSize:10,background:"#edfaf5",color:"#3aaa82",borderRadius:4,padding:"1px 5px",fontWeight:600}}>事業経費</span>}
                      </div>
                    </div>
                    <span style={{fontSize:15,fontWeight:700,flexShrink:0}}>{fmtYen(r.amount)}</span>
                    <button style={{background:"none",border:"1px solid #ddd",borderRadius:6,color:"#888",cursor:"pointer",fontSize:11,padding:"2px 7px",flexShrink:0}} onClick={()=>setEditRec({...r})}>編集</button>
                    <button style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:16,padding:"0 2px",flexShrink:0}} onClick={()=>delRecord(r.id)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ 月間 ══ */}
        {tab==="monthly" && (
          <div style={S.card}>
            <div style={S.navRow}>
              <button style={S.arrowBtn} onClick={()=>navMonth(-1)}>◀</button>
              <div style={{textAlign:"center"}}>
                <h2 style={{...S.cardTitle,marginBottom:2}}>{vYear}年 {vMonth}月</h2>
                <div style={{fontSize:11,color:"#aaa"}}>{prevYear}/{pad(prevMonth)}/19 〜 {vYear}/{pad(vMonth)}/18</div>
              </div>
              <button style={S.arrowBtn} onClick={()=>navMonth(1)}>▶</button>
            </div>

            <div style={S.summaryBox}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
                <span style={{fontSize:11,fontWeight:600,color:"#888",letterSpacing:1,textTransform:"uppercase"}}>月合計</span>
                <span style={{fontSize:26,fontWeight:700}}>{fmtYen(mTotal)}</span>
              </div>
              {mTotal>0 && (
                <div style={{height:40,borderRadius:10,overflow:"hidden",background:"#eeeee9",display:"flex",marginBottom:4}}>
                  {usedCats.map(c=>{
                    const pct=catTotals[c]/mTotal*100;
                    return (
                      <div key={c} style={{width:pct+"%",background:catColors[c],height:"100%",position:"relative",overflow:"hidden",cursor:"pointer"}}
                        onClick={()=>setExpCat(expCat===c?null:c)} title={c+": "+fmtYen(catTotals[c])}>
                        {pct>15 && <span style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",fontSize:11,fontWeight:600,color:"rgba(255,255,255,.9)",whiteSpace:"nowrap",overflow:"hidden",maxWidth:"calc(100% - 8px)"}}>{c}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              {mTotal===0 && <p style={{textAlign:"center",color:"#bbb",padding:"24px 0",fontSize:14}}>この期間の記録はありません</p>}
            </div>

            {Object.keys(byDate).length>0 && (
              <div>
                <div style={{overflowX:"auto",overflowY:"auto",maxHeight:"60vh",borderRadius:10,border:"1px solid #eeeee9"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr>
                        <th style={{...S.th,...S.thFix}}>日付</th>
                        <th style={{...S.th,background:"#f0f0ec",color:"#333",position:"sticky",left:72,zIndex:3,boxShadow:"2px 0 4px rgba(0,0,0,.04)",minWidth:80}}>合計</th>
                        {usedCats.map(c=>(
                          <th key={c} style={S.th}>
                            <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:catColors[c],marginRight:4,verticalAlign:"middle"}} />{c}
                          </th>
                        ))}
                      </tr>
                      <tr style={{background:"#f5f5f0",borderTop:"2px solid #e0e0da"}}>
                        <td style={{...S.td,...S.thFix,fontWeight:700,background:"#f5f5f0"}}>月計</td>
                        <td style={{...S.td,fontWeight:700,background:"#f0f0ec",position:"sticky",left:72,zIndex:1,boxShadow:"2px 0 4px rgba(0,0,0,.04)"}}>{fmtYen(mTotal)}</td>
                        {usedCats.map(c=><td key={c} style={{...S.td,fontWeight:700}}>{fmtYen(catTotals[c])}</td>)}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(byDate).sort().reverse().map((date,di)=>{
                        const dayTotal=Object.values(byDate[date]).reduce((a,b)=>a+b,0);
                        const dow=DAYS[new Date(date).getDay()];
                        const isSun=new Date(date).getDay()===0;
                        const isSat=new Date(date).getDay()===6;
                        const isToday=date===today;
                        const dateColor=isSun?"#e07a5f":isSat?"#4f7cac":"#444";
                        return (
                          <Fragment key={date}>
                            <tr style={{...(di%2===0?{background:"#fff"}:{background:"#fdfdfb"}),...(isToday?{background:"#eef4fb"}:{})}}>
                              <td style={{...S.td,...S.thFix,color:dateColor,background:isToday?"#eef4fb":di%2===0?"#fff":"#fdfdfb"}}>
                                {date.slice(5).replace("-","/")}
                                <span style={{fontSize:11,color:dateColor,opacity:.7,marginLeft:3}}>{dow}</span>
                                {isToday&&<span style={{marginLeft:6,fontSize:10,background:"#4f7cac",color:"#fff",borderRadius:4,padding:"1px 5px"}}>today</span>}
                              </td>
                              <td style={{...S.td,fontWeight:600,background:"#fafaf8",position:"sticky",left:72,zIndex:1,boxShadow:"2px 0 4px rgba(0,0,0,.04)"}}>{fmtYen(dayTotal)}</td>
                              {usedCats.map(c=>{
                                const amt=byDate[date][c];
                                const ck=date+":"+c;
                                return (
                                  <td key={c} style={{...S.td,...(amt?{cursor:"pointer"}:{}),...(expDate===ck?{background:catColors[c]+"22"}:{})}}
                                    onClick={()=>{ if(amt) setExpDate(expDate===ck?null:ck); }}>
                                    {amt ? <span style={{color:catColors[c],fontWeight:600}}>{fmtYen(amt)}{expDate===ck&&<span style={{fontSize:9,marginLeft:2}}>▲</span>}</span> : <span style={{color:"#d0d0cb"}}>—</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <DetailPanel expandedDate={expDate} monthRecords={mRecs} onClose={()=>setExpDate(null)} onDelete={(id,len)=>{delRecord(id);if(len===1)setExpDate(null);}} />
              </div>
            )}

            {mRecs.length>0 && (
              <MonthlyList
                mRecs={mRecs}
                today={today}
                catColors={catColors}
                bizCatColors={bizCatColors}
                onEdit={r=>setEditRec({...r})}
                onDelete={id=>delRecord(id)}
              />
            )}
          </div>
        )}

        {/* ══ 年間 ══ */}
        {tab==="yearly" && (
          <div style={S.card}>
            <div style={S.navRow}>
              <button style={S.arrowBtn} onClick={()=>setVYear(y=>y-1)}>◀</button>
              <h2 style={S.cardTitle}>{vYear}年</h2>
              <button style={S.arrowBtn} onClick={()=>setVYear(y=>y+1)}>▶</button>
            </div>
            <div style={S.summaryBox}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                <span style={{fontSize:11,fontWeight:600,color:"#888",letterSpacing:1,textTransform:"uppercase"}}>年間合計</span>
                <span style={{fontSize:26,fontWeight:700}}>{fmtYen(yRecs.reduce((s,r)=>s+Number(r.amount),0))}</span>
              </div>
            </div>
            {yRecs.length===0 ? <p style={{textAlign:"center",color:"#bbb",padding:"32px 0",fontSize:14}}>この年の記録はありません</p> : (
              <div style={{overflowX:"auto",borderRadius:10,border:"1px solid #eeeee9"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr>
                      <th style={{...S.th,...S.thFix}}>月</th>
                      {yUsedCats.map(c=><th key={c} style={S.th}><span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:catColors[c],marginRight:4,verticalAlign:"middle"}} />{c}</th>)}
                      <th style={{...S.th,background:"#f0f0ec",color:"#333"}}>合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHS.map((ml,mi)=>{
                      const m=mi+1;
                      const tot=Object.values(byMonth[m]).reduce((a,b)=>a+b,0);
                      const isCur=vYear===new Date().getFullYear()&&m===new Date().getMonth()+1;
                      return (
                        <tr key={m} style={{...(mi%2===0?{background:"#fff"}:{background:"#fdfdfb"}),...(isCur?{background:"#eef4fb"}:{})}}>
                          <td style={{...S.td,...S.thFix,fontWeight:600,background:isCur?"#eef4fb":mi%2===0?"#fff":"#fdfdfb"}}>
                            {ml}{isCur&&<span style={{marginLeft:6,fontSize:10,background:"#4f7cac",color:"#fff",borderRadius:4,padding:"1px 5px"}}>今月</span>}
                          </td>
                          {yUsedCats.map(c=><td key={c} style={S.td}>{byMonth[m][c]?fmtYen(byMonth[m][c]):<span style={{color:"#d0d0cb"}}>—</span>}</td>)}
                          <td style={{...S.td,fontWeight:600,background:"#fafaf8"}}>{tot>0?fmtYen(tot):<span style={{color:"#d0d0cb"}}>—</span>}</td>
                        </tr>
                      );
                    })}
                    <tr style={{background:"#f5f5f0",borderTop:"2px solid #e0e0da"}}>
                      <td style={{...S.td,...S.thFix,fontWeight:700,background:"#f5f5f0"}}>年計</td>
                      {yUsedCats.map(c=>{const s=yRecs.filter(r=>r.category===c).reduce((a,r)=>a+Number(r.amount),0);return<td key={c} style={{...S.td,fontWeight:700}}>{fmtYen(s)}</td>;})}
                      <td style={{...S.td,fontWeight:700,background:"#f0f0ec"}}>{fmtYen(yRecs.reduce((s,r)=>s+Number(r.amount),0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ 事業経費 ══ */}
        {tab==="biz" && (
          <div style={S.card}>
            <h2 style={S.cardTitle}>事業経費</h2>
            <div style={S.navRow}>
              <button style={S.arrowBtn} onClick={()=>{ if(bzMonth===1){setBzMonth(12);setBzYear(y=>y-1);}else setBzMonth(m=>m-1); }}>◀</button>
              <span style={{fontWeight:600,fontSize:15}}>{bzYear}年 {bzMonth}月</span>
              <button style={S.arrowBtn} onClick={()=>{ if(bzMonth===12){setBzMonth(1);setBzYear(y=>y+1);}else setBzMonth(m=>m+1); }}>▶</button>
            </div>
            <div style={{...S.summaryBox,borderColor:"#b2e0d0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
                <span style={{fontSize:11,fontWeight:600,color:"#888",letterSpacing:1,textTransform:"uppercase"}}>月間事業経費合計</span>
                <span style={{fontSize:26,fontWeight:700,color:"#3aaa82"}}>{fmtYen(bzMTotal)}</span>
              </div>
              {bzMTotal>0 && (
                <div style={{height:10,borderRadius:10,overflow:"hidden",background:"#eeeee9",display:"flex"}}>
                  {bzUsed.map(c=><div key={c} style={{width:(bzTotals[c]/bzMTotal*100)+"%",background:bizCatColors[c],height:"100%"}} />)}
                </div>
              )}
              {bzMTotal===0 && <p style={{textAlign:"center",color:"#bbb",padding:"24px 0",fontSize:14}}>この月の事業経費はありません</p>}
            </div>
            {bzYRecs.length>0 && (
              <div style={{overflowX:"auto",borderRadius:10,border:"1px solid #eeeee9",marginTop:8}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr>
                      <th style={{...S.th,...S.thFix}}>月</th>
                      {bzYUsed.map(c=><th key={c} style={S.th}><span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:bizCatColors[c],marginRight:4,verticalAlign:"middle"}} />{c}</th>)}
                      <th style={{...S.th,background:"#f0f0ec",color:"#333"}}>合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHS.map((ml,mi)=>{
                      const m=mi+1;
                      const tot=Object.values(bzByM[m]).reduce((a,b)=>a+b,0);
                      const isCur=bzYear===new Date().getFullYear()&&m===new Date().getMonth()+1;
                      return (
                        <tr key={m} style={{...(mi%2===0?{background:"#fff"}:{background:"#fdfdfb"}),...(isCur?{background:"#eef4fb"}:{})}}>
                          <td style={{...S.td,...S.thFix,fontWeight:600,background:isCur?"#eef4fb":mi%2===0?"#fff":"#fdfdfb"}}>{ml}{isCur&&<span style={{marginLeft:6,fontSize:10,background:"#4f7cac",color:"#fff",borderRadius:4,padding:"1px 5px"}}>今月</span>}</td>
                          {bzYUsed.map(c=><td key={c} style={S.td}>{bzByM[m][c]?fmtYen(bzByM[m][c]):<span style={{color:"#d0d0cb"}}>—</span>}</td>)}
                          <td style={{...S.td,fontWeight:600,background:"#fafaf8"}}>{tot>0?fmtYen(tot):<span style={{color:"#d0d0cb"}}>—</span>}</td>
                        </tr>
                      );
                    })}
                    <tr style={{background:"#f5f5f0",borderTop:"2px solid #e0e0da"}}>
                      <td style={{...S.td,...S.thFix,fontWeight:700,background:"#f5f5f0"}}>年計</td>
                      {bzYUsed.map(c=>{const s=bzYRecs.filter(r=>(r.bizCategory||r.category)===c).reduce((a,r)=>a+Number(r.amount),0);return<td key={c} style={{...S.td,fontWeight:700}}>{fmtYen(s)}</td>;})}
                      <td style={{...S.td,fontWeight:700,background:"#f0f0ec"}}>{fmtYen(bzYRecs.reduce((s,r)=>s+Number(r.amount),0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <div style={{marginTop:20,borderTop:"1px solid #f0f0ec",paddingTop:16}}>
              <div style={{display:"flex",gap:8}}>
                <button style={{...S.primaryBtn,flex:1,marginTop:0,background:"#3aaa82",fontSize:13}} onClick={()=>setEditBizCat(true)}>カテゴリーを編集</button>
                <button style={{...S.primaryBtn,flex:1,marginTop:0,background:"#5c9e7a",fontSize:13}} onClick={()=>setEditBizP(true)}>支払い先を編集</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ 固定費 ══ */}
        {tab==="fixed" && (
          <div style={S.card}>
            <h2 style={S.cardTitle}>固定費候補</h2>
            <div style={S.summaryBox}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                <span style={{fontSize:11,fontWeight:600,color:"#888",letterSpacing:1,textTransform:"uppercase"}}>月間固定費合計</span>
                <span style={{fontSize:26,fontWeight:700}}>{fmtYen(fixTotal)}</span>
              </div>
            </div>
            {fixed.length===0 ? <p style={{textAlign:"center",color:"#bbb",padding:"32px 0",fontSize:14}}>固定費候補がありません</p> : (
              <div>
                <p style={{fontSize:12,color:"#aaa",marginBottom:12}}>記録したいものを選んで「記録する」を押してください</p>
                {fixed.map(f=>{
                  const isRec=records.some(r=>r.date.startsWith(vYear+"-"+pad(vMonth))&&r.memo===f.name&&r.isFixed);
                  return (
                    <FixedCandidateRow key={f.id} item={f} catColors={catColors} isRecorded={isRec} viewYear={vYear} viewMonth={vMonth}
                      onRecord={(item,amount,date)=>{
                        const rec={id:Date.now(),isFixed:true,isBiz:false,date,amount:Number(amount),category:item.category,bizCategory:item.bizCategory||"",payee:item.payee||"",memo:item.name};
                        setRecords(p=>[...p,rec]);
                        showToast(item.name+" を記録しました ✓");
                        sync({action:"addRecord",record:rec});
                      }} />
                  );
                })}
              </div>
            )}
            <button style={{...S.primaryBtn,marginTop:16}} onClick={()=>setEditFixed(true)}>固定費を編集する</button>
            <div style={{marginTop:14,borderTop:"1px solid #f0f0ec",paddingTop:14}}>
              <p style={{fontSize:13,color:"#666",marginBottom:10}}>今月（{new Date().getFullYear()}年{new Date().getMonth()+1}月）に一括記録：</p>
              <button style={{...S.primaryBtn,background:"#4f7cac",marginTop:0}} onClick={applyFixed} disabled={fixed.length===0}>今月の固定費を記録する</button>
            </div>
          </div>
        )}

      </main>

      {tab==="input" && <button style={S.fab} onClick={()=>setTab("fixed")}>固定費</button>}

      {editCat    && <TagEditor title="カテゴリーの編集" items={cats}    onSave={l=>{setCats(l);saveSetting("categories",l);}}     onClose={()=>setEditCat(false)} />}
      {editBizCat && <TagEditor title="事業カテゴリーの編集" items={bizCats} onSave={l=>{setBizCats(l);saveSetting("bizCategories",l);}} onClose={()=>setEditBizCat(false)} />}
      {editCatP   && <CatPayeeEditor cats={cats}    payees={catPayees} onSave={m=>{setCatPayees(m);saveSetting("catPayees",m);}}   onClose={()=>setEditCatP(false)} />}
      {editBizP   && <CatPayeeEditor cats={bizCats} payees={bizPayees} onSave={m=>{setBizPayees(m);saveSetting("bizCatPayees",m);}} onClose={()=>setEditBizP(false)} />}
      {editFixed  && <FixedEditor fixed={fixed} cats={cats} catColors={catColors} onSave={l=>{setFixed(l);saveSetting("fixedCosts",l);}} onClose={()=>setEditFixed(false)} />}
      {editRec    && <EditModal rec={editRec} cats={cats} catColors={catColors} bizCats={bizCats} bizCatColors={bizCatColors} catPayees={catPayees} onSave={updRecord} onClose={()=>setEditRec(null)} />}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  app:       { fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif", background:"#f7f7f5", minHeight:"100vh", color:"#1a1a1a" },
  header:    { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"#fff", borderBottom:"1px solid #e8e8e5", position:"sticky", top:0, zIndex:100, gap:6, flexWrap:"wrap" },
  logo:      { fontSize:16, fontWeight:700, letterSpacing:2 },
  sync:      { fontSize:11, color:"#4f7cac", background:"#eef4fb", borderRadius:10, padding:"2px 8px" },
  nav:       { display:"flex", gap:2, flexWrap:"wrap" },
  navBtn:    { padding:"5px 8px", border:"none", background:"transparent", borderRadius:20, fontSize:11, cursor:"pointer", color:"#555", fontFamily:"inherit" },
  navOn:     { background:"#1a1a1a", color:"#fff" },
  refreshBtn:{ background:"none", border:"1px solid #e0e0dc", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:16, color:"#666" },
  main:      { maxWidth:900, margin:"0 auto", padding:"16px 12px 100px", overflowX:"hidden" },
  card:      { background:"#fff", borderRadius:16, padding:"20px 16px", boxShadow:"0 1px 4px rgba(0,0,0,.06)", overflow:"hidden" },
  cardTitle: { fontSize:18, fontWeight:700, marginBottom:16, textAlign:"center" },
  navRow:    { display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginBottom:16 },
  arrowBtn:  { background:"none", border:"1px solid #e0e0dc", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:14 },
  summaryBox:{ background:"#fafaf8", borderRadius:12, padding:"16px", marginBottom:16, border:"1px solid #eeeee9" },
  label:     { display:"block", fontSize:11, fontWeight:600, color:"#888", letterSpacing:1, textTransform:"uppercase", marginBottom:5, marginTop:12 },
  rowLabel:  { display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12, marginBottom:5 },
  editLink:  { fontSize:12, color:"#4f7cac", background:"none", border:"none", cursor:"pointer", padding:0 },
  inp:       { width:"100%", boxSizing:"border-box", padding:"10px 12px", border:"1px solid #e0e0dc", borderRadius:10, fontSize:15, outline:"none", fontFamily:"inherit", background:"#fafaf8" },
  chips:     { display:"flex", flexWrap:"wrap", gap:6 },
  chip:      { padding:"6px 13px", border:"1px solid #ddd", borderRadius:20, fontSize:13, background:"#fafaf8", cursor:"pointer", fontFamily:"inherit", transition:"all .15s" },
  primaryBtn:{ marginTop:10, width:"100%", padding:"14px", background:"#1a1a1a", color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
  secTitle:  { fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:1, textTransform:"uppercase", marginBottom:10 },
  th:        { padding:"9px 10px", background:"#fafaf8", fontWeight:600, fontSize:12, color:"#666", borderBottom:"2px solid #e8e8e3", textAlign:"right", whiteSpace:"nowrap", position:"sticky", top:0, zIndex:3, boxShadow:"0 1px 0 #e8e8e3" },
  thFix:     { textAlign:"left", position:"sticky", left:0, zIndex:4, background:"#fafaf8", minWidth:72, boxShadow:"2px 0 4px rgba(0,0,0,.04)" },
  td:        { padding:"8px 10px", textAlign:"right", borderBottom:"1px solid #f2f2ee", fontSize:13, color:"#333", whiteSpace:"nowrap" },
  fab:       { position:"fixed", bottom:28, right:20, padding:"12px 20px", background:"#4f7cac", color:"#fff", border:"none", borderRadius:28, fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(79,124,172,.4)", zIndex:150, fontFamily:"inherit" },
  toast:     { position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", background:"#1a1a1a", color:"#fff", padding:"10px 22px", borderRadius:30, fontSize:13, zIndex:300, whiteSpace:"nowrap", boxShadow:"0 4px 12px rgba(0,0,0,.2)" },
};

// Modal styles
const M = {
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 },
  modal:   { background:"#fff", borderRadius:16, padding:24, width:"100%", maxWidth:440, maxHeight:"85vh", overflowY:"auto" },
  mTitle:  { fontSize:16, fontWeight:700, marginBottom:16 },
  label:   { display:"block", fontSize:11, fontWeight:600, color:"#888", letterSpacing:1, textTransform:"uppercase", marginBottom:5, marginTop:10 },
  inp:     { padding:"8px 12px", border:"1px solid #e0e0dc", borderRadius:8, fontSize:14, outline:"none", fontFamily:"inherit", background:"#fafaf8", boxSizing:"border-box" },
  chip:    { padding:"6px 13px", border:"1px solid #ddd", borderRadius:20, fontSize:13, background:"#fafaf8", cursor:"pointer", fontFamily:"inherit", transition:"all .15s" },
  tag:     { display:"flex", alignItems:"center", gap:4, padding:"4px 10px", background:"#f0f0ec", borderRadius:20, fontSize:13 },
  btns:    { display:"flex", gap:8, justifyContent:"flex-end", marginTop:4 },
  cancel:  { padding:"8px 16px", background:"#f0f0ec", border:"none", borderRadius:8, cursor:"pointer", fontSize:14, fontFamily:"inherit" },
  save:    { padding:"8px 20px", background:"#1a1a1a", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:14, fontFamily:"inherit" },
  addBtn:  { padding:"8px 16px", background:"#1a1a1a", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:14, fontFamily:"inherit", whiteSpace:"nowrap" },
  xBtn:    { background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:14, padding:0, lineHeight:1 },
  sortBtn: { background:"none", border:"1px solid #ddd", borderRadius:6, cursor:"pointer", color:"#888", fontSize:12, padding:"2px 7px", fontFamily:"inherit", lineHeight:1.4 },
  catTab:  { padding:"4px 10px", border:"1px solid #ddd", borderRadius:16, fontSize:12, cursor:"pointer", background:"#fafaf8", fontFamily:"inherit", color:"#666" },
  catTabOn:{ background:"#1a1a1a", color:"#fff", borderColor:"#1a1a1a" },
};
