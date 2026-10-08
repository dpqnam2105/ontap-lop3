"""Encode browser screenshots as a preview GIF; this is not game artwork."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
frames=[Image.open(root/'tests/out'/f'pet-motion-{i:02d}.png').convert('RGB') for i in range(24)]
palette=frames[0].quantize(colors=256)
encoded=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
dest=root/'docs/pet-motion-preview-v1.gif'
encoded[0].save(dest,save_all=True,append_images=encoded[1:],duration=160,loop=0,disposal=2,optimize=True)
print(dest, dest.stat().st_size)
