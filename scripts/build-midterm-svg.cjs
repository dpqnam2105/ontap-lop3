// Deterministic illustrations for the teacher's midterm vocabulary and signs.
const fs=require('fs'), path=require('path');
const out=path.join(__dirname,'../images/questions/lop3');fs.mkdirSync(out,{recursive:true});
const ink='#20334a', blue='#1978c9', red='#de3544', green='#25845b';
const defs=`<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L6 3 L0 6" fill="${blue}"/></marker></defs>`;
const line=(d,c=ink,w=8,extra='')=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const arrow=d=>line(d,blue,8,'marker-end="url(#arrow)"');
const circle=(x,y,r,fill,stroke=ink,w=5)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
const rect=(x,y,w,h,fill,rx=0,stroke=ink)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`;
const text=(x,y,t,size=28)=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" font-weight="700" fill="${ink}">${t}</text>`;
function person(x,y,s=1,color='#e98538',pose='walk'){
 return `<g transform="translate(${x} ${y}) scale(${s})">${circle(0,-42,13,'#f6cba7')}${line('M0 -23 V17',color,18)}${line('M0 -10 L-23 8 M0 -10 L24 -24',ink,7)}${line(pose==='sit'?'M0 17 H42 V54 H60':'M0 17 L-24 53 M0 17 L27 43',ink,9)}</g>`;
}
function save(name,title,body,w=640,h=400){fs.writeFileSync(path.join(out,name),`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}"><title>${title}</title>${defs}<rect width="${w}" height="${h}" rx="20" fill="#fff"/>${body}</svg>\n`);}
save('en-u1-map.svg','Folded paper map',`<path d="M95 80 L235 50 L390 85 L545 50 V305 L390 340 L235 305 L95 340Z" fill="#fff5cf" stroke="${ink}" stroke-width="7"/>${line('M235 50 V305 M390 85 V340','#ccba87',4)}${line('M110 170 L220 135 L370 175 L520 145','#fff',20)}${line('M170 72 L190 330 M450 78 L425 330','#fff',15)}${line('M275 80 Q350 120 290 180 T350 325','#79c8ed',20)}${rect(125,220,40,45,'#f0a760')}${rect(465,205,45,52,'#bca2e1')}${rect(330,245,40,30,'#94c6a1')}<path d="M417 90 C370 90 375 135 417 179 C459 135 464 90 417 90Z" fill="${red}" stroke="${ink}" stroke-width="4"/>${circle(417,116,12,'white',red,3)}`);
save('en-u1-square.svg','People meeting in a city square',`${rect(35,25,150,110,'#dce8f6',8)}${rect(455,25,150,110,'#f7debe',8)}${rect(220,15,200,100,'#e6d9f2',8)}${[65,110,155,250,290,330,370,480,520,560].map(x=>rect(x,45,18,30,'#83b5d0',0,'#83b5d0')).join('')}<path d="M85 145 L550 145 L620 360 L20 360Z" fill="#eee8db" stroke="#c4bba9" stroke-width="4"/>${[200,255,310].map(y=>line(`M45 ${y} H595`,'#d1c8b7',2)).join('')}<ellipse cx="320" cy="250" rx="95" ry="34" fill="#85c9e6" stroke="${ink}" stroke-width="5"/>${line('M320 245 V170','#7593aa',14)}${line('M320 183 Q285 150 270 195 M320 183 Q355 150 370 195','#329bd3',7)}${person(125,245,.7)}${person(505,260,.7,'#7852a6')}${person(195,315,.6,'#25845b')}${person(430,330,.6,'#1978c9')}`);
save('en-u1-sign.svg','Warning sign on a roadside post',`${line('M323 190 V340','#687788',17)}<path d="M323 45 L440 235 H206Z" fill="#fff" stroke="${red}" stroke-width="14" stroke-linejoin="round"/>${person(297,175,.6,ink)}${person(350,170,.7,ink)}${line('M100 345 H555','#c0c7cf',8)}${line('M40 375 H600','#687788',18)}`);
save('en-u1-up.svg','Child walking up stairs',`${line('M70 340 H150 V295 H230 V250 H310 V205 H390 V160 H470 V115 H550',ink,7)}${person(310,180,1,'#c55b92')}${arrow('M115 225 L490 40')}`);
save('en-u1-down.svg','Ball rolling down a hill',`<path d="M75 80 L550 340 H75Z" fill="#dcf0d1" stroke="${green}" stroke-width="5"/>${circle(250,150,35,'#ffd875')}${line('M230 125 Q252 130 270 158 M223 170 Q248 156 278 145',ink,4)}${line('M140 82 L185 107 M138 108 L178 130','#8ba0b0',5)}${arrow('M315 130 L515 250')}`);
save('en-u1-along.svg','Children walking along a river',`<path d="M20 180 Q160 145 320 185 T620 175 V320 Q450 355 320 320 T20 325Z" fill="#99d9f5"/>${line('M35 110 Q180 85 320 115 T605 100','#e7c89e',30)}${person(205,74,.8)}${person(295,84,.8,'#7852a6')}${arrow('M350 64 H555')}${line('M70 245 Q90 235 110 245 M430 270 Q455 255 480 270','#438bb2',4)}`);
save('en-u1-around.svg','Children running around a tree',`<ellipse cx="320" cy="280" rx="225" ry="80" fill="#f3ead9"/>${line('M320 160 V275','#89603c',20)}${circle(320,120,65,'#73bb74',green)}${person(130,205,.8)}${person(515,220,.8,'#7852a6')}${person(350,315,.7,'#1978c9')}${arrow('M155 288 C230 355 480 355 520 282 C565 208 395 180 295 190')}`);
function road(crossing=false){return `${rect(0,125,640,150,'#bcc6d0',0,'#bcc6d0')}${line('M20 200 H620','#fff',4,'stroke-dasharray="25 20"')}${crossing?[165,195,225,255].map(y=>rect(280,y,80,14,'#fff',0,'#fff')).join(''):''}`;}
save('en-u1-cross.svg','Crossing the street at a green pedestrian light',`${road(true)}${person(320,335,.7)}${arrow('M320 325 V65')}${rect(475,35,65,90,ink,10)}${circle(508,79,24,'#44c67b','#44c67b',0)}${person(508,80,.27,'#fff')}`);
save('en-u1-straight.svg','Going straight through a crossroads',`${road()}${rect(255,0,130,400,'#bcc6d0',0,'#bcc6d0')}${line('M320 10 V390','#fff',4,'stroke-dasharray="22 16"')}${person(320,345,.6)}${arrow('M320 285 V40')}`);
// New map. Placement is deliberately different from the paper worksheet.
const building=(x,y,w,h,label,fill)=>`${rect(x,y,w,h,fill,8)}${text(x+w/2,y+h/2+9,label,27)}`;
save('en-u1-map-a.svg','Town map with start arrow pointing up',`
 <path d="M115 45 Q145 110 115 170 T115 265" fill="none" stroke="#82cbea" stroke-width="38"/>
 ${rect(290,45,60,430,'#c7cfd8',0,'#c7cfd8')}${rect(45,165,550,60,'#c7cfd8',0,'#c7cfd8')}
 ${line('M320 90 V390','#fff',3,'stroke-dasharray="14 10"')}${line('M175 195 H515','#fff',3,'stroke-dasharray="14 10"')}
 ${rect(80,166,75,58,'#ddba85',0,'#775539')}${line('M83 171 H153 M83 219 H153','#775539',6)}
 ${building(228,12,184,59,'theater','#d9e6fa')}${building(478,150,153,85,'museum','#f5deb6')}
 ${building(8,150,92,85,'harbor','#cde8fa')}
 ${rect(71,80,31,16,'#fff',3)}<path d="M84 78 V46 L104 74Z" fill="#e57842"/>
 ${rect(115,276,158,89,'#f5dbe6',8)}${text(194,311,'art',28)}${text(194,344,'gallery',28)}
 ${rect(367,276,262,89,'#dcecd9',8)}${text(498,311,'recreation',28)}${text(498,344,'center',28)}
 ${line('M270 320 H290 M350 320 H370','#758695',6)}
 ${arrow('M320 424 V377')}${text(320,461,'★',37)}
 ${rect(233,470,174,29,'#f3ead7',5)}${text(320,493,'square',25)}
 `,640,510);
function sign(name,title,body,prohibit=true,bg='#fff',extra=''){
 save(name,title,`<circle cx="200" cy="200" r="163" fill="${bg}" stroke="${prohibit?red:bg}" stroke-width="15"/>${body}${prohibit?line('M88 88 L312 312',red,20):''}${extra}`,400,400);
}
sign('en-sign-no-talking.svg','Do not talk',`<path d="M125 267 V164 C125 100 220 91 230 150 L263 182 L238 188 V221 H208 V267Z" fill="${ink}"/>${line('M279 153 Q307 180 279 207',ink,7)}${line('M303 132 Q350 180 303 228',ink,7)}`,true,'#fff',`${rect(14,302,24,60,'#799ac9',2)}${rect(40,312,22,50,'#d9a46a',2)}`);
sign('en-sign-no-feeding.svg','Do not feed the animals',`${rect(65,170,65,48,'#dce6f4',4)}${line('M132 180 H163 M132 194 H170 M132 208 H159',ink,9)}${circle(187,192,10,'#dca85d')}${circle(267,135,40,'#e7bd8e')}${circle(238,105,13,'#e7bd8e')}${circle(295,105,13,'#e7bd8e')}${circle(255,134,4,ink,ink,0)}${circle(280,134,4,ink,ink,0)}${circle(267,257,39,'#ccb2e2')}<path d="M239 229 L234 204 L252 222 M283 223 L302 204 L298 233" fill="#ccb2e2" stroke="${ink}" stroke-width="5"/>${circle(255,253,4,ink,ink,0)}${circle(280,253,4,ink,ink,0)}`);
sign('en-sign-no-grass.svg','Do not walk on the grass',`${person(193,182,1.5,ink)}${line('M90 288 H309',green,5)}${[105,140,180,220,260,295].map(x=>line(`M${x} 288 l-9 -23 M${x} 288 l10 -20`,green,4)).join('')}`);
sign('en-sign-no-sitting-stairs.svg','Do not sit on the stairs',`${line('M75 290 H132 V247 H193 V204 H252 V161 H314',ink,7)}${person(193,178,1,ink,'sit')}`);
sign('en-sign-no-bikes.svg','Do not ride a bike',`${circle(116,247,53,'#fff')}${circle(286,247,53,'#fff')}${line('M116 247 L163 164 L231 247 H116 M163 164 L198 247 M198 247 L253 161 L286 247',ink,9)}${line('M146 150 H185 M251 160 V139 H276',ink,8)}`);
sign('en-sign-trash-bin.svg','Put trash in the bin',`${person(145,178,1.45,'#fff')}${rect(225,210,77,98,'none',4,'#fff')}${line('M216 203 H312','#fff',9)}${line('M158 168 L203 200','#fff',9)}${rect(201,181,15,15,'#fff',1,'#fff')}${line('M249 229 V290 M278 229 V290','#fff',5)}`,false,blue);
sign('en-sign-please-sit.svg','Please sit down',`${line('M170 119 V238 H276 V313 M170 239 V313', '#fff',13)}${line('M95 145 L213 220','#fff',10)}<path d="M210 190 L218 224 L185 217" fill="none" stroke="#fff" stroke-width="10" stroke-linejoin="round"/>`,false,green);
console.log('Wrote 17 SVG illustrations:',out);
