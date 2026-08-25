const KEY = 'rotaCafeRankingV2';
export function loadRanking() { try { const value = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(value) ? value : []; } catch { return []; } }
export function addScore(name, phone, score) { const ranking = [...loadRanking(), { id: crypto.randomUUID(), name, phone, score, date: Date.now() }].sort((a,b) => b.score-a.score || a.date-b.date).slice(0,50); localStorage.setItem(KEY, JSON.stringify(ranking)); return ranking; }
export function clearRanking(){ localStorage.removeItem(KEY); }
export function exportRanking(){
 const rows=[['Posição','Nome','Telefone','Pontos','Data'],...loadRanking().map((e,i)=>[i+1,e.name,e.phone||'',e.score,new Date(e.date).toLocaleString('pt-BR')])];
 return rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(';')).join('\r\n');
}
