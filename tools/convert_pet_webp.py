"""Convert approved art to delivery WebP; keep the PNG masters unchanged."""
import argparse
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--source-dir', type=Path, default=root / 'assets/pet')
args = parser.parse_args()
output = root / 'assets/pet'
report = []
for name in [f'dog-fluffy-brown-stage{i}-v2' for i in range(3)] + ['bow-blue-tuft-v1']:
    source = args.source_dir / (name + '.png')
    destination = output / (name + '.webp')
    original = Image.open(source).convert('RGBA')
    image = original.copy()
    if name.startswith('bow-'):
        image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    image.save(destination, 'WEBP', quality=88, method=6)
    decoded = Image.open(destination).convert('RGBA')
    assert decoded.size == image.size
    assert decoded.getchannel('A').tobytes() == image.getchannel('A').tobytes(), 'alpha changed'
    report.append({'file': destination.name, 'size': decoded.size, 'pngBytes': source.stat().st_size,
                   'webpBytes': destination.stat().st_size, 'alphaExact': True})
print(json.dumps(report, indent=2))
