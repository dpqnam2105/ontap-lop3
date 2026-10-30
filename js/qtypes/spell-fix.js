// A single deletion/insertion. Store an edit; reconstruct the word before grading.
(function(root) {
  const Q = root.QTypes;
  const norm = s => String(s).replace(/[’‘]/g, "'").toLowerCase();
  const apply = (q, r) => q.op === 'delete' ? q.wrong.slice(0,r.index)+q.wrong.slice(r.index+1)
    : q.wrong.slice(0,r.index)+r.letter+q.wrong.slice(r.index);
  const def = Q.register('spell-fix', {
    readAloud: false,
    normalize: norm,
    apply,
    validateQuestion(q) {
      const e = [];
      if(typeof q.wrong !== 'string' || !/^[a-zA-Z’‘']{2,18}$/.test(q.wrong)) e.push('wrong cần 2–18 chữ');
      if(typeof q.target !== 'string' || !/^[a-zA-Z’‘']{2,18}$/.test(q.target)) e.push('target hỏng');
      if(!['delete','insert'].includes(q.op)) e.push('op hỏng');
      if(typeof q.sentence !== 'string' || q.sentence.split('___').length !== 2) e.push('sentence cần một chỗ trống');
      if(!q.targetId || !q.checkId || typeof q.meaning !== 'string') e.push('thiếu targetId/checkId/meaning');
      if(q.op==='insert' && (!Array.isArray(q.letters) || q.letters.length!==3 || new Set(q.letters).size!==3 || q.letters.some(c=>!/^[a-z]$/.test(c)))) e.push('letters cần 3 chữ khác nhau');
      if(!Array.isArray(q.acceptEdits) || !q.acceptEdits.length) e.push('thiếu acceptEdits');
      if(e.length) return e;
      const edits=[];
      for(let i=0;i<q.wrong.length+(q.op==='insert'?1:0);i++) for(const letter of q.op==='insert'?q.letters:[null]) {
        const r={op:q.op,index:i,...(letter?{letter}:{})}; if(norm(apply(q,r))===norm(q.target)) edits.push(JSON.stringify(r));
      }
      const declared=q.acceptEdits.map(r=>JSON.stringify({op:r.op,index:r.index,...(r.letter?{letter:r.letter}:{})}));
      if(norm(q.wrong)===norm(q.target) || !edits.length || new Set(declared).size!==declared.length || edits.sort().join('|')!==declared.sort().join('|')) e.push('acceptEdits không khớp mọi cách sửa');
      if('choices' in q || 'a' in q) e.push('spell-fix không dùng choices/a');
      return e;
    },
    validateResponse(q,r) {
      if(!r || r.op!==q.op || !Number.isInteger(r.index) || r.index<0 || r.index>=q.wrong.length+(q.op==='insert'?1:0)) return {ok:false};
      if(q.op==='insert' && !q.letters.includes(r.letter)) return {ok:false};
      if(q.op==='delete' && r.letter!==undefined) return {ok:false};
      return {ok:true};
    },
    grade(q,r) {const valid=this.validateResponse(q,r).ok;return {valid,correct:valid && norm(apply(q,r))===norm(q.target)};},
    responseKey(q,r) {return this.validateResponse(q,r).ok?norm(apply(q,r)):'incomplete';},
    describeResponse(q,r) {return this.validateResponse(q,r).ok?apply(q,r):'';},
    describeAnswer(q) {return q.target;},
    render({host,q,onChange}) {
      let response=null, gap=null, locked=false, helped=false;
      host.innerHTML='<p class="sf-sentence"></p><p class="sf-meaning"></p><p class="sf-instruction"></p><div class="sf-word" aria-label="Từ cần sửa"></div><div class="sf-letters" aria-label="Chữ để điền"></div><p class="sf-preview" aria-live="polite"></p><button type="button" class="sf-reset">↶ Làm lại</button><p class="sf-solution" hidden></p>';
      const sentence=host.querySelector('.sf-sentence'), halves=q.sentence.split('___');
      sentence.append(document.createTextNode(halves[0]));const mark=document.createElement('strong');mark.textContent=q.wrong;sentence.append(mark,document.createTextNode(halves[1]));
      host.querySelector('.sf-meaning').textContent='Nghĩa cần điền: '+q.meaning;
      for(const g of q.glosses||[]) {const p=document.createElement('small');p.textContent=g.text+' = '+g.vi;host.querySelector('.sf-meaning').append(document.createElement('br'),p);}
      host.querySelector('.sf-instruction').textContent=q.op==='delete'?'Bấm một chữ cái thừa để xóa.':'Bấm một khe, rồi chọn chữ còn thiếu.';
      const word=host.querySelector('.sf-word'),letters=host.querySelector('.sf-letters');
      function draw(silent) {
        word.replaceChildren();letters.replaceChildren();
        function chip(text,index,isGap) {
          const b=document.createElement('button');b.type='button';b.textContent=text;b.className=isGap?'sf-gap':'sf-char';b.dataset.index=index;
          b.setAttribute('aria-label',isGap?'Khe '+(index+1):'Chữ '+text+', vị trí '+(index+1));b.setAttribute('aria-pressed',String(isGap?gap===index:response?.index===index));b.disabled=locked;
          if(helped && q.acceptEdits.some(e=>isGap?e.index===index:(q.op==='delete' && e.index===index))) b.classList.add('sf-help');
          b.onclick=()=>{if(locked)return;if(isGap){gap=index;response=null;}else response={op:'delete',index};draw();};return b;
        }
        for(let i=0;i<=q.wrong.length;i++) {if(q.op==='insert')word.append(chip('+',i,true));if(i<q.wrong.length){if(q.op==='delete')word.append(chip(q.wrong[i],i,false));else {const s=document.createElement('span');s.className='sf-char sf-static';s.textContent=q.wrong[i];word.append(s);}}}
        if(q.op==='insert') for(const letter of q.letters) {const b=document.createElement('button');b.type='button';b.className='sf-letter';b.textContent=letter;b.disabled=locked||gap===null;b.setAttribute('aria-label','Điền chữ '+letter);b.onclick=()=>{if(locked||gap===null)return;response={op:'insert',index:gap,letter};draw();};letters.append(b);}
        host.querySelector('.sf-preview').textContent=response?'Từ sau khi sửa: '+apply(q,response):'Chưa chọn cách sửa';
        host.querySelector('.sf-reset').disabled=locked||(!response && gap===null);
        if(!silent)onChange(!!response);
      }
      host.querySelector('.sf-reset').onclick=()=>{if(locked)return;response=null;gap=null;draw();};draw();
      return {
        getResponse(){return response?{...response}:null;},
        restore(r){if(def.validateResponse(q,r).ok){response={...r};gap=q.op==='insert'?r.index:null;draw(true);}},
        showResult(res){helped=!res.correct;draw(true);if(res.reveal){const p=host.querySelector('.sf-solution');p.hidden=false;p.textContent='Cách viết đúng: '+q.target;}},
        lock(){locked=true;host.querySelectorAll('button').forEach(b=>b.disabled=true);},
        unlock(){locked=false;draw(true);},
        destroy(){locked=true;}
      };
    }
  });
})(typeof window!=='undefined'?window:globalThis);
