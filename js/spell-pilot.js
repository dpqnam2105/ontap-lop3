// Manual-only spelling pilot. All storage is inside pilot-guard's isolated profile.
const SpellPilot = {
  TOPIC: 'en_pilot-spell-fix', KEY: 'spellPilot_v1',
  enabled(){return !!(window.API && API.pilotOn() && App.currentGrade==='lop3');},
  state(){const d=Storage.get(this.KEY);return d && d.v===1 && Array.isArray(d.runs)?d:{v:1,runs:[]};},
  save(d){Storage.set(this.KEY,d);return JSON.stringify(Storage.get(this.KEY))===JSON.stringify(d);},
  day(){return Today._dateKey();},
  dayNumber(key){const p=key.split('-').map(Number);return Date.UTC(p[0],p[1]-1,p[2])/864e5;},
  source(){const s=App.allData?.subjects.find(s=>s.id==='tieng-anh');return {s,t:s?.topics.find(t=>t.id===this.TOPIC)};},
  pools(){
    const {s,t}=this.source();if(!s||!t)return null;
    const bank=new Map();for(const topic of s.topics){const a=App._allowedIndices(s,topic);const allowed=a===null?null:new Set(a);topic.questions.forEach((q,i)=>{if(!allowed||allowed.has(i))bank.set(q.id,{...q,_idx:i,topicId:topic.id,subjectId:s.id,_topicName:topic.name});});}
    const targets=t.pilot.targets;
    const valid=targets.filter(x=>bank.has(x.checkId)&&x.practiceIds.some(id=>bank.has(id)));
    return {s,t,bank,targets,valid};
  },
  status(d=this.state()){
    const baseline=d.runs.find(r=>r.kind==='baseline'&&r.complete);
    const practice=d.runs.filter(r=>r.kind==='practice'&&r.complete).slice(-1)[0];
    const gap=practice?this.dayNumber(this.day())-this.dayNumber(practice.date):null;
    const followup=practice&&d.runs.find(r=>r.kind==='followup'&&r.complete&&r.practiceId===practice.id);
    return {baseline,practice,gap,canFollow:!!baseline&&!!practice&&gap>=3&&!followup};
  },
  start(kind){
    if(!this.enabled()||!App.playerName)return false;
    const p=this.pools();if(!p||p.valid.length!==12){Rewards._achievementPopup('Chưa đủ 12 từ trong phạm vi đã học. Bố mẹ kiểm tra GĐ2 và phạm vi Ms Hoa nhé.');return false;}
    const data=this.state(), status=this.status(data);
    if(kind==='baseline'&&status.baseline){Rewards._achievementPopup('Đã lưu lần đo đầu, không ghi đè kết quả.');return false;}
    if(kind==='practice'&&!status.baseline){Rewards._achievementPopup('Con làm lượt đo đầu trước khi luyện nhé.');return false;}
    if(kind==='followup'&&!status.canFollow){Rewards._achievementPopup('Đo lại sau ít nhất 3 ngày từ buổi luyện hoàn tất gần nhất.');return false;}
    if(!['baseline','practice','followup'].includes(kind))return false;
    let run=data.runs.find(r=>r.kind===kind&&!r.complete&&(kind!=='followup'||r.practiceId===status.practice.id));
    if(!run){
      const count=data.runs.filter(r=>r.kind==='practice').length;
      run={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),kind,date:this.day(),startedAt:new Date().toISOString(),complete:false,
        practiceId:kind==='followup'?status.practice.id:null,
        questionIds:p.targets.map(x=>kind==='practice'?x.practiceIds.filter(id=>p.bank.has(id))[count%x.practiceIds.filter(id=>p.bank.has(id)).length]:x.checkId),entries:{}};
      data.runs.push(run);if(!this.save(data)){Rewards._achievementPopup('Chưa lưu được lượt thử.');return false;}
    }
    const chosen=run.questionIds.map(id=>p.bank.get(id));
    if(chosen.some(q=>!q)){Rewards._achievementPopup('Phạm vi đã đổi; lượt đang dở có câu chưa được mở.');return false;}
    const pool=chosen.map(q=>{
      const x=p.targets.find(x=>x.checkId===q.id||x.practiceIds.includes(q.id));
      const copy={...q,_spellTargetId:x.targetId};
      if(kind!=='practice'){delete copy.hint;copy.noHint=true;copy._spNoHelp=true;}
      return copy;
    }).filter(q=>!run.entries[q._spellTargetId]?.complete);
    if(!pool.length)return false;
    Quiz.startMixed(pool,'Tiếng Anh','tieng-anh','',null,{title:kind==='practice'?'Sửa chính tả':'Kiểm tra cách viết',modeLabel:kind==='practice'?'Luyện có trợ giúp':'Kiểm tra độc lập',spellingRun:{id:run.id,kind}});
    return true;
  },
  entry(q){const r=this.state().runs.find(r=>r.id===Quiz.spellingRun?.id);return r?.entries[q._spellTargetId]||null;},
  record(q,response,correct,{used=0,shown=0,ms=0}={}){
    if(!this.enabled()||!Quiz.spellingRun)return false;
    const d=this.state(),r=d.runs.find(r=>r.id===Quiz.spellingRun.id);
    if(!r||r.complete||!r.questionIds.includes(q.id))return false;
    const id=q._spellTargetId;if(!id)return false;
    const e=r.entries[id]||(r.entries[id]={questionId:q.id,targetId:id,attempts:[],complete:false});
    const key=QTypes.responseKey(q,response);
    if(e.complete||e.attempts.some(a=>a.key===key)||e.attempts.length>=2)return false;
    e.attempts.push({key,response,correct:!!correct,assistanceUsed:used,assistanceShown:shown,timeSpentMs:Math.max(0,ms),at:new Date().toISOString()});
    e.complete=r.kind!=='practice'||correct||e.attempts.length>=2;
    e.firstCorrect=!!e.attempts[0].correct;e.maxAssistance=Math.max(...e.attempts.map(a=>a.assistanceShown));
    e.timeSpentMs=e.attempts.reduce((n,a)=>n+a.timeSpentMs,0);
    return this.save(d);
  },
  finish(){
    const d=this.state(),r=d.runs.find(r=>r.id===Quiz.spellingRun?.id);if(!r)return null;
    r.complete=Object.keys(r.entries).length===12&&Object.values(r.entries).every(e=>e.complete);
    if(r.complete){r.date=this.day();r.finishedAt=r.finishedAt||new Date().toISOString();}
    this.save(d);this.refresh();return r;
  },
  summary(run){
    if(!run)return '';
    const n=Object.values(run.entries).filter(e=>e.firstCorrect).length;
    return (run.kind==='practice'?'Luyện có trợ giúp':run.kind==='baseline'?'Lần đo đầu':'Lần đo lại')+': đúng lần đầu '+n+'/12 từ. '+(run.kind==='practice'?'Hoàn thành thao tác chưa phải thành thạo viết.':'Đây là nhận diện cách viết; chưa kết luận khả năng tự viết.');
  },
  refresh(){const old=document.getElementById('spellPilotCard');if(old){const next=this.card();if(next)old.replaceWith(next);}},
  card(){
    if(!this.enabled())return null;
    const p=this.pools();if(!p)return null;
    const d=this.state(),st=this.status(d),ready=p.valid.length===12;
    const el=document.createElement('section');el.id='spellPilotCard';el.className='sp-pilot-card';
    const title=document.createElement('h3');title.textContent='✏️ Thử sửa chính tả · 12 từ';el.append(title);
    const note=document.createElement('p');note.textContent='Đo trước khi luyện, rồi kiểm tra lại sau 3–5 ngày. Chọn một cách sửa cho mỗi từ.';el.append(note);
    const range=document.createElement('p');range.textContent='Trong phạm vi đã học: '+p.valid.length+'/12 từ.';el.append(range);
    const actions=document.createElement('div');actions.className='sp-actions';
    for(const [kind,label,allowed] of [['baseline','1. Đo lần đầu',!st.baseline],['practice','2. Luyện 12 từ',!!st.baseline],['followup','3. Đo lại',st.canFollow]]){
      const b=document.createElement('button');b.type='button';b.dataset.spellAction=kind;b.textContent=label;b.disabled=!ready||!allowed;b.onclick=()=>this.start(kind);actions.append(b);
    }
    el.append(actions);
    const follow=d.runs.filter(r=>r.kind==='followup'&&r.complete).slice(-1)[0];
    if(st.baseline&&follow){const score=r=>Object.values(r.entries).filter(e=>e.firstCorrect).length;const comparison=document.createElement('p');comparison.textContent='Nhận diện đúng lần đầu: trước luyện '+score(st.baseline)+'/12 → đo lại '+score(follow)+'/12 ('+follow.date+').';el.append(comparison);}
    const latest=d.runs.filter(r=>r.complete).slice(-1)[0];if(latest){const s=document.createElement('p');s.textContent=this.summary(latest);el.append(s);}
    if(st.practice&&!st.canFollow){const n=document.createElement('p');n.textContent='Đo lại sau ít nhất 3 ngày từ buổi luyện gần nhất ('+st.practice.date+').';el.append(n);}
    if(st.gap>5){const n=document.createElement('p');n.textContent='Đã quá mốc 5 ngày; vẫn có thể đo lại và ghi đúng ngày thực tế.';el.append(n);}
    const paper=document.createElement('p');paper.textContent="Bố mẹ có thể đọc cho con viết giấy: didn't, dinner, smiled.";el.append(paper);
    return el;
  }
};
window.SpellPilot=SpellPilot;
