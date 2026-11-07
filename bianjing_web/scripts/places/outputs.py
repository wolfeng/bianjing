import json,csv
P=json.load(open('places.json'))
L=[("城门","#B22222","door.left.hand.closed","🚪","icon_gate"),("水门","#1E90FF","water.waves","🌊",None),("宫殿","#DAA520","crown.fill","👑","icon_palace"),("官署","#8B4513","building.columns.fill","🏛️",None),
("寺院","#FF8C00","building.fill","🛕","icon_pagoda"),("道观","#6A5ACD","sparkles","☯️",None),("祠庙","#C71585","flame.fill","🏮",None),("桥梁","#4682B4","arrow.left.and.right","🌉","icon_bridge"),
("街巷","#808080","road.lanes","🛣️",None),("市场酒楼","#DC143C","cup.and.saucer.fill","🍶","icon_tavern"),("园林池苑","#2E8B57","leaf.fill","🌳",None),("仓库","#A0522D","shippingbox.fill","📦",None),
("军营","#556B2F","shield.fill","🛡️",None),("宅第","#CD853F","house.fill","🏠","icon_courtyard"),("学校","#008B8B","book.fill","📚",None),("河渠","#00BFFF","drop.fill","💧",None),("其他","#696969","mappin","📍",None)]
from collections import Counter;cnt=Counter(p['category'] for p in P)
legend=[dict(category=c,color=col,sfSymbol=s,emoji=e,count=cnt.get(c,0),farStyle="dot",nearStyle="icon",nearIcon=near) for c,col,s,e,near in L]
overrides={"上方寺（佑国寺塔/铁塔）":{"nearIcon":"icon_tieta","label":"铁塔"},"天清寺（繁塔）":{"nearIcon":"icon_fanta","label":"繁塔"},"州桥（天汉桥）":{"nearIcon":"icon_bridge","label":"州桥"}}
json.dump(dict(version=2,farWhenLatitudeDeltaGreaterThan=0.04,categories=legend,placeIconOverrides=overrides,notes=["尺度小：彩色圆点","尺度大：特色图标"]),open('../legend.json','w'),ensure_ascii=False,indent=1)
md=["# 图例（LEGEND）","","| 类别 | 颜色 | SF Symbol | 近景图标 | 数量 |","|---|---|---|---|---|"]+[f"| {l['category']} | `{l['color']}` | `{l['sfSymbol']}` | {l['nearIcon'] or l['sfSymbol']} | {l['count']} |" for l in legend]
md+=["","- 尺度小（俯瞰）用彩色圆点；尺度大（放大）用特色图标。","- 铁塔/繁塔有专用外形图标。","- conflict=true：两图位置相差超过 300 米。"]
open('../LEGEND.md','w').write("\n".join(md))
def fc(gcj):
    F=[]
    for p in P:
        pr={k:v for k,v in p.items() if k not in('lat','lon','gcj_lat','gcj_lon')}
        F.append(dict(type="Feature",properties=pr,geometry=dict(type="Point",coordinates=[p['gcj_lon'],p['gcj_lat']] if gcj else [p['lon'],p['lat']])))
    return dict(type="FeatureCollection",crs="GCJ-02" if gcj else "WGS84",features=F)
json.dump(fc(False),open('../places_wgs84.geojson','w'),ensure_ascii=False,indent=1);json.dump(fc(True),open('../places_gcj02.geojson','w'),ensure_ascii=False,indent=1)
with open('../places.csv','w',newline='',encoding='utf-8-sig') as f:
    w=csv.writer(f);w.writerow(["name","category","lat","lon","gcj_lat","gcj_lon","source_maps","confidence","conflict","map1_map2_distance_m","position_source","note"])
    for p in P:
        sm="+".join(m for m in("map1","map2") if p[m+"_pos"])
        note=("OCR原文:"+"/".join(p['ocr_raw']))+(f"；校准偏差{p['calib_offset_m']}米" if p.get('calib_offset_m') else "")
        w.writerow([p['name'],p['category'],p['lat'],p['lon'],p['gcj_lat'],p['gcj_lon'],sm,p['confidence'],p['conflict'],p['distance_m'] or "",p['position_source'],note])
print(len(P),cnt)
