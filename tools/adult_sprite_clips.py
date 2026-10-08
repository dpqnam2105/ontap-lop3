"""Derive SVG clipping metadata from the edited atlas, without altering source pixels."""
from pathlib import Path
from collections import deque
import json, math
from PIL import Image

root=Path(__file__).resolve().parents[1]
im=Image.open(root.parent/'output/pet-art/masters-v3/dog-fluffy-brown-stage2-v3.png').convert('RGBA')
w,h=im.size;a=im.getchannel('A').tobytes();labels=[0]*(w*h);label=0
for i,v in enumerate(a):
    if v<=80 or labels[i]:continue
    label+=1;q=deque([i]);labels[i]=label
    while q:
        p=q.popleft();x=p%w;y=p//w
        for j in [p-1 if x else -1,p+1 if x<w-1 else -1,p-w,p+w]:
            if 0<=j<w*h and not labels[j] and a[j]>80:labels[j]=label;q.append(j)
rects=[[4,13,325,316],[338,20,677,315],[682,28,933,317],[940,149,1247,317],[15,321,330,618],[339,326,649,605],[636,342,950,621],[978,331,1248,620],[19,615,303,898],[321,629,632,902],[637,637,972,910],[995,629,1239,920],[19,899,303,1222],[318,920,661,1210],[657,915,965,1217],[933,1026,1249,1214]]

def simplify(points,eps=1.2):
    if len(points)<3:return points
    ax,ay=points[0];bx,by=points[-1];den=math.hypot(bx-ax,by-ay)
    ds=[abs((by-ay)*x-(bx-ax)*y+bx*ay-by*ax)/(den or 1) for x,y in points]
    k=max(range(len(ds)),key=ds.__getitem__)
    return simplify(points[:k+1],eps)[:-1]+simplify(points[k:],eps) if ds[k]>eps else [points[0],points[-1]]

clips=[]
for x0,y0,x1,y1 in rects:
    counts={}
    for y in range(y0,y1):
        for x in range(x0,x1):
            n=labels[y*w+x]
            if n:counts[n]=counts.get(n,0)+1
    chosen=max(counts,key=counts.get);pixels=set()
    for y in range(y0,y1):
        for x in range(x0,x1):
            if labels[y*w+x]==chosen:
                # Padding retains anti-aliased fur. Atlas pixels and alpha are untouched.
                for dx in [-2,-1,0,1,2]:
                    for dy in [-2,-1,0,1,2]:pixels.add((x+dx,y+dy))
    edges={}
    for x,y in pixels:
        for neighbour,start,end in [((x,y-1),(x,y),(x+1,y)),((x+1,y),(x+1,y),(x+1,y+1)),((x,y+1),(x+1,y+1),(x,y+1)),((x-1,y),(x,y+1),(x,y))]:
            if neighbour not in pixels:edges.setdefault(start,[]).append(end)
    start=min(edges,key=lambda p:(p[1],p[0]));path=[start];p=start
    for _ in range(sum(map(len,edges.values()))+1):
        p=edges[p].pop()
        if p==start:break
        path.append(p)
    else:raise AssertionError('open contour')
    split=max(range(len(path)),key=lambda i:(path[i][0]-start[0])**2+(path[i][1]-start[1])**2)
    polygon=simplify(path[:split+1])+simplify(path[split:]+[start])[1:-1]
    clips.append('M'+'L'.join(str(x)+','+str(y) for x,y in polygon)+'Z')
text='// SVG silhouette masks: remove neighbouring atlas sprites; retain original alpha.\nconst PetAdultArt='+json.dumps({'clips':clips},separators=(',',':'))+';\nwindow.PetAdultArt=PetAdultArt;\n'
(root/'js/pet-adult-art-v3.js').write_text(text,encoding='utf-8')
print('16 clips,',len(text),'bytes')
