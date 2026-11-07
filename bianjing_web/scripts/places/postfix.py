import json,math
exec("\n".join(open('../build.py').read().split('\n')[:10]))
P=json.load(open('places.json'));B={p['name']:p for p in P}
def setpos(p,lat,lon,src):
    p['lat'],p['lon']=round(lat,6),round(lon,6);g=gcj(lat,lon);p['gcj_lat'],p['gcj_lon']=round(g[0],6),round(g[1],6)
    p['position_source']=src;p['confidence']='text_derived';p['conflict']=False
# 1 景德寺
s=B['上清储祥宫'];jd=B['景德寺'];other=B.pop('景德寺（另处1）',None)
setpos(jd,s['lat']+300/110540,s['lon'],'text_derived:《汴京遗迹志》卷十“景德寺〈在麗景門外迤東〉”；《东京梦华录》卷三“景德寺，在上清宫背”——取上清储祥宫北300m')
if other: jd['map2_pos']=jd.get('map2_pos') or other.get('map2_pos');jd['ocr_raw']=jd['ocr_raw']+other['ocr_raw']+['（并入原景德寺另处1）'];jd['sources']=sorted(set(jd['sources']+other['sources']))
# 2 法云寺
B.pop('法云寺',None);f=B.pop('法云寺（另处1）');f['name']='法云寺';f['map1_pos']=None;f['distance_m']=None;f['conflict']=False
f['position_source']+='；《东京梦华录》卷三“以南太學東門…以南街東法云寺”核实';B['法云寺']=f
# 3 迎祥池
a,b=B['南薰门'],B['普济水门（蔡河下水门）']
setpos(B['迎祥池'],(a['lat']+b['lat'])/2+150/110540,(a['lon']+b['lon'])/2,'text_derived:《汴京遗迹志》卷八“迎祥池〈在普濟水門之西〉”；《宋会要辑稿·方域》普济在南薰门之东——取南薰门与普济水门中点、城墙内侧150m')
# 4,5
B.pop('天清寺（繁塔）（另处1）',None);B.pop('金龙四大王庙',None)
P=list(B.values());json.dump(P,open('places.json','w'),ensure_ascii=False)
for n in('景德寺','法云寺','迎祥池'): print(n,B[n]['lat'],B[n]['lon'],B[n]['gcj_lat'],B[n]['gcj_lon'])
print(len(P))
