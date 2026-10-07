"""Delivery resize/encoding only; keep generated source canvases, particularly paired bed layers."""
import json, shutil
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
sources = json.loads((root / 'docs/pet-room-art-sources-v1.json').read_text(encoding='utf-8'))
out = root / 'assets/pet/room'
masters = root.parent / 'output/pet-room/masters-v1'
out.mkdir(parents=True, exist_ok=True)
masters.mkdir(parents=True, exist_ok=True)
report = []
for name, source in sources.items():
    original = Image.open(source).convert('RGBA')
    shutil.copy2(source, masters / (name + '.png'))
    im = original.copy()
    edge = 1600 if name.startswith('cozy-') else 512
    im.thumbnail((edge, edge), Image.Resampling.LANCZOS)
    if not name.startswith('cozy-'):
        assert original.getchannel('A').getextrema() == (0, 255), name + ' missing real alpha'
    dest = out / (name + '.webp')
    im.save(dest, 'WEBP', quality=88, method=6)
    decoded = Image.open(dest).convert('RGBA')
    assert decoded.getchannel('A').tobytes() == im.getchannel('A').tobytes()
    report.append({'file':dest.name,'size':list(im.size),'bytes':dest.stat().st_size,'alphaExact':True})
(root / 'docs/pet-room-art-payload-v1.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
