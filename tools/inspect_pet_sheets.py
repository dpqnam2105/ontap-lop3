"""Read-only alpha/component inspection; does not modify any generated artwork."""
from PIL import Image
from pathlib import Path
import json
import sys

result = {}
for path in Path('assets/pet').glob('*stage*-v2.png' if '--v2' in sys.argv else '*stage*.png'):
    image = Image.open(path)
    width, height = image.size
    alpha = image.getchannel('A').tobytes()
    seen = bytearray(width * height)
    boxes = []
    for start, opacity in enumerate(alpha):
        if opacity < 180 or seen[start]:
            continue
        stack = [start]
        seen[start] = 1
        count = 0
        xmin, ymin, xmax, ymax = width, height, 0, 0
        while stack:
            index = stack.pop()
            x, y = index % width, index // width
            count += 1
            xmin, ymin, xmax, ymax = min(xmin, x), min(ymin, y), max(xmax, x), max(ymax, y)
            for neighbor in ((index-1 if x else -1), (index+1 if x+1 < width else -1), index-width, index+width):
                if 0 <= neighbor < len(alpha) and not seen[neighbor] and alpha[neighbor] >= 180:
                    seen[neighbor] = 1
                    stack.append(neighbor)
        if count > 4000:
            boxes.append([xmin, ymin, xmax+1, ymax+1])
    boxes.sort(key=lambda b: (int((b[1]+b[3])/2 // (height/4)), (b[0]+b[2])/2))
    result[path.name] = {'size': [width, height], 'alpha': image.getchannel('A').getextrema(), 'boxes': boxes}
print(json.dumps(result, indent=2))
