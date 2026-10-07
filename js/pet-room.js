// Room data + coordinate helpers. Artwork is deliberately empty in this frame PR.
const PetRoom = {
  DEFAULT_TEMPLATE:'room-cozy-v1',
  SLOTS:['bed','rug','bowl','toy','plant','wall'],
  ITEMS:{},
  TEMPLATES:{
    'room-cozy-v1':{
      id:'room-cozy-v1',width:1000,height:625,
      background:{img:null,horizon:320,wall:'#fbefdf',floor:'#edcca4',window:{x:160,y:80,w:180,h:210}},
      dog:{widthByStage:[255,295,320],spawn:{x:490,y:520},wander:{x:300,y:80},speech:{x:500,y:95}},
      slots:{
        bed:{x:805,y:445,w:330,h:185,layer:'back',frontLayer:'depth',frontDepthY:457,spot:{x:805,y:425},does:['sleep']},
        plant:{x:125,y:395,w:160,h:210,layer:'depth',spot:{x:220,y:435},does:['sniff']},
        rug:{x:500,y:605,w:720,h:150,layer:'floor',spot:{x:500,y:530},does:['rest']},
        bowl:{x:300,y:555,w:130,h:80,layer:'depth',spot:{x:335,y:530},does:['eat']},
        toy:{x:750,y:555,w:100,h:80,layer:'depth',spot:{x:695,y:530},does:['play']}
      },
      walkArea:{polygon:[[160,390],[850,390],[940,585],[80,585]]}
    }
  },
  own(object,key){return !!object && Object.hasOwn(object,key);},
  template(room){return this.own(this.TEMPLATES,room?.template)?this.TEMPLATES[room.template]:this.TEMPLATES[this.DEFAULT_TEMPLATE];},
  defaults(){return Object.fromEntries(this.SLOTS.map(slot=>[slot,slot+'-default']));},
  normalize(raw,owned=[]){
    owned=Array.isArray(owned)?owned:[];
    const input=raw && typeof raw==='object' && !Array.isArray(raw)?raw:{};
    const nested=input.slots && typeof input.slots==='object' && !Array.isArray(input.slots);
    const source=nested?input.slots:input,slots=this.defaults(),template=this.template(input);
    for(const slot of this.SLOTS){
      const id=this.own(source,slot)?source[slot]:null,item=this.own(this.ITEMS,id)?this.ITEMS[id]:null;
      if(item?.slot===slot&&(item.free||owned.includes(id)))slots[slot]=id;
    }
    // Transitional flat mirrors preserve equipment when an already-open v1 tab writes its old format.
    // New readers always prefer slots; mirrors are rebuilt after every successful Pet.tx.
    const room={template:template.id,slots,...slots};
    if(input.pos && typeof input.pos==='object' && !Array.isArray(input.pos)){
      const pos={};
      for(const slot of Object.keys(template.slots)){
        const p=this.own(input.pos,slot)?input.pos[slot]:null;
        if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=template.width&&p.y>=0&&p.y<=template.height)pos[slot]={x:p.x,y:p.y};
      }
      // Reserved only: rendering does not apply pos until dragging is introduced explicitly.
      if(Object.keys(pos).length)room.pos=pos;
    }
    return room;
  },
  placement(room,slot){
    const template=this.template(room),p=template.slots[slot];if(!p)return null;
    const id=room.slots?.[slot]||room[slot],item=this.own(this.ITEMS,id)?this.ITEMS[id]:this.ITEMS[slot+'-default'];
    return {slot,item,...p,
      x:p.x+(Number.isFinite(item.offset?.x)?item.offset.x:0),y:p.y+(Number.isFinite(item.offset?.y)?item.offset.y:0),
      w:Number.isFinite(item.size?.w)&&item.size.w>0?item.size.w:p.w,h:Number.isFinite(item.size?.h)&&item.size.h>0?item.size.h:p.h};
  },
  target(room,does){
    for(const slot of Object.keys(this.template(room).slots)){
      const p=this.placement(room,slot);
      if((p.item.does||p.does||[]).includes(does))return {slot,x:p.spot.x,y:p.spot.y};
    }
    return null;
  },
  inside(polygon,p){
    let inside=false;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const [ax,ay]=polygon[j],[bx,by]=polygon[i],cross=(p.x-ax)*(by-ay)-(p.y-ay)*(bx-ax);
      if(Math.abs(cross)<1e-7&&p.x>=Math.min(ax,bx)&&p.x<=Math.max(ax,bx)&&p.y>=Math.min(ay,by)&&p.y<=Math.max(ay,by))return true;
      if((ay>p.y)!==(by>p.y)&&p.x<(bx-ax)*(p.y-ay)/(by-ay)+ax)inside=!inside;
    }
    return inside;
  },
  closest(polygon,p){
    let best=null,distance=Infinity;
    for(let i=0;i<polygon.length;i++){
      const [ax,ay]=polygon[i],[bx,by]=polygon[(i+1)%polygon.length],dx=bx-ax,dy=by-ay;
      const t=Math.max(0,Math.min(1,((p.x-ax)*dx+(p.y-ay)*dy)/(dx*dx+dy*dy||1)));
      const q={x:ax+t*dx,y:ay+t*dy},d=(q.x-p.x)**2+(q.y-p.y)**2;
      if(d<distance){distance=d;best=q;}
    }
    return best;
  },
  clamp(room,point,stage=0){
    const t=this.template(room),w=t.dog.widthByStage[stage]||t.dog.widthByStage[0];
    let p={x:Number.isFinite(point?.x)?point.x:t.dog.spawn.x,y:Number.isFinite(point?.y)?point.y:t.dog.spawn.y};
    const bounds=q=>({x:Math.max(w/2+8,Math.min(t.width-w/2-8,q.x)),y:Math.max(w,Math.min(t.height-8,q.y))});
    p=bounds(p);
    for(let i=0;i<3&&!this.inside(t.walkArea.polygon,p);i++)p=bounds(this.closest(t.walkArea.polygon,p));
    return this.inside(t.walkArea.polygon,p)?p:bounds(t.dog.spawn);
  },
  depth(layer,y=0){return ({background:0,wall:100,back:200,floor:300,depth:1000,front:3000,effect:4000,speech:5000}[layer]??1000)+(layer==='depth'?Math.round(y):0);}
};
PetRoom.order=nodes=>nodes.slice().sort((a,b)=>PetRoom.depth(a.layer,a.y)-PetRoom.depth(b.layer,b.y)||a.id.localeCompare(b.id));
// Stable inventory IDs and existing 0/50-star prices. Images arrive in the room-art PR.
for(const [slot,label] of Object.entries({bed:'Giường',rug:'Thảm',bowl:'Bát',toy:'Đồ chơi',plant:'Cây',wall:'Màu tường'})){
  for(const [suffix,name,free] of [['default',label+' cơ bản',true],['blue',label+' xanh',false],['pink',label+' hồng',false]]){
    PetRoom.ITEMS[slot+'-'+suffix]={id:slot+'-'+suffix,slot,name,free,price:free?0:50,img:null,
      placeholderTint:suffix==='pink'?'#ecc3cf':suffix==='blue'?'#a5c8db':({bed:'#a5c8db',rug:'#fff3df',bowl:'#8cc7ef',toy:'#ffd564',plant:'#77ad66'})[slot],
      ...(slot==='bed'?{frontImg:null}:{}),
      ...(slot==='wall'?{tint:({default:'#fbefdf',blue:'#e3f2ff',pink:'#fbe8ee'})[suffix]}:{})};
  }
}
window.PetRoom=PetRoom;
