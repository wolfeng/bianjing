import json,math,numpy as np,cv2,csv,sys
exec(open('canon.py').read())
exec(open('../build.py').read().split('F=[]')[0])   # gcj()
OV=json.load(open('../overlays.json'))
alias=[]
for k,(cat,al) in C.items():
    for a in set([k.split('（')[0] if '（' in k and k.split('（')[0] in al else k]+al+[k]): alias.append((a,k))
alias.sort(key=lambda t:-len(t[0]))
def fix(t):
    for a,b in FIX: t=t.replace(a,b)
    return t
def load(m):
    R=json.load(open(f'../ocr_{m}_raw.json'))
    hits=[]
    for r in R:
        if r['s']<0.5: continue
        t=fix(r['t']);b=np.array(r['box']);x0,y0=b.min(0);x1,y1=b.max(0);vert=(y1-y0)>1.3*(x1-x0)
        used=[False]*len(t)
        for a,k in alias:
            i=t.find(a)
            while i>=0:
                if not any(used[i:i+len(a)]):
                    for j in range(i,i+len(a)): used[j]=True
                    f=(i+len(a)/2)/max(1,len(t))
                    p=(x0+(x1-x0)*0.5, y0+(y1-y0)*f) if vert else (x0+(x1-x0)*f,(y0+y1)/2)
                    hits.append(dict(k=k,px=p,s=r['s'],raw=r['t']))
                i=t.find(a,i+1)
    # cluster same name within 80px
    inst=[]
    for h in sorted(hits,key=lambda h:-h['s']):
        for g in inst:
            if g['k']==h['k'] and math.dist(g['px'],h['px'])<80: g['n']+=1;break
        else: h['n']=1;inst.append(h)
    return inst
MLON=111000*math.cos(math.radians(34.79))
def px2geo(m,p):
    H=np.array(OV[m]['H_px_to_localm']);q=cv2.perspectiveTransform(np.array([[p]],float),H)[0,0];return q
# residual field per map (local metres): truth - predicted at control points
exec(open('../georef.py').read().split('CP=')[0].split('res={}')[0].replace("exec(open('build.py')","exec(open('../build.py')").replace("open('bianjing_wgs84.geojson')","open('../bianjing_wgs84.geojson')"))
CP=eval(open('../georef.py').read().split('CP=')[1].split('\nMLON')[0])
RF={}
for m in CP:
    pts=[];vec=[]
    for n,p in CP[m].items():
        g=geo[n];t=np.array([(g[0]-114.35)*MLON,(g[1]-34.80)*111000]);q=px2geo(m,p);pts.append(q);vec.append(t-q)
    RF[m]=(np.array(pts),np.array(vec))
def corr(m,q):
    P,V=RF[m];d=np.linalg.norm(P-q,axis=1)+200;w=1/d**2;dv=(w[:,None]*V).sum(0)/w.sum()
    loc=float((w*np.linalg.norm(V,axis=1)).sum()/w.sum())   # local misfit estimate
    return q+dv*np.exp(-d.min()/3000)*0+dv, loc
def toll(q): return (q[0]/MLON+114.35, q[1]/111000+34.80)
I={m:load(m) for m in ['map1','map2']}
for m in I:
    for h in I[m]:
        q=px2geo(m,h['px']);qc,loc=corr(m,q);h['geo_raw']=toll(q);h['geo']=toll(qc);h['loc_err']=loc
print({m:len(v) for m,v in I.items()},{m:len(set(h['k'] for h in v)) for m,v in I.items()})
json.dump(I,open('instances.json','w'),ensure_ascii=False,default=float)
