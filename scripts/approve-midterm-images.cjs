const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),dir=path.join(root,'data-lop3/tieng-anh');
const report=JSON.parse(fs.readFileSync(path.join(root,'docs/midterm-images/mobile-390.json')));
const checked=new Set(report.questions.map(q=>q.id));
let count=0;
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&f!=='index.json')){
 const p=path.join(dir,f),d=JSON.parse(fs.readFileSync(p));let changed=false;
 for(const q of d.topic.questions){if(q.source==='claude-nik3-lo3-giuaky-20261012'&&q.image&&checked.has(q.id)){
  if(!fs.existsSync(path.join(root,q.image)))throw new Error('Missing '+q.image);
  q.imageReview={status:'ok',by:'codex',date:'2026-10-12',checkedOn:'mobile-390'};count++;changed=true;
 }}
 if(changed)fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
}
if(count!==20)throw new Error('Expected 20 checked questions, got '+count);
console.log('Approved 20 visually checked question images.');
