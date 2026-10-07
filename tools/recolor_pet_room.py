"""Nam/Claude requested deterministic recolour of approved defaults, no image generation.

Only coloured cloth/plastic/terracotta changes. Cream piping, kibble, green
leaves, geometry, canvas and alpha stay intact. Work from PNG masters rather
than repeated lossy WebP encodes. Value detail preserves painted texture.
"""
import colorsys
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
masters = root.parent / 'output/pet-room/masters-v1'
out = root / 'assets/pet/room'
report = []

def ramp(value, low, high):
    t = max(0., min(1., (value-low)/(high-low)))
    return t*t*(3-2*t)

for slot in ['bed', 'bed-front', 'rug', 'bowl', 'toy', 'plant']:
    stem = 'bed-front-v1' if slot == 'bed-front' else slot+'-default-v1'
    original = Image.open(masters / (stem+'.png')).convert('RGBA')
    base = original.copy()
    base.thumbnail((512, 512), Image.Resampling.LANCZOS)
    for colour in ['blue', 'pink']:
        pixels = []
        changed = 0
        for r,g,b,a in base.get_flattened_data():
            h,s,v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
            hue = h*360
            mask = 0.
            if a:
                if slot in ['bed','bed-front','bowl'] and 175 <= hue <= 245:
                    mask = ramp(s,.08,.20)
                elif slot == 'rug' and 8 <= hue <= 55:
                    mask = ramp(s,.22,.40)
                elif slot == 'toy' and 48 <= hue <= 165:
                    mask = ramp(s,.07,.18)
                elif slot == 'plant' and 5 <= hue <= 40:
                    # Dark soil excluded; cream pot stripe and leaves excluded by saturation/hue.
                    mask = ramp(s,.28,.45)*ramp(v,.48,.68)
            if mask:
                target_h = (202 if colour == 'blue' else 344)/360
                target_s = min(.50 if colour=='blue' else .40,max(.22,s*(1.25 if colour=='blue' else .85)))
                nr,ng,nb = colorsys.hsv_to_rgb(target_h,target_s,v)
                rgb = tuple(round(c*(1-mask)+n*255*mask) for c,n in zip((r,g,b),(nr,ng,nb)))
                # Feather hue selection without dimming highlights along the mask edge.
                peak=max(rgb)
                if peak:rgb=tuple(round(c*max(r,g,b)/peak) for c in rgb)
                pixels.append((*rgb,a))
                changed += rgb != (r,g,b)
            else:
                pixels.append((r,g,b,a))
        assert changed > 100, (slot,colour,'empty colour mask')
        im = Image.new('RGBA',base.size)
        im.putdata(pixels)
        assert im.getchannel('A').tobytes() == base.getchannel('A').tobytes()
        assert all(max(old[:3])==max(new[:3]) for old,new in zip(base.get_flattened_data(),pixels)), 'painted brightness changed'
        name = slot+'-'+colour+'-v1.webp'
        dest = out / name
        im.save(dest,'WEBP',quality=88,method=6)
        decoded = Image.open(dest).convert('RGBA')
        assert decoded.size == base.size
        assert decoded.getchannel('A').tobytes() == base.getchannel('A').tobytes()
        report.append({'file':name,'size':list(base.size),'bytes':dest.stat().st_size,
                       'changedPixels':changed,'alphaExact':True,'valueExact':True,'source':stem+'.png'})
(root / 'docs/pet-room-recolor-payload-v1.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
