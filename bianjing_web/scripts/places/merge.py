import json,math,csv
exec(open('canon.py').read());exec(open('../build.py').read().split('F=[]')[0])
I=json.load(open('instances2.json'));EXTRA=json.load(open('extra_cats.json'))
CALF={f['properties']['name']:f for f in json.load(open('../bianjing_wgs84.geojson'))['features'] if f['properties']['layer']!='图1地名' and f['geometry']['type']=='Point'}
CAL={"新郑门（顺天门）":"新郑门（顺天门）","万胜门（开远门）":"万胜门（开远门）","固子门（金耀门）":"固子门（金耀门）","南薰门":"南薰门","戴楼门（安上门）":"戴楼门（安上门）","陈州门（宣化门）":"陈州门（宣化门）",
"新宋门（朝阳门）":"新宋门（朝阳门）","新曹门（含辉门）":"新曹门（含辉门）","陈桥门（景阳门）":"陈桥门（景阳门）","封丘门（永泰门）":"封丘门（永泰门）","新酸枣门（通天门）":"新酸枣门（通天门）","卫州门（安肃门）":"卫州门（安肃门）",
"朱雀门":"朱雀门","保康门":"保康门","崇明门（新门）":"新门（崇明门）","旧郑门（宜秋门）":"旧郑门（宜秋门）","梁门（阊阖门）":"梁门（阊阖门）","旧宋门（丽景门）":"旧宋门（丽景门）","旧曹门（望春门）":"旧曹门（望春门）",
"旧封丘门（安远门）":"旧封丘门（安远门）","旧酸枣门（景龙门）":"景龙门（旧酸枣门）","天波门（金水门）":"天波门（金水门）","宣德门":"宣德门（宫城正门）","西水门（汴河上水门）":"西水门（汴河上水门）","东水门（汴河下水门）":"东水门（汴河下水门）",
"东北水门（善利水门）":"东北水门（善利水门/五丈河）","西北水门（金水河）":"西北水门（金水河）","广利水门（蔡河上水门）":"蔡河上水门（广利水门）","普济水门（蔡河下水门）":"蔡河下水门（普济水门）",
"上方寺（佑国寺塔/铁塔）":"铁塔（开宝寺塔）","天清寺（繁塔）":"繁塔（天清寺塔）","大相国寺":"大相国寺","州桥（天汉桥）":"州桥（天汉桥）","州桥":"州桥（天汉桥）","龙津桥":"龙津桥","延庆观":"延庆观",
"白矾楼":"樊楼（丰乐楼）","白矾楼（樊楼）":"樊楼（丰乐楼）","艮岳":"艮岳（万岁山）","艮岳（万岁山）":"艮岳（万岁山）","金明池":"金明池","琼林苑":"琼林苑","开封府":"开封府（北宋府衙）","古吹台":"古吹台（禹王台）"}
canon_merge={"州桥":"州桥（天汉桥）","白矾楼（樊楼）":"白矾楼","艮岳（万岁山）":"艮岳","芳林苑":"芳林园","洞源观":"洞元观","车辂院":"车辂院"}
for m in I:
    for h in I[m]: h['k']=canon_merge.get(h['k'],h['k'])
def D(a,b): return math.hypot((a[0]-b[0])*91200,(a[1]-b[1])*111000)
names=sorted(set(h['k'] for m in I for h in I[m]))
P=[]
for k in names:
    a=[h for h in I['map1'] if h['k']==k];b=[h for h in I['map2'] if h['k']==k]
    pairs=[];ub=list(b)
    for x in sorted(a,key=lambda h:-h['n']):
        if ub:
            y=min(ub,key=lambda y:D(x['geo'],y['geo']))
            if D(x['geo'],y['geo'])<1500 or (len(a)==1 and len(ub)==1): pairs.append((x,y));ub.remove(y);continue
        pairs.append((x,None))
    pairs+=[(None,y) for y in ub]
    calname=CAL.get(k);calused=False
    if calname and len(pairs)>1:  # nearest instance gets calibrated coordinate
        c=CALF[calname]['geometry']['coordinates'];pairs.sort(key=lambda pr:min(D(h['geo'],c) for h in pr if h))
    for i,(x,y) in enumerate(pairs):
        cat=C[k][0] if k in C else EXTRA.get(k,"其他")
        if cat=="城门" and "水门" in k: cat="水门"
        pr=dict(name=k if i==0 else f"{k}（另处{i}）",category=cat,map1_pos=x and [round(v,6) for v in x['geo']],map2_pos=y and [round(v,6) for v in y['geo']],
                map1_px=x and [round(v) for v in x['px']],map2_px=y and [round(v) for v in y['px']],ocr_raw=[h['raw'] for h in (x,y) if h])
        pr['distance_m']=round(D(x['geo'],y['geo'])) if x and y else None
        if calname and i==0:
            c=CALF[calname]['geometry']['coordinates'];pos=c;pr['position_source']="calibrated:"+calname;pr['confidence']=CALF[calname]['properties']['confidence']
            pr['sources']=CALF[calname]['properties']['sources']
        else:
            cands=[(h['loc_err'],h['geo'],m) for h,m in ((x,'map1'),(y,'map2')) if h];e,pos,mm=min(cands)
            pr['position_source']=mm+"（局部残差较小，约%d米）"%e;pr['confidence']="estimated";pr['sources']=[s for s,h in (("map1: 张驭寰《北宋东京城复原图》(2000)",x),("map2: 《北宋东京·开封府手绘地图》",y)) if h]
        rd=[h.get('reading','read') for h in (x,y) if h]
        if 'user_verified' in rd: pr['confidence']='user_verified'
        elif 'uncertain_reading' in rd and not pr['position_source'].startswith('calib'): pr['confidence']='uncertain_reading'
        pr['reading']=rd;pr['visual_checked']=any(h.get('visual') or h.get('fixed') for h in (x,y) if h)
        pr['conflict']=bool(pr['distance_m'] and pr['distance_m']>300)
        if calname and i==0:
            dd=[D(h['geo'],pos) for h in (x,y) if h];pr['calib_offset_m']=[round(v) for v in dd]
        pr['lon'],pr['lat']=round(pos[0],6),round(pos[1],6);g=gcj(pr['lat'],pr['lon']);pr['gcj_lat'],pr['gcj_lon']=round(g[0],6),round(g[1],6)
        P.append(pr)
json.dump(P,open('places.json','w'),ensure_ascii=False,indent=0)
from collections import Counter
print(len(P),Counter(p['category'] for p in P),"both",sum(1 for p in P if p['map1_pos'] and p['map2_pos']),"conf",sum(p['conflict'] for p in P),"cal",sum(1 for p in P if p['position_source'].startswith('calib')))
