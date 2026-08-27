function findPossibleMatches_(records) {
  const pairs = [];
  for (let i=0;i<records.length;i++) for (let j=i+1;j<records.length;j++) {
    const score = entitySimilarity_(records[i].fields, records[j].fields);
    if (score >= 0.75 && records[i].id !== records[j].id) pairs.push({ left: records[i], right: records[j], score, key: digestEntity_([records[i].source,records[i].id,records[j].source,records[j].id].sort().join('|')) });
  }
  return pairs;
}

function entitySimilarity_(a,b) {
  const email = comparable_(a.Email || a['Email Address']) && comparable_(a.Email || a['Email Address']) === comparable_(b.Email || b['Email Address']) ? 1 : 0;
  const phone = digits_(a.Phone || a['Phone Number']) && digits_(a.Phone || a['Phone Number']) === digits_(b.Phone || b['Phone Number']) ? 1 : 0;
  const name = diceCoefficient_(comparable_(a.Name || a['Full Name']), comparable_(b.Name || b['Full Name']));
  return Math.max(email, phone, name * 0.8);
}
function comparable_(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function digits_(v){return String(v||'').replace(/\D/g,'').slice(-10);}
function diceCoefficient_(a,b){if(!a||!b)return 0;if(a===b)return 1;const x={};for(let i=0;i<a.length-1;i++)x[a.slice(i,i+2)]=(x[a.slice(i,i+2)]||0)+1;let hits=0;for(let i=0;i<b.length-1;i++){const p=b.slice(i,i+2);if(x[p]){x[p]--;hits++;}}return 2*hits/Math.max(1,a.length+b.length-2);}

function publishPossibleMatches_(matches) {
  const ss = SpreadsheetApp.openById(entityConfig_().spreadsheetId), ack = ss.getSheetByName(ENTITY.acknowledgements) || ss.insertSheet(ENTITY.acknowledgements), sheet = ss.getSheetByName(ENTITY.matches) || ss.insertSheet(ENTITY.matches);
  if (!ack.getLastRow()) ack.appendRow(['Match Key','Acknowledged At','Note']);
  const acknowledged = new Set(ack.getLastRow()<2?[]:ack.getRange(2,1,ack.getLastRow()-1,1).getValues().flat().map(String));
  sheet.clearContents(); sheet.appendRow(['Match Key','Left Source','Left ID','Right Source','Right ID','Score']);
  const rows = matches.filter(m=>!acknowledged.has(m.key)).map(m=>[m.key,m.left.source,m.left.id,m.right.source,m.right.id,m.score]);
  if(rows.length) sheet.getRange(2,1,rows.length,6).setValues(rows);
  return rows.length;
}
