import { useState, useEffect, Fragment } from "react";

// ── サンプルデータ ─────────────────────────────────────────────────────────────
const SAMPLE_RECORDS = [
  {id:1,  date:"2026-05-01", amount:12800, category:"食費",     payee:"スーパー",     memo:"週末まとめ買い", isFixed:false, isBiz:false},
  {id:2,  date:"2026-05-01", amount:980,   category:"交通費",   payee:"電車・バス",   memo:"",              isFixed:false, isBiz:false},
  {id:3,  date:"2026-05-02", amount:3200,  category:"外食",     payee:"レストラン",   memo:"家族の夕食",     isFixed:false, isBiz:false},
  {id:4,  date:"2026-05-03", amount:1580,  category:"日用品",   payee:"ドラッグストア",memo:"シャンプー等",   isFixed:false, isBiz:false},
  {id:5,  date:"2026-05-05", amount:4500,  category:"娯楽",     payee:"映画",         memo:"GWお出かけ",    isFixed:false, isBiz:false},
  {id:6,  date:"2026-05-07", amount:8200,  category:"光熱費",   payee:"電力会社",     memo:"4月分",         isFixed:true,  isBiz:false},
  {id:7,  date:"2026-05-07", amount:2300,  category:"通信費",   payee:"携帯会社",     memo:"",              isFixed:true,  isBiz:false},
  {id:8,  date:"2026-05-08", amount:6800,  category:"食費",     payee:"スーパー",     memo:"",              isFixed:false, isBiz:false},
  {id:9,  date:"2026-05-08", amount:1200,  category:"外食",     payee:"カフェ",       memo:"ランチ",        isFixed:false, isBiz:false},
  {id:10, date:"2026-05-10", amount:15000, category:"衣類",     payee:"ユニクロ",     memo:"春服まとめ買い", isFixed:false, isBiz:false},
  {id:11, date:"2026-05-10", amount:3500,  category:"医療・健康",payee:"病院",         memo:"定期検診",      isFixed:false, isBiz:false},
  {id:12, date:"2026-05-12", amount:890,   category:"食費",     payee:"コンビニ",     memo:"",              isFixed:false, isBiz:false},
  {id:13, date:"2026-05-12", amount:5400,  category:"教育",     payee:"書籍",         memo:"参考書",        isFixed:false, isBiz:false},
  {id:14, date:"2026-05-13", amount:2100,  category:"食費",     payee:"スーパー",     memo:"",              isFixed:false, isBiz:false},
  {id:15, date:"2026-05-13", amount:1800,  category:"外食",     payee:"カフェ",       memo:"友人と",        isFixed:false, isBiz:false},
  {id:16, date:"2026-05-14", amount:780,   category:"交通費",   payee:"電車・バス",   memo:"",              isFixed:false, isBiz:false},
  {id:17, date:"2026-05-02", amount:5500,  category:"通信費",   payee:"プロバイダ",   memo:"光回線",        isFixed:true,  isBiz:true},
  {id:18, date:"2026-05-08", amount:12000, category:"接待交際費",payee:"レストラン",   memo:"クライアント接待",isFixed:false, isBiz:true},
  {id:19, date:"2026-05-10", amount:3200,  category:"消耗品",   payee:"Amazon",       memo:"プリンターインク",isFixed:false, isBiz:true},
  {id:20, date:"2026-05-12", amount:8800,  category:"交通費",   payee:"新幹線",       memo:"出張 東京-大阪", isFixed:false, isBiz:true},
  {id:21, date:"2026-04-03", amount:11200, category:"食費",     payee:"スーパー",     memo:"",              isFixed:false, isBiz:false},
  {id:22, date:"2026-04-05", amount:4200,  category:"外食",     payee:"レストラン",   memo:"",              isFixed:false, isBiz:false},
  {id:23, date:"2026-04-10", amount:8500,  category:"光熱費",   payee:"電力会社",     memo:"3月分",         isFixed:true,  isBiz:false},
  {id:24, date:"2026-04-15", amount:25000, category:"医療・健康",payee:"歯科",         memo:"矯正",          isFixed:false, isBiz:false},
  {id:25, date:"2026-04-20", amount:6800,  category:"娯楽",     payee:"サブスク",     memo:"Netflix等",     isFixed:true,  isBiz:false},
  {id:26, date:"2026-04-22", amount:3300,  category:"日用品",   payee:"ホームセンター",memo:"",              isFixed:false, isBiz:false},
  {id:27, date:"2026-03-05", amount:9800,  category:"食費",     payee:"スーパー",     memo:"",              isFixed:false, isBiz:false},
  {id:28, date:"2026-03-12", amount:18000, category:"衣類",     payee:"ZARA",         memo:"冬物セール",    isFixed:false, isBiz:false},
  {id:29, date:"2026-03-15", amount:7600,  category:"光熱費",   payee:"電力会社",     memo:"2月分",         isFixed:true,  isBiz:false},
  {id:30, date:"2026-03-20", amount:12000, category:"教育",     payee:"セミナー",     memo:"",              isFixed:false, isBiz:false},
];

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES     = ["食費","交通費","日用品","娯楽","医療・健康","美容","光熱費","通信費","外食","衣類","教育","その他"];
const DEFAULT_BIZ_CATEGORIES = ["通信費","交通費","消耗品","接待交際費","広告宣伝費","外注費","地代家賃","水道光熱費","その他経費"];
const DEFAULT_CAT_PAYEES = {
  "食費":["スーパー","コンビニ","業務スーパー"],
  "交通費":["電車・バス","タクシー","新幹線","飛行機"],
  "外食":["カフェ","レストラン","ファストフード"],
  "日用品":["ドラッグストア","ホームセンター","100均"],
  "娯楽":["映画","ゲーム","サブスク"],
  "医療・健康":["病院","薬局","歯科"],
  "美容":["美容院","コスメ","エステ"],
  "光熱費":["電力会社","ガス会社","水道局"],
  "通信費":["携帯会社","プロバイダ","NHK"],
  "衣類":["ユニクロ","ZARA","GU"],
  "教育":["書籍","セミナー","塾・教室"],
  "その他":["Amazon","楽天","その他"],
};
const DEFAULT_BIZ_CAT_PAYEES = {
  "通信費":["携帯会社","プロバイダ"],
  "交通費":["電車・バス","タクシー","新幹線","飛行機"],
  "消耗品":["Amazon","ホームセンター","文具店"],
  "接待交際費":["レストラン","カフェ","贈答品"],
  "広告宣伝費":["Google","Meta","媒体社"],
  "外注費":["フリーランサー","制作会社"],
  "地代家賃":["不動産会社"],
  "水道光熱費":["電力会社","ガス会社","水道局"],
  "その他経費":["その他"],
};

const GAS_URL = (typeof localStorage !== "undefined" && localStorage.getItem("kakeibo_gas_url")) || "";

const pad      = n => String(n).padStart(2,"0");
const fmtDate  = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fmtYen   = n => `¥${Number(n).toLocaleString()}`;
const todayStr = () => fmtDate(new Date());
const MONTHS   = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const DAYS     = ["日","月","火","水","木","金","土"];
const PALETTE  = ["#4f7cac","#6dbf9e","#f0a500","#e07a5f","#9c89b8","#f18f01","#44bba4","#e94f37","#adb5bd","#5c677d","#b5838d","#6d6875"];

const gasPost = async (body) => {
  if(!GAS_URL) return {ok:false};
  const res = await fetch(GAS_URL, { method:"POST", body:JSON.stringify(body) });
  return res.json();
};

// ── TagEditor ─────────────────────────────────────────────────────────────────
function TagEditor({ title, items, onSave, onClose }) {
  const [list, setList] = useState([...items]);
  const [input, setInput] = useState("");
  const add = () => { const v=input.trim(); if(v&&!list.includes(v)){setList([...list,v]);setInput("");} };
  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <h3 style={S.modalTitle}>{title}の編集</h3>
        <div style={S.tagList}>
          {list.map((item,i)=>(
            <span key={i} style={S.tag}>{item}
              <button style={S.tagDel} onClick={()=>setList(list.filter((_,j)=>j!==i))}>×</button>
            </span>
          ))}
        </div>
        <div style={S.tagInputRow}>
          <input style={S.tagInput} value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&add()} placeholder="新しい項目を追加" />
          <button style={S.addBtn} onClick={add}>追加</button>
        </div>
        <div style={S.modalBtns}>
          <button style={S.cancelBtn} onClick={onClose}>キャンセル</button>
          <button style={S.saveBtn} onClick={()=>{onSave(list);onClose();}}>保存</button>
        </div>
      </div>
    </div>
  );
}

// ── CatPayeeEditor ────────────────────────────────────────────────────────────
function CatPayeeEditor({ categories, catPayees, onSave, onClose }) {
  const [map, setMap] = useState(()=>{ const m={}; categories.forEach(c=>{m[c]=[...(catPayees[c]||[])]}); return m; });
  const [selCat, setSelCat] = useState(categories[0]||"");
  const [input, setInput] = useState("");
  const add = () => {
    const v=input.trim();
    if(v&&selCat&&!(map[selCat]||[]).includes(v)){ setMap(m=>({...m,[selCat]:[...(m[selCat]||[]),v]})); setInput(""); }
  };
  return (
    <div style={S.overlay}>
      <div style={{...S.modal,maxWidth:520}}>
        <h3 style={S.modalTitle}>カテゴリー別 支払い先の編集</h3>
        <div style={S.catTabBar}>
          {categories.map(c=>(
            <button key={c} style={{...S.catTab,...(selCat===c?S.catTabActive:{})}} onClick={()=>setSelCat(c)}>{c}</button>
          ))}
        </div>
        <div style={{...S.tagList,marginTop:12}}>
          {(map[selCat]||[]).map((p,i)=>(
            <span key={i} style={S.tag}>{p}
              <button style={S.tagDel} onClick={()=>setMap(m=>({...m,[selCat]:m[selCat].filter((_,j)=>j!==i)}))}>×</button>
            </span>
          ))}
          {(map[selCat]||[]).length===0&&<span style={{color:"#bbb",fontSize:13}}>まだ登録なし</span>}
        </div>
        <div style={S.tagInputRow}>
          <input style={S.tagInput} value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&add()} placeholder={`${selCat}の支払い先を追加`} />
          <button style={S.addBtn} onClick={add}>追加</button>
        </div>
        <div style={S.modalBtns}>
          <button style={S.cancelBtn} onClick={onClose}>キャンセル</button>
          <button style={S.saveBtn} onClick={()=>{onSave(map);onClose();}}>保存</button>
        </div>
      </div>
    </div>
  );
}


// ── FixedCandidateRow: 固定費候補の1行 ───────────────────────────────────────
function FixedCandidateRow({ item, catColors, isRecorded, viewYear, viewMonth, onRecord }) {
  const pad = n => String(n).padStart(2,"0");
  const [amount, setAmount] = useState(String(item.amount));
  const [date,   setDate]   = useState(`${viewYear}-${pad(viewMonth)}-${pad(item.day)}`);
  const [open,   setOpen]   = useState(false);

  return (
    <div style={{border:"1px solid #eeeee9", borderRadius:12, marginBottom:8, overflow:"hidden"}}>
      {/* メイン行 */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px"}}>
        <span style={{width:10,height:10,borderRadius:"50%",background:catColors[item.category]||"#aaa",flexShrink:0,display:"inline-block"}} />
        <div style={{flex:1}}>
          <div style={{fontWeight:600,fontSize:14}}>{item.name}</div>
          <div style={{fontSize:11,color:"#aaa",marginTop:2}}>{item.category}{item.payee&&` · ${item.payee}`}</div>
        </div>
        <div style={{fontSize:15,fontWeight:700,marginRight:8}}>{fmtYen(item.amount)}</div>
        {isRecorded
          ? <span style={{fontSize:12,color:"#6dbf9e",fontWeight:600,padding:"4px 10px",border:"1px solid #6dbf9e",borderRadius:20}}>記録済み ✓</span>
          : <button style={{padding:"6px 14px",background:"#1a1a1a",color:"#fff",border:"none",borderRadius:20,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
              onClick={()=>setOpen(o=>!o)}>
              {open?"閉じる":"記録する"}
            </button>
        }
      </div>
      {/* 展開パネル（日付・金額を調整して記録） */}
      {open && !isRecorded && (
        <div style={{background:"#f7f7f4",borderTop:"1px solid #eeeee9",padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:120}}>
            <label style={{fontSize:11,fontWeight:600,color:"#888",display:"block",marginBottom:4}}>日付</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              style={{width:"100%",boxSizing:"border-box",padding:"7px 10px",border:"1px solid #e0e0dc",borderRadius:8,fontSize:14,fontFamily:"inherit",background:"#fff"}} />
          </div>
          <div style={{flex:1,minWidth:120}}>
            <label style={{fontSize:11,fontWeight:600,color:"#888",display:"block",marginBottom:4}}>金額（円）</label>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
              style={{width:"100%",boxSizing:"border-box",padding:"7px 10px",border:"1px solid #e0e0dc",borderRadius:8,fontSize:14,fontFamily:"inherit",background:"#fff"}} />
          </div>
          <button
            style={{padding:"8px 20px",background:"#4f7cac",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}
            onClick={()=>{ if(amount&&date){onRecord(item,amount,date);setOpen(false);} }}>
            この金額で記録
          </button>
        </div>
      )}
    </div>
  );
}

// ── FixedCostEditor ───────────────────────────────────────────────────────────
function FixedCostEditor({ fixedCosts, categories, catColors, onSave, onClose }) {
  const [list, setList] = useState(fixedCosts.map(f=>({...f})));
  const [form, setForm] = useState({name:"",amount:"",category:"",payee:"",day:1});
  const add = () => {
    if(!form.name||!form.amount||!form.category) return;
    setList([...list,{id:Date.now(),...form,amount:Number(form.amount)}]);
    setForm({name:"",amount:"",category:"",payee:"",day:1});
  };
  return (
    <div style={S.overlay}>
      <div style={{...S.modal,maxWidth:520}}>
        <h3 style={S.modalTitle}>固定費の管理</h3>
        <div style={{marginBottom:16}}>
          {list.map((f,i)=>(
            <div key={f.id} style={S.fixedRow}>
              <span style={{...S.dot,background:catColors[f.category]||"#aaa"}} />
              <span style={{flex:1,fontSize:14,fontWeight:600}}>{f.name}</span>
              <span style={{fontSize:12,color:"#888",marginRight:8}}>毎月{f.day}日</span>
              <span style={{fontSize:14,fontWeight:700,marginRight:8}}>{fmtYen(f.amount)}</span>
              <button style={S.tagDel} onClick={()=>setList(list.filter((_,j)=>j!==i))}>×</button>
            </div>
          ))}
          {list.length===0&&<p style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"12px 0"}}>固定費はまだありません</p>}
        </div>
        <div style={{borderTop:"1px solid #eee",paddingTop:16}}>
          <p style={{fontSize:12,fontWeight:600,color:"#888",marginBottom:10}}>新しい固定費を追加</p>
          <div style={S.fixedFormGrid}>
            <input style={S.tagInput} placeholder="名称（例：家賃）" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            <input style={S.tagInput} type="number" placeholder="金額" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
            <select style={S.tagInput} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
              <option value="">カテゴリー</option>
              {categories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select style={S.tagInput} value={form.day} onChange={e=>setForm(f=>({...f,day:Number(e.target.value)}))}>
              {Array.from({length:28},(_,i)=>i+1).map(d=><option key={d} value={d}>{d}日</option>)}
            </select>
          </div>
          <input style={{...S.tagInput,marginTop:8,width:"100%",boxSizing:"border-box"}}
            placeholder="支払い先（任意）" value={form.payee} onChange={e=>setForm(f=>({...f,payee:e.target.value}))} />
          <button style={{...S.addBtn,width:"100%",marginTop:8,padding:"10px"}} onClick={add}>追加</button>
        </div>
        <div style={{...S.modalBtns,marginTop:16}}>
          <button style={S.cancelBtn} onClick={onClose}>キャンセル</button>
          <button style={S.saveBtn} onClick={()=>{onSave(list);onClose();}}>保存</button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]     = useState("input");
  const [syncing, setSyncing] = useState(false);
  const [records, setRecords] = useState(SAMPLE_RECORDS);
  const [categories,    setCategories]    = useState(DEFAULT_CATEGORIES);
  const [catPayees,     setCatPayees]     = useState(DEFAULT_CAT_PAYEES);
  const [bizCategories, setBizCategories] = useState(DEFAULT_BIZ_CATEGORIES);
  const [bizCatPayees,  setBizCatPayees]  = useState(DEFAULT_BIZ_CAT_PAYEES);
  const [fixedCosts,    setFixedCosts]    = useState([]);
  const [form, setForm]   = useState({date:todayStr(),amount:"",category:"",payee:"",memo:"",isFixed:false,isBiz:false,bizCategory:""});
  const [editingCat,          setEditingCat]          = useState(false);
  const [editingCatPayee,     setEditingCatPayee]     = useState(false);
  const [editingBizCat,       setEditingBizCat]       = useState(false);
  const [editingBizCatPayee,  setEditingBizCatPayee]  = useState(false);
  const [editingFixed,        setEditingFixed]        = useState(false);
  const [viewYear,     setViewYear]     = useState(new Date().getFullYear());
  const [viewMonth,    setViewMonth]    = useState(new Date().getMonth()+1);
  const [bizViewYear,  setBizViewYear]  = useState(new Date().getFullYear());
  const [bizViewMonth, setBizViewMonth] = useState(new Date().getMonth()+1);
  const [expandedDate, setExpandedDate] = useState(null);
  const [expandedCat,  setExpandedCat]  = useState(null);
  const [toast, setToast] = useState({msg:"",type:"info"});

  const catColors    = {}; categories.forEach((c,i)=>{catColors[c]=PALETTE[i%PALETTE.length];});
  const bizCatColors = {}; bizCategories.forEach((c,i)=>{bizCatColors[c]=PALETTE[(i+4)%PALETTE.length];});

  const showToast = (msg,type="info") => { setToast({msg,type}); setTimeout(()=>setToast({msg:"",type:"info"}),2200); };

  const syncPost = async (body) => {
    if(!GAS_URL) return;
    setSyncing(true);
    try { await gasPost(body); } catch(e) { console.warn("GAS sync error:", e); }
    setSyncing(false);
  };

  const addRecord = () => {
    const bizCat    = form.isBiz ? form.bizCategory : null;
    const normalCat = form.category;
    const primaryCat = bizCat || normalCat;
    if(!form.amount||!primaryCat||!form.date){ showToast("日付・金額・カテゴリーは必須です","error"); return; }

    const baseRec = {date:form.date, amount:Number(form.amount),
      payee:form.payee||"", memo:form.memo||"", isFixed:form.isFixed};

    const newRecs = [];

    // 事業経費レコード（bizCatが選ばれている場合）
    if(bizCat){
      newRecs.push({...baseRec, id:Date.now(), category:bizCat, isBiz:true});
    }

    // 通常カテゴリーレコード（normalCatが選ばれている場合）
    // 事業経費ONでも通常カテゴリーが選択されていれば家計側にも記録
    if(normalCat){
      newRecs.push({...baseRec, id:Date.now()+1, category:normalCat, isBiz:false});
    }

    // bizCatもnormalCatもない場合は弾く（上でチェック済み）
    const rec = newRecs[0]; // 固定費判定用に先頭を使う
    setRecords(prev=>[...prev,...newRecs]);
    // 固定費ONで記録したら、同名候補がなければ固定費候補に自動追加
    if(form.isFixed){
      const name = form.memo||cat;
      const day  = Number(form.date.split("-")[2]);
      const already = fixedCosts.some(f=>f.name===name&&f.category===cat);
      if(!already){
        const newFixed = {id:Date.now()+1, name, amount:Number(form.amount), category:cat, payee:form.payee||"", day};
        const updated  = [...fixedCosts, newFixed];
        setFixedCosts(updated);
        saveSettings({fixedCosts:updated});
        showToast(`「${name}」を固定費候補に追加しました ✓`);
      } else {
        showToast("記録しました ✓");
      }
    } else {
      showToast("記録しました ✓");
    }
    setForm(f=>({...f,amount:"",memo:"",payee:"",isFixed:false,isBiz:false,bizCategory:""}));
    if(newRecs.length>1){
      syncPost({action:"addRecords",records:newRecs});
    } else {
      syncPost({action:"addRecord",record:newRecs[0]});
    }
  };

  const deleteRecord = (id) => {
    setRecords(prev=>prev.filter(r=>r.id!==id));
    syncPost({action:"deleteRecord",id});
  };

  const applyFixedCosts = () => {
    const prefix=`${viewYear}-${pad(viewMonth)}`;
    if(records.some(r=>r.date.startsWith(prefix)&&r.isFixed)){ showToast("今月はすでに適用済みです","error"); return; }
    const newRecs=fixedCosts.map(f=>({id:Date.now()+Math.random(),isFixed:true,isBiz:false,
      date:`${prefix}-${pad(f.day)}`,amount:f.amount,category:f.category,payee:f.payee||"",memo:f.name}));
    setRecords(prev=>[...prev,...newRecs]);
    showToast(`${newRecs.length}件の固定費を記録しました`);
    syncPost({action:"addRecords",records:newRecs});
  };

  const saveSettings = (patch) => { if(GAS_URL) syncPost({action:"saveAllSettings",settings:patch}); };

  // ── 月間データ ──
  const monthRecords = records.filter(r=>{
    const [y,m]=r.date.split("-").map(Number); return y===viewYear&&m===viewMonth&&!r.isBiz;
  });
  const byDate={};
  monthRecords.forEach(r=>{ if(!byDate[r.date])byDate[r.date]={}; byDate[r.date][r.category]=(byDate[r.date][r.category]||0)+r.amount; });
  const monthTotal = monthRecords.reduce((s,r)=>s+r.amount,0);
  const usedCats   = categories.filter(c=>monthRecords.some(r=>r.category===c));
  const catTotals  = {}; usedCats.forEach(c=>{catTotals[c]=monthRecords.filter(r=>r.category===c).reduce((s,r)=>s+r.amount,0);});

  // ── 年間データ ──
  const yearRecords  = records.filter(r=>r.date.startsWith(String(viewYear))&&!r.isBiz);
  const byMonth={}; for(let m=1;m<=12;m++) byMonth[m]={};
  yearRecords.forEach(r=>{ const m=Number(r.date.split("-")[1]); byMonth[m][r.category]=(byMonth[m][r.category]||0)+r.amount; });
  const yearUsedCats = categories.filter(c=>yearRecords.some(r=>r.category===c));

  // ── 事業経費データ ──
  const bizAllRecs   = records.filter(r=>r.isBiz);
  const bizMonthRecs = bizAllRecs.filter(r=>{ const [y,m]=r.date.split("-").map(Number); return y===bizViewYear&&m===bizViewMonth; });
  const bizMonthTotal= bizMonthRecs.reduce((s,r)=>s+r.amount,0);
  const bizUsedCats  = bizCategories.filter(c=>bizMonthRecs.some(r=>r.category===c));
  const bizCatTotals = {}; bizUsedCats.forEach(c=>{bizCatTotals[c]=bizMonthRecs.filter(r=>r.category===c).reduce((s,r)=>s+r.amount,0);});
  const bizYearRecs  = bizAllRecs.filter(r=>r.date.startsWith(String(bizViewYear)));
  const bizByMonth={}; for(let m=1;m<=12;m++) bizByMonth[m]={};
  bizYearRecs.forEach(r=>{ const m=Number(r.date.split("-")[1]); bizByMonth[m][r.category]=(bizByMonth[m][r.category]||0)+r.amount; });
  const bizYearUsedCats = bizCategories.filter(c=>bizYearRecs.some(r=>r.category===c));

  const todayDate    = todayStr();
  const fixedTotal   = fixedCosts.reduce((s,f)=>s+f.amount,0);
  const payeesToShow = form.isBiz&&form.bizCategory ? (bizCatPayees[form.bizCategory]||[])
                     : form.category                 ? (catPayees[form.category]||[]) : [];

  return (
    <div style={S.app}>
      {toast.msg && <div style={{...S.toast,...(toast.type==="error"?{background:"#e07a5f"}:{})}}>{toast.msg}</div>}

      {/* ヘッダー */}
      <header style={S.header}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={S.logo}>家計簿</span>
          {syncing && <span style={S.syncBadge}>同期中...</span>}
        </div>
        <nav style={S.nav}>
          {[["input","入力"],["monthly","月間"],["yearly","年間"],["biz","事業経費"],["fixed","固定費"]].map(([key,label])=>(
            <button key={key} style={{...S.navBtn,...(tab===key?S.navActive:{})}} onClick={()=>setTab(key)}>{label}</button>
          ))}
        </nav>
      </header>

      <main style={S.main}>

        {/* ══ 入力 ══ */}
        {tab==="input" && (
          <div style={S.card}>
            <h2 style={S.cardTitle}>支出を記録</h2>
            <div>
              <label style={{...S.label,marginTop:0}}>日付</label>
              <div style={{position:"relative"}}>
                <input
                  style={{...S.input, color:"transparent", position:"absolute", top:0, left:0, opacity:0, width:"100%", height:"100%", zIndex:2}}
                  type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
                <div style={{...S.input, color:"#1a1a1a", pointerEvents:"none", position:"relative", zIndex:1}}>
                  {form.date ? (() => { const [y,m,d]=form.date.split("-"); return `${y}年${m}月${d}日`; })() : "日付を選択"}
                </div>
              </div>
            </div>
            <div style={{marginTop:10}}>
              <label style={{...S.label,marginTop:0}}>金額（円）</label>
              <input style={{...S.input,fontSize:22,fontWeight:700,textAlign:"right"}} type="number" placeholder="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
            </div>

            <div style={S.toggleRow}>
              <button style={{...S.toggleBtn,...(form.isFixed?S.toggleOn:{})}} onClick={()=>setForm(f=>({...f,isFixed:!f.isFixed}))}>📌 固定費</button>
              <button style={{...S.toggleBtn,...(form.isBiz?S.toggleOnBiz:{})}} onClick={()=>setForm(f=>({...f,isBiz:!f.isBiz,bizCategory:"",payee:""}))}>💼 事業経費</button>
            </div>

            {!form.isBiz && (
              <div>
                <div style={S.rowLabel}>
                  <label style={{...S.label,marginTop:0}}>カテゴリー</label>
                  <button style={S.editLink} onClick={()=>setEditingCat(true)}>編集</button>
                </div>
                <div style={S.chips}>
                  {categories.map(c=>(
                    <button key={c} style={{...S.chip,...(form.category===c?{background:catColors[c],color:"#fff",borderColor:catColors[c]}:{})}}
                      onClick={()=>setForm(f=>({...f,category:c,payee:""}))}>{c}</button>
                  ))}
                </div>
              </div>
            )}

            {form.isBiz && (
              <div style={S.bizCatSection}>
                {/* 事業経費カテゴリー */}
                <div style={S.rowLabel}>
                  <label style={{...S.label,marginTop:0,color:"#3aaa82"}}>💼 事業カテゴリー</label>
                  <button style={S.editLink} onClick={()=>setEditingBizCat(true)}>編集</button>
                </div>
                <div style={S.chips}>
                  {bizCategories.map(c=>(
                    <button key={c}
                      style={{...S.chip,...(form.bizCategory===c
                        ?{background:bizCatColors[c],color:"#fff",borderColor:bizCatColors[c]}
                        :{borderColor:"#6dbf9e",color:"#3aaa82"})}}
                      onClick={()=>setForm(f=>({...f,bizCategory:f.bizCategory===c?"":c,payee:""}))}>
                      {c}
                    </button>
                  ))}
                </div>

                {/* 家計カテゴリーも同時記録 */}
                <div style={{marginTop:10,paddingTop:10,borderTop:"1px dashed #b2e0d0"}}>
                  <div style={S.rowLabel}>
                    <label style={{...S.label,marginTop:0,color:"#888"}}>
                      家計カテゴリーにも記録
                      {form.category&&<span style={{marginLeft:6,color:"#4f7cac",fontWeight:700}}>ON</span>}
                    </label>
                    <button style={S.editLink} onClick={()=>setEditingCat(true)}>編集</button>
                  </div>
                  <p style={{fontSize:11,color:"#aaa",marginBottom:8}}>
                    例）事業では「消耗品」、家計では「日用品」として両方に記録されます
                  </p>
                  <div style={S.chips}>
                    {categories.map(c=>(
                      <button key={c}
                        style={{...S.chip,...(form.category===c
                          ?{background:catColors[c],color:"#fff",borderColor:catColors[c]}
                          :{})}}
                        onClick={()=>setForm(f=>({...f,category:f.category===c?"":c,payee:""}))}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {payeesToShow.length>0 && (
              <div>
                <div style={S.rowLabel}>
                  <label style={{...S.label,marginTop:0}}>支払い先</label>
                  <button style={S.editLink} onClick={()=>form.isBiz?setEditingBizCatPayee(true):setEditingCatPayee(true)}>編集</button>
                </div>
                <div style={S.chips}>
                  {payeesToShow.map(p=>(
                    <button key={p} style={{...S.chip,...(form.payee===p?{background:"#333",color:"#fff",borderColor:"#333"}:{})}}
                      onClick={()=>setForm(f=>({...f,payee:p}))}>{p}</button>
                  ))}
                </div>
              </div>
            )}
            {payeesToShow.length===0 && (form.category||form.bizCategory) && (
              <div style={{marginTop:8}}>
                <button style={S.editLink} onClick={()=>form.isBiz?setEditingBizCatPayee(true):setEditingCatPayee(true)}>
                  + このカテゴリーの支払い先を登録する
                </button>
              </div>
            )}

            <label style={S.label}>メモ</label>
            <input style={S.input} placeholder="任意" value={form.memo} onChange={e=>setForm(f=>({...f,memo:e.target.value}))} />

            <button style={S.primaryBtn} onClick={addRecord}>記録する</button>

            {records.length>0 && (
              <div style={{marginTop:28}}>
                <p style={S.sectionTitle}>最近の記録</p>
                {[...records].reverse().slice(0,10).map(r=>(
                  <div key={r.id} style={S.recRow}>
                    <span style={{...S.dot,background:(r.isBiz?bizCatColors:catColors)[r.category]||"#aaa",marginTop:5}} />
                    <div style={S.recInfo}>
                      <span style={S.recCat}>{r.category}</span>
                      {r.payee&&<span style={S.recPayee}> · {r.payee}</span>}
                      {r.memo&&<span style={S.recMemo}> — {r.memo}</span>}
                      <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
                        <span style={S.recDate}>{r.date}</span>
                        {r.isFixed&&<span style={S.badgeFixed}>固定費</span>}
                        {r.isBiz&&<span style={S.badgeBiz}>事業経費</span>}
                      </div>
                    </div>
                    <span style={S.recAmt}>{fmtYen(r.amount)}</span>
                    <button style={S.delBtn} onClick={()=>deleteRecord(r.id)}>×</button>
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
              <button style={S.arrowBtn} onClick={()=>{ setExpandedDate(null); setExpandedCat(null); if(viewMonth===1){setViewMonth(12);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); }}>◀</button>
              <h2 style={S.cardTitle}>{viewYear}年 {viewMonth}月</h2>
              <button style={S.arrowBtn} onClick={()=>{ setExpandedDate(null); setExpandedCat(null); if(viewMonth===12){setViewMonth(1);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); }}>▶</button>
            </div>

            {/* サマリー */}
            <div style={S.summaryBox}>
              <div style={S.summaryTotal}>
                <span style={S.summaryLabel}>月合計</span>
                <span style={S.summaryAmt}>{fmtYen(monthTotal)}</span>
              </div>
              {monthTotal>0 && (
                <div>
                  <div style={S.barTrack}>
                    {usedCats.map(c=><div key={c} style={{width:`${catTotals[c]/monthTotal*100}%`,background:catColors[c],height:"100%"}} />)}
                  </div>
                  <div style={S.catSummaryList}>
                    {usedCats.map(c=>{
                      const isOpen=expandedCat===c;
                      const recs=monthRecords.filter(r=>r.category===c);
                      return (
                        <div key={c}>
                          <div style={{...S.catSummaryRow,...(isOpen?S.catSummaryRowOpen:{})}} onClick={()=>setExpandedCat(isOpen?null:c)}>
                            <span style={{...S.dot,background:catColors[c],width:10,height:10}} />
                            <span style={S.catSummaryName}>{c}</span>
                            <span style={S.catSummaryPct}>{Math.round(catTotals[c]/monthTotal*100)}%</span>
                            <span style={S.catSummaryAmt}>{fmtYen(catTotals[c])}</span>
                            <span style={S.chevron}>{isOpen?"▲":"▼"}</span>
                          </div>
                          {isOpen && (
                            <div style={S.catBreakdown}>
                              {recs.map(r=>(
                                <div key={r.id} style={S.catBreakdownRow}>
                                  <span style={S.catBreakdownDate}>{r.date.slice(5).replace("-","/")} {DAYS[new Date(r.date).getDay()]}</span>
                                  <span style={S.catBreakdownPayee}>{r.payee||""}</span>
                                  {r.memo&&<span style={S.catBreakdownMemo}>「{r.memo}」</span>}
                                  <span style={S.catBreakdownAmt}>{fmtYen(r.amount)}</span>
                                  <button style={S.delBtn} onClick={()=>deleteRecord(r.id)}>×</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {monthTotal===0 && <p style={S.empty}>この月の記録はありません</p>}
            </div>

            {/* 日別テーブル（カテゴリー固定列） */}
            {Object.keys(byDate).length>0 && (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={{...S.th,...S.thSticky}}>日付</th>
                      {usedCats.map(c=>(
                        <th key={c} style={S.th}>
                          <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:catColors[c],marginRight:4,verticalAlign:"middle"}} />
                          {c}
                        </th>
                      ))}
                      <th style={{...S.th,...S.thTotal}}>合計</th>
                    </tr>
                    <tr style={S.trSum}>
                      <td style={{...S.td,...S.thSticky,fontWeight:700,background:"#f5f5f0"}}>月計</td>
                      {usedCats.map(c=>(
                        <td key={c} style={{...S.td,fontWeight:700}}>{fmtYen(catTotals[c])}</td>
                      ))}
                      <td style={{...S.td,...S.tdTotal,fontWeight:700}}>{fmtYen(monthTotal)}</td>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(byDate).sort().map(date=>{
                      const dayTotal=Object.values(byDate[date]).reduce((a,b)=>a+b,0);
                      const dow=DAYS[new Date(date).getDay()];
                      const isSun=new Date(date).getDay()===0;
                      const isSat=new Date(date).getDay()===6;
                      const isToday=date===todayDate;
                      const dayRecs=monthRecords.filter(r=>r.date===date);
                      const dateColor=isSun?"#e07a5f":isSat?"#4f7cac":"#444";
                      return (
                        <Fragment key={date}>
                          <tr style={isToday?S.trToday:{}}>
                            <td style={{...S.td,...S.thSticky,color:dateColor,background:isToday?"#eef4fb":"#fff"}}>
                              {date.slice(5).replace("-","/")}
                              <span style={{fontSize:11,color:dateColor,opacity:.7,marginLeft:3}}>{dow}</span>
                              {isToday&&<span style={S.todayBadge}>今日</span>}
                            </td>
                            {usedCats.map(c=>{
                              const amt=byDate[date][c];
                              const cellKey=`${date}:${c}`;
                              const isOpen=expandedDate===cellKey;
                              return (
                                <td key={c}
                                  style={{...S.td,...(amt?{cursor:"pointer"}:{}),...(isOpen?{background:catColors[c]+"22"}:{})}}
                                  onClick={()=>{ if(amt) setExpandedDate(isOpen?null:cellKey); }}>
                                  {amt
                                    ? <span style={{color:catColors[c],fontWeight:600}}>{fmtYen(amt)}{isOpen&&<span style={{fontSize:9,marginLeft:2}}>▲</span>}</span>
                                    : <span style={S.dash}>—</span>}
                                </td>
                              );
                            })}
                            <td style={{...S.td,...S.tdTotal}}>{fmtYen(dayTotal)}</td>
                          </tr>
                          {usedCats.map(c=>{
                            const cellKey=`${date}:${c}`;
                            if(expandedDate!==cellKey) return null;
                            const recs=dayRecs.filter(r=>r.category===c);
                            return (
                              <tr key={cellKey+"-d"} style={{background:"#f7f7f4"}}>
                                <td colSpan={usedCats.length+2} style={{padding:"6px 12px 10px",borderBottom:"2px solid #e0e0da"}}>
                                  <div style={{fontSize:11,fontWeight:700,color:"#888",marginBottom:6,letterSpacing:.5}}>
                                    {date.slice(5).replace("-","/")} {dow} · {c}
                                  </div>
                                  {recs.map(r=>(
                                    <div key={r.id} style={S.detailRow}>
                                      <span style={S.detailPayee}>{r.payee||"—"}</span>
                                      {r.memo&&<span style={S.detailMemo}>「{r.memo}」</span>}
                                      {r.isFixed&&<span style={S.badgeFixed}>固定</span>}
                                      <span style={S.detailAmt}>{fmtYen(r.amount)}</span>
                                      <button style={S.delBtn} onClick={()=>{deleteRecord(r.id);if(recs.length===1)setExpandedDate(null);}}>×</button>
                                    </div>
                                  ))}
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ 年間 ══ */}
        {tab==="yearly" && (
          <div style={S.card}>
            <div style={S.navRow}>
              <button style={S.arrowBtn} onClick={()=>setViewYear(y=>y-1)}>◀</button>
              <h2 style={S.cardTitle}>{viewYear}年</h2>
              <button style={S.arrowBtn} onClick={()=>setViewYear(y=>y+1)}>▶</button>
            </div>
            <div style={S.summaryBox}>
              <div style={S.summaryTotal}>
                <span style={S.summaryLabel}>年間合計</span>
                <span style={S.summaryAmt}>{fmtYen(yearRecords.reduce((s,r)=>s+r.amount,0))}</span>
              </div>
            </div>
            {yearRecords.length===0
              ? <p style={S.empty}>この年の記録はありません</p>
              : (
                <div style={S.tableWrap}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={{...S.th,...S.thSticky}}>月</th>
                        {yearUsedCats.map(c=>(
                          <th key={c} style={S.th}>
                            <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:catColors[c],marginRight:4,verticalAlign:"middle"}} />
                            {c}
                          </th>
                        ))}
                        <th style={{...S.th,...S.thTotal}}>合計</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MONTHS.map((mLabel,mi)=>{
                        const m=mi+1;
                        const total=Object.values(byMonth[m]).reduce((a,b)=>a+b,0);
                        const isCur=viewYear===new Date().getFullYear()&&m===new Date().getMonth()+1;
                        return (
                          <tr key={m} style={{...(mi%2===0?S.trEven:S.trOdd),...(isCur?S.trToday:{})}}>
                            <td style={{...S.td,...S.thSticky,fontWeight:600,background:isCur?"#eef4fb":mi%2===0?"#fff":"#fdfdfb"}}>
                              {mLabel}{isCur&&<span style={S.todayBadge}>今月</span>}
                            </td>
                            {yearUsedCats.map(c=>(
                              <td key={c} style={S.td}>{byMonth[m][c]?fmtYen(byMonth[m][c]):<span style={S.dash}>—</span>}</td>
                            ))}
                            <td style={{...S.td,...S.tdTotal}}>{total>0?fmtYen(total):<span style={S.dash}>—</span>}</td>
                          </tr>
                        );
                      })}
                      <tr style={S.trSum}>
                        <td style={{...S.td,...S.thSticky,fontWeight:700,background:"#f5f5f0"}}>年計</td>
                        {yearUsedCats.map(c=>{
                          const s=yearRecords.filter(r=>r.category===c).reduce((a,r)=>a+r.amount,0);
                          return <td key={c} style={{...S.td,fontWeight:700}}>{fmtYen(s)}</td>;
                        })}
                        <td style={{...S.td,...S.tdTotal,fontWeight:700}}>{fmtYen(yearRecords.reduce((s,r)=>s+r.amount,0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        )}

        {/* ══ 事業経費 ══ */}
        {tab==="biz" && (
          <div style={S.card}>
            <h2 style={S.cardTitle}>💼 事業経費</h2>
            <div style={S.navRow}>
              <button style={S.arrowBtn} onClick={()=>{ if(bizViewMonth===1){setBizViewMonth(12);setBizViewYear(y=>y-1);}else setBizViewMonth(m=>m-1); }}>◀</button>
              <span style={{fontWeight:600,fontSize:15}}>{bizViewYear}年 {bizViewMonth}月</span>
              <button style={S.arrowBtn} onClick={()=>{ if(bizViewMonth===12){setBizViewMonth(1);setBizViewYear(y=>y+1);}else setBizViewMonth(m=>m+1); }}>▶</button>
            </div>
            <div style={{...S.summaryBox,borderColor:"#b2e0d0"}}>
              <div style={S.summaryTotal}>
                <span style={S.summaryLabel}>月間事業経費合計</span>
                <span style={{...S.summaryAmt,color:"#3aaa82"}}>{fmtYen(bizMonthTotal)}</span>
              </div>
              {bizMonthTotal>0 && (
                <div>
                  <div style={S.barTrack}>
                    {bizUsedCats.map(c=><div key={c} style={{width:`${bizCatTotals[c]/bizMonthTotal*100}%`,background:bizCatColors[c],height:"100%"}} />)}
                  </div>
                  <div style={S.catSummaryList}>
                    {bizUsedCats.map(c=>{
                      const recs=bizMonthRecs.filter(r=>r.category===c);
                      const isOpen=expandedCat==="biz:"+c;
                      return (
                        <div key={c}>
                          <div style={{...S.catSummaryRow,...(isOpen?S.catSummaryRowOpen:{})}} onClick={()=>setExpandedCat(isOpen?null:"biz:"+c)}>
                            <span style={{...S.dot,background:bizCatColors[c],width:10,height:10}} />
                            <span style={S.catSummaryName}>{c}</span>
                            <span style={S.catSummaryPct}>{Math.round(bizCatTotals[c]/bizMonthTotal*100)}%</span>
                            <span style={S.catSummaryAmt}>{fmtYen(bizCatTotals[c])}</span>
                            <span style={S.chevron}>{isOpen?"▲":"▼"}</span>
                          </div>
                          {isOpen && (
                            <div style={S.catBreakdown}>
                              {recs.map(r=>(
                                <div key={r.id} style={S.catBreakdownRow}>
                                  <span style={S.catBreakdownDate}>{r.date.slice(5).replace("-","/")} {DAYS[new Date(r.date).getDay()]}</span>
                                  <span style={S.catBreakdownPayee}>{r.payee||""}</span>
                                  {r.memo&&<span style={S.catBreakdownMemo}>「{r.memo}」</span>}
                                  <span style={S.catBreakdownAmt}>{fmtYen(r.amount)}</span>
                                  <button style={S.delBtn} onClick={()=>deleteRecord(r.id)}>×</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {bizMonthTotal===0 && <p style={S.empty}>この月の事業経費はありません</p>}
            </div>
            <h3 style={{...S.sectionTitle,marginBottom:12,marginTop:8}}>{bizViewYear}年 月別推移</h3>
            {bizYearRecs.length===0
              ? <p style={S.empty}>この年の事業経費はありません</p>
              : (
                <div style={S.tableWrap}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={{...S.th,...S.thSticky}}>月</th>
                        {bizYearUsedCats.map(c=>(
                          <th key={c} style={S.th}>
                            <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:bizCatColors[c],marginRight:4,verticalAlign:"middle"}} />
                            {c}
                          </th>
                        ))}
                        <th style={{...S.th,...S.thTotal}}>合計</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MONTHS.map((mLabel,mi)=>{
                        const m=mi+1;
                        const total=Object.values(bizByMonth[m]).reduce((a,b)=>a+b,0);
                        const isCur=bizViewYear===new Date().getFullYear()&&m===new Date().getMonth()+1;
                        return (
                          <tr key={m} style={{...(mi%2===0?S.trEven:S.trOdd),...(isCur?S.trToday:{})}}>
                            <td style={{...S.td,...S.thSticky,fontWeight:600,background:isCur?"#eef4fb":mi%2===0?"#fff":"#fdfdfb"}}>
                              {mLabel}{isCur&&<span style={S.todayBadge}>今月</span>}
                            </td>
                            {bizYearUsedCats.map(c=>(
                              <td key={c} style={S.td}>{bizByMonth[m][c]?fmtYen(bizByMonth[m][c]):<span style={S.dash}>—</span>}</td>
                            ))}
                            <td style={{...S.td,...S.tdTotal}}>{total>0?fmtYen(total):<span style={S.dash}>—</span>}</td>
                          </tr>
                        );
                      })}
                      <tr style={S.trSum}>
                        <td style={{...S.td,...S.thSticky,fontWeight:700,background:"#f5f5f0"}}>年計</td>
                        {bizYearUsedCats.map(c=>{
                          const s=bizYearRecs.filter(r=>r.category===c).reduce((a,r)=>a+r.amount,0);
                          return <td key={c} style={{...S.td,fontWeight:700}}>{fmtYen(s)}</td>;
                        })}
                        <td style={{...S.td,...S.tdTotal,fontWeight:700}}>{fmtYen(bizYearRecs.reduce((s,r)=>s+r.amount,0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            }
            <div style={{marginTop:24,borderTop:"1px solid #f0f0ec",paddingTop:16}}>
              <p style={S.sectionTitle}>カテゴリー設定</p>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button style={{...S.primaryBtn,flex:1,marginTop:0,background:"#3aaa82",fontSize:13}} onClick={()=>setEditingBizCat(true)}>カテゴリーを編集</button>
                <button style={{...S.primaryBtn,flex:1,marginTop:0,background:"#5c9e7a",fontSize:13}} onClick={()=>setEditingBizCatPayee(true)}>支払い先を編集</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ 固定費 ══ */}
        {tab==="fixed" && (
          <div style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h2 style={{...S.cardTitle,marginBottom:0}}>📌 固定費候補</h2>
              <button style={S.editLink} onClick={()=>setEditingFixed(true)}>候補を編集</button>
            </div>

            {fixedCosts.length===0 ? (
              <div style={{textAlign:"center",padding:"32px 0"}}>
                <p style={{color:"#bbb",fontSize:14,marginBottom:16}}>固定費候補がまだありません</p>
                <button style={{...S.primaryBtn,width:"auto",padding:"10px 24px"}} onClick={()=>setEditingFixed(true)}>候補を追加する</button>
              </div>
            ) : (
              <div>
                <p style={{fontSize:12,color:"#aaa",marginBottom:16}}>記録したいものを選んで「記録する」を押してください。金額はその都度変更できます。</p>
                {fixedCosts.map(f=>{
                  const isRecorded = records.some(r=>
                    r.date.startsWith(`${viewYear}-${pad(viewMonth)}`) &&
                    r.memo===f.name && r.isFixed
                  );
                  return (
                    <FixedCandidateRow
                      key={f.id}
                      item={f}
                      catColors={catColors}
                      isRecorded={isRecorded}
                      viewYear={viewYear}
                      viewMonth={viewMonth}
                      onRecord={(item, amount, date)=>{
                        const rec={
                          id:Date.now(), isFixed:true, isBiz:false,
                          date, amount:Number(amount),
                          category:item.category, payee:item.payee||"", memo:item.name
                        };
                        setRecords(prev=>[...prev,rec]);
                        showToast(`${item.name} を記録しました ✓`);
                        syncPost({action:"addRecord",record:rec});
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {tab==="input" && <button style={S.fixedFab} onClick={()=>setTab("fixed")}>📌 固定費</button>}

      {editingCat        && <TagEditor title="カテゴリー" items={categories} onSave={list=>{setCategories(list);saveSettings({categories:list});}} onClose={()=>setEditingCat(false)} />}
      {editingBizCat     && <TagEditor title="事業経費カテゴリー" items={bizCategories} onSave={list=>{setBizCategories(list);saveSettings({bizCategories:list});}} onClose={()=>setEditingBizCat(false)} />}
      {editingCatPayee   && <CatPayeeEditor categories={categories} catPayees={catPayees} onSave={map=>{setCatPayees(map);saveSettings({catPayees:map});}} onClose={()=>setEditingCatPayee(false)} />}
      {editingBizCatPayee&& <CatPayeeEditor categories={bizCategories} catPayees={bizCatPayees} onSave={map=>{setBizCatPayees(map);saveSettings({bizCatPayees:map});}} onClose={()=>setEditingBizCatPayee(false)} />}
      {editingFixed      && <FixedCostEditor fixedCosts={fixedCosts} categories={categories} catColors={catColors} onSave={list=>{setFixedCosts(list);saveSettings({fixedCosts:list});}} onClose={()=>setEditingFixed(false)} />}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  app:             { fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif", background:"#f7f7f5", minHeight:"100vh", color:"#1a1a1a" },
  header:          { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"#fff", borderBottom:"1px solid #e8e8e5", position:"sticky", top:0, zIndex:100, gap:6, flexWrap:"wrap" },
  logo:            { fontSize:16, fontWeight:700, letterSpacing:2 },
  nav:             { display:"flex", gap:2, flexWrap:"wrap" },
  navBtn:          { padding:"5px 8px", border:"none", background:"transparent", borderRadius:20, fontSize:11, cursor:"pointer", color:"#555", fontFamily:"inherit" },
  navActive:       { background:"#1a1a1a", color:"#fff" },
  syncBadge:       { fontSize:11, color:"#4f7cac", background:"#eef4fb", borderRadius:10, padding:"2px 8px" },
  main:            { maxWidth:900, margin:"0 auto", padding:"16px 12px 100px", overflowX:"hidden" },
  card:            { background:"#fff", borderRadius:16, padding:"20px 16px", boxShadow:"0 1px 4px rgba(0,0,0,.06)", overflow:"hidden" },
  cardTitle:       { fontSize:18, fontWeight:700, marginBottom:20, textAlign:"center" },
  navRow:          { display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginBottom:16 },
  arrowBtn:        { background:"none", border:"1px solid #e0e0dc", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:14 },
  rowTwo:          { display:"flex", gap:12 },
  label:           { display:"block", fontSize:11, fontWeight:600, color:"#888", letterSpacing:1, textTransform:"uppercase", marginBottom:5, marginTop:14 },
  rowLabel:        { display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14, marginBottom:5 },
  editLink:        { fontSize:12, color:"#4f7cac", background:"none", border:"none", cursor:"pointer", padding:0 },
  input:           { width:"100%", boxSizing:"border-box", padding:"12px 14px", border:"1px solid #e0e0dc", borderRadius:10, fontSize:16, outline:"none", fontFamily:"inherit", background:"#fafaf8", display:"block" },
  chips:           { display:"flex", flexWrap:"wrap", gap:6 },
  chip:            { padding:"7px 14px", border:"1px solid #ddd", borderRadius:20, fontSize:13, background:"#fafaf8", cursor:"pointer", fontFamily:"inherit", transition:"all .15s" },
  primaryBtn:      { marginTop:12, width:"100%", padding:"16px", background:"#1a1a1a", color:"#fff", border:"none", borderRadius:12, fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
  toggleRow:       { display:"flex", gap:8, marginTop:14 },
  toggleBtn:       { flex:1, padding:"12px", border:"1px solid #ddd", borderRadius:10, fontSize:14, fontWeight:600, background:"#fafaf8", cursor:"pointer", fontFamily:"inherit", color:"#777" },
  toggleOn:        { background:"#4f7cac", color:"#fff", borderColor:"#4f7cac" },
  toggleOnBiz:     { background:"#3aaa82", color:"#fff", borderColor:"#3aaa82" },
  bizCatSection:   { background:"#edfaf5", borderRadius:10, padding:"12px", marginTop:10, border:"1px solid #b2e0d0" },
  sectionTitle:    { fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:1, textTransform:"uppercase", marginBottom:10 },
  recRow:          { display:"flex", alignItems:"flex-start", gap:10, padding:"10px 0", borderBottom:"1px solid #f0f0ec" },
  recInfo:         { flex:1, fontSize:14 },
  recCat:          { fontWeight:600 },
  recPayee:        { color:"#666" },
  recMemo:         { color:"#aaa" },
  recDate:         { fontSize:11, color:"#bbb" },
  recAmt:          { fontSize:15, fontWeight:700, flexShrink:0 },
  dot:             { width:8, height:8, borderRadius:"50%", flexShrink:0, display:"inline-block" },
  delBtn:          { background:"none", border:"none", color:"#ccc", cursor:"pointer", fontSize:16, padding:"0 2px", flexShrink:0 },
  badgeFixed:      { fontSize:10, background:"#eef4fb", color:"#4f7cac", borderRadius:4, padding:"1px 5px", fontWeight:600 },
  badgeBiz:        { fontSize:10, background:"#edfaf5", color:"#3aaa82", borderRadius:4, padding:"1px 5px", fontWeight:600 },
  summaryBox:      { background:"#fafaf8", borderRadius:12, padding:"16px", marginBottom:20, border:"1px solid #eeeee9" },
  summaryTotal:    { display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10 },
  summaryLabel:    { fontSize:11, fontWeight:600, color:"#888", letterSpacing:1, textTransform:"uppercase" },
  summaryAmt:      { fontSize:26, fontWeight:700 },
  barTrack:        { height:10, borderRadius:10, overflow:"hidden", background:"#eeeee9", display:"flex", marginBottom:12 },
  catSummaryList:  { display:"flex", flexDirection:"column", gap:1 },
  catSummaryRow:   { display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, cursor:"pointer" },
  catSummaryRowOpen:{ background:"#f0f0ec" },
  catSummaryName:  { flex:1, fontSize:14, fontWeight:500 },
  catSummaryPct:   { fontSize:12, color:"#aaa", minWidth:32, textAlign:"right" },
  catSummaryAmt:   { fontSize:14, fontWeight:700, minWidth:80, textAlign:"right" },
  chevron:         { fontSize:10, color:"#bbb", marginLeft:4 },
  catBreakdown:    { background:"#f7f7f4", borderRadius:8, margin:"2px 0 6px 28px" },
  catBreakdownRow: { display:"flex", alignItems:"center", gap:8, padding:"7px 12px", borderBottom:"1px solid #eeeee9", fontSize:13 },
  catBreakdownDate:{ color:"#888", minWidth:52, flexShrink:0 },
  catBreakdownPayee:{ color:"#555", flex:1 },
  catBreakdownMemo:{ color:"#aaa", fontSize:12 },
  catBreakdownAmt: { fontWeight:700, marginLeft:"auto", flexShrink:0 },
  empty:           { textAlign:"center", color:"#bbb", padding:"32px 0", fontSize:14 },
  tableWrap:       { overflowX:"auto", borderRadius:10, border:"1px solid #eeeee9" },
  table:           { width:"100%", borderCollapse:"collapse", fontSize:13 },
  th:              { padding:"9px 10px", background:"#fafaf8", fontWeight:600, fontSize:12, color:"#666", borderBottom:"2px solid #e8e8e3", textAlign:"right", whiteSpace:"nowrap" },
  thSticky:        { textAlign:"left", position:"sticky", left:0, zIndex:2, background:"#fafaf8", minWidth:72, boxShadow:"2px 0 4px rgba(0,0,0,.04)" },
  thTotal:         { background:"#f0f0ec", color:"#333" },
  td:              { padding:"8px 10px", textAlign:"right", borderBottom:"1px solid #f2f2ee", fontSize:13, color:"#333", whiteSpace:"nowrap" },
  tdTotal:         { fontWeight:600, background:"#fafaf8" },
  trEven:          { background:"#fff" },
  trOdd:           { background:"#fdfdfb" },
  trToday:         { background:"#eef4fb" },
  trSum:           { background:"#f5f5f0", borderTop:"2px solid #e0e0da" },
  todayBadge:      { marginLeft:6, fontSize:10, background:"#4f7cac", color:"#fff", borderRadius:4, padding:"1px 5px" },
  dash:            { color:"#d0d0cb" },
  detailRow:       { display:"flex", alignItems:"center", gap:6, padding:"5px 0", borderBottom:"1px solid #eaeae5", fontSize:12 },
  detailPayee:     { color:"#444", fontWeight:500, flexShrink:0 },
  detailMemo:      { color:"#aaa", flex:1 },
  detailAmt:       { fontWeight:700, marginLeft:"auto", flexShrink:0 },
  fixedCard:       { border:"1px solid #eeeee9", borderRadius:10, padding:"14px 16px", marginBottom:10 },
  fixedRow:        { display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom:"1px solid #f0f0ec" },
  fixedFormGrid:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 },
  fixedFab:        { position:"fixed", bottom:28, right:20, padding:"12px 20px", background:"#4f7cac", color:"#fff", border:"none", borderRadius:28, fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(79,124,172,.4)", zIndex:150, fontFamily:"inherit" },
  overlay:         { position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 },
  modal:           { background:"#fff", borderRadius:16, padding:24, width:"100%", maxWidth:440, maxHeight:"85vh", overflowY:"auto" },
  modalTitle:      { fontSize:16, fontWeight:700, marginBottom:16 },
  tagList:         { display:"flex", flexWrap:"wrap", gap:6, marginBottom:16, minHeight:32 },
  tag:             { display:"flex", alignItems:"center", gap:4, padding:"4px 10px", background:"#f0f0ec", borderRadius:20, fontSize:13 },
  tagDel:          { background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:14, padding:0, lineHeight:1 },
  tagInputRow:     { display:"flex", gap:8, marginBottom:16 },
  tagInput:        { flex:1, padding:"8px 12px", border:"1px solid #e0e0dc", borderRadius:8, fontSize:14, outline:"none", fontFamily:"inherit", background:"#fafaf8", boxSizing:"border-box" },
  addBtn:          { padding:"8px 16px", background:"#1a1a1a", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:14, fontFamily:"inherit" },
  modalBtns:       { display:"flex", gap:8, justifyContent:"flex-end" },
  cancelBtn:       { padding:"8px 16px", background:"#f0f0ec", border:"none", borderRadius:8, cursor:"pointer", fontSize:14, fontFamily:"inherit" },
  saveBtn:         { padding:"8px 20px", background:"#1a1a1a", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:14, fontFamily:"inherit" },
  catTabBar:       { display:"flex", flexWrap:"wrap", gap:4, marginBottom:4 },
  catTab:          { padding:"4px 10px", border:"1px solid #ddd", borderRadius:16, fontSize:12, cursor:"pointer", background:"#fafaf8", fontFamily:"inherit", color:"#666" },
  catTabActive:    { background:"#1a1a1a", color:"#fff", borderColor:"#1a1a1a" },
  toast:           { position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", background:"#1a1a1a", color:"#fff", padding:"10px 22px", borderRadius:30, fontSize:13, zIndex:300, whiteSpace:"nowrap", boxShadow:"0 4px 12px rgba(0,0,0,.2)" },
};
