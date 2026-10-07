"""Compare actual delivered WebP pixels, not recolour metadata. Run with bundled Python/Pillow."""
import colorsys, json, math
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]
assets=root/'assets/pet/room'
report=json.loads((root/'docs/pet-room-recolor-payload-v1.json').read_text(encoding='utf-8'))
results=[]

def difference(base, paid):
    assert base.size==paid.size
    assert base.getchannel('A').tobytes()==paid.getchannel('A').tobytes(), 'geometry/alpha changed'
    pairs=[(a,b) for a,b in zip(base.get_flattened_data(),paid.get_flattened_data()) if a[3]>=240]
    return sum(math.sqrt(sum((a[i]-b[i])**2 for i in range(3))/3) for a,b in pairs)/len(pairs)

def material_difference(base,paid,slot):
    values=[]
    for a,b in zip(base.get_flattened_data(),paid.get_flattened_data()):
        h,s,v=colorsys.rgb_to_hsv(*(x/255 for x in a[:3]))
        if a[3]<240:continue
        hue=h*360
        selected=(slot in ['bed','bed-front','bowl'] and 175<=hue<=245 and s>.20 or
                  slot=='rug' and 8<=hue<=55 and s>.30 or
                  slot=='toy' and 48<=hue<=165 and s>.12 or
                  slot=='plant' and 5<=hue<=40 and s>.45 and v>.68)
        if selected:
            nh,ns,nv=colorsys.rgb_to_hsv(*(x/255 for x in b[:3]))
            dh=abs(nh-h)*360
            values.append((min(dh,360-dh),abs(nv-v)))
    assert len(values)>100,'missing material sample'
    return {'hueDegrees':sum(p[0] for p in values)/len(values),'valueDelta':sum(p[1] for p in values)/len(values)}

for entry in report:
    default_name=entry['source'].replace('.png','.webp')
    base=Image.open(assets/default_name).convert('RGBA')
    paid=Image.open(assets/entry['file']).convert('RGBA')
    score=difference(base,paid)
    # Do not penalise deliberately unchanged cream padding/leaf area: compare coloured material too.
    slot=entry['source'].replace('-default-v1.png','').replace('-v1.png','')
    material_score=material_difference(base,paid,slot)
    assert score>=8 and (material_score['hueDegrees']>=30 or material_score['valueDelta']>=.12), (entry['file'],'too similar to free item',score,material_score)
    if entry.get('navy'):
        ratios=[]
        for a,b in zip(base.get_flattened_data(),paid.get_flattened_data()):
            h,s,v=colorsys.rgb_to_hsv(*(x/255 for x in a[:3]))
            if a[3]>=240 and 175<=h*360<=245 and s>.20 and v>.15:
                ratios.append(max(b[:3])/max(a[:3]))
        ratio=sum(ratios)/len(ratios)
        assert ratio<.70,(entry['file'],'navy must be visibly darker',ratio)
    assert difference(base,base)==0, 'negative control: copying default must fail threshold'
    assert material_difference(base,base,slot)=={'hueDegrees':0,'valueDelta':0}
    results.append({'file':entry['file'],'meanRgbDistance':round(score,2),**{k:round(v,3) for k,v in material_score.items()}})
print(json.dumps(results,indent=2))
print('12 paid layers differ from default; navy is darker; alpha/geometry unchanged')
