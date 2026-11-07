import json,math,sys
sys.argv=['x'];exec(open('extract.py').read().split("I={m:load(m)")[0])
I=json.load(open('instances.json'))
amap={a:k for a,k in alias}
EXTRA={}
rows=[l.strip().split('|') for l in open('../review/add.txt') if l.strip() and not l.startswith('#')]
for crop,name,cat,x,y,conf in rows:
    x,y=float(x),float(y);m='map1' if crop.startswith('M') else 'map2'
    if crop=='DEL':
        k=amap.get(name,name);c=[h for h in I['map2'] if h['k']==k]
        if c: I['map2'].remove(min(c,key=lambda h:math.dist(h['px'],(x,y))))
        continue
    if name=='?': continue
    k=amap.get(name,name)
    if k not in C: EXTRA[k]=cat
    if crop=='FIX':
        c=[h for h in I['map2'] if h['k']==k]
        if c: h=min(c,key=lambda h:math.dist(h['px'],(x,y))); h['px']=[x,y]; h['raw']+='（人工改正位置）'; h['reading']=conf; h['fixed']=True
        else: I['map2'].append(dict(k=k,px=[x,y],s=1.0,raw='人工判读',n=1,reading=conf,fixed=True))
        continue
    near=[h for h in I[m] if h['k']==k and math.dist(h['px'],(x,y))<120]
    if near:  # already have: move to building anchor, keep
        h=near[0];h['px']=[x,y];h['reading']=conf if conf!='read' else h.get('reading','read');h['visual']=True
    else: I[m].append(dict(k=k,px=[x,y],s=1.0,raw='人工判读（'+crop+'）',n=1,reading=conf,visual=True,added=True))
for m in I:
    for h in I[m]:
        q=px2geo(m,h['px']);qc,loc=corr(m,q);h['geo_raw']=toll(q);h['geo']=toll(qc);h['loc_err']=loc
json.dump(I,open('instances2.json','w'),ensure_ascii=False,default=float);json.dump(EXTRA,open('extra_cats.json','w'),ensure_ascii=False)
print({m:len(v) for m,v in I.items()},"added",sum(1 for m in I for h in I[m] if h.get('added')),"extra canon",len(EXTRA))
REN={'冯季良园':'马季良园','北婆台寺':'北繁台寺','草场巷':'草场巷街'}
for m in I:
    for h in I[m]:
        if h['k'] in REN: h['raw']+='（原写作'+h['k']+'）';h['k']=REN[h['k']];EXTRA.setdefault(h['k'],'园林池苑' if '园' in h['k'] else '街巷' if '巷' in h['k'] else '寺院')
json.dump(EXTRA,open('extra_cats.json','w'),ensure_ascii=False)
# 同图同名 150px 内去重（保留人工判读/改正者）
for m in I:
    keep=[]
    for h in sorted(I[m],key=lambda h:-(2 if h.get('fixed') else 1 if h.get('visual') else 0)):
        if any(k['k']==h['k'] and math.dist(k['px'],h['px'])<150 for k in keep): continue
        keep.append(h)
    I[m]=keep
json.dump(I,open('instances2.json','w'),ensure_ascii=False,default=float)
print("after dedupe",{m:len(v) for m,v in I.items()})
