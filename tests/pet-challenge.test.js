const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
let profile,writes,started;
const box={window:{},console,Storage:{load:()=>JSON.parse(JSON.stringify(profile)),getActiveName:()=>profile.playerName||'',canonName:s=>s.toLowerCase(),save:p=>{profile=JSON.parse(JSON.stringify(p));writes++;}},
App:{currentGrade:'lop3',_seededRandom:()=>()=>.4,_allowedIndices:(s,t)=>t.questions.map((_,i)=>i).filter(i=>!t.questions[i].blocked)},
Quiz:{startMixed:(pool,name,id,key,task,options)=>{started={pool,options}}}};
vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/pet.js'),'utf8'),box);
const P=box.window.Pet;
function bank(){return {subjects:['toan','tieng-viet','tieng-anh'].map(id=>({id,name:id,topics:[{id:id+'_core',name:'core',questions:Array.from({length:7},(_,i)=>({id:id+i,q:'?',choices:['0','1'],a:0,track:'core'}))}]}))};}
function reset(){profile={playerName:'Thỏ',stars:100};writes=0;started=null;P._challengeRun=null;box.App.allData=bank();}
function run(name,f){reset();f();console.log('OK',name);}
run('five questions per subject, no core/learned-scope bypass',()=>{const d=box.App.allData;
d.subjects[0].topics[0].questions[0].blocked=true;d.subjects[0].topics[0].questions[1].track='enrich';
d.subjects[0].topics.push({id:'toan_tu-duy-so',questions:Array.from({length:8},(_,i)=>({id:'bad'+i,q:'?',choices:['0','1'],a:0}))});
assert.ok(P.startChallenge().ok);assert.equal(started.pool.length,15);
for(const id of P.CHALLENGE_SUBJECTS)assert.equal(started.pool.filter(q=>q.subjectId===id).length,5);
assert.ok(started.pool.every(q=>!q.blocked&&q.track==='core'));
});
run('insufficient subject does not fill from later scope or another subject',()=>{box.App.allData.subjects[1].topics[0].questions=box.App.allData.subjects[1].topics[0].questions.slice(0,4);assert.equal(P.startChallenge().error,'questions');assert.equal(started,null);assert.equal(writes,0)});
run('guest cannot start',()=>{profile.playerName='';assert.equal(P.startChallenge().error,'guest');assert.equal(started,null)});
run('incorrect / ordinary / incomplete finish cannot award',()=>{P.startChallenge();const runId=P._challengeRun.runId;
assert.equal(P.onChallengeFinish({kind:'other',runId,score:15,mainTotal:15}).error,'challenge');
assert.equal(P.onChallengeFinish({kind:'pet_adopt',runId:'wrong',score:15,mainTotal:15}).error,'challenge');
assert.equal(P.onChallengeFinish({kind:'pet_adopt',runId,score:14,mainTotal:14}).error,'challenge');
assert.equal(writes,0);assert.equal(profile.petAdopt,undefined)});
run('completion at zero score grants once, persistent right survives reload then adopts once',()=>{P.startChallenge();const info={kind:'pet_adopt',runId:P._challengeRun.runId,score:0,mainTotal:15};
assert.ok(P.onChallengeFinish(info).ok);const right=JSON.stringify(profile.petAdopt);assert.equal(writes,1);
assert.equal(P.onChallengeFinish(info).ok,false);assert.equal(writes,1);assert.equal(JSON.stringify(profile.petAdopt),right);
P._challengeRun=null;assert.ok(P.adoptionRight());assert.ok(P.adopt('Bông','adopt').ok);assert.equal(profile.stars,100);assert.equal(profile.pet.bag.kibble,6);assert.ok(profile.petAdopt.usedAt);
assert.equal(P.adopt('Bông','again').error,'adopted');assert.equal(profile.pet.bag.kibble,6)});
run('different learner or grade cannot claim a pending run',()=>{P.startChallenge();const info={kind:'pet_adopt',runId:P._challengeRun.runId,score:15,mainTotal:15};profile.playerName='Bé khác';assert.equal(P.onChallengeFinish(info).error,'challenge');profile.playerName='Thỏ';box.App.currentGrade='lop2';assert.equal(P.onChallengeFinish(info).error,'challenge');box.App.currentGrade='lop3';assert.equal(writes,0)});
console.log('6 adoption challenge tests passed');
