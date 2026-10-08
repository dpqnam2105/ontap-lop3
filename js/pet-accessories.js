// Stable accessory IDs; anchors describe art only, never persistent gameplay state.
const PetAccessories={
  SLOTS:['head','neck','back'],
  ITEMS:{'bow-blue':{id:'bow-blue',name:'Nơ xanh nhỏ',slot:'head',price:50,img:'assets/pet/bow-blue-tuft-v1.webp',width:110}},
  headAtlas:[
    [[150,60],[499,60],[787,62],[1060,140],[133,398],[455,429],[755,350],[1096,340],[170,630],[463,730],[829,662],[1097,675],[166,907],[506,964],[786,949],[1099,1018]],
    [[150,42],[548,45],[786,43],[1060,150],[125,420],[485,420],[743,360],[1101,350],[185,640],[458,730],[870,652],[1134,650],[169,925],[540,965],[780,930],[1124,1040]],
    [[134,17],[575,22],[808,31],[1070,150],[120,426],[480,442],[770,350],[1120,338],[175,632],[465,730],[873,652],[1120,629],[155,905],[560,935],[840,920],[1124,1046]]
  ],
  anchor(stage,frame,rect,slot='head'){
    const point=this.headAtlas[stage]?.[frame];if(!point||!this.SLOTS.includes(slot)||!rect)return null;
    const [x,y,right,bottom]=rect,w=right-x,h=bottom-y,left=(360-w)/2,top=350-h;
    const head={x:left+point[0]-x,y:top+point[1]-y,angle:frame===7?-12:0,scale:[1,.95,.90][stage],visible:frame!==3,layer:'front'};
    if(slot==='head')return head;
    // Reserved anchors for later art review; no neck/back accessory is sold yet.
    return {x:slot==='neck'?head.x:left+w*.65,y:slot==='neck'?head.y+h*.40:top+h*.53,
      angle:0,scale:head.scale,visible:frame!==3,layer:slot==='back'?'behind':'front'};
  }
};
window.PetAccessories=PetAccessories;
