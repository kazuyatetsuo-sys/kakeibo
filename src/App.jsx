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

const cycleSort = day => day>=19 ? day : day+31;
const pad = n => String(n).padStart(2,"0");
const fmtYen = n => "¥" + Number(n).toLocaleString();
const todayStr = () => { const d=new Date(); return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); };
const normDate = d => { if(!d) return ""; const s=String(d); if(s.includes("T")||s.includes("Z")){ const dt=new Date(s); return dt.getFullYear()+"-"+pad(dt.getMonth()+1)+"-"+pad(dt.getDate()); } return s.slice(0,10); };
const gasPost = async body => {
  if(!GAS_URL) return {ok:false};
  const r = await fetch(GAS_URL,{method:"POST",body:JSON.stringify(body)});
  if(!r.ok) throw new Error("HTTP "+r.status);
  const res = await r.json();
  if(!res || res.ok===false) throw new Error((res&&res.error)||"保存に失敗しました");
  return res;
};

const PENDING_KEY = "kakeibo_pending_ops";
const loadPendingOps = () => { try { return JSON.parse(localStorage.getItem(PENDING_KEY)||"[]"); } catch(e) { return []; } };
const savePendingOps = ops => { try { localStorage.setItem(PENDING_KEY, JSON.stringify(ops)); } catch(e) {} };

// ── TagEditor ─────────────────────────────────────────────────────────────────
function TagEditor({ title, items, onSave, onClose }) {
  const [list, setList] = useState(items.map(v=>({orig:v,val:v})));
  const [inp, setInp] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const add = () => { const v=inp.trim(); if(v&&!list.some(x=>x.val===v)){setList([...list,{orig:null,val:v}]);setInp("");} };
  const up = i => { if(i===0) return; const l=[...list]; [l[i-1],l[i]]=[l[i],l[i-1]]; setList(l); };
  const dn = i => { if(i===list.length-1) return; const l=[...list]; [l[i],l[i+1]]=[l[i+1],l[i]]; setList(l); };
  const startEdit = i => { setEditIdx(i); setEditVal(list[i].val); };
  const commitEdit = () => {
    const v = editVal.trim();
    if(v && editIdx!==null && !list.some((x,j)=>j!==editIdx&&x.val===v)){
      setList(l=>l.map((x,j)=>j===editIdx?{...x,val:v}:x));
    }
    setEditIdx(null);
  };
  const save = () => {
    const renames = list.filter(x=>x.orig && x.orig!==x.val).map(x=>({oldName:x.orig,newName:x.val}));
    onSave(list.map(x=>x.val), renames);
    onClose();
  };
  return (
    <div style={M.overlay}>
      <div style={M.modal}>
        <h3 style={M.mTitle}>{title}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14}}>
          {list.map((item,i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"var(--surface-alt)",borderRadius:8}}>
              {editIdx===i ? (
                <input autoFocus style={{...M.inp,flex:1,padding:"4px 8px"}} value={editVal}
                  onChange={e=>setEditVal(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")commitEdit(); if(e.key==="Escape")setEditIdx(null);}}
                  onBlur={commitEdit} />
              ) : (
                <span style={{flex:1,fontSize:14}}>{item.val}</span>
              )}
              <button style={M.sortBtn} onClick={()=>startEdit(i)}>✎</button>
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
          <button style={M.save} onClick={save}>保存</button>
        </div>
      </div>
    </div>
  );
}

// ── CatPayeeEditor ────────────────────────────────────────────────────────────
function CatPayeeEditor({ cats, payees, onSave, onClose }) {
  const [map, setMap] = useState(()=>{ const m={}; cats.forEach(c=>{m[c]=(payees[c]||[]).map(v=>({orig:v,val:v}))}); return m; });
  const [sel, setSel] = useState(cats[0]||"");
  const [inp, setInp] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const add = () => { const v=inp.trim(); if(v&&sel&&!(map[sel]||[]).some(x=>x.val===v)){setMap(m=>({...m,[sel]:[...(m[sel]||[]),{orig:null,val:v}]}));setInp("");} };
  const startEdit = i => { setEditIdx(i); setEditVal(map[sel][i].val); };
  const commitEdit = () => {
    const v = editVal.trim();
    if(v && editIdx!==null && !(map[sel]||[]).some((x,j)=>j!==editIdx&&x.val===v)){
      setMap(m=>({...m,[sel]:m[sel].map((x,j)=>j===editIdx?{...x,val:v}:x)}));
    }
    setEditIdx(null);
  };
  const save = () => {
    const renames = [];
    const outMap = {};
    Object.keys(map).forEach(c=>{
      outMap[c] = map[c].map(x=>x.val);
      map[c].forEach(x=>{ if(x.orig && x.orig!==x.val) renames.push({oldName:x.orig,newName:x.val}); });
    });
    onSave(outMap, renames);
    onClose();
  };
  return (
    <div style={M.overlay}>
      <div style={{...M.modal,maxWidth:520}}>
        <h3 style={M.mTitle}>支払い先の編集</h3>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:12}}>
          {cats.map(c => <button key={c} style={{...M.catTab,...(sel===c?M.catTabOn:{})}} onClick={()=>{setSel(c);setEditIdx(null);}}>{c}</button>)}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12,minHeight:32}}>
          {(map[sel]||[]).map((p,i) => (
            editIdx===i ? (
              <input key={i} autoFocus style={{...M.inp,padding:"4px 8px",width:120}} value={editVal}
                onChange={e=>setEditVal(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")commitEdit(); if(e.key==="Escape")setEditIdx(null);}}
                onBlur={commitEdit} />
            ) : (
              <span key={i} style={M.tag}>
                <span style={{cursor:"pointer"}} onClick={()=>startEdit(i)}>{p.val}</span>
                <button style={M.xBtn} onClick={()=>setMap(m=>({...m,[sel]:m[sel].filter((_,j)=>j!==i)}))}>×</button>
              </span>
            )
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <input style={M.inp} value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder={"支払い先を追加"} />
          <button style={M.addBtn} onClick={add}>追加</button>
        </div>
        <div style={M.btns}>
          <button style={M.cancel} onClick={onClose}>キャンセル</button>
          <button style={M.save} onClick={save}>保存</button>
        </div>
      </div>
    </div>
  );
}

// ── AddFixedModal: 固定費新規追加 ────────────────────────────────────────────
function AddFixedModal({ cats, catColors, catPayees, bizCats, bizCatColors, onAdd, onClose }) {
  const [f, setF] = useState({name:"",amount:"",category:"",bizCategory:"",payee:"",memo:"",day:1,isBiz:false});
  const payeesToShow = f.category ? (catPayees[f.category]||[]) : [];
  const add = () => {
    if(!f.name||!f.amount||!f.category){ return; }
    onAdd({id:Date.now(),...f,amount:Number(f.amount)});
    onClose();
  };
  return (
    <div style={M.overlay}>
      <div style={{...M.modal,maxWidth:480,maxHeight:"90vh",overflowY:"auto"}}>
        <h3 style={M.mTitle}>固定費を追加</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <input style={M.inp} placeholder="名称（例：家賃）" value={f.name} onChange={e=>setF(v=>({...v,name:e.target.value}))} />
          <input style={M.inp} type="number" placeholder="金額" value={f.amount} onChange={e=>setF(v=>({...v,amount:e.target.value}))} />
          <select style={M.inp} value={f.day} onChange={e=>setF(v=>({...v,day:Number(e.target.value)}))}>
            {Array.from({length:28},(_,i)=>i+1).map(d=><option key={d} value={d}>{d}日</option>)}
          </select>
        </div>
        <label style={{...M.label,marginTop:0}}>カテゴリー</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
          {cats.map(c=><button key={c} style={{...M.chip,...(f.category===c?{background:catColors[c],color:"#fff",borderColor:catColors[c]}:{})}} onClick={()=>setF(v=>({...v,category:c,payee:""}))}>{c}</button>)}
        </div>
        {payeesToShow.length>0 && (
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
            {payeesToShow.map(p=><button key={p} style={{...M.chip,...(f.payee===p?{background:"var(--ink-bg)",color:"#fff",borderColor:"var(--ink-bg)"}:{})}} onClick={()=>setF(v=>({...v,payee:p}))}>{p}</button>)}
          </div>
        )}
        <input style={{...M.inp,width:"100%",boxSizing:"border-box",marginBottom:6}} placeholder="支払い先" value={f.payee} onChange={e=>setF(v=>({...v,payee:e.target.value}))} />
        <input style={{...M.inp,width:"100%",boxSizing:"border-box",marginBottom:8}} placeholder="メモ（任意）" value={f.memo} onChange={e=>setF(v=>({...v,memo:e.target.value}))} />
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:"var(--surface-alt)",borderRadius:10,border:"1px solid var(--border)",cursor:"pointer",marginBottom:8}} onClick={()=>setF(v=>({...v,isBiz:!v.isBiz,bizCategory:""}))}>
          <span style={{fontSize:13,color:"var(--text-tertiary)"}}>事業経費</span>
          <div style={{width:36,height:22,borderRadius:11,background:f.isBiz?"#3aaa82":"var(--border-strong)",position:"relative",flexShrink:0}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:"var(--surface)",position:"absolute",top:2,left:f.isBiz?16:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}} />
          </div>
        </div>
        {f.isBiz && (
          <div style={{background:"var(--tint-green)",borderRadius:10,padding:10,border:"1px solid #b2e0d0",marginBottom:8}}>
            <label style={{...M.label,marginTop:0,color:"#3aaa82"}}>事業カテゴリー</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {bizCats.map(c=><button key={c} style={{...M.chip,...(f.bizCategory===c?{background:bizCatColors[c],color:"#fff",borderColor:bizCatColors[c]}:{borderColor:"#6dbf9e",color:"#3aaa82"})}} onClick={()=>setF(v=>({...v,bizCategory:v.bizCategory===c?"":c}))}>{c}</button>)}
            </div>
          </div>
        )}
        <div style={{...M.btns,marginTop:14}}>
          <button style={M.cancel} onClick={onClose}>キャンセル</button>
          <button style={M.save} onClick={add}>追加</button>
        </div>
      </div>
    </div>
  );
}

// ── FixedEditor ───────────────────────────────────────────────────────────────
function FixedEditor({ fixed, cats, catColors, catPayees, bizCats, bizCatColors, bizPayees, onSave, onClose }) {
  const [list, setList] = useState(fixed.map(f=>({...f})));
  const [editIdx, setEditIdx] = useState(null);
  const upd = (i,patch) => setList(list.map((x,j)=>j===i?{...x,...patch}:x));
  return (
    <div style={M.overlay}>
      <div style={{...M.modal,maxWidth:520,maxHeight:"90vh",overflowY:"auto"}}>
        <h3 style={M.mTitle}>固定費の管理</h3>
        {list.length===0 && <p style={{color:"var(--text-subtle)",fontSize:13,textAlign:"center",padding:"16px 0"}}>固定費がありません</p>}
        {list.map((item,i) => (
          <div key={item.id}>
            {editIdx===i ? (
              <div style={{padding:"12px",background:"var(--surface-alt)",borderRadius:10,marginBottom:8,border:"1px solid var(--border)"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <input style={M.inp} placeholder="名称" value={item.name} onChange={e=>upd(i,{name:e.target.value})} />
                  <input style={M.inp} type="number" placeholder="金額" value={item.amount} onChange={e=>upd(i,{amount:e.target.value})} />
                  <select style={M.inp} value={item.day} onChange={e=>upd(i,{day:Number(e.target.value)})}>
                    {Array.from({length:28},(_,k)=>k+1).map(d=><option key={d} value={d}>{d}日</option>)}
                  </select>
                </div>
                <label style={{...M.label,marginTop:0}}>カテゴリー</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                  {cats.map(c=><button key={c} style={{...M.chip,...(item.category===c?{background:catColors[c],color:"#fff",borderColor:catColors[c]}:{})}} onClick={()=>upd(i,{category:c,payee:""})}>{c}</button>)}
                </div>
                {(catPayees[item.category]||[]).length>0 && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                    {(catPayees[item.category]||[]).map(p=><button key={p} style={{...M.chip,...(item.payee===p?{background:"var(--ink-bg)",color:"#fff",borderColor:"var(--ink-bg)"}:{})}} onClick={()=>upd(i,{payee:p})}>{p}</button>)}
                  </div>
                )}
                <input style={{...M.inp,width:"100%",boxSizing:"border-box",marginBottom:6}} placeholder="支払い先" value={item.payee||""} onChange={e=>upd(i,{payee:e.target.value})} />
                <input style={{...M.inp,width:"100%",boxSizing:"border-box",marginBottom:8}} placeholder="メモ" value={item.memo||""} onChange={e=>upd(i,{memo:e.target.value})} />
                {/* 事業経費トグル */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:"var(--surface)",borderRadius:10,border:"1px solid var(--border)",cursor:"pointer",marginBottom:8}} onClick={()=>upd(i,{isBiz:!item.isBiz,bizCategory:""})}>
                  <span style={{fontSize:13,color:"var(--text-tertiary)"}}>事業経費</span>
                  <div style={{width:36,height:22,borderRadius:11,background:item.isBiz?"#3aaa82":"var(--border-strong)",position:"relative",flexShrink:0,transition:"background .2s"}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:"var(--surface)",position:"absolute",top:2,left:item.isBiz?16:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}} />
                  </div>
                </div>
                {item.isBiz && (
                  <div style={{background:"var(--tint-green)",borderRadius:10,padding:10,border:"1px solid #b2e0d0",marginBottom:8}}>
                    <label style={{...M.label,marginTop:0,color:"#3aaa82"}}>事業カテゴリー</label>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {bizCats.map(c=><button key={c} style={{...M.chip,...(item.bizCategory===c?{background:bizCatColors[c],color:"#fff",borderColor:bizCatColors[c]}:{borderColor:"#6dbf9e",color:"#3aaa82"})}} onClick={()=>upd(i,{bizCategory:item.bizCategory===c?"":c})}>{c}</button>)}
                    </div>
                  </div>
                )}
                <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                  <button style={M.cancel} onClick={()=>setEditIdx(null)}>完了</button>
                </div>
              </div>
            ) : (
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                <span style={{width:10,height:10,borderRadius:"50%",background:catColors[item.category]||"var(--text-subtle)",display:"inline-block",flexShrink:0}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600}}>{item.name}</div>
                  <div style={{fontSize:11,color:"var(--text-subtle)",marginTop:2}}>
                    {item.category}
                    {item.isBiz&&item.bizCategory&&<span style={{marginLeft:4,color:"#3aaa82"}}>{item.bizCategory}</span>}
                    {item.payee?" · "+item.payee:""} · 毎月{item.day}日
                    {item.isBiz&&<span style={{marginLeft:4,fontSize:10,background:"var(--tint-green)",color:"#3aaa82",borderRadius:4,padding:"1px 5px"}}>事業経費</span>}
                  </div>
                </div>
                <span style={{fontSize:14,fontWeight:700}}>{fmtYen(item.amount)}</span>
                <button style={{background:"none",border:"1px solid var(--border)",borderRadius:6,color:"var(--text-faint)",cursor:"pointer",fontSize:11,padding:"2px 7px"}} onClick={()=>setEditIdx(i)}>編集</button>
                <button style={M.xBtn} onClick={()=>setList(list.filter((_,j)=>j!==i))}>×</button>
              </div>
            )}
          </div>
        ))}
        <div style={{...M.btns,marginTop:16}}>
          <button style={M.cancel} onClick={onClose}>キャンセル</button>
          <button style={M.save} onClick={()=>{onSave(list);onClose();}}>保存</button>
        </div>
      </div>
    </div>
  );
}

// ── PatternModal ──────────────────────────────────────────────────────────────
function PatternModal({ idx, pattern, cats, catColors, catPayees, bizCats, bizCatColors, onSave, onDelete, onClose }) {
  const empty = {label:"",amount:"",category:"",payee:"",isBiz:false,bizCategory:"",memo:""};
  const [f, setF] = useState(pattern ? {...pattern,amount:String(pattern.amount)} : empty);
  const payeesToShow = f.category ? (catPayees[f.category]||[]) : [];
  const save = () => {
    if(!f.label||!f.category) return;
    onSave(idx,{...f,amount:f.amount!==""?Number(f.amount):""});
    onClose();
  };
  return (
    <div style={M.overlay}>
      <div style={{...M.modal,maxHeight:"90vh",overflowY:"auto"}}>
        <h3 style={M.mTitle}>パターン {idx+1} を設定</h3>
        <label style={M.label}>ボタンのラベル（絵文字など）</label>
        <input style={{...M.inp,width:"100%",boxSizing:"border-box",marginBottom:8}} placeholder="例: ☕ や コンビニ" value={f.label} onChange={e=>setF(v=>({...v,label:e.target.value}))} />
        <label style={M.label}>金額（円）</label>
        <input style={{...M.inp,width:"100%",boxSizing:"border-box",textAlign:"right",fontWeight:700,fontSize:18,marginBottom:4}} type="number" value={f.amount} onChange={e=>setF(v=>({...v,amount:e.target.value}))} />
        <label style={M.label}>カテゴリー</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
          {cats.map(c=><button key={c} style={{...M.chip,...(f.category===c?{background:catColors[c],color:"#fff",borderColor:catColors[c]}:{})}} onClick={()=>setF(v=>({...v,category:c,payee:""}))}>{c}</button>)}
        </div>
        {payeesToShow.length>0 && (
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:6}}>
            {payeesToShow.map(p=><button key={p} style={{...M.chip,...(f.payee===p?{background:"var(--ink-bg)",color:"#fff",borderColor:"var(--ink-bg)"}:{})}} onClick={()=>setF(v=>({...v,payee:p}))}>{p}</button>)}
          </div>
        )}
        <input style={{...M.inp,width:"100%",boxSizing:"border-box",marginBottom:8}} placeholder="支払い先（直接入力）" value={f.payee} onChange={e=>setF(v=>({...v,payee:e.target.value}))} />
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:"var(--surface-alt)",borderRadius:10,border:"1px solid var(--border)",cursor:"pointer",marginBottom:8}} onClick={()=>setF(v=>({...v,isBiz:!v.isBiz,bizCategory:""}))}>
          <span style={{fontSize:13,color:"var(--text-tertiary)"}}>事業経費</span>
          <div style={{width:36,height:22,borderRadius:11,background:f.isBiz?"#3aaa82":"var(--border-strong)",position:"relative",flexShrink:0,transition:"background .2s"}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:"var(--surface)",position:"absolute",top:2,left:f.isBiz?16:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}} />
          </div>
        </div>
        {f.isBiz && (
          <div style={{background:"var(--tint-green)",borderRadius:10,padding:12,border:"1px solid #b2e0d0",marginBottom:8}}>
            <label style={{...M.label,color:"#3aaa82",marginTop:0}}>事業カテゴリー</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {bizCats.map(c=><button key={c} style={{...M.chip,...(f.bizCategory===c?{background:bizCatColors[c],color:"#fff",borderColor:bizCatColors[c]}:{borderColor:"#6dbf9e",color:"#3aaa82"})}} onClick={()=>setF(v=>({...v,bizCategory:v.bizCategory===c?"":c}))}>{c}</button>)}
            </div>
          </div>
        )}
        <label style={M.label}>メモ</label>
        <input style={{...M.inp,width:"100%",boxSizing:"border-box"}} placeholder="メモ（任意）" value={f.memo} onChange={e=>setF(v=>({...v,memo:e.target.value}))} />
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:16}}>
          {pattern
            ? <button style={{padding:"8px 16px",background:"none",border:"1px solid #e07a5f",borderRadius:8,cursor:"pointer",fontSize:13,color:"#e07a5f",fontFamily:"inherit"}} onClick={()=>{onDelete(idx);onClose();}}>削除</button>
            : <span />}
          <div style={{display:"flex",gap:8}}>
            <button style={M.cancel} onClick={onClose}>キャンセル</button>
            <button style={M.save} onClick={save}>保存</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EditModal ─────────────────────────────────────────────────────────────────
function EditModal({ rec, cats, catColors, bizCats, bizCatColors, catPayees, onSave, onClose }) {
  const [r, setR] = useState({...rec});
  const payees = r.category ? (catPayees[r.category]||[]) : [];
  useEffect(()=>{
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onSave({...r,amount:Number(r.amount)});
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [r, onSave]);
  return (
    <div style={M.overlay}>
      <div style={{...M.modal,maxHeight:"90vh",overflowY:"auto"}}>
        <h3 style={M.mTitle}>記録を編集</h3>
        <div style={{marginBottom:8}}>
          <label style={M.label}>日付</label>
          <input type="date" value={r.date} onChange={e=>setR(v=>({...v,date:e.target.value}))} style={{...M.inp,width:"100%",boxSizing:"border-box",fontSize:16}} />
        </div>
        <div style={{marginBottom:4}}>
          <label style={M.label}>金額（円）</label>
          <input style={{...M.inp,width:"100%",boxSizing:"border-box",textAlign:"right",fontWeight:700,fontSize:18}} type="number" value={r.amount} onChange={e=>setR(v=>({...v,amount:e.target.value}))} />
        </div>
        <label style={M.label}>カテゴリー</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
          {cats.map(c => <button key={c} style={{...M.chip,...(r.category===c?{background:catColors[c],color:"#fff",borderColor:catColors[c]}:{})}} onClick={()=>setR(v=>({...v,category:c,payee:""}))}>{c}</button>)}
        </div>
        {payees.length>0 && (
          <div>
            <label style={M.label}>支払い先</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:6}}>
              {payees.map(p => <button key={p} style={{...M.chip,...(r.payee===p?{background:"var(--ink-bg)",color:"#fff",borderColor:"var(--ink-bg)"}:{})}} onClick={()=>setR(v=>({...v,payee:p}))}>{p}</button>)}
            </div>
          </div>
        )}
        <input style={{...M.inp,width:"100%",boxSizing:"border-box",marginBottom:4}} placeholder="支払い先を直接入力" value={r.payee||""} onChange={e=>setR(v=>({...v,payee:e.target.value}))} />
        <div style={{margin:"10px 0"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:"var(--surface-alt)",borderRadius:10,border:"1px solid var(--border)",cursor:"pointer"}} onClick={()=>setR(v=>({...v,isBiz:!v.isBiz,bizCategory:v.isBiz?"":v.bizCategory}))}>
            <span style={{fontSize:13,color:"var(--text-secondary)"}}>事業経費</span>
            <div style={{width:36,height:22,borderRadius:11,background:r.isBiz?"#3aaa82":"var(--border-strong)",position:"relative",flexShrink:0}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:"var(--surface)",position:"absolute",top:2,left:r.isBiz?16:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}} />
            </div>
          </div>
        </div>
        {r.isBiz && (
          <div style={{background:"var(--tint-green)",borderRadius:10,padding:12,border:"1px solid #b2e0d0",marginBottom:8}}>
            <label style={{...M.label,color:"#3aaa82",marginTop:0}}>事業カテゴリー</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {bizCats.map(c => <button key={c} style={{...M.chip,...(r.bizCategory===c?{background:bizCatColors[c],color:"#fff",borderColor:bizCatColors[c]}:{borderColor:"#6dbf9e",color:"#3aaa82"})}} onClick={()=>setR(v=>({...v,bizCategory:v.bizCategory===c?"":c}))}>{c}</button>)}
            </div>
          </div>
        )}
        <label style={M.label}>メモ</label>
        <input style={{...M.inp,width:"100%",boxSizing:"border-box"}} placeholder="メモ" value={r.memo||""} onChange={e=>setR(v=>({...v,memo:e.target.value}))} />
        <div style={{...M.btns,marginTop:16,position:"sticky",bottom:0,background:"var(--surface)",paddingTop:12,paddingBottom:8,marginLeft:-24,marginRight:-24,paddingLeft:24,paddingRight:24,borderTop:"1px solid var(--border)"}}>
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
  // 19日〜18日サイクルに合わせた日付
  const initDate = () => {
    const d = item.day;
    // 1〜18日 → 当月、19〜31日 → 前月（サイクル開始月）
    if(d<=18){
      return viewYear+"-"+pad(viewMonth)+"-"+pad(d);
    } else {
      const pm = viewMonth===1?12:viewMonth-1;
      const py = viewMonth===1?viewYear-1:viewYear;
      return py+"-"+pad(pm)+"-"+pad(d);
    }
  };
  const [date, setDate] = useState(initDate());
  const [open, setOpen] = useState(false);
  return (
    <div style={{border:"1px solid var(--border)",borderRadius:12,marginBottom:8,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px"}}>
        <span style={{width:10,height:10,borderRadius:"50%",background:catColors[item.category]||"var(--text-subtle)",display:"inline-block",flexShrink:0}} />
        <div style={{flex:1}}>
          <div style={{fontWeight:600,fontSize:14}}>{item.name}</div>
          <div style={{fontSize:11,color:"var(--text-subtle)",marginTop:2}}>{item.category}{item.payee?" · "+item.payee:""}</div>
        </div>
        <div style={{fontSize:15,fontWeight:700,marginRight:8}}>{fmtYen(item.amount)}</div>
        {isRecorded
          ? <span style={{fontSize:12,color:"#6dbf9e",fontWeight:600,padding:"4px 10px",border:"1px solid #6dbf9e",borderRadius:20}}>記録済み ✓</span>
          : <button style={{padding:"6px 14px",background:"var(--ink-bg)",color:"#fff",border:"none",borderRadius:20,fontSize:13,fontWeight:600,cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>{open?"閉じる":"記録する"}</button>
        }
      </div>
      {open && !isRecorded && (
        <div style={{background:"var(--surface-alt)",borderTop:"1px solid var(--border)",padding:"12px 14px",display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
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
      <p style={{fontSize:11,fontWeight:700,color:"var(--text-subtle)",letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>当月の記録一覧（{mRecs.length}件）</p>
      {dates.map(date=>{
        const dow = DAYS[new Date(date).getDay()];
        const isSun = new Date(date).getDay()===0;
        const isSat = new Date(date).getDay()===6;
        const dateColor = isSun?"#e07a5f":isSat?"#4f7cac":"var(--text-secondary)";
        const dayTotal = grouped[date].reduce((s,r)=>s+Number(r.amount),0);
        return (
          <div key={date} style={{marginBottom:14,borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
            {/* 日付ヘッダー */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",background:"var(--border)"}}>
              <span style={{fontSize:14,fontWeight:700,color:dateColor}}>
                {date.slice(5).replace("-","/")}
                <span style={{fontSize:12,fontWeight:500,marginLeft:6,opacity:.8}}>{dow}</span>
                {date===today&&<span style={{marginLeft:8,fontSize:10,background:"#4f7cac",color:"#fff",borderRadius:4,padding:"1px 6px"}}>today</span>}
              </span>
              <span style={{fontSize:13,fontWeight:700,color:"var(--text-tertiary)"}}>{fmtYen(dayTotal)}</span>
            </div>
            {/* 各レコード */}
            {grouped[date].map((r,i)=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",background:"var(--surface)",borderBottom:i<grouped[date].length-1?"1px solid var(--border)":"none"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span style={{fontSize:14,fontWeight:500,color:"var(--text-primary)"}}>{r.payee||"—"}</span>
                    {r.isFixed&&<span style={{fontSize:10,background:"var(--border)",color:"var(--text-faint)",borderRadius:4,padding:"1px 6px"}}>固定費</span>}
                    {r.isBiz&&<span style={{fontSize:10,background:"var(--tint-green)",color:"#3aaa82",borderRadius:4,padding:"1px 6px",fontWeight:600}}>事業経費</span>}
                    {r.memo&&<span style={{fontSize:11,color:"var(--text-subtle)"}}>— {r.memo}</span>}
                  </div>
                </div>
                <span style={{fontSize:13,fontWeight:600,flexShrink:0,color:"var(--text-secondary)"}}>{fmtYen(r.amount)}</span>
                <button style={{background:"none",border:"1px solid var(--border)",borderRadius:6,color:"var(--text-subtle)",cursor:"pointer",fontSize:10,padding:"2px 7px",flexShrink:0,fontFamily:"inherit"}} onClick={()=>onEdit(r)}>編集</button>
                <button style={{background:"none",border:"none",color:"var(--border-strong)",cursor:"pointer",fontSize:16,padding:"0 2px",flexShrink:0,lineHeight:1}} onClick={()=>onDelete(r.id)}>×</button>
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
  if(!expandedDate || expandedDate.split("|").length!==3) return null;
  const [epStart, epEnd, epCat] = expandedDate.split("|");
  const isRange = epStart!==epEnd;
  const epRecs = monthRecords.filter(r => { const d=normDate(r.date); return d>=epStart && d<=epEnd && r.category===epCat; });
  if(!epRecs.length) return null;
  const sub = epRecs.reduce((s,r)=>s+Number(r.amount),0);
  const rangeLabel = isRange
    ? epStart.slice(5).replace("-","/")+"〜"+epEnd.slice(5).replace("-","/")
    : epStart.slice(5).replace("-","/")+" "+DAYS[new Date(epStart).getDay()];
  return (
    <div style={{marginTop:8,background:"var(--surface-alt)",borderRadius:10,padding:"14px 16px",border:"1px solid var(--border)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:700,color:"var(--text-tertiary)"}}>{rangeLabel} · {epCat}</span>
        <button style={{background:"none",border:"none",color:"var(--text-subtle)",cursor:"pointer",fontSize:20,padding:"0 2px"}} onClick={onClose}>×</button>
      </div>
      {epRecs.map(r => (
        <div key={r.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:"1px solid var(--border)",fontSize:13}}>
          {isRange && <span style={{color:"var(--text-faint)",fontSize:11,flexShrink:0}}>{normDate(r.date).slice(5).replace("-","/")}</span>}
          <span style={{color:"var(--text-secondary)",fontWeight:500,flexShrink:0}}>{r.payee||"—"}</span>
          {r.memo && <span style={{color:"var(--text-subtle)",flex:1}}>「{r.memo}」</span>}
          {r.isFixed && <span style={{fontSize:10,background:"var(--tint-blue)",color:"#4f7cac",borderRadius:4,padding:"1px 5px",fontWeight:600}}>固定</span>}
          {r.isBiz && <span style={{fontSize:10,background:"var(--tint-green)",color:"#3aaa82",borderRadius:4,padding:"1px 5px",fontWeight:600}}>事業</span>}
          <span style={{fontWeight:700,marginLeft:"auto",flexShrink:0}}>{fmtYen(r.amount)}</span>
          <button style={{background:"none",border:"none",color:"var(--border-strong)",cursor:"pointer",fontSize:16,padding:"0 2px"}} onClick={()=>onDelete(r.id,epRecs.length)}>×</button>
        </div>
      ))}
      {epRecs.length>1 && <div style={{textAlign:"right",fontSize:13,fontWeight:700,marginTop:8,color:"var(--text-secondary)"}}>小計 {fmtYen(sub)}</div>}
    </div>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────────────
function DonutChart({ items, colors, total, size=160, thickness=22, radius=40, onSegClick, activeKey, showLabels=false, labelMinPct=0.06 }) {
  const r = radius, cx = 50, cy = 50;
  const circumference = 2*Math.PI*r;
  let cumulative = 0;
  const labels = [];
  const segments = items.map(it=>{
    const pct = total>0 ? it.value/total : 0;
    const dash = pct*circumference;
    const dashArray = `${dash} ${circumference-dash}`;
    const dashOffset = -cumulative*circumference;
    if(showLabels && pct>=labelMinPct){
      const mid = cumulative + pct/2;
      const theta = 2*Math.PI*mid;
      labels.push({ key:it.key, label:it.label, pct, lx: cx+r*Math.sin(theta), ly: cy-r*Math.cos(theta) });
    }
    cumulative += pct;
    return (
      <circle key={it.key} cx={cx} cy={cy} r={r} fill="none" stroke={colors[it.key]||"var(--border-strong)"} strokeWidth={thickness}
        strokeDasharray={dashArray} strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{cursor:onSegClick?"pointer":"default",opacity:activeKey&&activeKey!==it.key?0.35:1,transition:"opacity .15s"}}
        onClick={onSegClick?()=>onSegClick(it.key):undefined}>
        <title>{it.label}: {fmtYen(it.value)}</title>
      </circle>
    );
  });
  return (
    <div style={{position:"relative",width:size,maxWidth:"100%",aspectRatio:"1 / 1",margin:"0 auto"}}>
      <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",display:"block"}}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={thickness} />
        {segments}
        {labels.map(l=>(
          <text key={l.key} x={l.lx} y={l.ly} textAnchor="middle" fill="#fff" stroke="rgba(0,0,0,.35)" strokeWidth={0.6} paintOrder="stroke" style={{pointerEvents:"none",fontWeight:700}}>
            <tspan x={l.lx} dy="-0.9" fontSize="4.2">{l.label}</tspan>
            <tspan x={l.lx} dy="3.6" fontSize="3.6">{Math.round(l.pct*100)}%</tspan>
          </text>
        ))}
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
        <span style={{fontSize:10,color:"var(--text-faint)",fontWeight:600}}>合計</span>
        <span style={{fontSize:16,fontWeight:700,color:"var(--text-primary)"}}>{fmtYen(total)}</span>
      </div>
    </div>
  );
}

// ── TodayDetailModal ──────────────────────────────────────────────────────────
function TodayDetailModal({ date, records, catColors, onClose }) {
  const dow = DAYS[new Date(date).getDay()];
  const total = records.reduce((s,r)=>s+Number(r.amount),0);
  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={{...M.modal,maxWidth:420}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{...M.mTitle,marginBottom:0}}>{date.slice(5).replace("-","/")} {dow} の内訳</h3>
          <button style={{background:"none",border:"none",color:"var(--text-subtle)",cursor:"pointer",fontSize:20,padding:"0 2px"}} onClick={onClose}>×</button>
        </div>
        {records.length===0 ? (
          <p style={{textAlign:"center",color:"var(--text-subtle)",padding:"20px 0",fontSize:14}}>記録はありません</p>
        ) : (
          <Fragment>
            {records.map(r=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:catColors[r.category]||"var(--text-subtle)",flexShrink:0,display:"inline-block"}} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--text-primary)"}}>{r.payee||"—"}</div>
                  <div style={{fontSize:11,color:"var(--text-faint)",marginTop:2}}>{r.category}{r.memo?" — "+r.memo:""}</div>
                </div>
                <span style={{fontSize:14,fontWeight:700,flexShrink:0}}>{fmtYen(r.amount)}</span>
              </div>
            ))}
            <div style={{textAlign:"right",fontSize:14,fontWeight:700,marginTop:10,color:"var(--text-secondary)"}}>合計 {fmtYen(total)}</div>
          </Fragment>
        )}
      </div>
    </div>
  );
}

// ── BulkRecategorizeModal ────────────────────────────────────────────────────
function BulkRecategorizeModal({ records, cats, catColors, onApply, onClose }) {
  const uncatRecs = records.filter(r=>!cats.includes(r.category));
  const groups = {};
  uncatRecs.forEach(r=>{ const k=r.category||""; (groups[k]=groups[k]||[]).push(r); });
  const groupKeys = Object.keys(groups).sort((a,b)=>groups[b].length-groups[a].length);
  const [selections, setSelections] = useState({});
  const [applied, setApplied] = useState(new Set());

  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={{...M.modal,maxWidth:480,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <h3 style={{...M.mTitle,marginBottom:0}}>未分類の一括編集</h3>
          <button style={{background:"none",border:"none",color:"var(--text-subtle)",cursor:"pointer",fontSize:20,padding:"0 2px"}} onClick={onClose}>×</button>
        </div>
        {groupKeys.length===0 ? (
          <p style={{textAlign:"center",color:"var(--text-subtle)",padding:"20px 0",fontSize:14}}>未分類の記録はありません 🎉</p>
        ) : (
          <Fragment>
            <p style={{fontSize:12,color:"var(--text-faint)",marginBottom:14}}>元のカテゴリー値ごとにグループ化しています。それぞれ正しいカテゴリーを選んで「適用」を押してください（全期間対象）。</p>
            {groupKeys.map(k=>{
              const recs = groups[k];
              const total = recs.reduce((s,r)=>s+Number(r.amount),0);
              const isApplied = applied.has(k);
              return (
                <div key={k} style={{marginBottom:14,padding:"12px 14px",background:isApplied?"var(--tint-green)":"var(--surface-alt)",borderRadius:10,border:"1px solid "+(isApplied?"#b2e0d0":"var(--border)")}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                    <span style={{fontSize:13,fontWeight:700,color:"var(--text-tertiary)"}}>{k===""?"（空欄）":`"${k}"`} <span style={{fontWeight:400,color:"var(--text-faint)"}}>（{recs.length}件）</span></span>
                    <span style={{fontSize:13,fontWeight:700}}>{fmtYen(total)}</span>
                  </div>
                  {isApplied ? (
                    <div style={{fontSize:12,color:"#3aaa82",fontWeight:600}}>✓ 「{selections[k]}」に設定しました</div>
                  ) : (
                    <Fragment>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                        {cats.map(c=><button key={c} style={{...M.chip,...(selections[k]===c?{background:catColors[c],color:"#fff",borderColor:catColors[c]}:{})}} onClick={()=>setSelections(s=>({...s,[k]:c}))}>{c}</button>)}
                      </div>
                      <button style={{...M.save,padding:"6px 16px",fontSize:13,...(!selections[k]?{opacity:.4,cursor:"default"}:{})}} disabled={!selections[k]} onClick={async ()=>{ await onApply(recs.map(r=>r.id),selections[k]); setApplied(a=>new Set([...a,k])); }}>この{recs.length}件を適用</button>
                    </Fragment>
                  )}
                </div>
              );
            })}
          </Fragment>
        )}
      </div>
    </div>
  );
}

// ── WeekDetailModal ───────────────────────────────────────────────────────────
function WeekDetailModal({ monStr, sunStr, records, catColors, onClose }) {
  const total = records.reduce((s,r)=>s+Number(r.amount),0);
  const cats = Array.from(new Set(records.map(r=>r.category).filter(Boolean)));
  const catTotals = {}; cats.forEach(c=>{catTotals[c]=records.filter(r=>r.category===c).reduce((s,r)=>s+Number(r.amount),0);});
  const sorted = cats.slice().sort((a,b)=>catTotals[b]-catTotals[a]);
  const fmtShort = s => s.slice(5).replace("-","/");
  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={{...M.modal,maxWidth:420}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{...M.mTitle,marginBottom:0}}>{fmtShort(monStr)}〜{fmtShort(sunStr)} 今週の内訳</h3>
          <button style={{background:"none",border:"none",color:"var(--text-subtle)",cursor:"pointer",fontSize:20,padding:"0 2px"}} onClick={onClose}>×</button>
        </div>
        {total===0 ? (
          <p style={{textAlign:"center",color:"var(--text-subtle)",padding:"20px 0",fontSize:14}}>記録はありません</p>
        ) : (
          <Fragment>
            <div style={{marginBottom:8}}>
              <DonutChart items={sorted.map(c=>({key:c,label:c,value:catTotals[c]}))} colors={catColors} total={total} />
            </div>
            <div style={{marginTop:10}}>
              {sorted.map(c=>(
                <div key={c} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid var(--border)"}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:catColors[c]||"var(--text-subtle)",flexShrink:0,display:"inline-block"}} />
                  <span style={{fontSize:13,color:"var(--text-tertiary)",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c}</span>
                  <span style={{fontSize:13,fontWeight:700,color:"var(--text-secondary)",flexShrink:0}}>{fmtYen(catTotals[c])}</span>
                </div>
              ))}
            </div>
            <div style={{textAlign:"right",fontSize:14,fontWeight:700,marginTop:10,color:"var(--text-secondary)"}}>合計 {fmtYen(total)}</div>
          </Fragment>
        )}
      </div>
    </div>
  );
}

// ── MonthCategoryModal ───────────────────────────────────────────────────────
function MonthCategoryModal({ year, month, records, catColors, onClose }) {
  const total = records.reduce((s,r)=>s+Number(r.amount),0);
  const cats = Array.from(new Set(records.map(r=>r.category).filter(Boolean)));
  const catTotals = {}; cats.forEach(c=>{catTotals[c]=records.filter(r=>r.category===c).reduce((s,r)=>s+Number(r.amount),0);});
  const sorted = cats.slice().sort((a,b)=>catTotals[b]-catTotals[a]);
  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={{...M.modal,maxWidth:420}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{...M.mTitle,marginBottom:0}}>{year}年{month}月 カテゴリー内訳</h3>
          <button style={{background:"none",border:"none",color:"var(--text-subtle)",cursor:"pointer",fontSize:20,padding:"0 2px"}} onClick={onClose}>×</button>
        </div>
        {total===0 ? (
          <p style={{textAlign:"center",color:"var(--text-subtle)",padding:"20px 0",fontSize:14}}>記録はありません</p>
        ) : (
          <Fragment>
            <div style={{marginBottom:8}}>
              <DonutChart items={sorted.map(c=>({key:c,label:c,value:catTotals[c]}))} colors={catColors} total={total} />
            </div>
            <div style={{marginTop:10}}>
              {sorted.map(c=>(
                <div key={c} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid var(--border)"}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:catColors[c]||"var(--text-subtle)",flexShrink:0,display:"inline-block"}} />
                  <span style={{fontSize:13,color:"var(--text-tertiary)",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c}</span>
                  <span style={{fontSize:13,fontWeight:700,color:"var(--text-secondary)",flexShrink:0}}>{fmtYen(catTotals[c])}</span>
                </div>
              ))}
            </div>
            <div style={{textAlign:"right",fontSize:14,fontWeight:700,marginTop:10,color:"var(--text-secondary)"}}>合計 {fmtYen(total)}</div>
          </Fragment>
        )}
      </div>
    </div>
  );
}

// ── CategoryBreakdownModal ────────────────────────────────────────────────────
function CategoryBreakdownModal({ title, records, isUncat, onBulkRecat, onClose }) {
  const total = records.reduce((s,r)=>s+Number(r.amount),0);
  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={{...M.modal,maxWidth:420}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{...M.mTitle,marginBottom:0}}>{title}</h3>
          <button style={{background:"none",border:"none",color:"var(--text-subtle)",cursor:"pointer",fontSize:20,padding:"0 2px"}} onClick={onClose}>×</button>
        </div>
        {isUncat && onBulkRecat && (
          <button style={{...S.editLink,display:"block",marginBottom:10}} onClick={onBulkRecat}>全期間の未分類をまとめて編集 →</button>
        )}
        {records.length===0 ? (
          <p style={{textAlign:"center",color:"var(--text-subtle)",padding:"20px 0",fontSize:14}}>記録はありません</p>
        ) : (
          <Fragment>
            {records.map(r=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 0",borderBottom:"1px solid var(--border)",fontSize:13}}>
                <span style={{color:"var(--text-faint)",fontSize:11,flexShrink:0}}>{normDate(r.date).slice(5).replace("-","/")}</span>
                <span style={{color:"var(--text-primary)",fontWeight:600,flexShrink:0}}>{r.payee||"—"}</span>
                {isUncat && <span style={{fontSize:10,background:"var(--border)",color:"var(--text-faint)",borderRadius:4,padding:"1px 5px"}}>{r.category?`category: "${r.category}"`:"category未設定"}</span>}
                {r.memo && <span style={{color:"var(--text-subtle)",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>「{r.memo}」</span>}
                {r.isFixed && <span style={{fontSize:10,background:"var(--tint-blue)",color:"#4f7cac",borderRadius:4,padding:"1px 5px",fontWeight:600,flexShrink:0}}>固定</span>}
                {r.isBiz && <span style={{fontSize:10,background:"var(--tint-green)",color:"#3aaa82",borderRadius:4,padding:"1px 5px",fontWeight:600,flexShrink:0}}>事業</span>}
                <span style={{fontWeight:700,marginLeft:"auto",flexShrink:0}}>{fmtYen(r.amount)}</span>
              </div>
            ))}
            <div style={{textAlign:"right",fontSize:14,fontWeight:700,marginTop:10,color:"var(--text-secondary)"}}>合計 {fmtYen(total)}</div>
          </Fragment>
        )}
      </div>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ label, on, color, onChange }) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:"var(--surface-alt)",borderRadius:10,border:"1px solid var(--border)",cursor:"pointer"}} onClick={onChange}>
      <span style={{fontSize:13,color:"var(--text-tertiary)"}}>{label}</span>
      <div style={{width:36,height:22,borderRadius:11,background:on?color:"var(--border-strong)",position:"relative",flexShrink:0,transition:"background .2s"}}>
        <div style={{width:18,height:18,borderRadius:"50%",background:"var(--surface)",position:"absolute",top:2,left:on?16:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}} />
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]           = useState("input");
  const [syncing, setSyncing]   = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [records, setRecords]   = useState([]);
  const [cats, setCats]         = useState(DEFAULT_CATS);
  const [catPayees, setCatPayees] = useState(DEFAULT_CAT_PAYEES);
  const [bizCats, setBizCats]   = useState(DEFAULT_BIZ_CATS);
  const [bizPayees, setBizPayees] = useState(DEFAULT_BIZ_PAYEES);
  const [fixed, setFixed]       = useState([]);
  const [form, setForm]         = useState({date:todayStr(),amount:"",category:"",payee:"",memo:"",isFixed:false,isBiz:false,bizCategory:"",isSpecial:false});
  const [editCat, setEditCat]   = useState(false);
  const [editCatP, setEditCatP] = useState(false);
  const [editBizCat, setEditBizCat] = useState(false);
  const [editBizP, setEditBizP] = useState(false);
  const [editFixed, setEditFixed] = useState(false);
  const [addFixed,  setAddFixed]  = useState(false);
  const [editRec, setEditRec]   = useState(null);
  const [patterns, setPatterns] = useState(Array(8).fill(null));
  const [editPattern, setEditPattern] = useState(null);
  const [vYear, setVYear]       = useState(()=>{ const n=new Date(),d=n.getDate(),m=n.getMonth()+1,y=n.getFullYear(); if(d>=19){ return m===12?y+1:y; } return y; });
  const [vMonth, setVMonth]     = useState(()=>{ const n=new Date(),d=n.getDate(),m=n.getMonth()+1; if(d>=19){ return m===12?1:m+1; } return m; });
  const [bzYear, setBzYear]     = useState(new Date().getFullYear());
  const [bzMonth, setBzMonth]   = useState(new Date().getMonth()+1);
  const [expDate, setExpDate]   = useState(null);
  const [expCat, setExpCat]     = useState(null);
  const [expBzCat, setExpBzCat] = useState(null);
  const [expYCat, setExpYCat]   = useState(null);
  const [expYMonthCat, setExpYMonthCat] = useState(null);
  const [showBulkRecat, setShowBulkRecat] = useState(false);
  const [showTodayDetail, setShowTodayDetail] = useState(false);
  const [weekDetailRange, setWeekDetailRange] = useState(null);
  const [showMonthCatDetail, setShowMonthCatDetail] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState(new Set());
  const [toast, setToast]       = useState("");
  const writing = useRef(0);
  const pressTimer = useRef(null);
  const didLongPress = useRef(false);
  const pendingOps = useRef(loadPendingOps());

  const catColors    = {}; cats.forEach((c,i)=>{catColors[c]=PALETTE[i%PALETTE.length];});
  const bizCatColors = {}; bizCats.forEach((c,i)=>{bizCatColors[c]=PALETTE[(i+4)%PALETTE.length];});

  const showToast = (msg,dur=2200) => { setToast(msg); setTimeout(()=>setToast(""),dur); };

  const persistPending = () => savePendingOps(pendingOps.current.map(({id,body})=>({id,body})));

  // 前回の失敗分やオフライン中に溜まった未送信の変更をサーバーへ再送信する
  const flushPending = async () => {
    if(!GAS_URL) return;
    const items = pendingOps.current.filter(o=>!o.inFlight);
    if(items.length===0) return;
    setSyncing(true);
    for(const op of items){
      op.inFlight = true;
      try {
        await gasPost(op.body);
        pendingOps.current = pendingOps.current.filter(o=>o.id!==op.id);
      } catch(e) {
        console.warn(e);
        op.inFlight = false;
        break; // 順序を保つため、失敗したら以降は次回に回す
      }
    }
    persistPending();
    setPendingCount(pendingOps.current.length);
    setSyncing(false);
  };

  const fetchAll = async () => {
    if(!GAS_URL) return;
    setSyncing(true);
    await flushPending();
    try {
      const res = await (await fetch(GAS_URL+"?action=getAll")).json();
      // 未送信の変更が残っている間は、サーバーの古いデータで上書きしない
      if(res.ok && writing.current===0 && pendingOps.current.length===0) {
        if(res.records && res.records.length>0) {
          setRecords(res.records.map(r=>({...r,date:normDate(r.date),amount:Number(r.amount),isFixed:r.isFixed===true||r.isFixed==="TRUE",isBiz:r.isBiz===true||r.isBiz==="TRUE",isSpecial:r.isSpecial===true||r.isSpecial==="TRUE",bizCategory:r.bizCategory||""})));
        }
        const s=res.settings||{};
        if(s.categories)    setCats(s.categories);
        if(s.catPayees)     setCatPayees(s.catPayees);
        if(s.bizCategories) setBizCats(s.bizCategories);
        if(s.bizCatPayees)  setBizPayees(s.bizCatPayees);
        if(s.fixedCosts)    setFixed(s.fixedCosts);
        if(s.patterns)      setPatterns(Array.from({length:8},(_,i)=>s.patterns[i]||null));
      }
    } catch(e) { console.warn(e); }
    setSyncing(false);
  };

  useEffect(()=>{
    if(!GAS_URL) return;
    if(pendingOps.current.length>0){ setPendingCount(pendingOps.current.length); }
    fetchAll();
    const t = setInterval(fetchAll, 30000);
    const onOnline = () => fetchAll();
    window.addEventListener("online", onOnline);
    return ()=>{ clearInterval(t); window.removeEventListener("online", onOnline); };
  },[]);

  useEffect(()=>{
    const handler = e => { if(pendingOps.current.length>0){ e.preventDefault(); e.returnValue=""; } };
    window.addEventListener("beforeunload", handler);
    return ()=>window.removeEventListener("beforeunload", handler);
  },[]);

  useEffect(()=>{
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (tab === "input" && editRec === null) {
          addRecord();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tab, form, records, fixed, editRec]);

  const sync = async body => {
    if(!GAS_URL) return true;
    const op = { id: Date.now()+"_"+Math.random().toString(36).slice(2), body, inFlight:true };
    pendingOps.current = [...pendingOps.current, op];
    persistPending();
    setPendingCount(pendingOps.current.length);
    writing.current += 1;
    setSyncing(true);
    let ok = false;
    try { await gasPost(body); ok = true; } catch(e){ console.warn(e); }
    if(ok) pendingOps.current = pendingOps.current.filter(o=>o.id!==op.id);
    else op.inFlight = false;
    persistPending();
    setPendingCount(pendingOps.current.length);
    if(!ok) showToast("⚠ 保存に失敗しました。オフラインの可能性があります。接続後に自動で再送信します", 6000);
    writing.current = Math.max(0, writing.current-1);
    setSyncing(false);
    return ok;
  };

  const saveSetting = (key,val) => { if(GAS_URL) sync({action:"saveAllSettings",settings:{[key]:val}}); };

  const fillPattern = (pat) => {
    if(!pat) return;
    setForm(f=>({...f,amount:String(pat.amount),category:pat.category,payee:pat.payee||"",memo:pat.memo||"",isBiz:pat.isBiz||false,bizCategory:pat.isBiz?(pat.bizCategory||""):""}));
  };

  const addRecord = () => {
    const cat = form.isBiz ? (form.bizCategory||form.category) : form.category;
    if(!form.amount||!cat||!form.date){ showToast("日付・金額・カテゴリーは必須です"); return; }
    const rec = {id:Date.now(),date:normDate(form.date),amount:Number(form.amount),category:form.category,bizCategory:form.isBiz?form.bizCategory:"",payee:form.payee||"",memo:form.memo||"",isFixed:false,isBiz:form.isBiz,isSpecial:form.isSpecial};
    setRecords(p=>[...p,rec]);
    showToast("記録しました ✓");
    setForm(f=>({...f,amount:"",memo:"",payee:"",isFixed:false,isBiz:false,bizCategory:"",isSpecial:false}));
    sync({action:"addRecord",record:rec});
  };

  const delRecord = id => { setRecords(p=>p.filter(r=>r.id!==id)); sync({action:"deleteRecord",id}); };

  const updRecord = upd => {
    setRecords(p=>p.map(r=>r.id===upd.id?{...upd,amount:Number(upd.amount)}:r));
    setEditRec(null); showToast("更新しました ✓");
    sync({action:"deleteRecord",id:upd.id});
    sync({action:"addRecord",record:{...upd,amount:Number(upd.amount)}});
  };

  const applyCategoryRename = async (oldName,newName) => {
    if(!oldName||!newName||oldName===newName) return;
    const affected = records.filter(r=>r.category===oldName||r.bizCategory===oldName);
    if(affected.length===0) return;
    const updated = affected.map(r=>({...r,category:r.category===oldName?newName:r.category,bizCategory:r.bizCategory===oldName?newName:r.bizCategory}));
    setRecords(prev=>prev.map(r=>{ const u=updated.find(x=>x.id===r.id); return u||r; }));
    writing.current += 1;
    try {
      for(const u of updated){ await sync({action:"deleteRecord",id:u.id}); await sync({action:"addRecord",record:u}); }
    } finally { writing.current = Math.max(0, writing.current-1); }
  };

  const applyPayeeRename = async (oldName,newName) => {
    if(!oldName||!newName||oldName===newName) return;
    const affected = records.filter(r=>r.payee===oldName);
    if(affected.length===0) return;
    const updated = affected.map(r=>({...r,payee:newName}));
    setRecords(prev=>prev.map(r=>{ const u=updated.find(x=>x.id===r.id); return u||r; }));
    writing.current += 1;
    try {
      for(const u of updated){ await sync({action:"deleteRecord",id:u.id}); await sync({action:"addRecord",record:u}); }
    } finally { writing.current = Math.max(0, writing.current-1); }
  };

  const bulkAssignCategory = async (ids,newCategory) => {
    if(!newCategory || ids.length===0) return;
    const idSet = new Set(ids);
    const updated = records.filter(r=>idSet.has(r.id)).map(r=>({...r,category:newCategory}));
    if(updated.length===0) return;
    setRecords(prev=>prev.map(r=>{ const u=updated.find(x=>x.id===r.id); return u||r; }));
    writing.current += 1;
    try {
      for(const u of updated){ await sync({action:"deleteRecord",id:u.id}); await sync({action:"addRecord",record:u}); }
    } finally { writing.current = Math.max(0, writing.current-1); }
    showToast(updated.length+"件を「"+newCategory+"」に設定しました ✓");
  };

  const applyFixed = () => {
    const pfx=vYear+"-"+pad(vMonth);
    if(records.some(r=>r.date.startsWith(pfx)&&r.isFixed)){ showToast("今月はすでに適用済みです"); return; }
    const newR=fixed.map(f=>({id:Date.now()+Math.random(),isFixed:true,isBiz:f.isBiz||false,date:pfx+"-"+pad(f.day),amount:f.amount,category:f.category,bizCategory:f.bizCategory||"",payee:f.payee||"",memo:f.name}));
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
  const mondayOf = d => { const dt=new Date(d); const diff=dt.getDay()===0?6:dt.getDay()-1; const m=new Date(dt); m.setDate(dt.getDate()-diff); return m.getFullYear()+"-"+pad(m.getMonth()+1)+"-"+pad(m.getDate()); };
  const weekRange = monStr => { const s=new Date(monStr); s.setDate(s.getDate()+6); const sunStr=s.getFullYear()+"-"+pad(s.getMonth()+1)+"-"+pad(s.getDate()); return { sunStr, label: monStr.slice(5).replace("-","/")+"〜"+sunStr.slice(5).replace("-","/") }; };
  const byWeek = {}; mRecs.forEach(r=>{ const d=normDate(r.date); const wk=mondayOf(d); if(!byWeek[wk])byWeek[wk]={}; byWeek[wk][r.category]=(byWeek[wk][r.category]||0)+Number(r.amount); });
  const mTotal = mRecs.reduce((s,r)=>s+Number(r.amount),0);
  const mSpecialRecs = mRecs.filter(r=>r.isSpecial);
  const mSpecialTotal = mSpecialRecs.reduce((s,r)=>s+Number(r.amount),0);
  const mNormalTotal = mTotal - mSpecialTotal;
  const usedCats = cats.filter(c=>mRecs.some(r=>r.category===c));
  const catTotals = {}; usedCats.forEach(c=>{catTotals[c]=mRecs.filter(r=>r.category===c).reduce((s,r)=>s+Number(r.amount),0);});
  const uncatRecs = mRecs.filter(r=>!cats.includes(r.category));
  const uncatTotal = uncatRecs.reduce((s,r)=>s+Number(r.amount),0);

  // 年間データ
  // 年間：各月を19日〜翌月18日のサイクルで集計
  // 表示月mのサイクル = 前月19日〜当月18日
  const cycleStart = (y,m) => { const pm=m===1?12:m-1; const py=m===1?y-1:y; return py+"-"+pad(pm)+"-19"; };
  const cycleEnd   = (y,m) => y+"-"+pad(m)+"-18";
  const byMonth = {}; for(let m=1;m<=12;m++) byMonth[m]={};
  records.forEach(r=>{
    const d=normDate(r.date);
    for(let m=1;m<=12;m++){
      if(d>=cycleStart(vYear,m)&&d<=cycleEnd(vYear,m)){
        byMonth[m][r.category]=(byMonth[m][r.category]||0)+Number(r.amount);
        break;
      }
    }
  });
  const yRecs = records.filter(r=>{
    const d=normDate(r.date);
    return d>=cycleStart(vYear,1)&&d<=cycleEnd(vYear,12);
  });
  const yUsedCats = cats.filter(c=>Object.values(byMonth).some(m=>m[c]));
  const yCatTotals = {}; yUsedCats.forEach(c=>{yCatTotals[c]=yRecs.filter(r=>r.category===c).reduce((s,r)=>s+Number(r.amount),0);});
  const yTotal = yRecs.reduce((s,r)=>s+Number(r.amount),0);

  // 事業経費データ
  const bizRecs = records.filter(r=>r.isBiz&&r.bizCategory);
  const bzMRecs = bizRecs.filter(r=>{ const d=normDate(r.date); const [y,m]=d.split("-").map(Number); return y===bzYear&&m===bzMonth; });
  const bzMTotal = bzMRecs.reduce((s,r)=>s+Number(r.amount),0);
  const bzUsed   = bizCats.filter(c=>bzMRecs.some(r=>(r.bizCategory||r.category)===c));
  const bzTotals = {}; bzUsed.forEach(c=>{bzTotals[c]=bzMRecs.filter(r=>(r.bizCategory||r.category)===c).reduce((s,r)=>s+Number(r.amount),0);});
  const downloadCSV = () => {
    try {
      const rows = [
        ["日付","事業カテゴリー","支払い先","金額","メモ"],
        ...[...bzMRecs]
          .sort((a,b)=>normDate(a.date).localeCompare(normDate(b.date)))
          .map(r=>[
            normDate(r.date),
            r.bizCategory||"",
            r.payee||"",
            String(r.amount),
            r.memo||""
          ])
      ];
      const csvContent = "﻿" + rows.map(row=>
        row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")
      ).join("\n");
      const blob = new Blob([csvContent],{type:"text/csv;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = bzYear+"年"+bzMonth+"月_事業経費.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch(e) {
      alert("CSV出力に失敗しました: "+e.message);
    }
  };
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
          {pendingCount>0 && (
            <span style={S.syncError} onClick={flushPending} title="タップして再送信">
              ⚠ 未保存{pendingCount}件
            </span>
          )}
        </div>
        <nav style={S.nav}>
          {[["input","入力"],["monthly","月間"],["yearly","年間"],["biz","事業経費"],["fixed","固定費"],["card","Card"]].map(([k,l])=>(
            <button key={k} style={{...S.navBtn,...(tab===k?S.navOn:{})}} onClick={()=>{ setTab(k); if(k==='monthly'||k==='fixed'){
              const now=new Date();
              const d=now.getDate();
              const m=now.getMonth()+1;
              const y=now.getFullYear();
              if(d>=19){
                if(m===12){setVMonth(1);setVYear(y+1);}
                else{setVMonth(m+1);setVYear(y);}
              } else {
                setVMonth(m);setVYear(y);
              }} }}>{l}</button>
          ))}
        </nav>
        <button style={S.refreshBtn} onClick={fetchAll} title="更新">↺</button>
      </header>

      <main style={S.main}>

        {/* ══ 入力 ══ */}
        {tab==="input" && (
          <div style={S.card}>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
              {patterns.map((pat,i)=>(
                <button key={i}
                  onClick={()=>{ if(didLongPress.current){didLongPress.current=false;return;} pat?fillPattern(pat):setEditPattern(i); }}
                  onContextMenu={e=>{e.preventDefault();setEditPattern(i);}}
                  onTouchStart={()=>{ pressTimer.current=setTimeout(()=>{didLongPress.current=true;setEditPattern(i);},500); }}
                  onTouchEnd={()=>clearTimeout(pressTimer.current)}
                  onTouchMove={()=>clearTimeout(pressTimer.current)}
                  title={pat?(pat.label+(pat.amount?" ¥"+Number(pat.amount).toLocaleString():"")):("パターン"+(i+1)+"を登録")}
                  style={{borderRadius:20,padding:"6px 14px",fontSize:13,fontWeight:600,maxWidth:150,border:pat?"1.5px solid #4f7cac":"1.5px dashed var(--border-strong)",background:pat?"var(--tint-blue)":"var(--surface-alt)",cursor:"pointer",color:pat?"var(--text-primary)":"var(--text-subtle)",fontFamily:"inherit",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0}}>
                  {pat ? pat.label : "＋ 追加"}
                </button>
              ))}
            </div>
            {mTotal>0 && (()=>{
              const todayTotal = records.filter(r=>normDate(r.date)===today).reduce((s,r)=>s+Number(r.amount),0);
              const now = new Date();
              const dow = now.getDay(); // 0=Sun,1=Mon,...
              const diffToMon = (dow===0 ? 6 : dow-1);
              const monDate = new Date(now); monDate.setDate(now.getDate()-diffToMon);
              const monStr = monDate.getFullYear()+"-"+pad(monDate.getMonth()+1)+"-"+pad(monDate.getDate());
              const sunDate = new Date(monDate); sunDate.setDate(monDate.getDate()+6);
              const sunStr = sunDate.getFullYear()+"-"+pad(sunDate.getMonth()+1)+"-"+pad(sunDate.getDate());
              const weekRecs = records.filter(r=>{ const d=normDate(r.date); return d>=monStr&&d<=sunStr; });
              const weekTotal = weekRecs.reduce((s,r)=>s+Number(r.amount),0);
              return (
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                  <div style={{background:"var(--surface-alt)",borderRadius:10,padding:"10px 14px",textAlign:"center",cursor:"pointer"}} onClick={()=>setShowMonthCatDetail(true)}>
                    <div style={{fontSize:10,fontWeight:600,color:"var(--text-subtle)",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>当月合計</div>
                    <div style={{fontSize:22,fontWeight:700}}>
                      {fmtYen(mNormalTotal)}
                      {mSpecialTotal>0 && <span style={{fontSize:12,fontWeight:600,color:"#e07a5f",marginLeft:6}}>（特別 +{fmtYen(mSpecialTotal)}）</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <div style={{flex:1,background:"var(--surface-alt)",borderRadius:10,padding:"10px 14px",textAlign:"center",cursor:"pointer"}} onClick={()=>setShowTodayDetail(true)}>
                      <div style={{fontSize:10,fontWeight:600,color:"var(--text-subtle)",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>今日</div>
                      <div style={{fontSize:18,fontWeight:700}}>{fmtYen(todayTotal)}</div>
                    </div>
                    <div style={{flex:1,background:"var(--surface-alt)",borderRadius:10,padding:"10px 14px",textAlign:"center",cursor:"pointer"}} onClick={()=>setWeekDetailRange({monStr,sunStr})}>
                      <div style={{fontSize:10,fontWeight:600,color:"var(--text-subtle)",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>今週合計</div>
                      <div style={{fontSize:18,fontWeight:700}}>{fmtYen(weekTotal)}</div>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div style={{width:"100%",overflow:"hidden"}}>
              <label style={S.label}>日付</label>
              <input type="date" value={form.date}
                onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                style={{...S.inp,width:"100%",maxWidth:"100%",boxSizing:"border-box",fontSize:16,appearance:"none",WebkitAppearance:"none"}} />
            </div>
            <div>
              <label style={S.label}>金額（円）</label>
              <div style={{display:"flex",gap:8}}>
                <input style={{...S.inp,fontSize:20,fontWeight:700,textAlign:"right",flex:1,minWidth:0,boxSizing:"border-box"}} type="number" inputMode="numeric" placeholder="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
                <button style={{width:80,flexShrink:0,background:"var(--ink-bg)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}} onClick={addRecord}>記録する</button>
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
                  {payeesToShow.map(p=><button key={p} style={{...S.chip,...(form.payee===p?{background:"var(--ink-bg)",color:"#fff",borderColor:"var(--ink-bg)"}:{})}} onClick={()=>setForm(f=>({...f,payee:p}))}>{p}</button>)}
                </div>
              </div>
            )}
            {payeesToShow.length===0 && form.category && (
              <button style={{...S.editLink,marginTop:8,display:"block"}} onClick={()=>setEditCatP(true)}>+ 支払い先を登録する</button>
            )}

            {form.isBiz && (
              <div style={{background:"var(--tint-green)",borderRadius:10,padding:12,marginTop:10,border:"1px solid #b2e0d0"}}>
                <div style={S.rowLabel}>
                  <label style={{...S.label,marginTop:0,color:"#3aaa82"}}>事業カテゴリー</label>
                  <button style={S.editLink} onClick={()=>setEditBizCat(true)}>編集</button>
                </div>
                <div style={S.chips}>
                  {bizCats.map(c=><button key={c} style={{...S.chip,...(form.bizCategory===c?{background:bizCatColors[c],color:"#fff",borderColor:bizCatColors[c]}:{borderColor:"#6dbf9e",color:"#3aaa82"})}} onClick={()=>setForm(f=>({...f,bizCategory:f.bizCategory===c?"":c}))}>{c}</button>)}
                </div>
              </div>
            )}

            <div style={{marginTop:14,display:"flex",gap:8}}>
              <div style={{flex:1}}>
                <Toggle label="事業経費" on={form.isBiz} color="#3aaa82" onChange={()=>setForm(f=>({...f,isBiz:!f.isBiz,bizCategory:""}))} />
              </div>
              <div style={{flex:1}}>
                <Toggle label="特別支出" on={form.isSpecial} color="#e07a5f" onChange={()=>setForm(f=>({...f,isSpecial:!f.isSpecial}))} />
              </div>
            </div>

            <label style={S.label}>メモ</label>
            <input style={{...S.inp,width:"100%",boxSizing:"border-box"}} placeholder="任意" value={form.memo} onChange={e=>setForm(f=>({...f,memo:e.target.value}))} />
            <div style={{marginBottom:"80px"}} />

            {records.length>0 && (
              <div style={{marginTop:24}}>
                <p style={S.secTitle}>最近の記録</p>
                {[...records].reverse().slice(0,10).map(r=>(
                  <div key={r.id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                    <span style={{width:9,height:9,borderRadius:"50%",background:(r.isBiz?bizCatColors:catColors)[r.bizCategory||r.category]||"var(--border-strong)",flexShrink:0,display:"inline-block"}} />
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:600,color:"var(--text-primary)",marginBottom:3}}>{r.payee||"—"}</div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
                        <span style={{fontSize:11,color:"var(--text-secondary)"}}>{normDate(r.date).slice(5).replace("-","/")} {DAYS[new Date(normDate(r.date)).getDay()]}</span>
                        <span style={{fontSize:11,color:"var(--text-faint)",background:"var(--border)",borderRadius:4,padding:"1px 6px"}}>{r.category}</span>
                        {r.isFixed&&<span style={{fontSize:10,background:"var(--border)",color:"var(--text-faint)",borderRadius:4,padding:"1px 6px"}}>固定費</span>}
                        {r.isBiz&&<span style={{fontSize:10,background:"var(--tint-green)",color:"#3aaa82",borderRadius:4,padding:"1px 6px",fontWeight:600}}>事業経費</span>}
                        {r.memo&&<span style={{fontSize:11,color:"var(--text-subtle)"}}>— {r.memo}</span>}
                      </div>
                    </div>
                    <span style={{fontSize:14,fontWeight:700,flexShrink:0}}>{fmtYen(r.amount)}</span>
                    <button style={{background:"none",border:"1px solid var(--border)",borderRadius:6,color:"var(--text-subtle)",cursor:"pointer",fontSize:11,padding:"2px 7px",flexShrink:0}} onClick={()=>setEditRec({...r})}>編集</button>
                    <button style={{background:"none",border:"none",color:"var(--border-strong)",cursor:"pointer",fontSize:16,padding:"0 2px",flexShrink:0}} onClick={()=>delRecord(r.id)}>×</button>
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
                <div style={{fontSize:11,color:"var(--text-subtle)"}}>{prevYear}/{pad(prevMonth)}/19 〜 {vYear}/{pad(vMonth)}/18</div>
              </div>
              <button style={S.arrowBtn} onClick={()=>navMonth(1)}>▶</button>
            </div>

            <div style={S.summaryBox}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
                <span style={{fontSize:11,fontWeight:600,color:"var(--text-faint)",letterSpacing:1,textTransform:"uppercase"}}>月合計</span>
                <span style={{fontSize:26,fontWeight:700}}>{fmtYen(mTotal)}</span>
              </div>
              {mSpecialRecs.length>0 && (
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  <div style={{flex:1,background:"var(--surface)",borderRadius:8,padding:"8px 10px",border:"1px solid var(--border)"}}>
                    <div style={{fontSize:10,fontWeight:600,color:"var(--text-subtle)",letterSpacing:1,textTransform:"uppercase"}}>通常支出</div>
                    <div style={{fontSize:15,fontWeight:700,color:"var(--text-secondary)"}}>{fmtYen(mNormalTotal)}</div>
                  </div>
                  <div style={{flex:1,background:"var(--tint-red)",borderRadius:8,padding:"8px 10px",border:"1px solid var(--tint-red)"}}>
                    <div style={{fontSize:10,fontWeight:600,color:"#e07a5f",letterSpacing:1,textTransform:"uppercase"}}>特別支出（{mSpecialRecs.length}件）</div>
                    <div style={{fontSize:15,fontWeight:700,color:"#e07a5f"}}>{fmtYen(mSpecialTotal)}</div>
                  </div>
                </div>
              )}
              {mTotal>0 && (
                <div style={{marginBottom:8}}>
                  <DonutChart
                    items={[...usedCats.map(c=>({key:c,label:c,value:catTotals[c]})), ...(uncatTotal>0?[{key:"__uncat__",label:"未分類",value:uncatTotal}]:[])]}
                    colors={{...catColors,__uncat__:"#9a958a"}}
                    total={mTotal}
                    size={280}
                    thickness={26}
                    radius={36}
                    showLabels
                    onSegClick={c=>setExpCat(c)}
                    activeKey={expCat}
                  />
                </div>
              )}
              {mTotal>0 && (()=>{
                const allKeys = [...usedCats, ...(uncatTotal>0?["__uncat__"]:[])];
                const totalsMap = {...catTotals, __uncat__:uncatTotal};
                const sorted = allKeys.slice().sort((a,b)=>totalsMap[b]-totalsMap[a]);
                return (
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 12px",marginTop:10}}>
                    {sorted.map(c=>(
                      <div key={c} style={{display:"flex",alignItems:"center",gap:5,minWidth:0,padding:"3px 0",cursor:"pointer"}} onClick={()=>setExpCat(c)}>
                        <span style={{width:8,height:8,borderRadius:"50%",background:c==="__uncat__"?"#9a958a":catColors[c],flexShrink:0,display:"inline-block"}} />
                        <span style={{fontSize:12,color:"var(--text-tertiary)",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c==="__uncat__"?"未分類":c}</span>
                        <span style={{fontSize:12,fontWeight:700,color:"var(--text-secondary)",flexShrink:0}}>{fmtYen(totalsMap[c])}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {mTotal===0 && <p style={{textAlign:"center",color:"var(--text-subtle)",padding:"24px 0",fontSize:14}}>この期間の記録はありません</p>}
            </div>

            {Object.keys(byWeek).length>0 && (
              <div>
                <div style={{overflowX:"auto",overflowY:"auto",maxHeight:"60vh",borderRadius:10,border:"1px solid var(--border)"}}>
                  <table style={{width:"100%",borderCollapse:"separate",borderSpacing:0,fontSize:13}}>
                    <thead style={{position:"sticky",top:0,zIndex:5,background:"var(--surface-alt)"}}>
                      <tr>
                        <th style={{...S.th,...S.thFix}}>週</th>
                        <th style={{...S.th,background:"var(--border)",color:"var(--text-secondary)",minWidth:80}}>合計</th>
                        {usedCats.map(c=>(
                          <th key={c} style={S.th}>
                            <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:catColors[c],marginRight:4,verticalAlign:"middle"}} />{c}
                          </th>
                        ))}
                      </tr>
                      <tr style={{background:"var(--surface-alt)",borderTop:"2px solid var(--border)"}}>
                        <td style={{...S.td,...S.thFix,fontWeight:700,background:"var(--surface-alt)"}}>月計</td>
                        <td style={{...S.td,fontWeight:700,background:"var(--border)"}}>{fmtYen(mTotal)}</td>
                        {usedCats.map(c=><td key={c} style={{...S.td,fontWeight:700,background:"var(--surface-alt)"}}>{fmtYen(catTotals[c])}</td>)}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(byWeek).sort().reverse().map((wk,wi)=>{
                        const { sunStr, label } = weekRange(wk);
                        const weekTotal=Object.values(byWeek[wk]).reduce((a,b)=>a+b,0);
                        const isThisWeek = mondayOf(today)===wk;
                        return (
                          <Fragment key={wk}>
                            <tr style={{...(wi%2===0?{background:"var(--surface)"}:{background:"var(--surface-alt)"}),...(isThisWeek?{background:"var(--tint-blue)"}:{})}}>
                              <td style={{...S.td,...S.thFix,color:"var(--text-secondary)",background:isThisWeek?"var(--tint-blue)":wi%2===0?"var(--surface)":"var(--surface-alt)"}}>
                                {label}
                                {isThisWeek&&<span style={{marginLeft:6,fontSize:10,background:"#4f7cac",color:"#fff",borderRadius:4,padding:"1px 5px"}}>今週</span>}
                              </td>
                              <td style={{...S.td,fontWeight:600,background:"var(--surface-alt)"}}>{fmtYen(weekTotal)}</td>
                              {usedCats.map(c=>{
                                const amt=byWeek[wk][c];
                                const ck=wk+"|"+sunStr+"|"+c;
                                return (
                                  <td key={c} style={{...S.td,...(amt?{cursor:"pointer"}:{}),...(expDate===ck?{background:catColors[c]+"22"}:{})}}
                                    onClick={()=>{ if(amt) setExpDate(expDate===ck?null:ck); }}>
                                    {amt ? <span style={{color:catColors[c],fontWeight:600}}>{fmtYen(amt)}{expDate===ck&&<span style={{fontSize:9,marginLeft:2}}>▲</span>}</span> : <span style={{color:"var(--text-dash)"}}>—</span>}
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
              <button style={S.arrowBtn} onClick={()=>{setExpYCat(null);setExpYMonthCat(null);setVYear(y=>y-1);}}>◀</button>
              <h2 style={S.cardTitle}>{vYear}年</h2>
              <button style={S.arrowBtn} onClick={()=>{setExpYCat(null);setExpYMonthCat(null);setVYear(y=>y+1);}}>▶</button>
            </div>
            <div style={S.summaryBox}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
                <span style={{fontSize:11,fontWeight:600,color:"var(--text-faint)",letterSpacing:1,textTransform:"uppercase"}}>年間合計</span>
                <span style={{fontSize:26,fontWeight:700}}>{fmtYen(yTotal)}</span>
              </div>
              {yTotal>0 && (
                <div style={{marginBottom:8}}>
                  <DonutChart
                    items={yUsedCats.map(c=>({key:c,label:c,value:yCatTotals[c]}))}
                    colors={catColors}
                    total={yTotal}
                    size={280}
                    thickness={26}
                    radius={36}
                    showLabels
                    onSegClick={c=>setExpYCat(expYCat===c?null:c)}
                    activeKey={expYCat}
                  />
                </div>
              )}
              {yTotal>0 && (()=>{
                const sorted = yUsedCats.slice().sort((a,b)=>yCatTotals[b]-yCatTotals[a]);
                return (
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 12px",marginTop:10}}>
                    {sorted.map(c=>(
                      <div key={c} style={{display:"flex",alignItems:"center",gap:5,minWidth:0,padding:"3px 0"}}>
                        <span style={{width:8,height:8,borderRadius:"50%",background:catColors[c],flexShrink:0,display:"inline-block"}} />
                        <span style={{fontSize:12,color:"var(--text-tertiary)",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c}</span>
                        <span style={{fontSize:12,fontWeight:700,color:"var(--text-secondary)",flexShrink:0}}>{fmtYen(yCatTotals[c])}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            {yRecs.length===0 ? <p style={{textAlign:"center",color:"var(--text-subtle)",padding:"32px 0",fontSize:14}}>この年の記録はありません</p> : (
              <div style={{overflowX:"auto",borderRadius:10,border:"1px solid var(--border)"}}>
                <table style={{width:"100%",borderCollapse:"separate",borderSpacing:0,fontSize:13}}>
                  <thead>
                    <tr>
                      <th style={{...S.th,...S.thFix}}>月</th>
                      <th style={{...S.th,...S.thFix2}}>合計</th>
                      {yUsedCats.map(c=><th key={c} style={S.th}><span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:catColors[c],marginRight:4,verticalAlign:"middle"}} />{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHS.map((ml,mi)=>{
                      const m=mi+1;
                      const tot=Object.values(byMonth[m]).reduce((a,b)=>a+b,0);
                      const isCur=vYear===new Date().getFullYear()&&m===new Date().getMonth()+1;
                      const rowBg = isCur?"var(--tint-blue)":mi%2===0?"var(--surface)":"var(--surface-alt)";
                      return (
                        <tr key={m} style={{...(mi%2===0?{background:"var(--surface)"}:{background:"var(--surface-alt)"}),...(isCur?{background:"var(--tint-blue)"}:{})}}>
                          <td style={{...S.td,...S.thFix,fontWeight:600,background:rowBg}}>
                            {ml}{isCur&&<span style={{marginLeft:6,fontSize:10,background:"#4f7cac",color:"#fff",borderRadius:4,padding:"1px 5px"}}>今月</span>}
                          </td>
                          <td style={{...S.td,...S.thFix2,fontWeight:600,background:rowBg}}>{tot>0?fmtYen(tot):<span style={{color:"var(--text-dash)"}}>—</span>}</td>
                          {yUsedCats.map(c=>{
                            const amt=byMonth[m][c];
                            const ck=m+"|"+c;
                            return (
                              <td key={c} style={{...S.td,...(amt?{cursor:"pointer"}:{}),...(expYMonthCat===ck?{background:catColors[c]+"22"}:{})}}
                                onClick={()=>{ if(amt) setExpYMonthCat(expYMonthCat===ck?null:ck); }}>
                                {amt?fmtYen(amt):<span style={{color:"var(--text-dash)"}}>—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    <tr style={{background:"var(--surface-alt)",borderTop:"2px solid var(--border)"}}>
                      <td style={{...S.td,...S.thFix,fontWeight:700,background:"var(--surface-alt)"}}>年計</td>
                      <td style={{...S.td,...S.thFix2,fontWeight:700,background:"var(--surface-alt)"}}>{fmtYen(yTotal)}</td>
                      {yUsedCats.map(c=><td key={c} style={{...S.td,fontWeight:700}}>{fmtYen(yCatTotals[c])}</td>)}
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
                <span style={{fontSize:11,fontWeight:600,color:"var(--text-faint)",letterSpacing:1,textTransform:"uppercase"}}>月間事業経費合計</span>
                <span style={{fontSize:26,fontWeight:700,color:"#3aaa82"}}>{fmtYen(bzMTotal)}</span>
              </div>
              {bzMTotal>0 && (
                <div style={{marginBottom:8}}>
                  <DonutChart
                    items={bzUsed.map(c=>({key:c,label:c,value:bzTotals[c]}))}
                    colors={bizCatColors}
                    total={bzMTotal}
                    size={280}
                    thickness={26}
                    radius={36}
                    showLabels
                    onSegClick={c=>setExpBzCat(expBzCat===c?null:c)}
                    activeKey={expBzCat}
                  />
                </div>
              )}
              {bzMTotal>0 && (()=>{
                const sorted = bzUsed.slice().sort((a,b)=>bzTotals[b]-bzTotals[a]);
                return (
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 12px",marginTop:10}}>
                    {sorted.map(c=>(
                      <div key={c} style={{display:"flex",alignItems:"center",gap:5,minWidth:0,padding:"3px 0"}}>
                        <span style={{width:8,height:8,borderRadius:"50%",background:bizCatColors[c],flexShrink:0,display:"inline-block"}} />
                        <span style={{fontSize:12,color:"var(--text-tertiary)",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c}</span>
                        <span style={{fontSize:12,fontWeight:700,color:"var(--text-secondary)",flexShrink:0}}>{fmtYen(bzTotals[c])}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {bzMTotal===0 && <p style={{textAlign:"center",color:"var(--text-subtle)",padding:"24px 0",fontSize:14}}>この月の事業経費はありません</p>}
            </div>
            {bzYRecs.length>0 && (
              <div style={{overflowX:"auto",borderRadius:10,border:"1px solid var(--border)",marginTop:8}}>
                <table style={{width:"100%",borderCollapse:"separate",borderSpacing:0,fontSize:13}}>
                  <thead>
                    <tr>
                      <th style={{...S.th,...S.thFix}}>月</th>
                      {bzYUsed.map(c=><th key={c} style={S.th}><span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:bizCatColors[c],marginRight:4,verticalAlign:"middle"}} />{c}</th>)}
                      <th style={{...S.th,background:"var(--border)",color:"var(--text-secondary)"}}>合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHS.map((ml,mi)=>{
                      const m=mi+1;
                      const tot=Object.values(bzByM[m]).reduce((a,b)=>a+b,0);
                      const isCur=bzYear===new Date().getFullYear()&&m===new Date().getMonth()+1;
                      return (
                        <tr key={m} style={{...(mi%2===0?{background:"var(--surface)"}:{background:"var(--surface-alt)"}),...(isCur?{background:"var(--tint-blue)"}:{})}}>
                          <td style={{...S.td,...S.thFix,fontWeight:600,background:isCur?"var(--tint-blue)":mi%2===0?"var(--surface)":"var(--surface-alt)"}}>{ml}{isCur&&<span style={{marginLeft:6,fontSize:10,background:"#4f7cac",color:"#fff",borderRadius:4,padding:"1px 5px"}}>今月</span>}</td>
                          {bzYUsed.map(c=><td key={c} style={S.td}>{bzByM[m][c]?fmtYen(bzByM[m][c]):<span style={{color:"var(--text-dash)"}}>—</span>}</td>)}
                          <td style={{...S.td,fontWeight:600,background:"var(--surface-alt)"}}>{tot>0?fmtYen(tot):<span style={{color:"var(--text-dash)"}}>—</span>}</td>
                        </tr>
                      );
                    })}
                    <tr style={{background:"var(--surface-alt)",borderTop:"2px solid var(--border)"}}>
                      <td style={{...S.td,...S.thFix,fontWeight:700,background:"var(--surface-alt)"}}>年計</td>
                      {bzYUsed.map(c=>{const s=bzYRecs.filter(r=>(r.bizCategory||r.category)===c).reduce((a,r)=>a+Number(r.amount),0);return<td key={c} style={{...S.td,fontWeight:700}}>{fmtYen(s)}</td>;})}
                      <td style={{...S.td,fontWeight:700,background:"var(--border)"}}>{fmtYen(bzYRecs.reduce((s,r)=>s+Number(r.amount),0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <div style={{marginTop:20,borderTop:"1px solid var(--border)",paddingTop:16}}>
              <div style={{display:"flex",gap:8}}>
                <button style={{...S.primaryBtn,flex:1,marginTop:0,background:"#3aaa82",fontSize:13}} onClick={()=>setEditBizCat(true)}>カテゴリーを編集</button>
                <button style={{...S.primaryBtn,flex:1,marginTop:0,background:"#5c9e7a",fontSize:13}} onClick={()=>setEditBizP(true)}>支払い先を編集</button>
              </div>
            </div>

            {/* 月別履歴 */}
            {bzMRecs.length>0 && (
              <div style={{marginTop:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <p style={S.secTitle}>月間明細（{bzMRecs.length}件）</p>
                  <button style={{padding:"6px 14px",background:"#3aaa82",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
                    onClick={downloadCSV}>CSV出力</button>
                </div>
                {[...bzMRecs].sort((a,b)=>normDate(b.date).localeCompare(normDate(a.date))).map(r=>(
                  <div key={r.id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:600}}>{r.payee||"—"}</div>
                      <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
                        <span style={{fontSize:11,color:"var(--text-subtle)"}}>{normDate(r.date).slice(5).replace("-","/")} {DAYS[new Date(normDate(r.date)).getDay()]}</span>
                        <span style={{fontSize:11,color:"var(--text-faint)",background:"var(--border)",borderRadius:4,padding:"1px 6px"}}>{r.bizCategory||r.category}</span>
                        {r.memo&&<span style={{fontSize:11,color:"var(--text-subtle)"}}>— {r.memo}</span>}
                      </div>
                    </div>
                    <span style={{fontSize:14,fontWeight:700,flexShrink:0,color:"#3aaa82"}}>{fmtYen(r.amount)}</span>
                    <button style={{background:"none",border:"1px solid var(--border-strong)",borderRadius:6,color:"var(--text-faint)",cursor:"pointer",fontSize:11,padding:"2px 7px",flexShrink:0}} onClick={()=>setEditRec({...r})}>編集</button>
                    <button style={{background:"none",border:"none",color:"var(--border-strong)",cursor:"pointer",fontSize:16,padding:"0 2px",flexShrink:0}} onClick={()=>delRecord(r.id)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ Card ══ */}
        {tab==="card" && (
          <div style={S.card}>
            <h2 style={S.cardTitle}>Card</h2>
            <p style={{fontSize:14,color:"var(--text-muted)",marginBottom:20,textAlign:"center"}}>カード明細を確認して支出を記録しましょう</p>
            <a
              href="https://global.americanexpress.com/activity/recent?account_key=207669CFAE5C0CEF5271D847EDECCCD9"
              target="_blank"
              rel="noopener noreferrer"
              style={{display:"block",padding:"16px",background:"#1a6cb5",color:"#fff",borderRadius:12,textAlign:"center",fontSize:15,fontWeight:700,textDecoration:"none",marginBottom:12}}>
              American Express 明細を見る →
            </a>
            <p style={{fontSize:12,color:"var(--text-subtle)",textAlign:"center"}}>明細を確認後、入力タブから支出を記録してください</p>
          </div>
        )}


        {/* ══ 固定費 ══ */}
        {tab==="fixed" && (
          <div style={S.card}>
            <h2 style={S.cardTitle}>固定費候補</h2>
            <div style={S.summaryBox}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:fixed.length>0?12:0}}>
                <span style={{fontSize:11,fontWeight:600,color:"var(--text-faint)",letterSpacing:1,textTransform:"uppercase"}}>月間固定費合計</span>
                <span style={{fontSize:26,fontWeight:700}}>{fmtYen(fixTotal)}</span>
              </div>
              {fixed.length>0 && (()=>{
                const catTotals={};
                fixed.forEach(f=>{catTotals[f.category]=(catTotals[f.category]||0)+f.amount;});
                const sortedCats=cats.filter(c=>catTotals[c]).concat(Object.keys(catTotals).filter(c=>!cats.includes(c)));
                return (
                  <Fragment>
                  <DonutChart
                    items={sortedCats.map(c=>({key:c,label:c,value:catTotals[c]}))}
                    colors={catColors}
                    total={fixTotal}
                  />
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,marginTop:12}}>
                    <tbody>
                      {sortedCats.map(c=>(
                        <tr key={c} style={{borderTop:"1px solid var(--border)"}}>
                          <td style={{padding:"6px 0",display:"flex",alignItems:"center",gap:6}}>
                            <span style={{width:8,height:8,borderRadius:"50%",background:catColors[c]||"var(--text-subtle)",display:"inline-block",flexShrink:0}} />
                            <span style={{color:"var(--text-tertiary)"}}>{c}</span>
                          </td>
                          <td style={{padding:"6px 0",textAlign:"right",fontWeight:600}}>{fmtYen(catTotals[c])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </Fragment>
                );
              })()}
            </div>
            {fixed.length===0 ? <p style={{textAlign:"center",color:"var(--text-subtle)",padding:"32px 0",fontSize:14}}>固定費候補がありません</p> : (
              <div>
                <p style={{fontSize:12,color:"var(--text-subtle)",marginBottom:12}}>記録したいものを選んで「記録する」を押してください</p>
                {(()=>{
                  const grouped = {};
                  fixed.forEach(f=>{
                    const cat = f.category||"その他";
                    if(!grouped[cat]) grouped[cat]=[];
                    grouped[cat].push(f);
                  });
                  Object.keys(grouped).forEach(c=>grouped[c].sort((a,b)=>cycleSort(a.day)-cycleSort(b.day)));
                  const orderedCats = cats.filter(c=>grouped[c]).concat(Object.keys(grouped).filter(c=>!cats.includes(c)));
                  return orderedCats.map(cat=>{
                    const catTotal = grouped[cat].reduce((s,f)=>s+f.amount,0);
                    const isCollapsed = collapsedCats.has(cat);
                    return (
                    <div key={cat} style={{marginBottom:16}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,background:"var(--border)",borderRadius:8,padding:"8px 14px",marginTop:16,marginBottom:4,cursor:"pointer"}}
                        onClick={()=>setCollapsedCats(prev=>{ const next=new Set(prev); if(next.has(cat)) next.delete(cat); else next.add(cat); return next; })}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{width:12,height:12,borderRadius:"50%",background:catColors[cat]||"var(--text-subtle)",display:"inline-block",flexShrink:0}} />
                          <span style={{fontSize:15,fontWeight:700,color:"var(--text-secondary)"}}>{cat}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:14,fontWeight:700,color:"var(--text-secondary)"}}>{fmtYen(catTotal)}</span>
                          <span style={{fontSize:11,color:"var(--text-faint)"}}>{isCollapsed?"▶":"▼"}</span>
                        </div>
                      </div>
                      {!isCollapsed && grouped[cat].map((f,fi)=>{
                        const isRec=records.some(r=>r.date.startsWith(vYear+"-"+pad(vMonth))&&r.memo===f.name&&r.isFixed);
                        const showDayHeader = fi===0 || grouped[cat][fi-1].day!==f.day;
                        return (
                          <Fragment key={f.id}>
                            {showDayHeader && (
                              <div style={{fontSize:12,fontWeight:600,color:"var(--text-faint)",paddingLeft:14,marginTop:8,marginBottom:4}}>毎月{f.day}日</div>
                            )}
                            <div style={{paddingLeft:24}}>
                              <FixedCandidateRow item={f} catColors={catColors} isRecorded={isRec} viewYear={vYear} viewMonth={vMonth}
                                onRecord={(item,amount,date)=>{
                                  const rec={id:Date.now(),isFixed:true,isBiz:item.isBiz||false,date,amount:Number(amount),category:item.category,bizCategory:item.bizCategory||"",payee:item.payee||"",memo:item.name};
                                  setRecords(p=>[...p,rec]);
                                  showToast(item.name+" を記録しました ✓");
                                  sync({action:"addRecord",record:rec});
                                }} />
                            </div>
                          </Fragment>
                        );
                      })}
                    </div>
                    );
                  });
                })()}
              </div>
            )}
            <div style={{display:"flex",gap:8,marginTop:16}}>
              <button style={{...S.primaryBtn,marginTop:0,flex:1}} onClick={()=>setEditFixed(true)}>編集</button>
              <button style={{...S.primaryBtn,marginTop:0,flex:1,background:"#4f7cac"}} onClick={()=>setAddFixed(true)}>＋ 追加</button>
            </div>
            <div style={{marginTop:14,borderTop:"1px solid var(--border)",paddingTop:14}}>
              <p style={{fontSize:13,color:"var(--text-muted)",marginBottom:10}}>今月（{new Date().getFullYear()}年{new Date().getMonth()+1}月）に一括記録：</p>
              <button style={{...S.primaryBtn,background:"#4f7cac",marginTop:0}} onClick={applyFixed} disabled={fixed.length===0}>今月の固定費を記録する</button>
            </div>
          </div>
        )}

      </main>

      {tab!=="input" && <button style={S.fab} onClick={()=>setTab("input")}>＋ 入力</button>}

      {editCat    && <TagEditor title="カテゴリーの編集" items={cats}    onSave={(l,renames)=>{setCats(l);saveSetting("categories",l);(async()=>{for(const {oldName,newName} of renames)await applyCategoryRename(oldName,newName);if(renames.length)showToast("カテゴリー名を更新しました ✓");})();}}     onClose={()=>setEditCat(false)} />}
      {editBizCat && <TagEditor title="事業カテゴリーの編集" items={bizCats} onSave={(l,renames)=>{setBizCats(l);saveSetting("bizCategories",l);(async()=>{for(const {oldName,newName} of renames)await applyCategoryRename(oldName,newName);if(renames.length)showToast("カテゴリー名を更新しました ✓");})();}} onClose={()=>setEditBizCat(false)} />}
      {editCatP   && <CatPayeeEditor cats={cats}    payees={catPayees} onSave={(m,renames)=>{setCatPayees(m);saveSetting("catPayees",m);(async()=>{for(const {oldName,newName} of renames)await applyPayeeRename(oldName,newName);if(renames.length)showToast("支払い先名を更新しました ✓");})();}}   onClose={()=>setEditCatP(false)} />}
      {editBizP   && <CatPayeeEditor cats={bizCats} payees={bizPayees} onSave={(m,renames)=>{setBizPayees(m);saveSetting("bizCatPayees",m);(async()=>{for(const {oldName,newName} of renames)await applyPayeeRename(oldName,newName);if(renames.length)showToast("支払い先名を更新しました ✓");})();}} onClose={()=>setEditBizP(false)} />}
      {addFixed   && <AddFixedModal cats={cats} catColors={catColors} catPayees={catPayees} bizCats={bizCats} bizCatColors={bizCatColors} onAdd={item=>{const upd=[...fixed,item];setFixed(upd);saveSetting("fixedCosts",upd);showToast("固定費を追加しました ✓");}} onClose={()=>setAddFixed(false)} />}
      {editFixed  && <FixedEditor fixed={fixed} cats={cats} catColors={catColors} catPayees={catPayees} bizCats={bizCats} bizCatColors={bizCatColors} bizPayees={bizPayees} onSave={l=>{setFixed(l);saveSetting("fixedCosts",l);}} onClose={()=>setEditFixed(false)} />}
      {editRec    && <EditModal rec={editRec} cats={cats} catColors={catColors} bizCats={bizCats} bizCatColors={bizCatColors} catPayees={catPayees} onSave={updRecord} onClose={()=>setEditRec(null)} />}
      {showTodayDetail && <TodayDetailModal date={today} records={records.filter(r=>normDate(r.date)===today)} catColors={catColors} onClose={()=>setShowTodayDetail(false)} />}
      {weekDetailRange && <WeekDetailModal monStr={weekDetailRange.monStr} sunStr={weekDetailRange.sunStr} records={records.filter(r=>{const d=normDate(r.date);return d>=weekDetailRange.monStr&&d<=weekDetailRange.sunStr;})} catColors={catColors} onClose={()=>setWeekDetailRange(null)} />}
      {showMonthCatDetail && <MonthCategoryModal year={vYear} month={vMonth} records={mRecs} catColors={catColors} onClose={()=>setShowMonthCatDetail(false)} />}
      {showBulkRecat && <BulkRecategorizeModal records={records} cats={cats} catColors={catColors} onApply={bulkAssignCategory} onClose={()=>setShowBulkRecat(false)} />}
      {expCat && (
        <CategoryBreakdownModal
          title={(expCat==="__uncat__"?"未分類":expCat)+" の内訳"}
          records={expCat==="__uncat__"?uncatRecs:mRecs.filter(r=>r.category===expCat)}
          isUncat={expCat==="__uncat__"}
          onBulkRecat={()=>setShowBulkRecat(true)}
          onClose={()=>setExpCat(null)}
        />
      )}
      {expYMonthCat && (()=>{
        const [mStr,c] = expYMonthCat.split("|");
        const m = Number(mStr);
        const recs = records.filter(r=>{ const d=normDate(r.date); return d>=cycleStart(vYear,m)&&d<=cycleEnd(vYear,m)&&r.category===c; });
        return (
          <CategoryBreakdownModal
            title={vYear+"年 "+MONTHS[m-1]+" "+c+" の内訳"}
            records={recs}
            onClose={()=>setExpYMonthCat(null)}
          />
        );
      })()}
      {editPattern!==null && <PatternModal idx={editPattern} pattern={patterns[editPattern]} cats={cats} catColors={catColors} catPayees={catPayees} bizCats={bizCats} bizCatColors={bizCatColors}
        onSave={(i,pat)=>{ const upd=patterns.map((p,j)=>j===i?pat:p); setPatterns(upd); saveSetting("patterns",upd); showToast("パターン"+(i+1)+"を保存しました ✓"); }}
        onDelete={i=>{ const upd=patterns.map((p,j)=>j===i?null:p); setPatterns(upd); saveSetting("patterns",upd); }}
        onClose={()=>setEditPattern(null)} />}
    </div>
  );
}


// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  app:       { fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif", background:"var(--bg-page)", minHeight:"100vh", color:"var(--text-primary)" },
  header:    { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"var(--surface)", borderBottom:"1px solid var(--border)", position:"sticky", top:0, zIndex:100, gap:6, flexWrap:"wrap" },
  logo:      { fontSize:16, fontWeight:700, letterSpacing:2 },
  sync:      { fontSize:11, color:"#4f7cac", background:"var(--tint-blue)", borderRadius:10, padding:"2px 8px" },
  syncError: { fontSize:11, color:"var(--danger-text)", background:"var(--tint-red)", borderRadius:10, padding:"2px 8px", cursor:"pointer", fontWeight:700 },
  nav:       { display:"flex", gap:2, flexWrap:"wrap" },
  navBtn:    { padding:"5px 8px", border:"none", background:"transparent", borderRadius:20, fontSize:11, cursor:"pointer", color:"var(--text-tertiary)", fontFamily:"inherit" },
  navOn:     { background:"var(--ink-bg)", color:"#fff" },
  refreshBtn:{ background:"none", border:"1px solid var(--border)", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:16, color:"var(--text-muted)" },
  main:      { maxWidth:900, margin:"0 auto", padding:"16px 12px 100px", overflowX:"hidden" },
  card:      { background:"var(--surface)", borderRadius:16, padding:"20px 16px", boxShadow:"0 1px 4px rgba(0,0,0,.06)", overflow:"hidden" },
  cardTitle: { fontSize:18, fontWeight:700, marginBottom:16, textAlign:"center" },
  navRow:    { display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginBottom:16 },
  arrowBtn:  { background:"none", border:"1px solid var(--border)", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:14 },
  summaryBox:{ background:"var(--surface-alt)", borderRadius:12, padding:"16px", marginBottom:16, border:"1px solid var(--border)" },
  label:     { display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", letterSpacing:1, textTransform:"uppercase", marginBottom:5, marginTop:12 },
  rowLabel:  { display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12, marginBottom:5 },
  editLink:  { fontSize:12, color:"#4f7cac", background:"none", border:"none", cursor:"pointer", padding:0 },
  inp:       { width:"100%", boxSizing:"border-box", padding:"10px 12px", border:"1px solid var(--border)", borderRadius:10, fontSize:16, outline:"none", fontFamily:"inherit", background:"var(--surface-alt)" },
  chips:     { display:"flex", flexWrap:"wrap", gap:6 },
  chip:      { padding:"6px 13px", border:"1px solid var(--border-strong)", borderRadius:20, fontSize:13, background:"var(--surface-alt)", cursor:"pointer", fontFamily:"inherit", transition:"all .15s" },
  primaryBtn:{ marginTop:10, width:"100%", padding:"14px", background:"var(--ink-bg)", color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
  secTitle:  { fontSize:11, fontWeight:700, color:"var(--text-subtle)", letterSpacing:1, textTransform:"uppercase", marginBottom:10 },
  th:        { padding:"9px 10px", background:"var(--surface-alt)", fontWeight:600, fontSize:12, color:"var(--text-muted)", borderBottom:"2px solid var(--border)", textAlign:"right", whiteSpace:"nowrap", position:"sticky", top:0, zIndex:3, boxShadow:"0 1px 0 var(--border)" },
  thFix:     { textAlign:"left", position:"sticky", left:0, zIndex:4, background:"var(--surface-alt)", minWidth:100, boxShadow:"2px 0 4px rgba(0,0,0,.04)" },
  thFix2:    { position:"sticky", left:100, zIndex:4, background:"var(--border)", minWidth:90, boxShadow:"2px 0 4px rgba(0,0,0,.04)" },
  td:        { padding:"8px 10px", textAlign:"right", borderBottom:"1px solid var(--border)", fontSize:13, color:"var(--text-secondary)", whiteSpace:"nowrap", background:"var(--surface)" },
  fab:       { position:"fixed", bottom:28, right:20, padding:"12px 20px", background:"#4f7cac", color:"#fff", border:"none", borderRadius:28, fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(79,124,172,.4)", zIndex:150, fontFamily:"inherit" },
  toast:     { position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", background:"var(--ink-bg)", color:"#fff", padding:"10px 22px", borderRadius:30, fontSize:13, zIndex:300, whiteSpace:"nowrap", boxShadow:"0 4px 12px rgba(0,0,0,.2)" },
};

// Modal styles
const M = {
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 },
  modal:   { background:"var(--surface)", borderRadius:16, padding:24, width:"100%", maxWidth:440, maxHeight:"85vh", overflowY:"auto" },
  mTitle:  { fontSize:16, fontWeight:700, marginBottom:16 },
  label:   { display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", letterSpacing:1, textTransform:"uppercase", marginBottom:5, marginTop:10 },
  inp:     { padding:"8px 12px", border:"1px solid var(--border)", borderRadius:8, fontSize:16, outline:"none", fontFamily:"inherit", background:"var(--surface-alt)", boxSizing:"border-box" },
  chip:    { padding:"6px 13px", border:"1px solid var(--border-strong)", borderRadius:20, fontSize:13, background:"var(--surface-alt)", cursor:"pointer", fontFamily:"inherit", transition:"all .15s" },
  tag:     { display:"flex", alignItems:"center", gap:4, padding:"4px 10px", background:"var(--border)", borderRadius:20, fontSize:13 },
  btns:    { display:"flex", gap:8, justifyContent:"flex-end", marginTop:4 },
  cancel:  { padding:"8px 16px", background:"var(--border)", border:"none", borderRadius:8, cursor:"pointer", fontSize:14, fontFamily:"inherit" },
  save:    { padding:"8px 20px", background:"var(--ink-bg)", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:14, fontFamily:"inherit" },
  addBtn:  { padding:"8px 16px", background:"var(--ink-bg)", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:14, fontFamily:"inherit", whiteSpace:"nowrap" },
  xBtn:    { background:"none", border:"none", cursor:"pointer", color:"var(--text-subtle)", fontSize:14, padding:0, lineHeight:1 },
  sortBtn: { background:"none", border:"1px solid var(--border-strong)", borderRadius:6, cursor:"pointer", color:"var(--text-faint)", fontSize:12, padding:"2px 7px", fontFamily:"inherit", lineHeight:1.4 },
  catTab:  { padding:"4px 10px", border:"1px solid var(--border-strong)", borderRadius:16, fontSize:12, cursor:"pointer", background:"var(--surface-alt)", fontFamily:"inherit", color:"var(--text-muted)" },
  catTabOn:{ background:"var(--ink-bg)", color:"#fff", borderColor:"var(--ink-bg)" },
};
