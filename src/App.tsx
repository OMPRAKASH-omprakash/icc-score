import { useState, useEffect } from "react";
import { 
  Trophy, Clock, ChevronLeft, BarChart2, 
  Play, Trash2, Download, Share2, AlertTriangle, Edit2, Award, Star
} from "lucide-react";

// --- TYPES & STORAGE ---
type Lang = 'en' | 'ta' | 'hi' | 'te' | 'ml';

interface BatterStats { 
  name: string; runs: number; balls: number; fours: number; sixes: number; isOut: boolean; 
  dismissal?: string; dismissalType?: string; fielder?: string; bowler?: string;
}
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
  roundStr: string; 
  matchStatus: 'playing' | 'innings_break' | 'team1_won' | 'team2_won' | 'tie';
  revisedTarget?: number;
  isSuperOver?: boolean;
  tieBreakerInfo?: string;
  mainScore1?: InningsData;
  mainScore2?: InningsData;
  score1: InningsData; 
  score2: InningsData;
  isFreeHit: boolean; history: GameState[]; createdAt: string;
}

const STORAGE_KEY = 'icc_score_matches';
const ACTIVE_MATCH_KEY = 'icc_score_active';

// --- TRANSLATIONS ---
const dict: Record<Lang, any> = {
  en: { setup: "New Match", history: "History", performance: "Awards", teams: "Teams", team1: "Team 1", team2: "Team 2", overs: "Overs", start: "Start Toss", toss: "Toss Time", head: "Heads", tail: "Tails", flip: "Flip Coin", bat: "Bat", bowl: "Bowl", target: "Target", need: "Need", balls: "Balls", runRate: "CRR", reqRate: "RRR", extra: "Extras", wide: "Wide", noBall: "No Ball", freeHit: "FREE HIT", wicket: "Wicket", runOut: "Run Out", undo: "Undo", save: "Save", score: "Match Scorecard", over: "This Over", past: "Past Overs", sr: "SR", eco: "Eco", matchOver: "Match Over", wonBy: "won by", tied: "Match Tied", share: "Share", print: "Save PDF", endInnings: "End Innings", bowled: "Bowled", caught: "Caught", stumped: "Stumped", round: "Round Number/Name" },
  ta: { setup: "புதிய போட்டி", history: "வரலாறு", performance: "விருதுகள்", teams: "அணிகள்", team1: "அணி 1", team2: "அணி 2", overs: "ஓவர்கள்", start: "டாஸ்", toss: "டாஸ்", head: "தலை", tail: "பூ", flip: "சுழற்று", bat: "பேட்டிங்", bowl: "பந்துவீச்சு", target: "இலக்கு", need: "தேவை", balls: "பந்துகள்", runRate: "CRR", reqRate: "RRR", extra: "உதிரிகள்", wide: "வைடு", noBall: "நோ பால்", freeHit: "ஃப்ரீ ஹிட்", wicket: "விக்கெட்", runOut: "ரன் அவுட்", undo: "பின்வாங்கு", save: "சேமி", score: "ஸ்கோர்கார்டு", over: "இந்த ஓவர்", past: "கடந்த ஓவர்கள்", sr: "SR", eco: "Eco", matchOver: "போட்டி முடிந்தது", wonBy: "வெற்றி", tied: "சமன்", share: "பகிர்", print: "PDF சேமி", endInnings: "முடி", bowled: "போல்ட்", caught: "கேட்ச்", stumped: "ஸ்டம்ப்ட்", round: "சுற்று" },
  hi: { setup: "नया मैच", history: "इतिहास", performance: "पुरस्कार", teams: "टीमें", team1: "टीम 1", team2: "टीम 2", overs: "ओवर", start: "टॉस", toss: "टॉस", head: "हेड्स", tail: "टेल्स", flip: "सिक्का उछालें", bat: "बल्लेबाजी", bowl: "गेंदबाजी", target: "लक्ष्य", need: "चाहिए", balls: "गेंदें", runRate: "CRR", reqRate: "RRR", extra: "अतिरिक्त", wide: "वाइड", noBall: "नो बॉल", freeHit: "फ्री हिट", wicket: "विकेट", runOut: "रन आउट", undo: "पूर्ववत करें", save: "सहेजें", score: "स्कोरकार्ड", over: "यह Over", past: "पिछले ओवर", sr: "SR", eco: "Eco", matchOver: "मैच समाप्त", wonBy: "ने जीता", tied: "मैच टाई", share: "शेयर", print: "PDF सहेजें", endInnings: "पारी समाप्त", bowled: "बोल्ड", caught: "कैच", stumped: "स्टंप", round: "दौर" },
  te: { setup: "కొత్త మ్యాచ్", history: "చరిత్ర", performance: "అవార్డులు", teams: "జట్లు", team1: "జట్టు 1", team2: "జట్టు 2", overs: "ఓవర్లు", start: "టాస్", toss: "టాస్", head: "హెడ్స్", tail: "టైల్స్", flip: "కాయిన్", bat: "బ్యాటింగ్", bowl: "బౌలింగ్", target: "లక్ష్యం", need: "కావాలి", balls: "బంతులు", runRate: "CRR", reqRate: "RRR", extra: "అదనపు", wide: "వైడ్", noBall: "నో బాల్", freeHit: "ఫ్రీ హిట్", wicket: "వికెట్", runOut: "రన్ అవుట్", undo: "అన్డు", save: "సేవ్", score: "స్కోర్‌కార్డ్", over: "ఈ ఓవర్", past: "గత ఓవర్లు", sr: "SR", eco: "Eco", matchOver: "మ్యాచ్ ముగిసింది", wonBy: "గెలిచింది", tied: "మ్యాచ్ టై", share: "షేర్", print: "PDF సేవ్", endInnings: "ముగించు", bowled: "బౌల్డ్", caught: "క్యాచ్", stumped: "స్టంప్డ్", round: "రౌండ్" },
  ml: { setup: "പുതിയ മത്സരം", history: "ചരിത്രം", performance: "അവാർഡുകൾ", teams: "ടീമുകൾ", team1: "ടീം 1", team2: "ടീം 2", overs: "ഓവറുകൾ", start: "ടോസ്", toss: "ടോസ്", head: "ഹെഡ്സ്", tail: "ടെയിൽസ്", flip: "കോയിൻ", bat: "ബാറ്റ്", bowl: "ബോൾ", target: "ലക്ഷ്യം", need: "ആവശ്യം", balls: "പന്തുകൾ", runRate: "CRR", reqRate: "RRR", extra: "എക്സ്ട്രാസ്", wide: "വൈഡ്", noBall: "നോ ബോൾ", freeHit: "ഫ്രീ ഹിറ്റ്", wicket: "വിക്കറ്റ്", runOut: "റൺ ഔട്ട്", undo: "അൺഡു", save: "സേവ് ചെയ്യുക", score: "സ്കോർകാർഡ്", over: "ഈ ഓവർ", past: "കഴിഞ്ഞ ഓവറുകൾ", sr: "SR", eco: "Eco", matchOver: "മത്സരം കഴിഞ്ഞു", wonBy: "വിജയിച്ചു", tied: "സമനില", share: "പങ്കിടുക", print: "PDF സംരക്ഷിക്കുക", endInnings: "അവസാനിപ്പിക്കുക", bowled: "ബൗൾഡ്", caught: "ക്യാച്ച്", stumped: "സ്റ്റമ്പ്ഡ്", round: "റൗണ്ട്" }
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
  if (match.isSuperOver && match.matchStatus !== 'tie') {
     res = `${match.matchStatus === 'team1_won' ? match.team1 : match.team2} won the ${match.tieBreakerInfo}`;
  } else if (match.tieBreakerInfo && !match.isSuperOver) {
     res = `${match.matchStatus === 'team1_won' ? match.team1 : match.team2} won by ${match.tieBreakerInfo}`;
  } else if (match.matchStatus === 'team1_won') {
     res = `${match.team1} ${t.wonBy} ${match.score1.runs - match.score2.runs} runs`;
  } else if (match.matchStatus === 'team2_won') {
     res = `${match.team2} ${t.wonBy} ${10 - match.score2.wickets} wkts`;
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
        .dismissal { color: #64748b; font-size: 11px; font-weight: normal; margin-top: 2px; }
        .section-title { text-align: center; color: #1e3a8a; margin-top: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; text-transform: uppercase; font-weight: 900; letter-spacing: 2px; }
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
      
      ${(match.matchStatus as string) !== 'playing' && (match.matchStatus as string) !== 'innings_break' ? `<div class="result-box">RESULT: ${res}</div>` : ''}
  `;

  const matchSets = match.isSuperOver 
     ? [ { s1: match.mainScore1, s2: match.mainScore2, label: 'MAIN MATCH' }, { s1: match.score1, s2: match.score2, label: match.tieBreakerInfo?.toUpperCase() || 'TIE BREAKER' } ]
     : [ { s1: match.score1, s2: match.score2, label: '' } ];

  matchSets.forEach((mSet) => {
    if (mSet.label) html += `<h2 class="section-title">${mSet.label}</h2>`;

    [mSet.s1, mSet.s2].forEach((sc: any, idx) => {
      if (!sc) return;
      if (idx === 1 && match.innings === 1 && (match.matchStatus as string) === 'playing') return;
      const team = idx === 0 ? match.team1 : match.team2;
      const innPrefix = idx === 0 ? '1st ' : '2nd ';
      const label = sc.inningsLabel || `${innPrefix}Innings - ${team}`;
      
      html += `
        <div class="innings">
          <div class="innings-header"><span>${label}</span><span>${sc.runs}/${sc.wickets} (${fmtOvers(sc.balls)} Overs)</span></div>
          <table>
            <thead><tr><th>Batting</th><th class="right">R</th><th class="right">B</th><th class="right">4s</th><th class="right">6s</th><th class="right">SR</th></tr></thead>
            <tbody>
              ${sc.allBatters.map((b: any) => `<tr>
                <td>
                  <div class="bold">${b.name}</div>
                  <div class="dismissal">${b.isOut ? (b.dismissal || '(out)') : 'not out'}</div>
                </td>
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
  if (match.isSuperOver && match.matchStatus !== 'tie') {
     res = `${match.matchStatus === 'team1_won' ? match.team1 : match.team2} won the ${match.tieBreakerInfo}`;
  } else if (match.tieBreakerInfo && !match.isSuperOver) {
     res = `${match.matchStatus === 'team1_won' ? match.team1 : match.team2} won by ${match.tieBreakerInfo}`;
  } else if (match.matchStatus === 'team1_won') {
     res = `${match.team1} ${t.wonBy} ${match.score1.runs - match.score2.runs} runs`;
  } else if (match.matchStatus === 'team2_won') {
     res = `${match.team2} ${t.wonBy} ${10 - match.score2.wickets} wkts`;
  }
  
  let text = `🏆 *ICC SCORE - DETAILED MATCH REPORT* 🏆\n📅 ${formatDateStr(match.createdAt)}\n\n`;
  text += `*${match.roundStr || 'Match'}* : *${match.team1} vs ${match.team2}*\n`;
  if ((match.matchStatus as string) !== 'playing' && (match.matchStatus as string) !== 'innings_break') text += `*Result:* ${res}\n\n`;

  const matchSets = match.isSuperOver 
     ? [ { s1: match.mainScore1, s2: match.mainScore2, label: 'MAIN MATCH' }, { s1: match.score1, s2: match.score2, label: match.tieBreakerInfo?.toUpperCase() || 'TIE BREAKER' } ]
     : [ { s1: match.score1, s2: match.score2, label: '' } ];

  matchSets.forEach((mSet) => {
    if (mSet.label) text += `\n=== ${mSet.label} ===\n\n`;

    [mSet.s1, mSet.s2].forEach((sc: any, idx) => {
      if (!sc) return;
      if (idx === 1 && match.innings === 1 && (match.matchStatus as string) === 'playing') return;
      const team = idx === 0 ? match.team1 : match.team2;
      const innPrefix = idx === 0 ? '1st ' : '2nd ';
      
      text += `🏏 *${innPrefix}Innings - ${team}*\n`;
      text += `*Total Score:* ${sc.runs}/${sc.wickets} in ${fmtOvers(sc.balls)} Overs\n\n`;
      
      text += `*Batting:*\n`;
      sc.allBatters.forEach((b: any) => {
        if(b.balls > 0 || b.isOut) {
          let outStr = b.isOut ? (b.dismissal ? `(${b.dismissal})` : '(out)') : '*';
          text += `- ${b.name} ${outStr}: ${b.runs} (${b.balls}) [4s:${b.fours}, 6s:${b.sixes}]\n`;
        }
      });
      
      text += `\n*Bowling:*\n`;
      sc.allBowlers.forEach((b: any) => {
        text += `- ${b.name}: ${fmtOvers(b.balls)}-${b.runs}-${b.wickets} (Econ: ${calcEco(b.runs, b.balls)})\n`;
      });
      text += `\nExtras: ${sc.extras} (WD:${sc.wides}, NB:${sc.noBalls})\n`;
      text += `--------------------------\n`;
    });
  });
  
  if (navigator.share) {
    navigator.share({ title: 'ICC SCORE - Match Report', text }).catch(()=>{});
  } else {
    alert("Share not supported on this browser. You can copy the text from the downloaded PDF.");
  }
};

// --- REUSABLE COMPONENTS ---
const GlobalTopBar = ({ t, lang, setLang, onHistory, onPerformance, onBack, title, match }: any) => (
  <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center shadow-lg z-50 relative">
    <div className="flex items-center gap-3">
      {onBack ? <button onClick={onBack} className="text-slate-400 hover:text-white"><ChevronLeft/></button> : <div className="bg-blue-600 p-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)]"><Trophy size={18} /></div>}
      
      {match ? (
        <div className="text-left leading-tight">
          <div className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{match.roundStr || 'MATCH'} &bull; {match.isSuperOver ? 'SUPER OVER' : (match.innings === 1 ? '1ST' : '2ND')} {t.innNum || "INNINGS"}</div>
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
    <div className="flex gap-2 items-center">
      {onPerformance && (
        <button onClick={onPerformance} className="flex flex-col items-center px-2 py-1 bg-yellow-600/10 text-yellow-500 rounded-lg hover:bg-yellow-600/30 transition-colors" title={t.performance || "Awards"}>
          <Award size={14} />
          <span className="text-[8px] font-bold mt-0.5 tracking-widest uppercase">{t.performance || "Awards"}</span>
        </button>
      )}
      {onHistory && (
        <button onClick={onHistory} className="flex flex-col items-center px-2 py-1 bg-slate-800 text-slate-300 rounded-lg hover:text-white transition-colors" title={t.history || "History"}>
          <Clock size={14} />
          <span className="text-[8px] font-bold mt-0.5 tracking-widest uppercase">{t.history || "History"}</span>
        </button>
      )}
      <select value={lang} onChange={(e)=>setLang(e.target.value as Lang)} className="bg-slate-800 text-xs rounded-lg px-1 py-1.5 outline-none border border-slate-700 focus:border-blue-500 text-white font-bold cursor-pointer">
        <option value="en">EN</option><option value="ta">TA</option><option value="hi">HI</option><option value="te">TE</option><option value="ml">ML</option>
      </select>
    </div>
  </div>
);

const GlobalFooter = () => (
  <footer className="mt-auto p-4 text-center text-[10px] text-slate-500 border-t border-slate-800/50 bg-slate-950 tracking-widest uppercase space-y-2">
    <div>EMAIL : <a href="mailto:omprakashthiruselvi@gmail.com" target="_top" rel="noopener noreferrer" className="lowercase text-blue-400 hover:text-blue-300 underline transition-colors">omprakashthiruselvi@gmail.com</a> FOR BUSINESS QUERIES</div>
    <div className="font-bold text-slate-400 border-t border-slate-800/50 pt-2 mx-10">SUPPORTERS : ILLAMPUYAL CRICKET CLUB (DEVIYAKURICHI)</div>
  </footer>
);

const ScorecardTables = ({ match }: { match: GameState }) => {
  const matchSets = match.isSuperOver 
     ? [ { s1: match.mainScore1, s2: match.mainScore2, label: 'MAIN MATCH' }, { s1: match.score1, s2: match.score2, label: match.tieBreakerInfo?.toUpperCase() || 'TIE BREAKER' } ]
     : [ { s1: match.score1, s2: match.score2, label: '' } ];

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="text-center mb-6">
        <h2 className="font-black tracking-widest text-xl uppercase text-blue-500">Match Scorecard</h2>
        <p className="text-xs text-slate-400 mt-1">{match.roundStr || 'Match'} &bull; {formatDateStr(match.createdAt)}</p>
        {match.tieBreakerInfo && !match.isSuperOver && (
           <p className="text-xs text-yellow-400 font-bold mt-2 uppercase tracking-widest bg-yellow-600/20 inline-block px-3 py-1 rounded-full border border-yellow-500/30">
              Resolved via {match.tieBreakerInfo}
           </p>
        )}
      </div>
      
      {matchSets.map((mSet, setIdx) => (
         <div key={setIdx}>
           {mSet.label && (
              <div className="text-center font-black text-slate-300 tracking-widest uppercase my-6 border-b border-slate-800 pb-2">{mSet.label}</div>
           )}

           {[mSet.s1, mSet.s2].map((sc: any, i) => {
             if (!sc || !(i === 0 || match.innings === 2 || (match.matchStatus as string) !== 'playing')) return null;
             const team = i === 0 ? match.team1 : match.team2;
             const innPrefix = i === 0 ? '1st ' : '2nd ';

             return (
               <div key={i} className="mb-8">
                 <div className="bg-blue-900/30 p-3 flex justify-between items-center font-bold border-l-4 border-blue-500 mb-3 rounded-r-lg">
                   <span className="uppercase tracking-wide">{innPrefix}INNINGS - {team}</span>
                   <span>{sc.runs}/{sc.wickets} ({fmtOvers(sc.balls)})</span>
                 </div>
                 <table className="w-full text-sm mb-4 border-collapse">
                   <thead><tr className="bg-slate-800/50 text-left text-slate-300"><th className="p-2 border-b border-slate-700">Batter</th><th className="p-2 border-b border-slate-700 w-8 text-right">R</th><th className="p-2 border-b border-slate-700 w-8 text-right">B</th><th className="p-2 border-b border-slate-700 w-8 text-right">4s</th><th className="p-2 border-b border-slate-700 w-8 text-right">6s</th><th className="p-2 border-b border-slate-700 w-12 text-right">SR</th></tr></thead>
                   <tbody>
                     {sc.allBatters.map((b:any, j:number) => {
                       if (b.balls === 0 && !b.isOut && j > 1 && (match.matchStatus as string) === 'playing') return null;
                       return (
                         <tr key={j} className="border-b border-slate-800/50">
                           <td className="p-2">
                             <div className="font-bold">{b.name}</div>
                             <div className="text-[10px] text-slate-500 mt-0.5 tracking-wide uppercase">{b.isOut ? (b.dismissal || '(out)') : 'not out'}</div>
                           </td>
                           <td className="p-2 font-bold text-right align-top">{b.runs}</td><td className="p-2 text-slate-400 text-right align-top">{b.balls}</td><td className="p-2 text-right align-top">{b.fours}</td><td className="p-2 text-right align-top">{b.sixes}</td><td className="p-2 text-right align-top">{calcSR(b.runs, b.balls)}</td>
                         </tr>
                       )
                     })}
                   </tbody>
                 </table>
                 <div className="text-xs text-slate-400 mb-6 px-2">Extras: <b className="text-white">{sc.extras}</b> (WD: {sc.wides}, NB: {sc.noBalls})</div>

                 <table className="w-full text-sm border-collapse">
                   <thead><tr className="bg-slate-800/50 text-left text-slate-300"><th className="p-2 border-b border-slate-700">Bowler</th><th className="p-2 border-b border-slate-700 w-10 text-right">O</th><th className="p-2 border-b border-slate-700 w-10 text-right">R</th><th className="p-2 border-b border-slate-700 w-10 text-right">W</th><th className="p-2 border-b border-slate-700 w-12 text-right">Eco</th></tr></thead>
                   <tbody>
                     {sc.allBowlers.map((b:any, j:number) => {
                       if (b.balls === 0 && b.runs === 0 && (match.matchStatus as string) === 'playing') return null;
                       return (
                         <tr key={j} className="border-b border-slate-800/50"><td className="p-2 font-bold">{b.name}</td><td className="p-2 text-right">{fmtOvers(b.balls)}</td><td className="p-2 text-right">{b.runs}</td><td className="p-2 font-bold text-red-400 text-right">{b.wickets}</td><td className="p-2 text-right">{calcEco(b.runs, b.balls)}</td></tr>
                       )
                     })}
                   </tbody>
                 </table>
               </div>
             );
           })}
         </div>
      ))}
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [view, setView] = useState<'setup'|'toss'|'scoring'|'innings_break'|'end'|'history'|'performance'>('setup');
  const [lang, setLang] = useState<Lang>('en');
  const [matches, setMatches] = useState<GameState[]>([]);
  const [activeMatch, setActiveMatch] = useState<GameState | null>(null);

  const [setupData, setSetupData] = useState({ t1: '', t2: '', ovStr: '', roundStr: 'Match 1', teamsInput: '', slots: [] as any[] });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMatches(JSON.parse(saved));
      const active = localStorage.getItem(ACTIVE_MATCH_KEY);
      if (active) {
        const pActive = JSON.parse(active);
        setActiveMatch(pActive);
        setLang(pActive.language);
        if (pActive.matchStatus === 'innings_break') setView('innings_break');
        else setView(pActive.matchStatus !== 'playing' ? 'end' : 'scoring');
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

  const handleTieBreaker = (type: string, oldMatch: GameState) => {
    const m = JSON.parse(JSON.stringify(oldMatch));
    // Save original 20-over score if it's the first tie breaker
    if (!m.isSuperOver) {
       m.mainScore1 = m.score1;
       m.mainScore2 = m.score2;
    }
    // Initialize mini-match data
    m.score1 = INITIAL_INNINGS();
    m.score2 = INITIAL_INNINGS();
    m.innings = 1;
    m.overs = 1; 
    m.matchStatus = 'playing';
    m.isSuperOver = true;
    m.tieBreakerInfo = type;
    m.history = [];
    saveState(m);
    setView('toss');
  }

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

  if (view === 'setup') return <SetupView t={t} lang={lang} setLang={setLang} setView={setView} setActiveMatch={saveState} matches={matches} onResume={(m: GameState) => { saveState(m); setView(m.matchStatus === 'innings_break' ? 'innings_break' : m.matchStatus === 'playing' ? 'scoring' : 'end'); }} sData={setupData} setSData={setSetupData} />;
  if (view === 'toss' && activeMatch) return <TossView t={t} lang={lang} setLang={setLang} match={activeMatch} updateMatch={saveState} setView={setView} />;
  if (view === 'innings_break' && activeMatch) return <InningsBreakView t={t} lang={lang} setLang={setLang} match={activeMatch} updateMatch={saveState} setView={setView} />;
  if (view === 'scoring' && activeMatch) return <ScoringView t={t} lang={lang} setLang={setLang} match={activeMatch} updateMatch={saveState} sync={syncMatches} setView={setView} />;
  if (view === 'end' && activeMatch) return <EndView t={t} lang={lang} setLang={setLang} match={activeMatch} updateMatch={(m: GameState) => {saveState(m); syncMatches(m);}} setView={setView} clearActive={() => { localStorage.removeItem(ACTIVE_MATCH_KEY); setActiveMatch(null); }} onTieBreaker={handleTieBreaker} />;
  if (view === 'history') return <HistoryView t={t} lang={lang} setLang={setLang} matches={matches} sync={syncMatches} setView={setView} onResume={(m: GameState) => { saveState(m); setView(m.matchStatus === 'innings_break' ? 'innings_break' : m.matchStatus === 'playing' ? 'scoring' : 'end'); }} onDelete={(id: string) => { const ms = matches.filter(x => x.id !== id); setMatches(ms); localStorage.setItem(STORAGE_KEY, JSON.stringify(ms)); }} />;
  if (view === 'performance') return <PerformanceView t={t} lang={lang} setLang={setLang} matches={matches} setView={setView} />;
  return null;
}

// --- SETUP VIEW (WITH SLOT PREPARATION) ---
function SetupView({ t, lang, setLang, setView, setActiveMatch, matches, onResume, sData, setSData }: any) {
  
  const startMatch = () => {
    const ov = Math.max(1, parseInt(sData.ovStr) || 1);
    const newMatch: GameState = {
      id: genId(), isSetup: false, language: lang, team1: sData.t1, team2: sData.t2, overs: ov, innings: 1, matchStatus: 'playing',
      roundStr: sData.roundStr,
      score1: INITIAL_INNINGS(), score2: INITIAL_INNINGS(), isFreeHit: false, history: [], createdAt: new Date().toISOString()
    };
    setActiveMatch(newMatch);
    setView('toss');
  };

  const generateSlots = () => {
    let tms = sData.teamsInput.split(',').map((tm:string)=>tm.trim()).filter(Boolean);
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
    setSData({...sData, slots: newSlots});
  };

  const updateSlot = (id: string, field: 't1'|'t2'|'label', val: string) => {
    setSData({...sData, slots: sData.slots.map((s:any) => s.id === id ? { ...s, [field]: val } : s)});
  };
  const addSlot = () => setSData({...sData, slots: [...sData.slots, { id: genId(), label: 'Custom Match', t1: 'Team A', t2: 'Team B' }]});
  const removeSlot = (id: string) => setSData({...sData, slots: sData.slots.filter((s:any) => s.id !== id)});

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <GlobalTopBar t={t} lang={lang} setLang={setLang} onHistory={() => setView('history')} onPerformance={() => setView('performance')} />
      
      <div className="p-6 flex-1 max-w-md mx-auto w-full">
        
        {/* SLOT PREPARATION */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl pop-in mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><div className="w-1 h-5 bg-blue-500 rounded-full"></div>Slot Preparation</h2>
          <textarea 
            placeholder="Enter teams (comma separated) e.g., CSK, MI, RCB, KKR" 
            value={sData.teamsInput} onChange={e=>setSData({...sData, teamsInput: e.target.value})}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm mb-3 font-bold"
          />
          <button onClick={generateSlots} disabled={!sData.teamsInput} className="w-full bg-slate-800 py-3 rounded-xl font-bold hover:bg-slate-700 text-sm mb-4 disabled:opacity-50 transition-colors">Generate Random Slots</button>
          
          {sData.slots.length > 0 && (
            <div className="space-y-3 mb-2">
               {sData.slots.map((s:any) => (
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
                    <button onClick={() => {setSData({...sData, t1: s.t1, t2: s.t2, roundStr: s.label});}} className="text-xs bg-blue-600/20 text-blue-400 py-2 rounded mt-1 font-bold hover:bg-blue-600/40 w-full transition-colors">Select for New Match</button>
                  </div>
               ))}
               <button onClick={addSlot} className="w-full border border-dashed border-slate-700 text-slate-400 py-2.5 rounded-xl text-sm hover:text-white hover:border-slate-500 font-bold transition-colors">+ Add Custom Slot</button>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl pop-in">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><div className="w-1 h-5 bg-red-500 rounded-full"></div>{t.setup}</h2>
          
          <div className="space-y-4">
            <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.round || "Round"}</label>
            <input type="text" value={sData.roundStr} onChange={e=>setSData({...sData, roundStr: e.target.value})} placeholder="e.g. Semi Final" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold text-sm" /></div>

            <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.team1}</label>
            <input type="text" value={sData.t1} onChange={e=>setSData({...sData, t1: e.target.value})} placeholder="Team 1 Name" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold" /></div>
            
            <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.team2}</label>
            <input type="text" value={sData.t2} onChange={e=>setSData({...sData, t2: e.target.value})} placeholder="Team 2 Name" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold" /></div>
            
            <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.overs}</label>
            <input type="number" min="1" value={sData.ovStr} onChange={e=>setSData({...sData, ovStr: e.target.value})} placeholder="How many overs?" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold" />
            </div>
          </div>

          <button onClick={startMatch} disabled={!(sData.t1.trim() && sData.t2.trim() && parseInt(sData.ovStr) > 0)} className="w-full mt-8 bg-gradient-to-r from-blue-600 to-red-600 py-4 rounded-xl font-black text-lg shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:opacity-90 active:scale-95 transition-all uppercase tracking-wider disabled:opacity-50">{t.start}</button>
        </div>

        {matches.length > 0 && (matches[0].matchStatus === 'playing' || matches[0].matchStatus === 'innings_break') && (
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
  const [phase, setPhase] = useState<'caller'|'call'|'flip'|'decision'|'skip_toss'>('caller');
  const [caller, setCaller] = useState<string>('');
  const [result, setResult] = useState<'heads'|'tails'|null>(null);
  const [winner, setWinner] = useState<string>('');

  const handleCaller = (team: string) => { setCaller(team); setPhase('call'); };
  
  const handleCall = (c: 'heads'|'tails') => {
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

  const handleManualBat = (firstBatTeam: string) => {
    const m = { ...match };
    if (firstBatTeam !== m.team1) {
       m.team1 = match.team2; m.team2 = match.team1;
    }
    updateMatch(m);
    setView('scoring');
  }

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
              <div className="mt-8 border-t border-slate-800/50 pt-6">
                <button onClick={() => setPhase('skip_toss')} className="text-slate-500 text-sm hover:text-white transition-colors underline underline-offset-4">Skip Toss & Select Batting Team</button>
              </div>
            </div>
          )}

          {phase === 'skip_toss' && (
            <div className="pop-in">
              <h2 className="text-2xl font-black text-white mb-2">Manual Setup</h2>
              <p className="text-slate-400 text-sm mb-6">Select the team that will bat first</p>
              <div className="flex gap-4">
                <button onClick={() => handleManualBat(match.team1)} className="flex-1 bg-blue-600 py-4 rounded-xl font-bold hover:bg-blue-500">{match.team1}</button>
                <button onClick={() => handleManualBat(match.team2)} className="flex-1 bg-red-600 py-4 rounded-xl font-bold hover:bg-red-500">{match.team2}</button>
              </div>
              <button onClick={() => setPhase('caller')} className="mt-8 text-slate-500 text-sm hover:text-white underline underline-offset-4">Back to Coin Flip</button>
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

// --- INNINGS BREAK VIEW ---
function InningsBreakView({ t, lang, setLang, match, updateMatch, setView }: any) {
  const [timeLeft, setTimeLeft] = useState(8); 

  useEffect(() => {
    if (timeLeft <= 0) { startNext(); return; }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const startNext = () => {
    const m = JSON.parse(JSON.stringify(match));
    m.matchStatus = 'playing';
    m.innings = 2;
    m.isFreeHit = false;
    updateMatch(m);
    setView('scoring');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-white">
      <GlobalTopBar t={t} lang={lang} setLang={setLang} title="Innings Break" />
      <div className="flex-1 overflow-y-auto p-4">
         <div className="max-w-2xl mx-auto mb-6 text-center pop-in">
            <h2 className="text-2xl font-black text-blue-400 uppercase tracking-widest">Innings Complete</h2>
            <p className="text-sm text-slate-400 mb-4">Target for {match.team2}: <strong className="text-white text-lg">{match.score1.runs + 1}</strong> runs in {match.overs * 6} balls</p>
            <button onClick={startNext} className="bg-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/30">
               Start 2nd Innings ({timeLeft}s)
            </button>
         </div>
         <div className="opacity-80 pointer-events-none">
            <ScorecardTables match={match} />
         </div>
      </div>
      <GlobalFooter />
    </div>
  )
}

// --- MODALS FOR WICKET AND EXTRAS ---
function ExtraModalUI({type, t, onClose, onSubmit}: any) {
  const [runs, setRuns] = useState(0);
  const [wkt, setWkt] = useState('');
  const [fielder, setFielder] = useState('');
  
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
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={()=>{setWkt(''); setFielder('');}} className={`col-span-2 py-3 rounded-xl text-sm font-bold transition-colors ${wkt==='' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>No Wicket</button>
            <button onClick={()=>setWkt('Run Out')} className={`py-3 rounded-xl text-sm font-bold transition-colors ${wkt==='Run Out' ? 'bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}>{t.runOut}</button>
            {type === 'WD' ? (
              <button onClick={()=>setWkt('Stumped')} className={`py-3 rounded-xl text-sm font-bold transition-colors ${wkt==='Stumped' ? 'bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}>{t.stumped}</button>
            ) : (
              <button disabled className="py-3 rounded-xl text-sm font-bold bg-slate-800/30 text-slate-600 cursor-not-allowed">{t.stumped}</button>
            )}
            {type === 'WD' && (
              <button onClick={()=>setWkt('Caught')} className={`col-span-2 py-3 rounded-xl text-sm font-bold transition-colors ${wkt==='Caught' ? 'bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}>Caught</button>
            )}
          </div>
          {wkt && wkt !== 'Bowled' && (
            <input placeholder="Fielder Name" value={fielder} onChange={e=>setFielder(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 pop-in" />
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-800 rounded-xl font-bold hover:bg-slate-700">Cancel</button>
          <button onClick={()=>onSubmit(runs, wkt, fielder)} className="flex-1 py-4 bg-green-600 rounded-xl font-bold hover:bg-green-500 shadow-[0_0_15px_rgba(22,163,74,0.3)]">Confirm</button>
        </div>
      </div>
    </div>
  )
}

function WicketModalUI({ t, onClose, onSubmit }: any) {
  const [wType, setWType] = useState<string>('Bowled');
  const [fielder, setFielder] = useState<string>('');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 pop-in">
      <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-700 text-white shadow-2xl">
        <h3 className="font-bold text-red-500 mb-4 text-xl">{t.wicket} Type</h3>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          {['Bowled', 'Caught', 'Run Out', 'Stumped'].map((type) => (
            <button key={type} onClick={()=>setWType(type)} className={`py-3 rounded-xl font-bold border transition-colors ${wType === type ? 'bg-red-600 border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
              {type === 'Run Out' ? t.runOut : type === 'Bowled' ? t.bowled : type === 'Caught' ? t.caught : t.stumped}
            </button>
          ))}
        </div>

        {wType !== 'Bowled' && (
          <div className="mb-4 pop-in">
            <label className="text-[10px] text-slate-400 font-bold uppercase mb-2 block tracking-widest">Fielder Name</label>
            <input autoFocus placeholder="e.g. Virat Kohli" value={fielder} onChange={e=>setFielder(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 font-bold" />
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold hover:bg-slate-700">Cancel</button>
          <button onClick={()=>onSubmit(wType, fielder)} className="flex-1 py-3 bg-red-600 rounded-xl font-bold hover:bg-red-500">Confirm Wicket</button>
        </div>
      </div>
    </div>
  );
}

// --- SCORING VIEW ---
function ScoringView({ t, lang, setLang, match, updateMatch, sync, setView }: any) {
  const [modal, setModal] = useState<{type: 'bowler'|'extra'|'wicket'|'end'|'score'|'editName'|'editOvers'|null, data?: any}>({type: null});
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  
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

  const handleRun = (runs: number, extraType: string | null = null, extraRuns: number = 0, isWicket: boolean = false, wicketType: string = '', fielderName: string = '') => {
    if (score.isOverComplete || isWaitingForNext) return;

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
        
        let dString = '';
        const fName = fielderName.trim() || 'Sub';
        if (wicketType === 'Bowled') dString = `(BOWLED) ${sc.bowler.name}`;
        else if (wicketType === 'Caught') dString = `(CAUGHT) ${fName} (BOWLED) ${sc.bowler.name}`;
        else if (wicketType === 'Stumped') dString = `(STUMPED) ${fName} (BOWLED) ${sc.bowler.name}`;
        else if (wicketType === 'Run Out') dString = `(RUN OUT) ${fName}`;

        outBatter.dismissal = dString;
        outBatter.dismissalType = wicketType;
        outBatter.fielder = fielderName.trim();
        outBatter.bowler = sc.bowler.name;

        const btInAll = sc.allBatters.find(b=>b.name === outBatter.name);
        if(btInAll) {
          btInAll.isOut = true;
          btInAll.dismissal = dString;
          btInAll.dismissalType = wicketType;
          btInAll.fielder = fielderName.trim();
          btInAll.bowler = sc.bowler.name;
        }
        
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
      ns.matchStatus = 'innings_break';
      inningsEnded = true;
    } else if (ns.innings === 2) {
      const target = ns.revisedTarget ? ns.revisedTarget : ns.score1.runs + 1;
      if (sc.runs >= target) {
        ns.matchStatus = 'team2_won'; 
      } else if (sc.wickets >= 10 || sc.balls >= ns.overs * 6) {
        ns.matchStatus = sc.runs < target - 1 ? 'team1_won' : 'tie';
      }
    }
    
    pushHistory(ns);

    if (ns.matchStatus === 'innings_break') {
      setView('innings_break');
      return;
    } else if (ns.matchStatus !== 'playing') {
      setView('end');
      return; 
    }

    // Apply 3 Second Delay for next bowler
    if (sc.isOverComplete && !inningsEnded) {
      setIsWaitingForNext(true);
      setTimeout(() => {
        setIsWaitingForNext(false);
        setModal({type: 'bowler'});
      }, 3000);
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

  const handleEditOvers = (newOvers: number, applyDls: boolean) => {
      const ns = JSON.parse(JSON.stringify(m)) as GameState;
      ns.history = [];
      ns.overs = newOvers;

      // Apply DLS if in 2nd innings and requested
      if (applyDls && ns.innings === 2 && newOvers < m.overs) {
          let runsAtBall = 0;
          let ballsCounted = 0;
          const allT1Balls = [];
          ns.score1.previousOvers.forEach(o => allT1Balls.push(...o.log));
          allT1Balls.push(...ns.score1.currentOverLog);

          for (const b of allT1Balls) {
              runsAtBall += b.runs;
              if (b.isLegal) ballsCounted++;
              if (ballsCounted === newOvers * 6) break;
          }
          ns.revisedTarget = runsAtBall + 1;
      }
      
      const sc = ns.innings === 1 ? ns.score1 : ns.score2;
      if (sc.balls >= ns.overs * 6) {
          if (ns.innings === 1) {
            ns.matchStatus = 'innings_break';
          } else {
            const target = ns.revisedTarget ? ns.revisedTarget : ns.score1.runs + 1;
            if (ns.score2.runs >= target) ns.matchStatus = 'team2_won';
            else if (ns.score2.runs < target - 1) ns.matchStatus = 'team1_won';
            else ns.matchStatus = 'tie';
          }
          if (ns.matchStatus === 'innings_break') {
             updateMatch(ns); sync(ns); setView('innings_break'); return;
          }
          if (ns.matchStatus !== 'playing') {
             updateMatch(ns); sync(ns); setView('end'); return;
          }
      }
      updateMatch(ns); sync(ns); setModal({type: null});
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
      ns.matchStatus = 'innings_break';
    } else {
      const target = ns.revisedTarget ? ns.revisedTarget : ns.score1.runs + 1;
      if (ns.score2.runs >= target) ns.matchStatus = 'team2_won';
      else if (ns.score2.runs < target - 1) ns.matchStatus = 'team1_won';
      else ns.matchStatus = 'tie';
    }
    pushHistory(ns);
    if (ns.matchStatus === 'innings_break') {
      setView('innings_break');
    } else if (ns.matchStatus !== 'playing') {
      setView('end');
    } else {
      setModal({type: null});
    }
  };

  const striker = score.striker === 1 ? score.batter1 : score.batter2;
  const nStriker = score.striker === 1 ? score.batter2 : score.batter1;
  const crr = calcCRR(score.runs, score.balls);
  
  let targetScore = 0, req = '0.00', need = 0, ballsL = 0;
  if (m.innings === 2) {
    targetScore = m.revisedTarget ? m.revisedTarget : m.score1.runs + 1;
    need = targetScore - score.runs;
    ballsL = (m.overs * 6) - score.balls;
    req = calcCRR(need, ballsL);
  }

  const currentMaxBalls = Math.max(m.score1.balls, m.score2.balls);
  const minAllowedOvers = Math.floor(currentMaxBalls / 6) + (currentMaxBalls % 6 > 0 ? 1 : 0);

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
            <div className="text-right flex flex-col items-end">
              <div className="text-sm font-bold text-slate-300 flex items-center gap-1 bg-slate-950/30 px-2 py-0.5 rounded-lg border border-white/10">
                {fmtOvers(score.balls)} <span className="text-xs font-normal">/ {m.overs}</span>
                <button onClick={() => setModal({type:'editOvers'})} className="text-blue-400 hover:text-white transition-colors ml-1 p-1"><Edit2 size={10}/></button>
              </div>
              <div className="text-[10px] font-bold text-slate-400 mt-2">{t.runRate}: <span className="text-white">{crr}</span></div>
            </div>
          </div>

          {m.innings === 2 && (
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center bg-black/20 -mx-4 -mb-4 px-4 py-2 relative z-10">
              <div>
                 <div className="text-[10px] text-red-300 font-bold">{t.target} {m.revisedTarget ? '(DLS)' : ''}</div>
                 <div className="text-lg font-black">{targetScore}</div>
              </div>
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

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-center shadow-lg relative min-h-[90px]">
          {isWaitingForNext ? (
             <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-10 rounded-xl flex flex-col items-center justify-center pop-in border border-blue-500/50">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <div className="text-xs font-bold text-blue-400 tracking-widest uppercase">Over Complete</div>
             </div>
          ) : null}
          <div className="flex justify-between items-center mb-2">
            <div className="text-[10px] text-slate-500 font-bold uppercase">{t.over}</div>
            <button onClick={() => setModal({type: 'score'})} className="text-[10px] text-blue-400 flex items-center gap-1 font-bold uppercase z-20"><BarChart2 size={12}/> {t.score}</button>
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

        <div className={`bg-slate-900 border border-slate-800 p-2 rounded-xl grid grid-cols-4 gap-2 shadow-lg transition-opacity ${isWaitingForNext ? 'opacity-50 pointer-events-none' : ''}`}>
          {[0,1,2,3,4,6].map(r => (
            <button key={r} disabled={isWaitingForNext} onClick={()=>handleRun(r)} className={`h-14 rounded-xl font-black text-xl transition-all active:scale-95 ${r===6 ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : r===4 ? 'bg-blue-500/80' : r===0 ? 'bg-slate-800 text-slate-400' : 'bg-slate-800 hover:bg-slate-700'}`}>{r===0?'·':r}</button>
          ))}
          <button disabled={isWaitingForNext} onClick={()=>setModal({type:'extra', data: 'WD'})} className="h-14 bg-slate-800 border border-yellow-600/50 text-yellow-500 font-bold rounded-xl active:scale-95">{t.wide}</button>
          <button disabled={isWaitingForNext} onClick={()=>setModal({type:'extra', data: 'NB'})} className="h-14 bg-slate-800 border border-yellow-600/50 text-yellow-500 font-bold rounded-xl active:scale-95">{t.noBall}</button>
          <button disabled={isWaitingForNext} onClick={()=>setModal({type:'wicket'})} className="col-span-4 h-14 bg-gradient-to-r from-red-600 to-red-800 text-white font-black text-xl rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.4)] active:scale-95 uppercase tracking-widest">{t.wicket}</button>
        </div>

        <div className="flex gap-2">
          <button onClick={handleUndo} disabled={m.history.length === 0 || isWaitingForNext} className="flex-1 py-3 rounded-xl font-bold bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-50 hover:bg-slate-700 active:scale-95 transition-all">
            {t.undo}
          </button>
          <button onClick={() => setModal({type: 'end'})} disabled={isWaitingForNext} className="flex-1 py-3 rounded-xl font-bold bg-red-900/40 border border-red-800 text-red-500 hover:bg-red-900/60 active:scale-95 transition-all disabled:opacity-50">
            {t.endInnings || "End Innings"}
          </button>
        </div>

      </div>

      {modal.type === 'bowler' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 pop-in">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-700">
            <h3 className="font-bold mb-4 text-green-400 text-lg">Select Next Bowler</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {score.allBowlers.filter(b=>b.name !== score.bowler.name).map((b,i) => (
                <button key={i} onClick={()=>handleNextBowler(b.name)} className="px-3 py-1.5 bg-slate-800 rounded-lg text-sm border border-slate-700 hover:bg-slate-700">{b.name}</button>
              ))}
            </div>
            <form onSubmit={e=>{e.preventDefault(); const v=(e.target as any).bname.value.trim(); if(v) handleNextBowler(v);}}>
              <input name="bname" placeholder="Enter New Bowler Name" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 mb-3 text-white outline-none focus:border-blue-500" autoFocus/>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="w-full bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/20 text-white">Confirm Bowler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal.type === 'editOvers' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 pop-in">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-700">
            <h3 className="font-bold mb-2 text-white text-lg">Edit Match Overs</h3>
            <p className="text-xs text-slate-400 mb-4">You cannot reduce overs below what has already been bowled.</p>
            <form onSubmit={e=>{
              e.preventDefault(); 
              const v = parseInt((e.target as any).ovnum.value); 
              const applyDls = (e.target as any).dlsCheck?.checked || false;
              if(v >= minAllowedOvers) handleEditOvers(v, applyDls);
            }}>
              <input type="number" name="ovnum" defaultValue={m.overs} min={minAllowedOvers} className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 text-white outline-none focus:border-blue-500 font-bold" autoFocus/>
              
              {m.innings === 2 && (
                 <label className="flex items-center gap-3 mb-5 text-sm text-yellow-400 bg-yellow-900/10 p-3 rounded-lg border border-yellow-600/30 cursor-pointer">
                    <input type="checkbox" name="dlsCheck" defaultChecked className="w-4 h-4 rounded" />
                    <div>
                       <div className="font-bold">Apply DLS Method?</div>
                       <div className="text-[10px] text-slate-300">Recalculates target based on 1st innings score at this over limit.</div>
                    </div>
                 </label>
              )}

              <div className="flex gap-2">
                <button type="button" onClick={()=>setModal({type:null})} className="flex-1 bg-slate-800 py-3 rounded-xl font-bold hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/20">Save</button>
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
          onSubmit={(runs: number, wkt: string, fielder: string) => {
            const isW = wkt !== '';
            if (modal.data === 'WD') handleRun(0, 'WD', runs, isW, wkt, fielder);
            else handleRun(runs, 'NB', 0, isW, wkt, fielder);
            setModal({type:null});
          }}
        />
      )}

      {modal.type === 'wicket' && (
        <WicketModalUI 
          t={t}
          onClose={()=>setModal({type:null})}
          onSubmit={(wktType: string, fielderName: string)=>{
            handleRun(0, null, 0, true, wktType, fielderName);
            setModal({type:null});
          }}
        />
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
    </div>
  );
}

// --- END VIEW ---
function EndView({ t, lang, setLang, match, updateMatch, setView, clearActive, onTieBreaker }: any) {
  let res = t.tied;
  if (match.isSuperOver && match.matchStatus !== 'tie') {
     res = `${match.matchStatus === 'team1_won' ? match.team1 : match.team2} won the ${match.tieBreakerInfo}`;
  } else if (match.tieBreakerInfo && !match.isSuperOver) {
     res = `${match.matchStatus === 'team1_won' ? match.team1 : match.team2} won by ${match.tieBreakerInfo}`;
  } else if (match.matchStatus === 'team1_won') {
     res = `${match.team1} ${t.wonBy} ${match.score1.runs - match.score2.runs} runs`;
  } else if (match.matchStatus === 'team2_won') {
     const target = match.revisedTarget ? match.revisedTarget : match.score1.runs + 1;
     const need = target - match.score2.runs;
     const ballsLeft = (match.overs * 6) - match.score2.balls;
     res = `${match.team2} ${t.wonBy} ${10 - match.score2.wickets} wkts (${ballsLeft} balls left)`;
  }

  const s1 = match.isSuperOver ? match.mainScore1 : match.score1;
  const s2 = match.isSuperOver ? match.mainScore2 : match.score2;

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
              <div className="text-2xl font-black text-white">{s1.runs}/{s1.wickets}</div>
              <div className="text-xs text-slate-500 mt-1">({fmtOvers(s1.balls)} Overs)</div>
            </div>
            <div className="flex-1 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
              <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-widest">{match.team2}</div>
              <div className="text-2xl font-black text-white">{s2.runs}/{s2.wickets}</div>
              <div className="text-xs text-slate-500 mt-1">({fmtOvers(s2.balls)} Overs)</div>
            </div>
          </div>

          {match.matchStatus === 'tie' && (
            <div className="mb-10 bg-slate-900 border border-yellow-600/50 rounded-2xl p-5 pop-in shadow-xl shadow-yellow-600/10">
                <h3 className="text-yellow-500 font-black mb-2 uppercase tracking-widest flex items-center justify-center gap-2"><AlertTriangle size={18}/> Resolve Tie</h3>
                <p className="text-slate-400 text-sm mb-4">Start a new mini-match to decide the winner:</p>
                <div className="flex gap-2">
                   <button onClick={()=>onTieBreaker('Super Over', match)} className="flex-1 py-4 bg-yellow-600/20 border border-yellow-500 text-yellow-400 font-bold rounded-xl hover:bg-yellow-600/40 transition-colors shadow-[0_0_15px_rgba(202,138,4,0.3)]">Start Super Over</button>
                   <button onClick={()=>onTieBreaker('Bowl Out', match)} className="flex-1 py-4 bg-slate-800 border border-slate-700 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors">Start Bowl Out</button>
                </div>
            </div>
          )}

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
function HistoryView({ t, lang, setLang, matches, setView, onResume, onDelete }: any) {
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
        {matches.map((m: GameState) => {
          const s1 = m.isSuperOver ? m.mainScore1 : m.score1;
          const s2 = m.isSuperOver ? m.mainScore2 : m.score2;
          return (
            <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-lg cursor-pointer hover:border-slate-700 transition-colors" onClick={() => setSelectedMatch(m)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg">{m.team1} <span className="text-sm font-normal text-slate-400">v</span> {m.team2}</div>
                  <div className="text-xs text-slate-500 mt-1">{formatDateStr(m.createdAt)} &bull; {((m.matchStatus as string) === 'playing' || (m.matchStatus as string) === 'innings_break') ? <span className="text-yellow-500">Ongoing</span> : <span className="text-green-500">Complete</span>}</div>
                </div>
                <div className="text-right">
                  {s1 && <div className="font-black text-lg">{s1.runs}/{s1.wickets}</div>}
                  {s2 && (m.innings === 2 || ((m.matchStatus as string) !== 'playing' && (m.matchStatus as string) !== 'innings_break')) && <div className="font-bold text-sm text-slate-400">{s2.runs}/{s2.wickets}</div>}
                </div>
              </div>
              {m.tieBreakerInfo && (
                <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest bg-yellow-600/10 inline-block px-2 py-1 rounded border border-yellow-500/20 w-fit">
                  Resolved via {m.tieBreakerInfo}
                </div>
              )}
              <div className="flex gap-2 justify-end border-t border-slate-800 pt-3" onClick={(e) => e.stopPropagation()}>
                {((m.matchStatus as string) === 'playing' || (m.matchStatus as string) === 'innings_break') ? (
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
          )
        })}
      </div>
      <GlobalFooter />
    </div>
  );
}

// --- PERFORMANCE HISTORY VIEW ---
function PerformanceView({ t, lang, setLang, matches, setView }: any) {
  const [stats, setStats] = useState<any>({ runs: [], wickets: [], catches: [], fours: [], sixes: [], hatTricks: [] });

  useEffect(() => {
    const p: Record<string, any> = {};
    const getP = (name: string) => { if(!p[name]) p[name] = { name, runs: 0, wickets: 0, catches: 0, fours: 0, sixes: 0, hatTricks: 0 }; return p[name]; };

    const completed = matches.filter((m: GameState) => (m.matchStatus as string) !== 'playing' && (m.matchStatus as string) !== 'innings_break' && !m.isSetup);
    
    completed.forEach((m: GameState) => {
        const inningsToProcess = m.isSuperOver ? [m.mainScore1, m.mainScore2, m.score1, m.score2] : [m.score1, m.score2];

        inningsToProcess.forEach(sc => {
            if(!sc || !sc.allBatters) return;
            
            // Batters & Catches
            sc.allBatters.forEach(b => {
                const pStat = getP(b.name);
                pStat.runs += b.runs;
                pStat.fours += b.fours;
                pStat.sixes += b.sixes;
                if (b.isOut && b.fielder && b.dismissalType === 'Caught') {
                    getP(b.fielder).catches += 1;
                }
            });

            // Bowlers & Hat-tricks
            sc.allBowlers.forEach(b => { getP(b.name).wickets += b.wickets; });
            
            const allBalls = [...sc.previousOvers.flatMap(o=>o.log.map(b=>({...b, bowler: o.bowlerName}))), ...sc.currentOverLog.map(b=>({...b, bowler: sc.bowler.name}))];
            let wStreak = 0;
            let currentB = '';
            
            allBalls.forEach(b => {
                if (b.isWicket && b.label && !b.label.includes('RO')) { // Only bowler wickets count for Hat-tricks
                    if (b.bowler === currentB) {
                        wStreak++;
                        if(wStreak === 3) {
                            getP(b.bowler).hatTricks += 1;
                            wStreak = 0; // Reset after a hat-trick
                        }
                    } else {
                        currentB = b.bowler;
                        wStreak = 1;
                    }
                } else if (b.isLegal || b.extraType === 'WD' || b.extraType === 'NB') {
                    wStreak = 0; // Non-wicket ball resets streak
                }
            });
        });
    });

    const players = Object.values(p);
    setStats({
       runs: [...players].sort((a,b) => b.runs - a.runs).filter(x=>x.runs > 0).slice(0, 5),
       wickets: [...players].sort((a,b) => b.wickets - a.wickets).filter(x=>x.wickets > 0).slice(0, 5),
       catches: [...players].sort((a,b) => b.catches - a.catches).filter(x=>x.catches > 0).slice(0, 5),
       fours: [...players].sort((a,b) => b.fours - a.fours).filter(x=>x.fours > 0).slice(0, 5),
       sixes: [...players].sort((a,b) => b.sixes - a.sixes).filter(x=>x.sixes > 0).slice(0, 5),
       hatTricks: [...players].sort((a,b) => b.hatTricks - a.hatTricks).filter(x=>x.hatTricks > 0).slice(0, 5),
    });
  }, [matches]);

  const StatCard = ({ title, data, valKey, icon, colorClass }: any) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg pop-in">
       <div className={`flex items-center gap-2 mb-4 pb-2 border-b border-slate-800 font-bold ${colorClass}`}>
          {icon} {title}
       </div>
       {data.length === 0 ? (
          <div className="text-slate-600 text-xs text-center py-4 italic">No data available</div>
       ) : (
          <div className="space-y-3">
             {data.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <span className={`w-5 text-center text-xs font-bold ${i===0?'text-yellow-500':i===1?'text-slate-300':i===2?'text-amber-600':'text-slate-600'}`}>#{i+1}</span>
                      <span className="text-sm font-bold text-white">{p.name}</span>
                   </div>
                   <span className={`text-lg font-black ${colorClass}`}>{p[valKey]}</span>
                </div>
             ))}
          </div>
       )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-white">
      <GlobalTopBar t={t} lang={lang} setLang={setLang} title={t.performance || "Performance History"} onBack={() => setView('setup')} />
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-w-4xl mx-auto w-full pb-10">
        <div className="text-center mb-6 pop-in">
           <Star className="w-12 h-12 text-yellow-500 mx-auto mb-2 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
           <h2 className="text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Tournament Leaderboard</h2>
           <p className="text-xs text-slate-400 mt-1">Aggregated stats from all completed matches</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Highest Run Scorers" data={stats.runs} valKey="runs" colorClass="text-blue-400" icon={<Trophy size={16}/>} />
          <StatCard title="Highest Wicket Takers" data={stats.wickets} valKey="wickets" colorClass="text-red-400" icon={<Trophy size={16}/>} />
          <StatCard title="Most Catches" data={stats.catches} valKey="catches" colorClass="text-green-400" icon={<Award size={16}/>} />
          <StatCard title="Most Sixes" data={stats.sixes} valKey="sixes" colorClass="text-purple-400" icon={<Star size={16}/>} />
          <StatCard title="Most Fours" data={stats.fours} valKey="fours" colorClass="text-cyan-400" icon={<Star size={16}/>} />
          <StatCard title="Hat-Tricks" data={stats.hatTricks} valKey="hatTricks" colorClass="text-yellow-400" icon={<AlertTriangle size={16}/>} />
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
}
