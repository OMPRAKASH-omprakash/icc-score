import React, { useState, useEffect } from "react";
import { 
  Trophy, Clock, ChevronLeft, BarChart2, 
  Play, Trash2, Download, Share2, AlertTriangle, Edit2, X, Check
} from "lucide-react";

// --- TYPES & STORAGE ---
type Lang = 'en' | 'ta' | 'hi' | 'te' | 'ml';

interface BatterStats { name: string; runs: number; balls: number; fours: number; sixes: number; isOut: boolean; }
interface BowlerStats { name: string; runs: number; wickets: number; balls: number; wides: number; noBalls: number; }
interface OverData { overNum: number; runs: number; log: BallLog[]; bowlerName: string; }
interface BallLog { label: string; isLegal: boolean; isWicket: boolean; runs: number; extraType: string | null; }

interface InningsData {
  inningsLabel: string;
  runs: number; wickets: number; balls: number; extras: number; wides: number; noBalls: number;
  currentOverLog: BallLog[]; currentOverRuns: number; previousOvers: OverData[]; isOverComplete: boolean;
  batter1: BatterStats; batter2: BatterStats; striker: 1 | 2; bowler: BowlerStats;
  allBatters: BatterStats[]; allBowlers: BowlerStats[];
}

interface GameState {
  id: string; isSetup: boolean; language: Lang;
  team1: string; team2: string; overs: number; innings: 1 | 2;
  roundStr: string; inningsStr: string;
  matchStatus: 'playing' | 'team1_won' | 'team2_won' | 'tie';
  score1: InningsData; score2: InningsData;
  isFreeHit: boolean; history: GameState[]; createdAt: string;
}

const STORAGE_KEY = 'icc_score_matches';
const ACTIVE_MATCH_KEY = 'icc_score_active';

// --- TRANSLATIONS ---
const dict: Record<Lang, any> = {
  en: { setup: "New Match", history: "Match History", teams: "Teams", team1: "Team 1", team2: "Team 2", overs: "Overs", start: "Start Toss", toss: "Toss Time", head: "Heads", tail: "Tails", flip: "Flip Coin", bat: "Bat", bowl: "Bowl", target: "Target", need: "Need", balls: "Balls", runRate: "CRR", reqRate: "RRR", extra: "Extras", wide: "Wide", noBall: "No Ball", freeHit: "FREE HIT", wicket: "Wicket", runOut: "Run Out", undo: "Undo", save: "Save", score: "Match Scorecard", over: "This Over", past: "Past Overs", sr: "SR", eco: "Eco", matchOver: "Match Over", wonBy: "won by", tied: "Match Tied", share: "Share", print: "Save PDF", endInnings: "End Innings", bowled: "Bowled", caught: "Caught", stumped: "Stumped", round: "Round Number/Name", innNum: "Innings Number" },
  ta: { setup: "புதிய போட்டி", history: "போட்டி வரலாறு", teams: "அணிகள்", team1: "அணி 1", team2: "அணி 2", overs: "ஓவர்கள்", start: "டாஸ் தொடங்கு", toss: "டாஸ் நேரம்", head: "தலை", tail: "பூ", flip: "சுழற்று", bat: "பேட்டிங்", bowl: "பந்துவீச்சு", target: "இலக்கு", need: "தேவை", balls: "பந்துகள்", runRate: "CRR", reqRate: "RRR", extra: "உதிரிகள்", wide: "வைடு", noBall: "நோ பால்", freeHit: "ஃப்ரீ ஹிட்", wicket: "விக்கெட்", runOut: "ரன் அவுட்", undo: "பின்வாங்கு", save: "சேமி", score: "ஸ்கோர்கார்டு", over: "இந்த ஓவர்", past: "கடந்த ஓவர்கள்", sr: "SR", eco: "Eco", matchOver: "போட்டி முடிந்தது", wonBy: "வெற்றி", tied: "சமன்", share: "பகிர்", print: "PDF சேமி", endInnings: "இன்னிங்ஸை முடி", bowled: "போல்ட்", caught: "கேட்ச்", stumped: "ஸ்டம்ப்ட்", round: "சுற்று", innNum: "இன்னிங்ஸ்" },
  hi: { setup: "नया मैच", history: "मैच इतिहास", teams: "टीमें", team1: "टीम 1", team2: "टीम 2", overs: "ओवर", start: "टॉस शुरू करें", toss: "टॉस का समय", head: "हेड्स", tail: "टेल्स", flip: "सिक्का उछालें", bat: "बल्लेबाजी", bowl: "गेंदबाजी", target: "लक्ष्य", need: "चाहिए", balls: "गेंदें", runRate: "CRR", reqRate: "RRR", extra: "अतिरिक्त", wide: "वाइड", noBall: "नो बॉल", freeHit: "फ्री हिट", wicket: "विकेट", runOut: "रन आउट", undo: "पूर्ववत करें", save: "सहेजें", score: "स्कोरकार्ड", over: "यह Over", past: "पिछले ओवर", sr: "SR", eco: "Eco", matchOver: "मैच समाप्त", wonBy: "ने जीता", tied: "मैच टाई", share: "शेयर", print: "PDF सहेजें", endInnings: "पारी समाप्त", bowled: "बोल्ड", caught: "कैच", stumped: "स्टंप", round: "दौर", innNum: "पारी संख्या" },
  te: { setup: "కొత్త మ్యాచ్", history: "మ్యాచ్ చరిత్ర", teams: "జట్లు", team1: "జట్టు 1", team2: "జట్టు 2", overs: "ఓవర్లు", start: "టాస్ ప్రారంభించు", toss: "టాస్ సమయం", head: "హెడ్స్", tail: "టైల్స్", flip: "కాయిన్ ఎగరవేయండి", bat: "బ్యాటింగ్", bowl: "బౌలింగ్", target: "లక్ష్యం", need: "కావాలి", balls: "బంతులు", runRate: "CRR", reqRate: "RRR", extra: "అదనపు", wide: "వైడ్", noBall: "నో బాల్", freeHit: "ఫ్రీ హిట్", wicket: "వికెట్", runOut: "రన్ అవుట్", undo: "అన్డు", save: "సేవ్", score: "స్కోర్‌కార్డ్", over: "ఈ ఓవర్", past: "గత ఓవర్లు", sr: "SR", eco: "Eco", matchOver: "మ్యాచ్ ముగిసింది", wonBy: "గెలిచింది", tied: "మ్యాచ్ టై", share: "షేర్", print: "PDF సేవ్", endInnings: "ఇన్నింగ్స్ ముగించు", bowled: "బౌల్డ్", caught: "క్యాచ్", stumped: "స్టంప్డ్", round: "రౌండ్", innNum: "ఇన్నింగ్స్" },
  ml: { setup: "പുതിയ മത്സരം", history: "ചരിത്രം", teams: "ടീമുകൾ", team1: "ടീം 1", team2: "ടീം 2", overs: "ഓവറുകൾ", start: "ടോസ് ആരംഭിക്കുക", toss: "ടോസ് സമയം", head: "ഹെഡ്സ്", tail: "ടെയിൽസ്", flip: "കോയിൻ ടോസ് ചെയ്യുക", bat: "ബാറ്റ്", bowl: "ബോൾ", target: "ലക്ഷ്യം", need: "ആവശ്യം", balls: "പന്തുകൾ", runRate: "CRR", reqRate: "RRR", extra: "എക്സ്ട്രാസ്", wide: "വൈഡ്", noBall: "നോ ബോൾ", freeHit: "ഫ്രീ ഹിറ്റ്", wicket: "വിക്കറ്റ്", runOut: "റൺ ഔട്ട്", undo: "അൺഡundo", save: "സേവ് ചെയ്യുക", score: "സ്കോർകാർഡ്", over: "ഈ ഓവർ", past: "കഴിഞ്ഞ ഓവറുകൾ", sr: "SR", eco: "Eco", matchOver: "മത്സരം കഴിഞ്ഞു", wonBy: "വിജയിച്ചു", tied: "സമനില", share: "പങ്കിടുക", print: "PDF സംരക്ഷിക്കുക", endInnings: "ഇന്നിംഗ്സ് അവസാനിപ്പിക്കുക", bowled: "ബൗൾഡ്", caught: "ക്യാച്ച്", stumped: "സ്റ്റമ്പ്ഡ്", round: "റൗണ്ട്", innNum: "ഇന്നിംഗ്സ്" }
};

// --- FORMAT LOGIC HELPERS ---
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmtOvers = (b: number) => `${Math.floor(b / 6)}.${b % 6}`;
const calcSR = (r: number, b: number) => b > 0 ? ((r / b) * 100).toFixed(1) : '0.0';
const calcEco = (r: number, b: number) => b > 0 ? (r / (b / 6)).toFixed(2) : '0.00';
const calcCRR = calcEco;

const formatDateStr = (isoStr: string) => {
  const d = new Date(isoStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; 
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}  ${hours}:${mins} ${ampm}`;
};

const INITIAL_INNINGS = (): InningsData => ({
  inningsLabel: "", runs: 0, wickets: 0, balls: 0, extras: 0, wides: 0, noBalls: 0,
  currentOverLog: [], currentOverRuns: 0, previousOvers: [], isOverComplete: false,
  batter1: { name: "Batter 1", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
  batter2: { name: "Batter 2", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
  striker: 1, bowler: { name: "Bowler 1", runs: 0, wickets: 0, balls: 0, wides: 0, noBalls: 0 },
  allBatters: [{ name: "Batter 1", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false }, { name: "Batter 2", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false }],
  allBowlers: [{ name: "Bowler 1", runs: 0, wickets: 0, balls: 0, wides: 0, noBalls: 0 }]
});

// --- PDF EXPORT HELPER ---
const generateScorecardPDF = (match: GameState, t: any) => {
  const printWindow = window.open('', '', 'width=900,height=700');
  if (!printWindow) { alert("Please allow popups to generate the PDF scorecard."); return; }

  let res = t.tied;
  if(match.matchStatus === 'team1_won') res = `${match.team1} ${t.wonBy} ${match.score1.runs - match.score2.runs} runs`;
  if(match.matchStatus === 'team2_won') {
    const ballsLeft = (match.overs * 6) - match.score2.balls;
    res = `${match.team2} ${t.wonBy} ${10 - match.score2.wickets} wkts (${ballsLeft} balls left)`;
  }

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>ICC SCORE - ${match.team1} vs ${match.team2}</title>
      <style>
        @page { size: auto; margin: 0mm; } 
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 25px; margin: 15mm; color: #0f172a; background: #fff; line-height: 1.5; }
        .header { border-bottom: 3px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 25px; position: relative; }
        .header-content { display: flex; justify-content: space-between; align-items: flex-end; }
        h1 { color: #1e3a8a; margin: 0 0 5px 0; font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
        .subtitle { color: #475569; font-size: 16px; font-weight: 700; text-transform: uppercase; }
        .datetime { text-align: right; color: #64748b; font-size: 16px; font-weight: 600; }
        .result-box { background: #eff6ff; border-left: 5px solid #3b82f6; padding: 15px; margin-bottom: 30px; border-radius: 6px; font-weight: bold; color: #1e3a8a; text-align: center; font-size: 18px; }
        .innings { margin-bottom: 40px; page-break-inside: avoid; }
        .innings-header { background: #1e293b; color: white; padding: 12px 15px; font-size: 18px; font-weight: 800; border-radius: 8px 8px 0 0; text-transform: uppercase; display: flex; justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
        th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 14px; }
        th { background: #f8fafc; color: #475569; font-weight: bold; text-transform: uppercase; font-size: 12px; }
        .right { text-align: right; }
        .bold { font-weight: 800; color: #0f172a; }
        .extras-box { background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; padding: 10px 15px; font-size: 14px; color: #475569; margin-bottom: 20px; border-radius: 0 0 8px 8px; font-weight: 600; }
        @media print { .result-box, .innings-header, th, .extras-box { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <div>
            <h1>MATCH REPORT</h1>
            <div class="subtitle">${match.roundStr || 'MATCH'} &bull; ${match.team1} vs ${match.team2}</div>
          </div>
          <div class="datetime">${formatDateStr(match.createdAt)}</div>
        </div>
      </div>
      
      ${match.matchStatus !== 'playing' ? `<div class="result-box">RESULT: ${res}</div>` : ''}
  `;

  [match.score1, match.score2].forEach((sc, idx) => {
    if (idx === 1 && match.innings === 1 && match.matchStatus === 'playing') return;
    const team = idx === 0 ? match.team1 : match.team2;
    const label = sc.inningsLabel || `${idx + 1}${idx === 0 ? 'st' : 'nd'} Innings - ${team}`;
    html += `
      <div class="innings">
        <div class="innings-header"><span>${label}</span><span>${sc.runs}/${sc.wickets} (${fmtOvers(sc.balls)} Overs)</span></div>
        <table>
          <thead><tr><th>Batting</th><th class="right">R</th><th class="right">B</th><th class="right">4s</th><th class="right">6s</th><th class="right">SR</th></tr></thead>
          <tbody>
            ${sc.allBatters.map((b: any) => `<tr>
              <td><span class="bold">${b.name}</span> <span style="color:#64748b; font-size:12px;">${b.isOut ? '(out)' : '(not out)'}</span></td>
              <td class="right bold">${b.runs}</td><td class="right">${b.balls}</td><td class="right">${b.fours}</td><td class="right">${b.sixes}</td><td class="right">${calcSR(b.runs, b.balls)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
        <div class="extras-box">EXTRAS: <b style="color:#0f172a;">${sc.extras}</b> (WD: ${sc.wides}, NB: ${sc.noBalls})</div>
        
        <table>
          <thead><tr><th>Bowling</th><th class="right">Overs</th><th class="right">Runs</th><th class="right">Wickets</th><th class="right">Econ</th></tr></thead>
          <tbody>
            ${sc.allBowlers.map((b: any) => `<tr>
              <td class="bold">${b.name}</td>
              <td class="right">${fmtOvers(b.balls)}</td><td class="right">${b.runs}</td><td class="right bold" style="color:#dc2626">${b.wickets}</td><td class="right">${calcEco(b.runs, b.balls)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  });

  html += `
      <script>window.onload = () => { setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 300); };</script>
    </body>
    </html>
  `;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

const handleDetailedShare = (match: GameState, t: any) => {
  let res = t.tied;
  if(match.matchStatus === 'team1_won') res = `${match.team1} ${t.wonBy} ${match.score1.runs - match.score2.runs} runs`;
  if(match.matchStatus === 'team2_won') {
    const ballsLeft = (match.overs * 6) - match.score2.balls;
    res = `${match.team2} ${t.wonBy} ${10 - match.score2.wickets} wkts (${ballsLeft} balls left)`;
  }
  
  let text = `🏆 *ICC SCORE - DETAILED MATCH REPORT* 🏆\n📅 ${formatDateStr(match.createdAt)}\n\n`;
  text += `*${match.roundStr || 'Match'}* : *${match.team1} vs ${match.team2}*\n`;
  if (match.matchStatus !== 'playing') text += `*Result:* ${res}\n\n`;

  [match.score1, match.score2].forEach((sc, idx) => {
    if (idx === 1 && match.innings === 1 && match.matchStatus === 'playing') return;
    const team = idx === 0 ? match.team1 : match.team2;
    const innPrefix = match.inningsStr ? `${match.inningsStr}${idx === 0 ? 'st' : 'nd'} ` : `${idx + 1}${idx === 0 ? 'st' : 'nd'} `;
    
    text += `🏏 *${innPrefix}Innings - ${team}*\n`;
    text += `*Total Score:* ${sc.runs}/${sc.wickets} in ${fmtOvers(sc.balls)} Overs\n\n`;
    
    text += `*Batting:*\n`;
    sc.allBatters.forEach((b: any) => {
      if(b.balls > 0 || b.isOut) {
        text += `- ${b.name} ${b.isOut?'(out)':'*'}: ${b.runs} (${b.balls}) [4s:${b.fours}, 6s:${b.sixes}]\n`;
      }
    });
    
    text += `\n*Bowling:*\n`;
    sc.allBowlers.forEach((b: any) => {
      text += `- ${b.name}: ${fmtOvers(b.balls)}-${b.runs}-${b.wickets} (Econ: ${calcEco(b.runs, b.balls)})\n`;
    });
    text += `\nExtras: ${sc.extras} (WD:${sc.wides}, NB:${sc.noBalls})\n`;
    text += `--------------------------\n`;
  });
  
  if (navigator.share) {
    navigator.share({ title: 'ICC SCORE - Match Report', text }).catch(()=>{});
  } else {
    alert("Share not supported on this browser. You can copy the text from the downloaded PDF.");
  }
};

// --- REUSABLE COMPONENTS ---
const GlobalTopBar = ({ t, lang, setLang, onHistory, onBack, title, match }: any) => (
  <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center shadow-lg z-50 relative">
    <div className="flex items-center gap-3">
      {onBack ? <button onClick={onBack} className="text-slate-400 hover:text-white"><ChevronLeft/></button> : <div className="bg-blue-600 p-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)]"><Trophy size={18} /></div>}
      
      {match ? (
        <div className="text-left leading-tight">
          <div className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{match.roundStr || 'MATCH'} &bull; {match.inningsStr || match.innings} {t.innings}</div>
          <div className="text-lg font-black uppercase tracking-wide">{match.innings === 1 ? match.team1 : match.team2} <span className="text-slate-400 font-bold text-sm">v {match.innings === 1 ? match.team2 : match.team1}</span></div>
        </div>
      ) : title ? (
        <div className="text-left leading-tight flex flex-col">
          <h1 className="font-bold tracking-widest text-sm text-slate-200 uppercase">{title}</h1>
        </div>
      ) : (
        <div className="text-left leading-tight flex flex-col">
          <h1 className="font-black text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-500 leading-none mt-1">ICC SCORE</h1>
          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Credits : Omprakash T</span>
        </div>
      )}
    </div>
    <div className="flex gap-3 items-center">
      {onHistory && (
        <button onClick={onHistory} className="px-3 py-1.5 bg-slate-800 rounded-lg text-slate-300 hover:text-white flex items-center gap-2 transition-colors">
          <Clock size={14} /> <span className="text-[10px] font-bold tracking-wider uppercase hidden sm:block">{t.history || "History"}</span>
        </button>
      )}
      <select value={lang} onChange={(e)=>setLang(e.target.value as Lang)} className="bg-slate-800 text-xs rounded-lg px-2 py-1.5 outline-none border border-slate-700 focus:border-blue-500 text-white font-bold cursor-pointer">
        <option value="en">ENG</option><option value="ta">தமிழ்</option><option value="hi">हिंदी</option><option value="te">తెలుగు</option><option value="ml">മലയാളം</option>
      </select>
    </div>
  </div>
);

const GlobalFooter = () => (
  <footer className="mt-auto p-4 text-center text-[10px] text-slate-500 border-t border-slate-800/50 bg-slate-950 tracking-widest uppercase">
    EMAIL : <a href="mailto:omprakashthiruselvi@gmail.com" target="_top" rel="noopener noreferrer" className="lowercase text-blue-400 hover:text-blue-300 underline transition-colors">omprakashthiruselvi@gmail.com</a> FOR BUSINESS QUERIES
  </footer>
);

const ScorecardTables = ({ match }: { match: GameState }) => {
  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="text-center mb-6">
        <h2 className="font-black tracking-widest text-xl uppercase text-blue-500">Match Scorecard</h2>
        <p className="text-xs text-slate-400 mt-1">{match.roundStr || 'Match'} &bull; {formatDateStr(match.createdAt)}</p>
      </div>
      
      {[match.score1, match.score2].map((sc, i) => {
        if (!(i === 0 || match.innings === 2 || match.matchStatus !== 'playing')) return null;
        const team = i === 0 ? match.team1 : match.team2;
        const innPrefix = match.inningsStr ? `${match.inningsStr}${i === 0 ? 'st' : 'nd'} ` : `${i + 1}${i === 0 ? 'st' : 'nd'} `;

        return (
          <div key={i} className="mb-8">
            <div className="bg-blue-900/30 p-3 flex justify-between items-center font-bold border-l-4 border-blue-500 mb-3 rounded-r-lg">
              <span className="uppercase tracking-wide">{innPrefix}INNINGS - {team}</span>
              <span>{sc.runs}/{sc.wickets} ({fmtOvers(sc.balls)})</span>
            </div>
            <table className="w-full text-sm mb-4 border-collapse">
              <thead><tr className="bg-slate-800/50 text-left text-slate-300"><th className="p-2 border-b border-slate-700">Batter</th><th className="p-2 border-b border-slate-700 w-8 text-right">R</th><th className="p-2 border-b border-slate-700 w-8 text-right">B</th><th className="p-2 border-b border-slate-700 w-8 text-right">4s</th><th className="p-2 border-b border-slate-700 w-8 text-right">6s</th><th className="p-2 border-b border-slate-700 w-12 text-right">SR</th></tr></thead>
              <tbody>
                {sc.allBatters.map((b:any, j:number) => (
                  <tr key={j} className="border-b border-slate-800/50"><td className="p-2 font-bold">{b.name} <span className="text-slate-500 text-xs font-normal">{b.isOut?'(out)':'*'}</span></td><td className="p-2 font-bold text-right">{b.runs}</td><td className="p-2 text-slate-400 text-right">{b.balls}</td><td className="p-2 text-right">{b.fours}</td><td className="p-2 text-right">{b.sixes}</td><td className="p-2 text-right">{calcSR(b.runs, b.balls)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs text-slate-400 mb-6 px-2">Extras: <b className="text-white">{sc.extras}</b> (WD: {sc.wides}, NB: {sc.noBalls})</div>

            <table className="w-full text-sm border-collapse">
              <thead><tr className="bg-slate-800/50 text-left text-slate-300"><th className="p-2 border-b border-slate-700">Bowler</th><th className="p-2 border-b border-slate-700 w-10 text-right">O</th><th className="p-2 border-b border-slate-700 w-10 text-right">R</th><th className="p-2 border-b border-slate-700 w-10 text-right">W</th><th className="p-2 border-b border-slate-700 w-12 text-right">Eco</th></tr></thead>
              <tbody>
                {sc.allBowlers.map((b:any, j:number) => (
                  <tr key={j} className="border-b border-slate-800/50"><td className="p-2 font-bold">{b.name}</td><td className="p-2 text-right">{fmtOvers(b.balls)}</td><td className="p-2 text-right">{b.runs}</td><td className="p-2 font-bold text-red-400 text-right">{b.wickets}</td><td className="p-2 text-right">{calcEco(b.runs, b.balls)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [view, setView] = useState<'setup'|'toss'|'scoring'|'end'|'history'>('setup');
  const [lang, setLang] = useState<Lang>('en');
  const [matches, setMatches] = useState<GameState[]>([]);
  const [activeMatch, setActiveMatch] = useState<GameState | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMatches(JSON.parse(saved));
      const active = localStorage.getItem(ACTIVE_MATCH_KEY);
      if (active) {
        const pActive = JSON.parse(active);
        setActiveMatch(pActive);
        setLang(pActive.language);
        setView(pActive.matchStatus !== 'playing' ? 'end' : 'scoring');
      }
    } catch {}
  }, []);

  const saveState = (m: GameState) => {
    setActiveMatch(m);
    try {
      localStorage.setItem(ACTIVE_MATCH_KEY, JSON.stringify(m));
    } catch (e) {
      try { localStorage.setItem(ACTIVE_MATCH_KEY, JSON.stringify({...m, history: []})); } catch(e2) {}
    }
  };
  
  const syncMatches = (m: GameState) => {
    const ms = [...matches];
    const cleanMatch = { ...m, history: [] }; 
    const idx = ms.findIndex(x => x.id === m.id);
    if (idx >= 0) ms[idx] = cleanMatch; else ms.unshift(cleanMatch);
    setMatches(ms);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ms)); } catch (e) {}
  };

  const t = dict[lang];

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes coinFlip { 0% { transform: rotateY(0deg) scale(1); } 50% { transform: rotateY(900deg) scale(1.5); } 100% { transform: rotateY(1800deg) scale(1); } }
      .coin-anim { animation: coinFlip 2s cubic-bezier(0.2, 0.8, 0.3, 1) forwards; transform-style: preserve-3d; }
      @keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      .pop-in { animation: popIn 0.3s ease-out forwards; }
      .score-bubble { min-width: 28px; height: 28px; padding: 0 6px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  if (view === 'setup') return <SetupView t={t} lang={lang} setLang={setLang} setView={setView} setActiveMatch={saveState} matches={matches} onResume={(m: GameState) => { saveState(m); setView(m.matchStatus === 'playing' ? 'scoring' : 'end'); }} />;
  if (view === 'toss' && activeMatch) return <TossView t={t} lang={lang} setLang={setLang} match={activeMatch} updateMatch={saveState} setView={setView} />;
  if (view === 'scoring' && activeMatch) return <ScoringView t={t} lang={lang} setLang={setLang} match={activeMatch} updateMatch={saveState} sync={syncMatches} setView={setView} />;
  if (view === 'end' && activeMatch) return <EndView t={t} lang={lang} setLang={setLang} match={activeMatch} updateMatch={(m: GameState) => {saveState(m); syncMatches(m);}} setView={setView} clearActive={() => { localStorage.removeItem(ACTIVE_MATCH_KEY); setActiveMatch(null); }} />;
  if (view === 'history') return <HistoryView t={t} lang={lang} setLang={setLang} matches={matches} sync={syncMatches} setView={setView} onResume={(m: GameState) => { saveState(m); setView(m.matchStatus === 'playing' ? 'scoring' : 'end'); }} onDelete={(id: string) => { const ms = matches.filter(x => x.id !== id); setMatches(ms); localStorage.setItem(STORAGE_KEY, JSON.stringify(ms)); }} />;
  return null;
}

// --- SETUP VIEW (WITH SLOT PREPARATION) ---
function SetupView({ t, lang, setLang, setView, setActiveMatch, matches, onResume }: any) {
  const [t1, setT1] = useState("CSK");
  const [t2, setT2] = useState("MI");
  const [ovStr, setOvStr] = useState("5");
  const [roundStr, setRoundStr] = useState("Match 1");
  const [inningsStr, setInningsStr] = useState("1");

  const [teamsInput, setTeamsInput] = useState("");
  const [slots, setSlots] = useState<{id: string, t1: string, t2: string, label: string}[]>([]);

  const startMatch = () => {
    const ov = Math.max(1, parseInt(ovStr) || 1);
    const newMatch: GameState = {
      id: genId(), isSetup: false, language: lang, team1: t1, team2: t2, overs: ov, innings: 1, matchStatus: 'playing',
      roundStr, inningsStr,
      score1: INITIAL_INNINGS(), score2: INITIAL_INNINGS(), isFreeHit: false, history: [], createdAt: new Date().toISOString()
    };
    setActiveMatch(newMatch);
    setView('toss');
  };

  const generateSlots = () => {
    let tms = teamsInput.split(',').map(t=>t.trim()).filter(Boolean);
    
    // Double shuffle for highly unpredictable randomness
    for(let i = tms.length - 1; i > 0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [tms[i], tms[j]] = [tms[j], tms[i]];
    }
    tms.sort(() => Math.random() - 0.5);

    const newSlots = [];
    let mNum = 1;
    
    if(tms.length % 2 !== 0 && tms.length > 0) {
       const bye = tms.pop();
       for(let i=0; i<tms.length; i+=2) {
          if(tms[i+1]) newSlots.push({ id: genId(), label: `Match ${mNum++}`, t1: tms[i], t2: tms[i+1] });
       }
       newSlots.push({ id: genId(), label: `Direct Final / Bye`, t1: bye || "TBD", t2: 'Winner of previous' });
    } else {
       for(let i=0; i<tms.length; i+=2) {
          if(tms[i+1]) newSlots.push({ id: genId(), label: `Match ${mNum++}`, t1: tms[i], t2: tms[i+1] });
       }
    }
    setSlots(newSlots);
  };

  const updateSlot = (id: string, field: 't1'|'t2'|'label', val: string) => {
    setSlots(slots.map(s => s.id === id ? { ...s, [field]: val } : s));
  };
  const addSlot = () => setSlots([...slots, { id: genId(), label: 'Custom Match', t1: 'Team A', t2: 'Team B' }]);
  const removeSlot = (id: string) => setSlots(slots.filter(s => s.id !== id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <GlobalTopBar t={t} lang={lang} setLang={setLang} onHistory={() => setView('history')} />
      
      <div className="p-6 flex-1 max-w-md mx-auto w-full">
        
        {/* SLOT PREPARATION */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl pop-in mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><div className="w-1 h-5 bg-blue-500 rounded-full"></div>Slot Preparation</h2>
          <textarea 
            placeholder="Enter teams (comma separated) e.g., CSK, MI, RCB, KKR" 
            value={teamsInput} onChange={e=>setTeamsInput(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm mb-3 font-bold"
          />
          <button onClick={generateSlots} disabled={!teamsInput} className="w-full bg-slate-800 py-3 rounded-xl font-bold hover:bg-slate-700 text-sm mb-4 disabled:opacity-50 transition-colors">Generate Random Slots</button>
          
          {slots.length > 0 && (
            <div className="space-y-3 mb-2">
               {slots.map((s) => (
                  <div key={s.id} className="flex flex-col gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 relative w-full overflow-hidden">
                    <div className="flex justify-between items-center pr-1">
                      <input value={s.label} onChange={(e) => updateSlot(s.id, 'label', e.target.value)} className="bg-transparent text-xs text-blue-400 font-bold outline-none uppercase flex-1 min-w-0" />
                      <button onClick={() => removeSlot(s.id)} className="text-red-400 hover:text-red-300 p-1 shrink-0 transition-colors"><Trash2 size={14}/></button>
                    </div>
                    <div className="flex items-center gap-2 w-full">
                      <input value={s.t1} onChange={(e) => updateSlot(s.id, 't1', e.target.value)} className="flex-1 min-w-0 w-full bg-slate-900 px-2 py-1.5 rounded text-sm outline-none focus:border-blue-500 border border-slate-700 font-bold" />
                      <span className="text-slate-500 text-xs shrink-0">v</span>
                      <input value={s.t2} onChange={(e) => updateSlot(s.id, 't2', e.target.value)} className="flex-1 min-w-0 w-full bg-slate-900 px-2 py-1.5 rounded text-sm outline-none focus:border-blue-500 border border-slate-700 font-bold" />
                    </div>
                    <button onClick={() => {setT1(s.t1); setT2(s.t2); setRoundStr(s.label);}} className="text-xs bg-blue-600/20 text-blue-400 py-2 rounded mt-1 font-bold hover:bg-blue-600/40 w-full transition-colors">Select for New Match</button>
                  </div>
               ))}
               <button onClick={addSlot} className="w-full border border-dashed border-slate-700 text-slate-400 py-2.5 rounded-xl text-sm hover:text-white hover:border-slate-500 font-bold transition-colors">+ Add Custom Slot</button>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl pop-in">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><div className="w-1 h-5 bg-red-500 rounded-full"></div>{t.setup}</h2>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.round || "Round"}</label>
              <input type="text" value={roundStr} onChange={e=>setRoundStr(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold text-sm" /></div>
              
              <div className="w-1/3"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.innNum || "Innings"}</label>
              <input type="text" value={inningsStr} onChange={e=>setInningsStr(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold text-sm text-center" /></div>
            </div>

            <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.team1}</label>
            <input type="text" value={t1} onChange={e=>setT1(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold" /></div>
            
            <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.team2}</label>
            <input type="text" value={t2} onChange={e=>setT2(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-red-500 font-bold" /></div>
            
            <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.overs}</label>
            <input type="number" min="1" value={ovStr} onChange={e=>setOvStr(e.target.value)} placeholder="e.g. 5" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold" />
            </div>
          </div>

          <button onClick={startMatch} disabled={!t1 || !t2 || !parseInt(ovStr)} className="w-full mt-8 bg-gradient-to-r from-blue-600 to-red-600 py-4 rounded-xl font-black text-lg shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:opacity-90 active:scale-95 transition-all uppercase tracking-wider disabled:opacity-50">{t.start}</button>
        </div>

        {matches.length > 0 && matches[0].matchStatus === 'playing' && (
          <button onClick={() => onResume(matches[0])} className="w-full mt-4 bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between hover:bg-slate-700 transition-all shadow-lg">
            <div className="text-left"><p className="text-xs text-blue-400 font-bold mb-1">RESUME MATCH</p><p className="font-bold">{matches[0].team1} vs {matches[0].team2}</p></div>
            <Play size={20} className="text-green-500" />
          </button>
        )}
      </div>
      <GlobalFooter />
    </div>
  );
}

// --- TOSS VIEW ---
function TossView({ t, lang, setLang, match, updateMatch, setView }: any) {
  const [phase, setPhase] = useState<'caller'|'call'|'flip'|'decision'>('caller');
  const [caller, setCaller] = useState<string>('');
  const [call, setCall] = useState<'heads'|'tails'|null>(null);
  const [result, setResult] = useState<'heads'|'tails'|null>(null);
  const [winner, setWinner] = useState<string>('');

  const handleCaller = (team: string) => { setCaller(team); setPhase('call'); };
  
  const handleCall = (c: 'heads'|'tails') => {
    setCall(c);
    setPhase('flip');
    setTimeout(() => {
      const outcome = Math.random() > 0.5 ? 'heads' : 'tails';
      setResult(outcome);
      setWinner(outcome === c ? caller : (caller === match.team1 ? match.team2 : match.team1));
      setPhase('decision');
    }, 2000);
  };

  const handleDecision = (choice: 'bat'|'bowl') => {
    const m = { ...match };
    if ((choice === 'bat' && winner === m.team1) || (choice === 'bowl' && winner === m.team2)) {
      m.team1 = match.team1; m.team2 = match.team2;
    } else {
      m.team1 = match.team2; m.team2 = match.team1;
    }
    updateMatch(m);
    setView('scoring');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <GlobalTopBar t={t} lang={lang} setLang={setLang} title={t.toss} onBack={() => setView('setup')} />
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl pop-in min-h-[300px] flex flex-col justify-center">
          
          {phase === 'caller' && (
            <div className="pop-in">
              <h2 className="text-2xl font-black text-white mb-2">Toss Time</h2>
              <p className="text-slate-400 text-sm mb-6">Which team is calling the toss?</p>
              <div className="flex gap-4">
                <button onClick={() => handleCaller(match.team1)} className="flex-1 bg-blue-600 py-4 rounded-xl font-bold hover:bg-blue-500">{match.team1}</button>
                <button onClick={() => handleCaller(match.team2)} className="flex-1 bg-red-600 py-4 rounded-xl font-bold hover:bg-red-500">{match.team2}</button>
              </div>
            </div>
          )}

          {phase === 'call' && (
            <div className="pop-in">
              <h2 className="text-2xl font-black text-blue-400 mb-2">{caller}</h2>
              <p className="text-slate-400 text-sm mb-6">What is your call?</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => handleCall('heads')} className="w-32 h-32 rounded-full bg-slate-800 border-4 border-blue-500 flex items-center justify-center font-black text-xl text-blue-400 hover:scale-105">{t.head}</button>
                <button onClick={() => handleCall('tails')} className="w-32 h-32 rounded-full bg-slate-800 border-4 border-red-500 flex items-center justify-center font-black text-xl text-red-400 hover:scale-105">{t.tail}</button>
              </div>
            </div>
          )}

          {phase === 'flip' && (
            <div className="flex justify-center pop-in">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-yellow-500 to-yellow-300 coin-anim shadow-2xl border-4 border-yellow-200 flex items-center justify-center">
                <span className="text-5xl">🪙</span>
              </div>
            </div>
          )}

          {phase === 'decision' && (
            <div className="pop-in">
              <div className="text-3xl font-black text-yellow-400 mb-2 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] uppercase tracking-wider">{result === 'heads' ? t.head : t.tail}!</div>
              <h2 className="text-2xl font-black text-white mb-2">{winner} won the toss</h2>
              <p className="text-slate-400 text-sm mb-6">What will they choose?</p>
              <div className="flex gap-4">
                <button onClick={() => handleDecision('bat')} className="flex-1 bg-blue-600 py-3 rounded-xl font-bold uppercase tracking-widest">{t.bat}</button>
                <button onClick={() => handleDecision('bowl')} className="flex-1 bg-red-600 py-3 rounded-xl font-bold uppercase tracking-widest">{t.bowl}</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
}

// --- EXTRA MODAL (WIDES & NO BALLS) ---
function ExtraModalUI({type, t, onClose, onSubmit}: any) {
  const [runs, setRuns] = useState(0);
  const [wkt, setWkt] = useState('');
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 pop-in">
      <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-700 text-white shadow-2xl">
        <h3 className="font-bold mb-4 text-xl flex items-center gap-2">
          <AlertTriangle className="text-yellow-500"/>
          {type === 'WD' ? t.wide : t.noBall} Options
        </h3>
        
        <div className="mb-6 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
          <label className="text-[10px] text-slate-400 font-bold uppercase mb-3 block tracking-widest">Additional Runs Scored</label>
          <div className="grid grid-cols-4 gap-2">
            {[0,1,2,3,4,5,6].map(r => (
              <button key={r} onClick={()=>setRuns(r)} className={`py-3 rounded-xl font-bold transition-colors ${runs===r ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-slate-800 hover:bg-slate-700'}`}>{r}</button>
            ))}
          </div>
        </div>

        <div className="mb-6 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
          <label className="text-[10px] text-slate-400 font-bold uppercase mb-3 block tracking-widest">Wicket on this ball?</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={()=>setWkt('')} className={`col-span-2 py-3 rounded-xl text-sm font-bold transition-colors ${wkt==='' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>No Wicket</button>
            <button onClick={()=>setWkt('Run Out')} className={`py-3 rounded-xl text-sm font-bold transition-colors ${wkt==='Run Out' ? 'bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}>{t.runOut}</button>
            {type === 'WD' ? (
              <button onClick={()=>setWkt('Stumped')} className={`py-3 rounded-xl text-sm font-bold transition-colors ${wkt==='Stumped' ? 'bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}>{t.stumped}</button>
            ) : (
              <button disabled className="py-3 rounded-xl text-sm font-bold bg-slate-800/30 text-slate-600 cursor-not-allowed">{t.stumped}</button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-800 rounded-xl font-bold hover:bg-slate-700">Cancel</button>
          <button onClick={()=>onSubmit(runs, wkt)} className="flex-1 py-4 bg-green-600 rounded-xl font-bold hover:bg-green-500 shadow-[0_0_15px_rgba(22,163,74,0.3)]">Confirm</button>
        </div>
      </div>
    </div>
  )
}

// --- SCORING VIEW ---
function ScoringView({ t, lang, setLang, match, updateMatch, sync, setView }: any) {
  const [modal, setModal] = useState<{type: 'bowler'|'extra'|'wicket'|'end'|'score'|'editName'|null, data?: any}>({type: null});
  
  const m: GameState = match;
  const score = m.innings === 1 ? m.score1 : m.score2;

  const pushHistory = (newState: GameState) => {
    const snapshot = JSON.parse(JSON.stringify(m));
    snapshot.history = []; 
    newState.history = [...m.history, snapshot];
    if (newState.history.length > 20) newState.history.shift(); 
    updateMatch(newState);
    sync(newState);
  };

  const handleRun = (runs: number, extraType: string | null = null, extraRuns: number = 0, isWicket: boolean = false, wicketType: string = '') => {
    if (score.isOverComplete) { setModal({type: 'bowler'}); return; }

    const ns = JSON.parse(JSON.stringify(m)) as GameState;
    ns.history = []; 
    const sc = ns.innings === 1 ? ns.score1 : ns.score2;
    
    let isLegal = true;
    let label = runs.toString();
    const totalRuns = runs + extraRuns;
    let wasFreeHit = ns.isFreeHit;
    
    if (extraType === 'WD') {
      isLegal = false; sc.extras += 1 + extraRuns; sc.wides += 1; sc.runs += 1 + extraRuns; sc.currentOverRuns += 1 + extraRuns;
      label = `WD${extraRuns > 0 ? '+'+extraRuns : ''}`;
      const bInAll = sc.allBowlers.find(b=>b.name === sc.bowler.name);
      if(bInAll) { bInAll.runs += 1+extraRuns; bInAll.wides += 1; }
      sc.bowler.runs += 1+extraRuns; sc.bowler.wides += 1;
    } else if (extraType === 'NB') {
      isLegal = false; sc.extras += 1; sc.noBalls += 1; sc.runs += 1 + runs; sc.currentOverRuns += 1 + runs;
      label = `NB${runs > 0 ? '+'+runs : ''}`;
      ns.isFreeHit = true;
      const bInAll = sc.allBowlers.find(b=>b.name === sc.bowler.name);
      if(bInAll) { bInAll.runs += 1+runs; bInAll.noBalls += 1; }
      sc.bowler.runs += 1+runs; sc.bowler.noBalls += 1;
      
      const striker = sc.striker === 1 ? sc.batter1 : sc.batter2;
      striker.balls += 1; striker.runs += runs;
      if(runs===4) striker.fours++; if(runs===6) striker.sixes++;
      const btInAll = sc.allBatters.find(b=>b.name === striker.name);
      if(btInAll) { btInAll.balls++; btInAll.runs += runs; if(runs===4) btInAll.fours++; if(runs===6) btInAll.sixes++; }
    } else {
      if (wasFreeHit) ns.isFreeHit = false; 
      sc.balls += 1; sc.runs += runs; sc.currentOverRuns += runs;
      sc.bowler.balls += 1; sc.bowler.runs += runs;
      const bInAll = sc.allBowlers.find(b=>b.name === sc.bowler.name);
      if(bInAll) { bInAll.balls++; bInAll.runs += runs; }
      
      const striker = sc.striker === 1 ? sc.batter1 : sc.batter2;
      striker.balls += 1; striker.runs += runs;
      if(runs===4) striker.fours++; if(runs===6) striker.sixes++;
      const btInAll = sc.allBatters.find(b=>b.name === striker.name);
      if(btInAll) { btInAll.balls++; btInAll.runs += runs; if(runs===4) btInAll.fours++; if(runs===6) btInAll.sixes++; }
    }

    if (isWicket) {
      if (wasFreeHit && wicketType !== 'Run Out') {
        alert("Free Hit! Wicket ignored (not a run out).");
      } else {
        sc.wickets += 1;
        if(wicketType !== 'Run Out') { sc.bowler.wickets += 1; const bInAll = sc.allBowlers.find(b=>b.name === sc.bowler.name); if(bInAll) bInAll.wickets++; }
        
        let wktLabel = wicketType;
        if (wicketType === 'Run Out') wktLabel = 'RO';
        else if (wicketType === 'Caught') wktLabel = 'C';
        else if (wicketType === 'Bowled') wktLabel = 'B';
        else if (wicketType === 'Stumped') wktLabel = 'ST';

        if (extraType) label = `${extraType}+W(${wktLabel})`;
        else label = `W(${wktLabel})`;

        const outBatter = sc.striker === 1 ? sc.batter1 : sc.batter2;
        outBatter.isOut = true;
        const btInAll = sc.allBatters.find(b=>b.name === outBatter.name);
        if(btInAll) btInAll.isOut = true;
        
        const nb = { name: `Batter ${sc.wickets + 2}`, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
        if (sc.striker === 1) sc.batter1 = nb; else sc.batter2 = nb;
        sc.allBatters.push(nb);
      }
    }

    sc.currentOverLog.push({ label, isLegal, isWicket, runs: totalRuns, extraType });

    if ((runs % 2 !== 0 && extraType !== 'WD') || (extraType === 'WD' && extraRuns % 2 !== 0)) {
      sc.striker = sc.striker === 1 ? 2 : 1;
    }

    if (isLegal && sc.balls > 0 && sc.balls % 6 === 0) {
      sc.isOverComplete = true;
      sc.striker = sc.striker === 1 ? 2 : 1;
    }

    let inningsEnded = false;
    if (ns.innings === 1 && (sc.wickets >= 10 || sc.balls >= ns.overs * 6)) {
      ns.innings = 2; ns.isFreeHit = false;
      inningsEnded = true;
    } else if (ns.innings === 2) {
      const target = ns.score1.runs + 1;
      if (sc.runs >= target) {
        ns.matchStatus = 'team2_won'; 
      } else if (sc.wickets >= 10 || sc.balls >= ns.overs * 6) {
        ns.matchStatus = sc.runs < ns.score1.runs ? 'team1_won' : 'tie';
      }
    }
    
    pushHistory(ns);

    if (ns.matchStatus !== 'playing') {
      setView('end');
      return; 
    }

    if (sc.isOverComplete && !inningsEnded) {
      setModal({type: 'bowler'});
    }
  };

  const handleNextBowler = (name: string) => {
    const ns = JSON.parse(JSON.stringify(m)) as GameState;
    ns.history = []; 
    const sc = ns.innings === 1 ? ns.score1 : ns.score2;
    sc.previousOvers.push({ overNum: sc.previousOvers.length + 1, runs: sc.currentOverRuns, log: [...sc.currentOverLog], bowlerName: sc.bowler.name });
    sc.currentOverLog = []; sc.currentOverRuns = 0; sc.isOverComplete = false;
    let b = sc.allBowlers.find(x=>x.name === name);
    if (!b) { b = { name, runs: 0, wickets: 0, balls: 0, wides: 0, noBalls: 0 }; sc.allBowlers.push(b); }
    sc.bowler = { ...b };
    pushHistory(ns);
    setModal({type: null});
  };

  const handleEditName = (role: string, oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) { setModal({type:null}); return; }
    
    const ns = JSON.parse(JSON.stringify(m)) as GameState;
    const sc = ns.innings === 1 ? ns.score1 : ns.score2;

    if (role === 'striker' || role === 'nonStriker') {
        const isStrikerB1 = sc.striker === 1;
        const targetBatter = role === 'striker' ? (isStrikerB1 ? 'batter1' : 'batter2') : (isStrikerB1 ? 'batter2' : 'batter1');

        sc[targetBatter].name = newName;
        const bIndex = sc.allBatters.findIndex(b => b.name === oldName);
        if (bIndex > -1) sc.allBatters[bIndex].name = newName;
    } else if (role === 'bowler') {
        sc.bowler.name = newName;
        const bIndex = sc.allBowlers.findIndex(b => b.name === oldName);
        if (bIndex > -1) sc.allBowlers[bIndex].name = newName;
    }

    updateMatch(ns);
    sync(ns);
    setModal({type: null});
  };

  const handleUndo = () => {
    if (m.history.length === 0) return;
    const prev = m.history.pop()!;
    updateMatch(prev); sync(prev);
  };

  const handleEndInnings = () => {
    const ns = JSON.parse(JSON.stringify(m)) as GameState;
    ns.history = [];
    if (ns.innings === 1) {
      ns.innings = 2; ns.isFreeHit = false;
    } else {
      const target = ns.score1.runs + 1;
      if (ns.score2.runs >= target) ns.matchStatus = 'team2_won';
      else if (ns.score2.runs < ns.score1.runs) ns.matchStatus = 'team1_won';
      else ns.matchStatus = 'tie';
    }
    pushHistory(ns);
    if (ns.matchStatus !== 'playing') {
      setView('end');
    } else {
      setModal({type: null});
    }
  };

  const striker = score.striker === 1 ? score.batter1 : score.batter2;
  const nStriker = score.striker === 1 ? score.batter2 : score.batter1;
  const crr = calcCRR(score.runs, score.balls);
  let req = '0.00', need = 0, ballsL = 0;
  if (m.innings === 2) {
    need = m.score1.runs + 1 - score.runs;
    ballsL = (m.overs * 6) - score.balls;
    req = calcCRR(need, ballsL);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <GlobalTopBar t={t} lang={lang} setLang={setLang} match={match} setView={setView} onBack={() => setView('setup')} />

      <div className="flex-1 p-3 overflow-y-auto space-y-3 max-w-lg mx-auto w-full pb-10">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-red-900 rounded-2xl p-4 shadow-xl relative overflow-hidden border border-slate-700">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
          <div className="flex justify-between items-end relative z-10">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black tabular-nums">{score.runs}</span>
                <span className="text-2xl text-slate-400 font-medium">/{score.wickets}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-300">{fmtOvers(score.balls)} <span className="text-xs font-normal">/ {m.overs}</span></div>
              <div className="text-[10px] font-bold text-slate-400 mt-1">{t.runRate}: <span className="text-white">{crr}</span></div>
            </div>
          </div>

          {m.innings === 2 && (
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center bg-black/20 -mx-4 -mb-4 px-4 py-2 relative z-10">
              <div><div className="text-[10px] text-red-300 font-bold">{t.target}</div><div className="text-lg font-black">{m.score1.runs + 1}</div></div>
              <div className="text-center px-4"><div className="text-sm font-black text-yellow-400">{need > 0 ? need : 0} {t.need}</div><div className="text-[10px] text-slate-300">{ballsL} {t.balls}</div></div>
              <div className="text-right"><div className="text-[10px] text-red-300 font-bold">{t.reqRate}</div><div className="text-sm font-black">{req}</div></div>
            </div>
          )}
          {m.isFreeHit && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-sm animate-pulse flex items-center gap-1 z-20">
              <AlertTriangle size={10} /> {t.freeHit}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-2 pb-1 border-b border-slate-800/50">
            <div className="grid grid-cols-[1fr_24px_24px_32px] gap-2 items-center text-[10px] text-slate-500 font-bold mb-1 px-2">
              <span>{t.bat}</span><span className="text-right">R</span><span className="text-right">B</span><span className="text-right">{t.sr}</span>
            </div>
            <div className="grid grid-cols-[1fr_24px_24px_32px] gap-2 items-center bg-blue-900/20 p-2 rounded-lg mb-1 border border-blue-500/20">
              <div className="flex items-center gap-2 font-bold truncate group cursor-pointer" onClick={()=>setModal({type: 'editName', data: {role: 'striker', oldName: striker.name}})}>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shrink-0"></span>
                <span className="truncate group-hover:text-blue-300 transition-colors">{striker.name}</span>
                <Edit2 size={10} className="text-blue-400/50 opacity-0 group-hover:opacity-100 shrink-0" />
              </div>
              <span className="text-right font-bold tabular-nums">{striker.runs}</span><span className="text-right text-slate-400 tabular-nums">{striker.balls}</span><span className="text-right text-blue-400 text-xs tabular-nums">{calcSR(striker.runs, striker.balls)}</span>
            </div>
            <div className="grid grid-cols-[1fr_24px_24px_32px] gap-2 items-center p-2 rounded-lg text-slate-400">
              <div className="flex items-center gap-2 font-medium truncate group cursor-pointer" onClick={()=>setModal({type: 'editName', data: {role: 'nonStriker', oldName: nStriker.name}})}>
                <span className="w-1.5 h-1.5 bg-transparent border border-slate-600 rounded-full shrink-0"></span>
                <span className="truncate group-hover:text-slate-200 transition-colors">{nStriker.name}</span>
                <Edit2 size={10} className="text-slate-500/50 opacity-0 group-hover:opacity-100 shrink-0" />
              </div>
              <span className="text-right font-medium tabular-nums">{nStriker.runs}</span><span className="text-right tabular-nums">{nStriker.balls}</span><span className="text-right text-xs tabular-nums">{calcSR(nStriker.runs, nStriker.balls)}</span>
            </div>
          </div>
          <div className="p-2 bg-slate-800/20">
            <div className="grid grid-cols-[1fr_32px_24px_24px_32px] gap-2 items-center text-[10px] text-slate-500 font-bold mb-1 px-2">
              <span>{t.bowl}</span><span className="text-right">O</span><span className="text-right">R</span><span className="text-right">W</span><span className="text-right">{t.eco}</span>
            </div>
            <div className="grid grid-cols-[1fr_32px_24px_24px_32px] gap-2 items-center p-2 rounded-lg text-slate-200">
              <div className="flex items-center gap-2 font-bold truncate group cursor-pointer" onClick={()=>setModal({type: 'editName', data: {role: 'bowler', oldName: score.bowler.name}})}>
                <span className="truncate group-hover:text-blue-300 transition-colors">{score.bowler.name}</span>
                <Edit2 size={10} className="text-slate-500/50 opacity-0 group-hover:opacity-100 shrink-0" />
              </div>
              <span className="text-right text-slate-400 tabular-nums">{fmtOvers(score.bowler.balls)}</span><span className="text-right font-bold tabular-nums">{score.bowler.runs}</span><span className="text-right text-red-400 font-bold tabular-nums">{score.bowler.wickets}</span><span className="text-right text-yellow-500 text-xs tabular-nums">{calcEco(score.bowler.runs, score.bowler.balls)}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-center shadow-lg relative">
          <div className="flex justify-between items-center mb-2">
            <div className="text-[10px] text-slate-500 font-bold uppercase">{t.over}</div>
            <button onClick={() => setModal({type: 'score'})} className="text-[10px] text-blue-400 flex items-center gap-1 font-bold uppercase"><BarChart2 size={12}/> {t.score}</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scroll items-center min-h-[40px]">
            {score.currentOverLog.map((b, i) => (
              <div key={i} className={`shrink-0 score-bubble ${b.isWicket ? 'bg-red-600 text-white' : b.label==='6' ? 'bg-blue-600 ring-2 ring-blue-400 text-white' : b.label==='4' ? 'bg-blue-500 text-white' : !b.isLegal ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-600' : b.label==='0' ? 'bg-slate-800 text-slate-400' : 'bg-slate-700 text-white'}`}>
                {b.label==='0'? '·' : b.label}
              </div>
            ))}
            {score.currentOverLog.length===0 && <div className="text-slate-600 text-xs italic">...</div>}
          </div>
        </div>

        {score.previousOvers.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg">
            <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">{t.past || "Past Overs Breakdown"}</div>
            <div className="space-y-2">
              {[...score.previousOvers].reverse().map((o, i) => {
                const ones = o.log.filter(b => b.runs === 1 && b.extraType === null).length;
                const twos = o.log.filter(b => b.runs === 2 && b.extraType === null).length;
                const threes = o.log.filter(b => b.runs === 3 && b.extraType === null).length;
                const fours = o.log.filter(b => b.runs === 4 && b.extraType === null).length;
                const sixes = o.log.filter(b => b.runs === 6 && b.extraType === null).length;
                const wkts = o.log.filter(b => b.isWicket).length;
                return (
                  <div key={i} className="flex justify-between items-center bg-slate-800/40 border border-slate-800 p-2.5 rounded-lg text-xs">
                    <div className="flex-1">
                      <div className="font-bold text-slate-200">Over {o.overNum}</div>
                      <div className="text-[10px] text-slate-500 truncate w-16 sm:w-24">{o.bowlerName}</div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 text-right tabular-nums">
                      <div className="flex flex-col"><span className="text-[9px] text-slate-500">R</span><span className="font-black text-white">{o.runs}</span></div>
                      <div className="flex flex-col"><span className="text-[9px] text-slate-500">W</span><span className={`font-black ${wkts > 0 ? 'text-red-400' : 'text-slate-500'}`}>{wkts}</span></div>
                      <div className="flex flex-col"><span className="text-[9px] text-slate-500">1s</span><span className={`font-black ${ones > 0 ? 'text-slate-300' : 'text-slate-600'}`}>{ones}</span></div>
                      <div className="flex flex-col"><span className="text-[9px] text-slate-500">2s</span><span className={`font-black ${twos > 0 ? 'text-slate-300' : 'text-slate-600'}`}>{twos}</span></div>
                      <div className="flex flex-col"><span className="text-[9px] text-slate-500">3s</span><span className={`font-black ${threes > 0 ? 'text-slate-300' : 'text-slate-600'}`}>{threes}</span></div>
                      <div className="flex flex-col"><span className="text-[9px] text-slate-500">4s</span><span className={`font-black ${fours > 0 ? 'text-blue-400' : 'text-slate-600'}`}>{fours}</span></div>
                      <div className="flex flex-col"><span className="text-[9px] text-slate-500">6s</span><span className={`font-black ${sixes > 0 ? 'text-blue-400' : 'text-slate-600'}`}>{sixes}</span></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl grid grid-cols-4 gap-2 shadow-lg">
          {[0,1,2,3,4,6].map(r => (
            <button key={r} onClick={()=>handleRun(r)} className={`h-14 rounded-xl font-black text-xl transition-all active:scale-95 ${r===6 ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : r===4 ? 'bg-blue-500/80' : r===0 ? 'bg-slate-800 text-slate-400' : 'bg-slate-800 hover:bg-slate-700'}`}>{r===0?'·':r}</button>
          ))}
          <button onClick={()=>setModal({type:'extra', data: 'WD'})} className="h-14 bg-slate-800 border border-yellow-600/50 text-yellow-500 font-bold rounded-xl active:scale-95">{t.wide}</button>
          <button onClick={()=>setModal({type:'extra', data: 'NB'})} className="h-14 bg-slate-800 border border-yellow-600/50 text-yellow-500 font-bold rounded-xl active:scale-95">{t.noBall}</button>
          <button onClick={()=>setModal({type:'wicket'})} className="col-span-4 h-14 bg-gradient-to-r from-red-600 to-red-800 text-white font-black text-xl rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.4)] active:scale-95 uppercase tracking-widest">{t.wicket}</button>
        </div>

        <div className="flex gap-2">
          <button onClick={handleUndo} disabled={m.history.length === 0} className="flex-1 py-3 rounded-xl font-bold bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-50 hover:bg-slate-700 active:scale-95 transition-all">
            {t.undo}
          </button>
          <button onClick={() => setModal({type: 'end'})} className="flex-1 py-3 rounded-xl font-bold bg-red-900/40 border border-red-800 text-red-500 hover:bg-red-900/60 active:scale-95 transition-all">
            {t.endInnings || "End Innings"}
          </button>
        </div>

      </div>

      {modal.type === 'bowler' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 pop-in">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-700">
            <h3 className="font-bold mb-4 text-green-400 text-lg">Over Complete!</h3>
            <p className="text-sm text-slate-300 mb-4">Please select the next bowler to continue.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {score.allBowlers.filter(b=>b.name !== score.bowler.name).map((b,i) => (
                <button key={i} onClick={()=>handleNextBowler(b.name)} className="px-3 py-1.5 bg-slate-800 rounded-lg text-sm border border-slate-700 hover:bg-slate-700">{b.name}</button>
              ))}
            </div>
            <form onSubmit={e=>{e.preventDefault(); const v=(e.target as any).bname.value.trim(); if(v) handleNextBowler(v);}}>
              <input name="bname" placeholder="Enter New Bowler Name" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 mb-3 text-white outline-none focus:border-blue-500" autoFocus/>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={()=>setModal({type:null})} className="flex-1 bg-slate-800 py-3 rounded-xl font-bold hover:bg-slate-700 text-white">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/20 text-white">Confirm Bowler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal.type === 'editName' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 pop-in">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-700">
            <h3 className="font-bold mb-4 text-white text-lg">Edit Player Name</h3>
            <form onSubmit={e=>{
              e.preventDefault(); 
              const v=(e.target as any).pname.value; 
              if(v) handleEditName(modal.data.role, modal.data.oldName, v);
            }}>
              <input name="pname" defaultValue={modal.data.oldName} className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 text-white outline-none focus:border-blue-500" autoFocus/>
              <div className="flex gap-2">
                <button type="button" onClick={()=>setModal({type:null})} className="flex-1 bg-slate-800 py-3 rounded-xl font-bold hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/20">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal.type === 'extra' && (
        <ExtraModalUI 
          type={modal.data} 
          t={t} 
          onClose={()=>setModal({type:null})}
          onSubmit={(runs: number, wkt: string) => {
            const isW = wkt !== '';
            if (modal.data === 'WD') handleRun(0, 'WD', runs, isW, wkt);
            else handleRun(runs, 'NB', 0, isW, wkt);
            setModal({type:null});
          }}
        />
      )}

      {modal.type === 'wicket' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 pop-in">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-700">
            <h3 className="font-bold text-red-500 mb-4 text-xl">{t.wicket} Type</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={()=>{handleRun(0, null, 0, true, 'Bowled'); setModal({type:null})}} className="bg-slate-800 py-4 rounded-xl font-bold border border-slate-700 hover:bg-slate-700">{t.bowled || "Bowled"}</button>
              <button onClick={()=>{handleRun(0, null, 0, true, 'Caught'); setModal({type:null})}} className="bg-slate-800 py-4 rounded-xl font-bold border border-slate-700 hover:bg-slate-700">{t.caught || "Caught"}</button>
              <button onClick={()=>{handleRun(0, null, 0, true, 'Run Out'); setModal({type:null})}} className="bg-slate-800 py-4 rounded-xl font-bold border border-slate-700 hover:bg-slate-700">{t.runOut}</button>
              <button onClick={()=>{handleRun(0, null, 0, true, 'Stumped'); setModal({type:null})}} className="bg-slate-800 py-4 rounded-xl font-bold border border-slate-700 hover:bg-slate-700">{t.stumped || "Stumped"}</button>
            </div>
            <button onClick={()=>setModal({type:null})} className="w-full text-slate-400 py-3 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {modal.type === 'end' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 pop-in">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-700">
            <h3 className="font-bold mb-6 text-center text-lg">Are you sure you want to end this innings manually?</h3>
            <div className="flex gap-3">
              <button onClick={()=>setModal({type:null})} className="flex-1 bg-slate-800 py-3 rounded-xl font-bold text-white hover:bg-slate-700">Cancel</button>
              <button onClick={handleEndInnings} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-600/30 hover:bg-red-500">End Innings</button>
            </div>
          </div>
        </div>
      )}

      {modal.type === 'score' && (
        <div className="fixed inset-0 bg-black/90 flex flex-col z-50 pop-in">
          <GlobalTopBar t={t} lang={lang} setLang={setLang} title={t.score} onBack={() => setModal({type:null})} />
          <div className="flex-1 overflow-y-auto p-4 bg-slate-950 text-white">
            <ScorecardTables match={match} />
          </div>
        </div>
      )}
      <GlobalFooter />
    </div>
  );
}

// --- END VIEW ---
function EndView({ t, lang, setLang, match, updateMatch, setView, clearActive }: any) {
  let res = t.tied;
  if(match.matchStatus === 'team1_won') res = `${match.team1} ${t.wonBy} ${match.score1.runs - match.score2.runs} runs`;
  if(match.matchStatus === 'team2_won') {
    const ballsLeft = (match.overs * 6) - match.score2.balls;
    res = `${match.team2} ${t.wonBy} ${10 - match.score2.wickets} wkts (${ballsLeft} balls left)`;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-white font-sans">
      <GlobalTopBar t={t} lang={lang} setLang={setLang} title={t.matchOver} onBack={() => setView('setup')} />
      
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto p-6 text-center pop-in">
          <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          <h1 className="text-3xl font-black text-white mb-2 uppercase">{t.matchOver}</h1>
          <p className="text-xl text-blue-400 font-bold bg-blue-900/30 p-3 rounded-xl border border-blue-500/30 mb-8 shadow-lg shadow-blue-500/20">{res}</p>
          
          <div className="flex gap-4 mb-8">
            <div className="flex-1 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
              <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-widest">{match.team1}</div>
              <div className="text-2xl font-black text-white">{match.score1.runs}/{match.score1.wickets}</div>
              <div className="text-xs text-slate-500 mt-1">({fmtOvers(match.score1.balls)} Overs)</div>
            </div>
            <div className="flex-1 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
              <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-widest">{match.team2}</div>
              <div className="text-2xl font-black text-white">{match.score2.runs}/{match.score2.wickets}</div>
              <div className="text-xs text-slate-500 mt-1">({fmtOvers(match.score2.balls)} Overs)</div>
            </div>
          </div>

          <div className="space-y-3 mb-10">
            <button onClick={() => generateScorecardPDF(match, t)} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 border border-slate-700"><Download size={18}/> {t.print || "Download PDF"}</button>
            <button onClick={() => handleDetailedShare(match, t)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-500"><Share2 size={18}/> {t.share}</button>
            <button onClick={()=>{clearActive(); setView('setup');}} className="w-full bg-slate-900 border border-slate-800 text-white font-bold py-4 rounded-xl flex items-center justify-center hover:bg-slate-800">New Match</button>
          </div>

          <div className="text-left bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl">
             <ScorecardTables match={match} />
          </div>
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
}

// --- HISTORY VIEW ---
function HistoryView({ t, lang, setLang, matches, sync, setView, onResume, onDelete }: any) {
  const [selectedMatch, setSelectedMatch] = useState<GameState | null>(null);

  if (selectedMatch) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col z-50 pop-in">
        <GlobalTopBar t={t} lang={lang} setLang={setLang} title="Match Details" onBack={() => setSelectedMatch(null)} />
        <div className="flex-1 overflow-y-auto p-4 text-white">
          <ScorecardTables match={selectedMatch} />
          <div className="max-w-2xl mx-auto flex gap-2 pb-10">
            <button onClick={() => handleDetailedShare(selectedMatch, t)} className="flex-1 py-3 bg-blue-600 rounded-xl font-bold flex justify-center items-center gap-2"><Share2 size={16}/> {t.share}</button>
            <button onClick={() => generateScorecardPDF(selectedMatch, t)} className="flex-1 py-3 bg-green-600 rounded-xl font-bold flex justify-center items-center gap-2"><Download size={16}/> PDF</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-white">
      <GlobalTopBar t={t} lang={lang} setLang={setLang} title={t.history} onBack={() => setView('setup')} />
      
      <div className="flex-1 p-4 overflow-y-auto space-y-3 max-w-2xl mx-auto w-full">
        {matches.length === 0 && <p className="text-center text-slate-500 mt-10">No matches found.</p>}
        {matches.map((m: GameState) => (
          <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-lg cursor-pointer hover:border-slate-700 transition-colors" onClick={() => setSelectedMatch(m)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">{m.team1} <span className="text-sm font-normal text-slate-400">v</span> {m.team2}</div>
                <div className="text-xs text-slate-500 mt-1">{formatDateStr(m.createdAt)} &bull; {m.matchStatus === 'playing' ? <span className="text-yellow-500">Ongoing</span> : <span className="text-green-500">Complete</span>}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-lg">{m.score1.runs}/{m.score1.wickets}</div>
                {(m.innings === 2 || m.matchStatus !== 'playing') && <div className="font-bold text-sm text-slate-400">{m.score2.runs}/{m.score2.wickets}</div>}
              </div>
            </div>
            <div className="flex gap-2 justify-end border-t border-slate-800 pt-3" onClick={(e) => e.stopPropagation()}>
              {m.matchStatus === 'playing' ? (
                <button onClick={() => onResume(m)} className="px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg flex items-center gap-1 text-sm font-bold"><Play size={14}/> Resume</button>
              ) : (
                <>
                  <button onClick={() => handleDetailedShare(m, t)} className="px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg flex items-center gap-1 text-sm font-bold hover:bg-blue-600/30"><Share2 size={14}/> {t.share}</button>
                  <button onClick={() => generateScorecardPDF(m, t)} className="px-3 py-2 bg-green-600/20 text-green-400 rounded-lg flex items-center gap-1 text-sm font-bold hover:bg-green-600/30"><Download size={14}/> PDF</button>
                </>
              )}
              <button onClick={() => onDelete(m.id)} className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg flex items-center gap-1 text-sm hover:bg-red-600/30"><Trash2 size={14}/> Delete</button>
            </div>
          </div>
        ))}
      </div>
      <GlobalFooter />
    </div>
  );
}