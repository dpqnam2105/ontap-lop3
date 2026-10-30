const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={console,Date,Math,Set,Map,WeakMap,setTimeout,clearTimeout};ctx.window=ctx;ctx.document={getElementById:()=>null};vm.createContext(ctx);
for(const f of ['qtypes/registry.js','qtypes/spell-fix.js','quiz.js','spell-pilot.js'])vm.runInContext(fs.readFileSync('js/'+f,'utf8'),ctx);
const bank=JSON.parse(fs.readFileSync('data-lop3/tieng-anh/pilot-spell-fix.json')).topic.questions;
let checks=0;function ok(v,m){assert.ok(v,m);checks++;}
for(const q of bank.filter(q=>q.type==='spell-fix')){
 ok(ctx.QTypes.validate(q).length===0,q.id+' schema');
 for(const e of q.acceptEdits){ok(ctx.QTypes.get('spell-fix').grade(q,e).correct,q.id+' edit');ok(ctx.QTypes.responseKey(q,e)===q.target,q.id+' normalized key');}
 for(const r of [{op:q.op,index:-1},{op:q.op,index:99},{op:'other',index:0},{op:'insert',index:0,letter:'!'}])ok(!ctx.QTypes.get('spell-fix').validateResponse(q,r).ok,'invalid edit');
}
let reviews=0,answers=0,learning=0,retries=0,ach=0;ctx.Storage={recordReview(){reviews++},recordAnswer(){answers++}};ctx.Achieve={recordAnswer(){ach++}};
const Q=ctx.Quiz;Q._recordLearningAnswer=()=>learning++;Q._scheduleRetry=()=>retries++;Q.sessionDetails=[];Q.questionStartedAt=Date.now();Q.currentTopic={};Q.spellingRun={id:'pilot'};
const mcq={id:'probe',q:'?',choices:['a','b'],a:0};Q._recordFirst(mcq,ctx.QTypes.get('mcq'),{selectedIndex:1},false);
ok(reviews===0&&answers===0&&learning===0&&retries===0&&ach===0,'probe never touches mastery/history/retry');
Q.spellingRun=null;Q._recordFirst(bank[0],ctx.QTypes.get('spell-fix'),bank[0].acceptEdits[0],true);
ok(reviews===0&&answers===0&&learning===0&&ach===0,'coached never touches mastery/history');
Q._recordFirst(mcq,ctx.QTypes.get('mcq'),{selectedIndex:1},false);
ok(reviews===1&&answers===1&&learning===1&&retries===1&&ach===1,'ordinary MCQ keeps all old writes');
let saved={v:1,runs:[]};ctx.Storage.get=()=>JSON.parse(JSON.stringify(saved));ctx.Storage.set=(k,d)=>saved=JSON.parse(JSON.stringify(d));ctx.API={pilotOn:()=>true};ctx.App={currentGrade:'lop3'};ctx.Today={_dateKey:()=> '2026-10-31'};
const S=ctx.SpellPilot; saved.runs=[{id:'b',kind:'baseline',complete:true},{id:'p',kind:'practice',date:'2026-10-29',complete:true}];
ok(!S.status().canFollow,'two days blocked');saved.runs[1].date='2026-10-28';ok(S.status().canFollow,'three days allowed');saved.runs.push({id:'f',kind:'followup',practiceId:'p',complete:true});ok(!S.status().canFollow,'one followup per practice');
saved.runs=[{id:'x',kind:'practice',complete:false,questionIds:[bank[2].id],entries:{}}];Q.spellingRun={id:'x'};const q={...bank[2],_spellTargetId:bank[2].targetId};
ok(S.record(q,q.acceptEdits[0],true),'first edit saved');ok(!S.record(q,q.acceptEdits[1],true),'equivalent edit does not award twice');
saved.runs=[{id:'w',kind:'practice',complete:false,questionIds:[q.id],entries:{}}];Q.spellingRun={id:'w'};
let wrong={op:'delete',index:0};ok(S.record(q,wrong,false,{shown:1,ms:90}),'wrong first saved');ok(S.record(q,{op:'delete',index:1},false,{used:1,shown:2,ms:120}),'second wrong saved');const entry=saved.runs[0].entries[q.targetId];ok(entry.complete&&entry.attempts.length===2&&entry.maxAssistance===2&&entry.timeSpentMs===210,'assistance and attempts retained');
console.log('spell integration:',checks,'checks passed');
