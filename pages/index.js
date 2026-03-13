import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { chat, PROMPTS } from "../lib/api";

/* ══════════════════════════════════════════════════════════
   PhysicaAI v2  —  Next.js PWA
   API calls go to /api/chat (server-side proxy)
   API key is NEVER in this file
   ══════════════════════════════════════════════════════════ */

// ── STYLES ─────────────────────────────────────────────────
const G = `
  :root {
    --bg:#04080f;--s1:#080f1e;--s2:#0c1628;--s3:#102035;
    --border:rgba(0,195,255,0.1);
    --cyan:#00c3ff;--amber:#ffb347;--green:#00ffb3;
    --purple:#b47dff;--red:#ff6b6b;--gold:#ffd700;
    --text:#daeeff;--dim:#4a6fa5;--r:12px;
    --sb:228px;--bnb:64px;
    /* iOS safe area support */
    --sat: env(safe-area-inset-top, 0px);
    --sab: env(safe-area-inset-bottom, 0px);
  }
  input[type=range]{-webkit-appearance:none;width:100%;background:var(--s3);height:5px;border-radius:3px;cursor:pointer;}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--cyan);cursor:pointer;}
  .card{background:var(--s1);border:1px solid var(--border);border-radius:var(--r);padding:clamp(14px,4vw,24px);}
  .card-sm{background:var(--s1);border:1px solid var(--border);border-radius:10px;padding:14px;}
  .btn{padding:10px 18px;border-radius:9px;border:none;cursor:pointer;font-size:clamp(12px,3.5vw,14px);font-weight:600;transition:all .18s;letter-spacing:.01em;min-height:44px;touch-action:manipulation;font-family:inherit;}
  .btn-p{background:var(--cyan);color:#03070e;}.btn-p:hover{background:#33cfff;}.btn-p:active{transform:scale(.97);}
  .btn-p:disabled{background:var(--s3);color:var(--dim);cursor:not-allowed;}
  .btn-g{background:transparent;color:var(--text);border:1px solid var(--border);}.btn-g:hover{background:var(--s2);border-color:var(--cyan);}.btn-g:active{transform:scale(.97);}
  .btn-g:disabled{opacity:.4;cursor:not-allowed;}
  .btn-amber{background:rgba(255,179,71,.12);color:var(--amber);border:1px solid rgba(255,179,71,.3);}.btn-amber:hover{background:rgba(255,179,71,.22);}
  .btn-green{background:rgba(0,255,179,.12);color:var(--green);border:1px solid rgba(0,255,179,.3);}.btn-green:hover{background:rgba(0,255,179,.22);}
  .btn-red{background:rgba(255,107,107,.12);color:var(--red);border:1px solid rgba(255,107,107,.3);}.btn-red:hover{background:rgba(255,107,107,.22);}
  .btn-purple{background:rgba(180,125,255,.12);color:var(--purple);border:1px solid rgba(180,125,255,.3);}.btn-purple:hover{background:rgba(180,125,255,.22);}
  .tag{display:inline-block;padding:3px 10px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;}
  .tc{background:rgba(0,195,255,.1);color:var(--cyan);border:1px solid rgba(0,195,255,.2);}
  .ta{background:rgba(255,179,71,.1);color:var(--amber);border:1px solid rgba(255,179,71,.2);}
  .tg{background:rgba(0,255,179,.1);color:var(--green);border:1px solid rgba(0,255,179,.2);}
  .tp{background:rgba(180,125,255,.1);color:var(--purple);border:1px solid rgba(180,125,255,.2);}
  .tr{background:rgba(255,107,107,.1);color:var(--red);border:1px solid rgba(255,107,107,.2);}
  .pbar{background:var(--s3);border-radius:99px;height:5px;overflow:hidden;}
  .pbar-f{height:100%;border-radius:99px;transition:width .5s ease;}
  input,textarea,select{background:var(--s2);border:1px solid var(--border);border-radius:9px;color:var(--text);padding:10px 14px;outline:none;transition:border-color .2s;font-family:inherit;width:100%;}
  input:focus,textarea:focus{border-color:var(--cyan);}
  .pe{animation:pe .25s ease;}
  @keyframes pe{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--cyan);margin:0 2px;animation:dp 1.4s infinite;}
  .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
  @keyframes dp{0%,80%,100%{transform:scale(.5);opacity:.3}40%{transform:scale(1);opacity:1}}
  .math{font-family:'JetBrains Mono','Fira Code',monospace;}
  .mblock{background:rgba(0,195,255,.04);border:1px solid var(--border);border-left:3px solid var(--cyan);padding:12px 16px;border-radius:8px;font-family:'JetBrains Mono',monospace;font-size:clamp(11px,3vw,13px);color:var(--cyan);margin:10px 0;overflow-x:auto;white-space:pre-wrap;line-height:1.6;}
  .nav-i{display:flex;align-items:center;gap:11px;padding:10px 14px;border-radius:9px;cursor:pointer;font-size:13px;font-weight:500;color:var(--dim);transition:all .18s;margin:2px 8px;border:1px solid transparent;}
  .nav-i:hover{color:var(--text);background:var(--s2);}
  .nav-i.act{color:var(--cyan);background:rgba(0,195,255,.07);border-color:rgba(0,195,255,.18);}
  .flip-scene{perspective:1200px;width:100%;}
  .flip-card{width:100%;min-height:clamp(220px,40vw,280px);position:relative;transform-style:preserve-3d;transition:transform .55s cubic-bezier(.4,0,.2,1);cursor:pointer;}
  .flip-card.flipped{transform:rotateY(180deg);}
  .flip-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:var(--r);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:clamp(20px,5vw,36px);text-align:center;}
  .flip-front{background:var(--s1);border:1px solid rgba(0,195,255,.3);}
  .flip-back{background:var(--s2);border:1px solid rgba(0,195,255,.25);transform:rotateY(180deg);}
  .sidebar{position:fixed;left:0;top:var(--sat);bottom:0;width:var(--sb);background:var(--s1);border-right:1px solid var(--border);display:flex;flex-direction:column;z-index:200;overflow-y:auto;}
  .main-wrap{margin-left:var(--sb);min-height:100vh;}
  .mobile-topbar{display:none;position:sticky;top:0;z-index:150;background:var(--s1);border-bottom:1px solid var(--border);height:54px;align-items:center;justify-content:space-between;padding:0 16px;padding-top:var(--sat);}
  .bottom-nav{display:none;position:fixed;left:0;right:0;bottom:0;z-index:200;height:calc(var(--bnb) + var(--sab));padding-bottom:var(--sab);background:var(--s1);border-top:1px solid var(--border);align-items:center;justify-content:space-around;}
  .bn-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 2px;cursor:pointer;color:var(--dim);transition:color .18s;touch-action:manipulation;}
  .bn-item.act{color:var(--cyan);}
  .page-pad{padding:28px clamp(14px,5vw,40px) clamp(80px,12vw,100px);}
  .hscroll{display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px;}
  .hscroll::-webkit-scrollbar{height:0;}
  .s-bubble{border-radius:14px;padding:clamp(12px,3vw,16px) clamp(14px,3.5vw,20px);margin-bottom:12px;animation:pe .25s ease;line-height:1.75;font-size:clamp(13px,3.8vw,14px);}
  .s-bubble.ai{background:linear-gradient(135deg,rgba(180,125,255,.1),rgba(0,195,255,.07));border:1px solid rgba(180,125,255,.25);}
  .s-bubble.user{background:rgba(0,195,255,.07);border:1px solid rgba(0,195,255,.18);}
  @keyframes xp-pop{0%{transform:scale(1)}30%{transform:scale(1.35)}100%{transform:scale(1)}}
  .xp-pop{animation:xp-pop .4s ease;}
  @media(max-width:900px){
    :root{--sb:68px;}
    .sidebar .brand-lbl,.sidebar .nav-lbl,.sidebar .user-lbl{display:none;}
    .sidebar .nav-i{padding:10px;justify-content:center;margin:2px 5px;}
    .sidebar .user-row{justify-content:center;}
  }
  @media(max-width:620px){
    :root{--sb:0px;}
    .sidebar{display:none;}.main-wrap{margin-left:0;}
    .mobile-topbar{display:flex;}.bottom-nav{display:flex;}
    .page-pad{padding:14px 14px calc(var(--bnb) + var(--sab) + 18px);}
  }
  @media(max-width:812px) and (orientation:landscape){:root{--bnb:50px;}}
  @media(max-width:360px){.btn{padding:8px 10px;min-height:40px;}.card{padding:12px;}}
`;

// ── FLASHCARD DATA ─────────────────────────────────────────
const FLASHCARDS = [
  {id:1,cat:"Mechanics",front:"Newton's Second Law",back:"F⃗ = ma⃗\n\nNet force = mass × acceleration.\nUnit: Newton (N = kg·m/s²)"},
  {id:2,cat:"Mechanics",front:"Work-Energy Theorem",back:"W_net = ΔKE = ½mv² − ½mv₀²\n\nNet work done = change in kinetic energy."},
  {id:3,cat:"Mechanics",front:"Conservation of Momentum",back:"p⃗_total = Σmᵢvᵢ = constant\n\nIn an isolated system, total momentum is conserved."},
  {id:4,cat:"Mechanics",front:"Lagrangian Mechanics",back:"L = T − V\nd/dt(∂L/∂q̇) − ∂L/∂q = 0\n\nEuler-Lagrange equations give equations of motion."},
  {id:5,cat:"Waves & EM",front:"Simple Harmonic Motion",back:"ẍ + ω²x = 0\nx(t) = A cos(ωt + φ)\nω = √(k/m),  T = 2π/ω"},
  {id:6,cat:"Waves & EM",front:"Gauss's Law",back:"∮ E⃗·dA⃗ = Q_enc/ε₀\n\nElectric flux through a closed surface = enclosed charge / ε₀."},
  {id:7,cat:"Waves & EM",front:"Faraday's Law",back:"ε = −dΦ_B/dt\n\nInduced EMF = −rate of change of magnetic flux.\nLenz's law: opposes the change."},
  {id:8,cat:"Waves & EM",front:"Maxwell's Equations",back:"∇·E = ρ/ε₀\n∇·B = 0\n∇×E = −∂B/∂t\n∇×B = μ₀J + μ₀ε₀∂E/∂t"},
  {id:9,cat:"Quantum",front:"Schrödinger Equation",back:"iħ ∂ψ/∂t = Ĥψ\n\nFree particle: iħ∂ψ/∂t = −(ħ²/2m)∇²ψ\nDescribes evolution of quantum state."},
  {id:10,cat:"Quantum",front:"Uncertainty Principle",back:"ΔxΔp ≥ ħ/2\nΔEΔt ≥ ħ/2\n\nFundamental — not a measurement artifact.\nArises from the wave nature of matter."},
  {id:11,cat:"Quantum",front:"Particle in a Box",back:"Eₙ = n²π²ħ²/2mL²\n\nQuantized levels, n = 1,2,3,...\nGround state (n=1) has nonzero zero-point energy."},
  {id:12,cat:"Quantum",front:"de Broglie Wavelength",back:"λ = h/p = h/mv\n\nMatter has wave-like properties.\nElectron at 1 eV: λ ≈ 1.23 nm"},
  {id:13,cat:"Thermo",front:"First Law",back:"ΔU = Q − W\n\nChange in internal energy = heat added − work done BY system."},
  {id:14,cat:"Thermo",front:"Entropy & Second Law",back:"dS ≥ δQ/T\n\nEntropy of an isolated system never decreases.\nBoltzmann: S = k_B ln Ω"},
  {id:15,cat:"Thermo",front:"Ideal Gas Law",back:"PV = nRT = Nk_BT\n\nR = 8.314 J/mol·K\nk_B = 1.38×10⁻²³ J/K"},
  {id:16,cat:"Calculus",front:"Fundamental Theorem",back:"d/dx[∫ₐˣ f(t)dt] = f(x)\n∫ₐᵇ f(x)dx = F(b) − F(a)\n\nLinks differentiation and integration."},
  {id:17,cat:"Calculus",front:"Integration by Parts",back:"∫u dv = uv − ∫v du\n\nChoose u with LIATE:\nLog > Inv-trig > Algebraic > Trig > Exp"},
  {id:18,cat:"Calculus",front:"Taylor Series",back:"f(x) = Σ fⁿ(a)/n! · (x−a)ⁿ\n\neˣ = 1 + x + x²/2! + ...\nsin x = x − x³/3! + x⁵/5! − ..."},
  {id:19,cat:"Calculus",front:"Stokes' Theorem",back:"∮_C F⃗·dr⃗ = ∬_S (∇×F⃗)·dS⃗\n\nLine integral around curve = surface integral of curl."},
  {id:20,cat:"Linear Algebra",front:"Eigenvalue Equation",back:"Av⃗ = λv⃗\n\nFind λ from: det(A − λI) = 0\nEigenvectors span invariant subspaces."},
  {id:21,cat:"Diff. Equations",front:"First-Order Linear ODE",back:"dy/dx + P(x)y = Q(x)\n\nIntegrating factor: μ = e^∫P dx\nd(μy)/dx = μQ"},
  {id:22,cat:"Diff. Equations",front:"Laplace Transform",back:"L{f(t)} = ∫₀^∞ e^{−st}f(t)dt\n\nL{f'} = sF(s)−f(0)\nConverts ODE → algebraic equation."},
  {id:23,cat:"Relativity",front:"Lorentz Factor",back:"γ = 1/√(1−v²/c²)\n\nTime dilation: Δt = γΔt₀\nLength contraction: L = L₀/γ"},
  {id:24,cat:"Relativity",front:"Mass-Energy Equivalence",back:"E = mc²\n\nTotal: E = γm₀c²\nEnergy-momentum: E² = (pc)² + (m₀c²)²"},
];
const CATS = ["All", ...new Set(FLASHCARDS.map(c => c.cat))];

// SM-2 Algorithm
function sm2(card, rating) {
  const q = [0,1,3,5][rating];
  let { ef=2.5, interval=1, reps=0 } = card;
  if (q < 3) { reps=0; interval=1; }
  else { if(reps===0)interval=1; else if(reps===1)interval=6; else interval=Math.round(interval*ef); reps++; }
  ef = Math.max(1.3, ef + 0.1 - (5-q)*(0.08 + (5-q)*0.02));
  return { ef, interval, reps, nextDate: Date.now() + interval*86400000, lastRating: rating };
}

// Navigation
const NAV = [
  {id:"home",       label:"Home",       icon:"⌂"},
  {id:"flashcards", label:"Flashcards", icon:"⊡"},
  {id:"socratic",   label:"Socratic",   icon:"Σ"},
  {id:"tutor",      label:"AI Tutor",   icon:"✦"},
  {id:"practice",   label:"Practice",   icon:"◷"},
];

// ── HOOKS ──────────────────────────────────────────────────
function useW() {
  const [w, setW] = useState(1024);
  useEffect(() => {
    setW(window.innerWidth);
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

// ── RENDER MESSAGE ─────────────────────────────────────────
function renderMsg(text) {
  return text.split("\n\n").map((block, i) => {
    if (block.startsWith("```")) {
      const code = block.replace(/^```[\w]*\n?/,"").replace(/\n?```$/,"");
      return <div key={i} className="mblock">{code}</div>;
    }
    if (/^#{1,3}\s/.test(block))
      return <div key={i} style={{fontWeight:700,fontSize:"clamp(13px,4vw,15px)",color:"var(--cyan)",margin:"14px 0 7px",fontFamily:"'Syne',sans-serif"}}>{block.replace(/^#+\s/,"")}</div>;
    return (
      <p key={i} style={{marginBottom:10,lineHeight:1.8,fontSize:"clamp(13px,3.8vw,14px)"}}>
        {block.split("\n").map((ln,j,arr)=>(
          <span key={j}>
            {ln.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((s,k)=>{
              if(s.startsWith("**")&&s.endsWith("**")) return <strong key={k} style={{color:"var(--amber)"}}>{s.slice(2,-2)}</strong>;
              if(s.startsWith("`")&&s.endsWith("`")) return <code key={k} className="math" style={{color:"var(--cyan)",background:"rgba(0,195,255,.08)",padding:"1px 5px",borderRadius:4}}>{s.slice(1,-1)}</code>;
              return <span key={k}>{s}</span>;
            })}
            {j<arr.length-1&&<br/>}
          </span>
        ))}
      </p>
    );
  });
}

// ── NAV COMPONENTS ─────────────────────────────────────────
function Sidebar({ page, setPage, w }) {
  const compact = w <= 900 && w > 620;
  return (
    <div className="sidebar">
      <div style={{padding:compact?"14px 6px":"20px 16px 14px",borderBottom:"1px solid var(--border)"}}>
        <div style={{display:"flex",alignItems:"center",gap:compact?0:10,justifyContent:compact?"center":"flex-start"}}>
          <div style={{width:38,height:38,borderRadius:11,background:"linear-gradient(135deg,var(--cyan),var(--purple))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#030a14",fontFamily:"'Syne',sans-serif",flexShrink:0}}>Φ</div>
          {!compact&&<div className="brand-lbl"><div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,letterSpacing:"-.03em",lineHeight:1}}>PhysicaAI</div><div style={{fontSize:9,color:"var(--dim)",letterSpacing:".07em",marginTop:3}}>v2 · PHYSICS · MATH</div></div>}
        </div>
      </div>
      <nav style={{padding:"8px 0",flex:1}}>
        {NAV.map(n=>(
          <div key={n.id} className={`nav-i ${page===n.id?"act":""}`} onClick={()=>setPage(n.id)} style={{justifyContent:compact?"center":"flex-start"}}>
            <span style={{fontSize:16,width:20,textAlign:"center",flexShrink:0}}>{n.icon}</span>
            {!compact&&<span className="nav-lbl">{n.label}</span>}
          </div>
        ))}
      </nav>
      <div className="user-row" style={{padding:compact?"12px 6px":"12px 14px",borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",gap:compact?0:10,justifyContent:compact?"center":"flex-start"}}>
        <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,var(--cyan),var(--purple))",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:"#03070e",flexShrink:0}}>S</div>
        {!compact&&<div className="user-lbl"><div style={{fontSize:12,fontWeight:600}}>Student</div><div style={{fontSize:10,color:"var(--dim)"}}>Lvl 4 · 1,247 XP</div></div>}
      </div>
    </div>
  );
}
function MobileTopbar({ page }) {
  const cur = NAV.find(n=>n.id===page)||NAV[0];
  return (
    <div className="mobile-topbar">
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,var(--cyan),var(--purple))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:900,color:"#030a14",fontFamily:"'Syne',sans-serif"}}>Φ</div>
        <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16}}>PhysicaAI</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:"var(--cyan)"}}>{cur.icon}</span><span style={{fontSize:12,fontWeight:600,color:"var(--dim)"}}>{cur.label}</span></div>
    </div>
  );
}
function BottomNav({ page, setPage }) {
  return (
    <div className="bottom-nav">
      {NAV.map(n=>(
        <div key={n.id} className={`bn-item ${page===n.id?"act":""}`} onClick={()=>setPage(n.id)}>
          <span style={{fontSize:18,lineHeight:1}}>{n.icon}</span>
          <span style={{fontSize:8,fontWeight:700,letterSpacing:".04em",textTransform:"uppercase"}}>{n.label}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  HOME
// ══════════════════════════════════════════════════════════
function Home({ go }) {
  const features = [
    {icon:"⊡",title:"Flashcard SRS",      desc:"SM-2 spaced repetition. 24 physics & math cards. Earn XP.",            col:"var(--gold)",   page:"flashcards"},
    {icon:"Σ", title:"Socratic Mode",      desc:"AI that never gives answers — only guiding questions.",                 col:"var(--purple)", page:"socratic"},
    {icon:"✦",title:"AI Tutor",           desc:"Step-by-step explanations. Class 11 to graduate quantum mechanics.",    col:"var(--green)",  page:"tutor"},
    {icon:"◷",title:"Practice Problems", desc:"AI-generated problems from Beginner to Olympiad. Full solutions.",       col:"var(--amber)",  page:"practice"},
  ];
  return (
    <div style={{overflowX:"hidden"}}>
      <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
        {[{c:"rgba(0,195,255,.07)",s:500,x:"25%",y:"15%"},{c:"rgba(180,125,255,.06)",s:400,x:"75%",y:"10%"},{c:"rgba(255,215,0,.04)",s:300,x:"60%",y:"55%"}].map((o,i)=>(
          <div key={i} style={{position:"absolute",borderRadius:"50%",background:`radial-gradient(circle,${o.c} 0%,transparent 70%)`,width:o.s,height:o.s,left:o.x,top:o.y,transform:"translate(-50%,-50%)"}}/>
        ))}
      </div>
      <div className="page-pad" style={{textAlign:"center",paddingTop:"clamp(36px,9vw,90px)",paddingBottom:"clamp(24px,5vw,40px)",position:"relative",zIndex:1}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:20,background:"rgba(0,195,255,.07)",border:"1px solid rgba(0,195,255,.15)",padding:"5px 14px",borderRadius:99}}>
          <span style={{color:"var(--gold)",fontSize:12}}>★</span>
          <span style={{fontSize:11,color:"var(--dim)",letterSpacing:".06em",textTransform:"uppercase",fontWeight:600}}>PhysicaAI v2 — Installable PWA</span>
        </div>
        <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:"clamp(30px,8vw,76px)",lineHeight:1.05,letterSpacing:"-.04em",marginBottom:20}}>
          Learn Physics &amp;<br/>
          <span style={{background:"linear-gradient(135deg,var(--cyan) 0%,var(--purple) 55%,var(--gold) 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Mathematics</span><br/>
          Anywhere, Anytime
        </h1>
        <p style={{fontSize:"clamp(13px,4vw,17px)",color:"var(--dim)",lineHeight:1.75,maxWidth:520,margin:"0 auto 36px",fontWeight:300}}>
          Install on your phone — works offline. AI powered by your own secure backend.
        </p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="btn btn-p" style={{fontSize:"clamp(13px,4vw,15px)",padding:"12px clamp(18px,5vw,32px)"}} onClick={()=>go("tutor")}>Start AI Tutor ✦</button>
          <button className="btn btn-g" style={{fontSize:"clamp(13px,4vw,15px)",padding:"12px clamp(18px,5vw,32px)"}} onClick={()=>go("flashcards")}>Review Flashcards ⊡</button>
        </div>
        {/* Install hint */}
        <div style={{marginTop:28,display:"inline-flex",alignItems:"center",gap:10,background:"rgba(0,255,179,.06)",border:"1px solid rgba(0,255,179,.15)",padding:"10px 18px",borderRadius:12}}>
          <span style={{fontSize:18}}>📱</span>
          <span style={{fontSize:"clamp(11px,3vw,13px)",color:"var(--green)"}}>On phone? Tap <strong>Share → Add to Home Screen</strong> to install</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"clamp(10px,3vw,24px)",maxWidth:480,margin:"clamp(40px,8vw,60px) auto 0",textAlign:"center"}}>
          {[["24","Flashcards"],["∞","AI Answers"],["SM-2","Algorithm"],["PWA","Installable"]].map(([n,l])=>(
            <div key={l}><div style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(18px,4.5vw,28px)",fontWeight:900,color:"var(--cyan)",lineHeight:1}}>{n}</div><div style={{fontSize:"clamp(9px,2.5vw,11px)",color:"var(--dim)",textTransform:"uppercase",letterSpacing:".08em",marginTop:5}}>{l}</div></div>
          ))}
        </div>
      </div>
      <div className="page-pad" style={{paddingTop:0,position:"relative",zIndex:1}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,200px),1fr))",gap:"clamp(10px,3vw,16px)"}}>
          {features.map(f=>(
            <div key={f.title} className="card" style={{cursor:"pointer",transition:"all .2s"}} onClick={()=>go(f.page)}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.borderColor=f.col;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor="";}}>
              <div style={{fontSize:"clamp(22px,5vw,28px)",marginBottom:12,color:f.col}}>{f.icon}</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"clamp(13px,4vw,15px)",marginBottom:8}}>{f.title}</div>
              <div style={{color:"var(--dim)",fontSize:"clamp(12px,3.5vw,13px)",lineHeight:1.6}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  FLASHCARDS
// ══════════════════════════════════════════════════════════
function Flashcards() {
  const [cat, setCat] = useState("All");
  const [cardStates, setCardStates] = useState({});
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [xpAnim, setXpAnim] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const deck = (cat==="All"?FLASHCARDS:FLASHCARDS.filter(c=>c.cat===cat)).filter(c=>{ const s=cardStates[c.id]; return !s||Date.now()>=(s.nextDate||0); });
  const card = deck[idx % Math.max(deck.length,1)];
  const allCards = cat==="All"?FLASHCARDS:FLASHCARDS.filter(c=>c.cat===cat);
  const mastered = allCards.filter(c=>(cardStates[c.id]?.reps||0)>=3).length;
  const pct = allCards.length ? Math.round(mastered/allCards.length*100) : 0;

  const rate = (r) => {
    if (!card) return;
    setCardStates(p=>({...p,[card.id]:sm2({...p[card.id]},r)}));
    setTotalXP(p=>p+[0,5,10,20][r]);
    setXpAnim(true); setTimeout(()=>setXpAnim(false),500);
    setReviewed(p=>p+1);
    setFlipped(false); setTimeout(()=>setIdx(i=>i+1),80);
  };
  const ratings=[{label:"Again",sub:"1 day",cls:"btn-red",r:0},{label:"Hard",sub:"3 days",cls:"btn-purple",r:1},{label:"Good",sub:"1 week",cls:"btn-amber",r:2},{label:"Easy",sub:"3 weeks",cls:"btn-green",r:3}];

  return (
    <div className="pe page-pad">
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"clamp(20px,5vw,32px)",flexWrap:"wrap",gap:14}}>
        <div><h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:"clamp(22px,6vw,30px)",letterSpacing:"-.02em",marginBottom:6}}>Flashcard Review</h1><p style={{color:"var(--dim)",fontSize:"clamp(11px,3vw,13px)"}}>SM-2 spaced repetition — cards reappear when needed</p></div>
        <div className={`card-sm ${xpAnim?"xp-pop":""}`} style={{textAlign:"center",minWidth:90}}><div style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(20px,5vw,24px)",fontWeight:900,color:"var(--gold)"}}>+{totalXP}</div><div style={{fontSize:10,color:"var(--dim)",marginTop:3}}>Session XP</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,120px),1fr))",gap:"clamp(8px,2.5vw,12px)",marginBottom:"clamp(16px,4vw,20px)"}}>
        {[{l:"Due Now",v:deck.length,col:"var(--amber)"},{l:"Mastered",v:mastered,col:"var(--green)"},{l:"Reviewed",v:reviewed,col:"var(--purple)"}].map(s=>(
          <div key={s.l} className="card" style={{textAlign:"center",padding:"clamp(10px,3vw,18px)"}}><div style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(20px,5vw,26px)",fontWeight:900,color:s.col}}>{s.v}</div><div style={{fontSize:10,color:"var(--dim)",marginTop:4}}>{s.l}</div></div>
        ))}
      </div>
      <div style={{marginBottom:"clamp(12px,3vw,18px)"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:12,color:"var(--dim)"}}><span>Mastery</span><span style={{color:"var(--green)",fontWeight:700}}>{pct}%</span></div><div className="pbar"><div className="pbar-f" style={{width:`${pct}%`,background:"linear-gradient(90deg,var(--cyan),var(--green))"}}/></div></div>
      <div className="hscroll" style={{marginBottom:"clamp(16px,4vw,20px)"}}>
        {CATS.map(c=><button key={c} onClick={()=>{setCat(c);setIdx(0);setFlipped(false);}} className={`btn ${cat===c?"btn-p":"btn-g"}`} style={{flexShrink:0,fontSize:"clamp(11px,3vw,12px)",padding:"8px 14px"}}>{c}</button>)}
      </div>
      {deck.length>0&&card?(
        <>
          <div style={{marginBottom:12,display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--dim)"}}><span>Card {(idx%deck.length)+1} / {deck.length} due</span><span className="tag tc">{card.cat}</span></div>
          <div className="flip-scene" style={{marginBottom:18}}>
            <div className={`flip-card ${flipped?"flipped":""}`} onClick={()=>setFlipped(f=>!f)}>
              <div className="flip-face flip-front"><div style={{fontSize:11,color:"var(--dim)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:18}}>TAP TO REVEAL</div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(18px,5vw,26px)",color:"var(--text)",lineHeight:1.3}}>{card.front}</div><div style={{marginTop:22,color:"var(--cyan)",fontSize:22}}>⊡</div></div>
              <div className="flip-face flip-back"><div style={{fontSize:11,color:"var(--dim)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:14}}>ANSWER</div><div className="math" style={{fontSize:"clamp(12px,3.5vw,14px)",color:"var(--text)",whiteSpace:"pre-line",lineHeight:1.75,textAlign:"center"}}>{card.back}</div></div>
            </div>
          </div>
          {flipped?(
            <div><div style={{textAlign:"center",fontSize:12,color:"var(--dim)",marginBottom:12}}>How well did you know it?</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"clamp(6px,2vw,10px)"}}>
                {ratings.map(rb=><button key={rb.label} onClick={()=>rate(rb.r)} className={`btn ${rb.cls}`} style={{flexDirection:"column",display:"flex",alignItems:"center",padding:"10px 6px",gap:2,fontSize:"clamp(10px,3vw,13px)"}}><span style={{fontWeight:700}}>{rb.label}</span><span style={{fontSize:9,opacity:.7}}>{rb.sub}</span></button>)}
              </div>
            </div>
          ):(
            <div style={{textAlign:"center"}}><button className="btn btn-g" onClick={()=>setFlipped(true)} style={{fontSize:13}}>Reveal Answer ↓</button></div>
          )}
        </>
      ):(
        <div className="card" style={{textAlign:"center",padding:"clamp(32px,8vw,64px)"}}>
          <div style={{fontSize:48,marginBottom:16}}>🎉</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(18px,5vw,22px)",marginBottom:10}}>All caught up!</div>
          <div style={{color:"var(--dim)",fontSize:14,marginBottom:20}}>No cards due. Come back later or review all.</div>
          <button className="btn btn-p" onClick={()=>setIdx(0)}>Review Again</button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  AI CHAT (shared between Tutor and Socratic)
// ══════════════════════════════════════════════════════════
function ChatPage({ mode }) {
  const isSocratic = mode === "socratic";
  const initMsg = isSocratic
    ? `Welcome to **Socratic Mode**.\n\nI won't give you direct answers. Instead, I'll ask guiding questions so you discover the physics yourself.\n\nWhat concept would you like to work through?`
    : `Hello! I'm **PhysicaAI** — your physics and math tutor.\n\nAsk me anything from Newton's Laws to quantum field theory. I explain step-by-step with full derivations.\n\nWhat would you like to explore?`;

  const systemPrompt = isSocratic ? PROMPTS.socratic : PROMPTS.tutor;
  const [msgs, setMsgs] = useState([{ role: "assistant", content: initMsg }]);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const w = useW();
  const isMobile = w <= 620;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const send = useCallback(async (txt) => {
    const msg = (txt || inp).trim(); if (!msg || loading) return;
    setInp(""); setError("");
    const next = [...msgs, { role: "user", content: msg }];
    setMsgs(next); setLoading(true);
    try {
      const reply = await chat({ messages: next.map(m=>({role:m.role,content:m.content})), system: systemPrompt, maxTokens: 900 });
      setMsgs(p => [...p, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e.message);
      setMsgs(p => [...p, { role: "assistant", content: `⚠️ ${e.message}` }]);
    } finally { setLoading(false); }
  }, [msgs, inp, loading, systemPrompt]);

  const accent = isSocratic ? "var(--purple)" : "var(--cyan)";
  const bgGrad = isSocratic ? "linear-gradient(135deg,rgba(180,125,255,.08),rgba(0,195,255,.04))" : "var(--s1)";
  const quickPrompts = isSocratic
    ? ["Help me with projectile motion","Gauss's Law","Quantum superposition","Entropy","Angular momentum","What is the Hamiltonian?"]
    : ["Explain Maxwell's equations","Derive Schrödinger equation","Lagrangian formulation","Uncertainty principle","Noether's theorem","Fourier transform"];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh"}}>
      <div style={{padding:"clamp(12px,3vw,16px) clamp(14px,4vw,28px)",borderBottom:"1px solid var(--border)",background:bgGrad,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:`linear-gradient(135deg,${isSocratic?"var(--purple),#7b2fff":"var(--cyan),var(--purple)"})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{isSocratic?"Σ":"✦"}</div>
          <div style={{flex:1}}><div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(14px,4vw,17px)"}}>{isSocratic?"Socratic Mode":"AI Physics & Math Tutor"}</div><div style={{fontSize:"clamp(9px,2.5vw,11px)",color:"var(--dim)",marginTop:2}}>{isSocratic?"Guiding questions only — build real understanding":"Step-by-step · Class 11 to Graduate Level"}</div></div>
          <span className={`tag ${isSocratic?"tp":"tc"}`} style={{fontSize:9,flexShrink:0}}>{isSocratic?"Questions Only":"Direct Answers"}</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"clamp(12px,3vw,20px) clamp(12px,4vw,28px)"}}>
        {msgs.map((m,i)=>(
          <div key={i} className={isSocratic?`s-bubble ${m.role==="user"?"user":"ai"}`:undefined}
            style={!isSocratic?{padding:"clamp(12px,3vw,16px) clamp(12px,3vw,18px)",borderRadius:12,marginBottom:10,background:m.role==="user"?"rgba(0,195,255,.07)":"var(--s2)",border:`1px solid ${m.role==="user"?"rgba(0,195,255,.18)":"var(--border)"}`,marginLeft:m.role==="user"?isMobile?"18%":60:0,marginRight:m.role==="user"?0:isMobile?"4%":40,animation:"pe .25s ease"}:
            {marginLeft:m.role==="user"?isMobile?"16%":80:0,marginRight:m.role==="user"?0:isMobile?"4%":60}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
              {m.role==="assistant"?<><span style={{color:accent}}>{isSocratic?"Σ":"✦"}</span><span style={{fontSize:9,fontWeight:800,color:accent,letterSpacing:".07em",textTransform:"uppercase"}}>{isSocratic?"Socratic Tutor":"PhysicaAI"}</span></>:<><div style={{width:18,height:18,borderRadius:"50%",background:"linear-gradient(135deg,var(--cyan),var(--purple))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#03070e"}}>S</div><span style={{fontSize:9,fontWeight:700,color:"var(--dim)",letterSpacing:".05em",textTransform:"uppercase"}}>You</span></>}
            </div>
            <div>{renderMsg(m.content)}</div>
          </div>
        ))}
        {loading&&<div style={{padding:"14px 18px",borderRadius:12,marginBottom:10,background:"var(--s2)",border:"1px solid var(--border)",marginRight:isMobile?"4%":40}}><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}><span style={{color:accent}}>{isSocratic?"Σ":"✦"}</span><span style={{fontSize:9,fontWeight:800,color:accent,letterSpacing:".07em",textTransform:"uppercase"}}>{isSocratic?"Forming a question...":"Thinking..."}</span></div><div style={{display:"flex",gap:3}}><div className="dot" style={{background:accent}}/><div className="dot" style={{background:accent}}/><div className="dot" style={{background:accent}}/></div></div>}
        <div ref={endRef}/>
      </div>
      <div className="hscroll" style={{padding:"0 clamp(12px,4vw,28px) 8px",flexShrink:0}}>
        {quickPrompts.map(q=><button key={q} onClick={()=>send(q)} className="btn btn-g" style={{fontSize:"clamp(10px,2.8vw,11px)",padding:"6px 12px",color:isSocratic?"var(--purple)":"var(--dim)",borderColor:isSocratic?"rgba(180,125,255,.3)":"var(--border)",whiteSpace:"nowrap",flexShrink:0,minHeight:36}}>{q}</button>)}
      </div>
      {error&&<div style={{margin:"0 clamp(12px,4vw,28px) 6px",padding:"8px 14px",background:"rgba(255,107,107,.08)",border:"1px solid rgba(255,107,107,.3)",borderRadius:9,fontSize:12,color:"var(--red)"}}>⚠️ {error}</div>}
      <div style={{padding:"4px clamp(12px,4vw,28px) clamp(16px,4vw,24px)",flexShrink:0}}>
        <div style={{display:"flex",gap:8,background:isSocratic?"rgba(180,125,255,.07)":"var(--s2)",border:`1px solid ${isSocratic?"rgba(180,125,255,.2)":"var(--border)"}`,borderRadius:13,padding:"8px 8px 8px 14px",alignItems:"flex-end"}}>
          <textarea value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!isMobile){e.preventDefault();send();}}} placeholder={isMobile?"Ask anything…":"Ask about any physics or math concept…"} rows={2} style={{flex:1,background:"transparent",border:"none",resize:"none",color:"var(--text)",fontSize:"clamp(13px,4vw,14px)",padding:"6px 0",lineHeight:1.5,maxHeight:100}}/>
          <button onClick={()=>send()} disabled={loading||!inp.trim()} className="btn" style={{width:44,height:44,borderRadius:10,padding:0,fontSize:18,flexShrink:0,background:isSocratic?"var(--purple)":"var(--cyan)",color:isSocratic?"#fff":"#03070e",minHeight:44,display:"flex",alignItems:"center",justifyContent:"center"}}>→</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  PRACTICE
// ══════════════════════════════════════════════════════════
const PROB_BANK=[{id:1,level:"Beginner",topic:"Newton's Laws",q:"A 5 kg block accelerates at 3 m/s². Net force?",opts:["8 N","1.67 N","15 N","30 N"],ans:2,sol:"F=ma=5×3=15N"},{id:2,level:"Intermediate",topic:"Kinematics",q:"Projectile at 45°, v₀=20 m/s. Max range?",opts:["40.8 m","20.4 m","81.6 m","10.2 m"],ans:0,sol:"R=v₀²sin2θ/g≈40.8m"},{id:3,level:"Advanced",topic:"Electrostatics",q:"Inside uniform sphere at r<R, E=?",opts:["ρr/3ε₀","ρR³/3ε₀r²","ρr/2ε₀","ρr/ε₀"],ans:0,sol:"Gauss law→E=ρr/3ε₀"},{id:4,level:"Intermediate",topic:"Calculus",q:"∫₀^π sin(x)dx=?",opts:["0","2","−2","π"],ans:1,sol:"[-cosx]₀^π=1+1=2"},{id:5,level:"Advanced",topic:"Quantum",q:"Ground state energy, infinite square well, width L?",opts:["ħ²π²/2mL²","ħ²π²/mL²","2ħ²π²/mL²","ħ²/2mL²"],ans:0,sol:"E₁=ħ²π²/2mL²"},{id:6,level:"Olympiad",topic:"Classical Mechanics",q:"Bead on rotating hoop, stationary angle θ≠0?",opts:["cosθ=g/ω²R","cosθ=ω²R/g","sinθ=g/ω²R","θ=π/2"],ans:0,sol:"cosθ=g/ω²R"}];

function Practice() {
  const [level,setLevel]=useState("All"),[idx,setIdx]=useState(0),[sel,setSel]=useState(null),[showSol,setShowSol]=useState(false),[score,setScore]=useState({c:0,t:0}),[extras,setExtras]=useState([]),[gen,setGen]=useState(false),[genErr,setGenErr]=useState("");
  const all=[...PROB_BANK,...extras],filtered=level==="All"?all:all.filter(p=>p.level===level),prob=filtered[idx%Math.max(filtered.length,1)];
  const pick=i=>{if(sel!==null)return;setSel(i);setScore(s=>({c:s.c+(i===prob.ans?1:0),t:s.t+1}));};
  const next=()=>{setSel(null);setShowSol(false);setIdx(i=>i+1);};
  const generate=async()=>{
    setGen(true);setGenErr("");
    try{
      const lv=level==="All"?"Intermediate":level;
      const reply=await chat({messages:[{role:"user",content:`Generate a ${lv} physics/math MCQ as JSON only (no markdown):\n{"q":"...","opts":["A","B","C","D"],"ans":0,"sol":"...","topic":"...","level":"${lv}"}`}],system:PROMPTS.problemGenerator,maxTokens:500});
      const p=JSON.parse(reply.replace(/```json|```/g,"").trim());p.id=Date.now();
      setExtras(e=>[...e,p]);setIdx(all.length);
    }catch(e){setGenErr("Generation failed — try again.");}
    finally{setGen(false);}
  };
  const acc=score.t>0?Math.round(score.c/score.t*100):null;
  return(
    <div className="pe page-pad">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"clamp(20px,5vw,28px)",flexWrap:"wrap",gap:14}}>
        <div><h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:"clamp(22px,6vw,30px)",letterSpacing:"-.02em",marginBottom:6}}>Practice Problems</h1><p style={{color:"var(--dim)",fontSize:"clamp(11px,3vw,13px)"}}>Beginner to Olympiad — AI-generated on demand</p></div>
        <div className="card-sm" style={{textAlign:"center",minWidth:90}}><div style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(22px,6vw,26px)",fontWeight:900,color:"var(--green)"}}>{acc!=null?`${acc}%`:"—"}</div><div style={{fontSize:10,color:"var(--dim)",marginTop:4}}>{score.c}/{score.t}</div></div>
      </div>
      <div className="hscroll" style={{marginBottom:"clamp(16px,4vw,20px)"}}>
        {["All","Beginner","Intermediate","Advanced","Olympiad"].map(l=><button key={l} onClick={()=>{setLevel(l);setIdx(0);setSel(null);setShowSol(false);}} className={`btn ${level===l?"btn-p":"btn-g"}`} style={{flexShrink:0,fontSize:"clamp(11px,3vw,13px)",padding:"8px 14px"}}>{l}</button>)}
        <button onClick={generate} disabled={gen} className="btn btn-amber" style={{flexShrink:0,fontSize:"clamp(11px,3vw,12px)",padding:"8px 14px"}}>{gen?"⏳ Generating…":"✦ AI Generate"}</button>
      </div>
      {genErr&&<div style={{color:"var(--red)",fontSize:12,marginBottom:10}}>{genErr}</div>}
      {prob&&(
        <div className="card">
          <div style={{display:"flex",gap:8,marginBottom:"clamp(14px,4vw,20px)",alignItems:"center",flexWrap:"wrap"}}>
            <span className={`tag ${prob.level==="Beginner"?"tg":prob.level==="Intermediate"?"ta":prob.level==="Olympiad"?"tr":"tp"}`}>{prob.level}</span>
            <span className="tag tc">{prob.topic}</span>
            <span style={{marginLeft:"auto",fontSize:11,color:"var(--dim)"}}>#{(idx%filtered.length)+1}/{filtered.length}</span>
          </div>
          <div style={{fontSize:"clamp(14px,4vw,16px)",lineHeight:1.8,marginBottom:"clamp(18px,5vw,26px)",fontWeight:500}} className="math">{prob.q}</div>
          <div style={{display:"flex",flexDirection:"column",gap:"clamp(8px,2.5vw,10px)",marginBottom:16}}>
            {prob.opts.map((opt,i)=>{
              let bg="var(--s2)",border="var(--border)",col="var(--text)";
              if(sel!==null){if(i===prob.ans){bg="rgba(0,255,179,.08)";border="var(--green)";col="var(--green)";}else if(i===sel){bg="rgba(255,107,107,.08)";border="var(--red)";col="var(--red)";}}
              return(<div key={i} onClick={()=>pick(i)} style={{padding:"clamp(10px,3vw,13px) clamp(12px,4vw,16px)",borderRadius:9,border:`1px solid ${border}`,background:bg,color:col,cursor:sel!==null?"default":"pointer",transition:"all .18s",display:"flex",alignItems:"center",gap:12}} onMouseEnter={e=>{if(sel===null){e.currentTarget.style.background="rgba(0,195,255,.07)";e.currentTarget.style.borderColor="rgba(0,195,255,.35)";}}} onMouseLeave={e=>{if(sel===null){e.currentTarget.style.background="var(--s2)";e.currentTarget.style.borderColor="var(--border)";}}}>
                <span className="math" style={{width:28,height:28,borderRadius:"50%",background:"var(--s3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{String.fromCharCode(65+i)}</span>
                <span className="math" style={{fontSize:"clamp(13px,3.8vw,14px)"}}>{opt}</span>
              </div>);
            })}
          </div>
          {sel!==null&&(<div>
            <div style={{padding:"clamp(10px,3vw,12px) 16px",borderRadius:9,marginBottom:12,background:sel===prob.ans?"rgba(0,255,179,.07)":"rgba(255,107,107,.07)",border:`1px solid ${sel===prob.ans?"var(--green)":"var(--red)"}`,color:sel===prob.ans?"var(--green)":"var(--red)",fontWeight:600,fontSize:"clamp(13px,3.8vw,14px)"}}>{sel===prob.ans?"✓ Correct!":"✗ Not quite."}</div>
            <button className="btn btn-g" onClick={()=>setShowSol(!showSol)} style={{marginBottom:10,fontSize:12}}>{showSol?"▲ Hide":"▼ Solution"}</button>
            {showSol&&<div className="mblock"><span className="math">{prob.sol}</span></div>}
            <button className="btn btn-p" onClick={next} style={{marginTop:12,width:"100%"}}>Next →</button>
          </div>)}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ROOT
// ══════════════════════════════════════════════════════════
export default function PhysicaAI() {
  const router = useRouter();
  const initialPage = (router.query?.page) || "home";
  const [page, setPage] = useState(initialPage);
  const w = useW();
  const isMobile = w <= 620;

  useEffect(() => {
    if (router.query?.page && router.query.page !== page) setPage(router.query.page);
  }, [router.query?.page]);

  const PAGES = {
    home:       <Home go={setPage}/>,
    flashcards: <Flashcards/>,
    socratic:   <ChatPage mode="socratic"/>,
    tutor:      <ChatPage mode="tutor"/>,
    practice:   <Practice/>,
  };

  return (
    <>
      <Head>
        <title>PhysicaAI — Physics &amp; Mathematics AI Tutor</title>
      </Head>
      <style>{G}</style>
      {!isMobile && <Sidebar page={page} setPage={setPage} w={w}/>}
      {isMobile  && <MobileTopbar page={page}/>}
      <div className="main-wrap" key={page}>
        {PAGES[page] || <Home go={setPage}/>}
      </div>
      {isMobile && <BottomNav page={page} setPage={setPage}/>}
    </>
  );
}
