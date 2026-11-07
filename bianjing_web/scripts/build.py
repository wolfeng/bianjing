import json,math
def gcj(lat,lon):
    a=6378245.0;ee=0.00669342162296594323
    def tl(x,y):
        r=-100+2*x+3*y+0.2*y*y+0.1*x*y+0.2*math.sqrt(abs(x));r+=(20*math.sin(6*x*math.pi)+20*math.sin(2*x*math.pi))*2/3;r+=(20*math.sin(y*math.pi)+40*math.sin(y/3*math.pi))*2/3;r+=(160*math.sin(y/12*math.pi)+320*math.sin(y*math.pi/30))*2/3;return r
    def tn(x,y):
        r=300+x+2*y+0.1*x*x+0.1*x*y+0.1*math.sqrt(abs(x));r+=(20*math.sin(6*x*math.pi)+20*math.sin(2*x*math.pi))*2/3;r+=(20*math.sin(x*math.pi)+40*math.sin(x/3*math.pi))*2/3;r+=(150*math.sin(x/12*math.pi)+300*math.sin(x/30*math.pi))*2/3;return r
    dl=tl(lon-105,lat-35);dn=tn(lon-105,lat-35);rl=lat/180*math.pi;m=1-ee*math.sin(rl)**2;s=math.sqrt(m)
    return lat+dl*180/((a*(1-ee))/(m*s)*math.pi), lon+dn*180/(a/s*math.cos(rl)*math.pi)

import numpy as np, copy
S={
 "osm":"https://www.openstreetmap.org/ (Nominatim 检索, 2026-11-03)",
 "wiki":"https://en.wikipedia.org/w/api.php?action=query&prop=coordinates&titles=Iron%20Pagoda|Daxiangguo%20Temple",
 "dpm":"https://www.dpm.org.cn/Uploads/File/2019/11/25/u5ddbb7e042505.pdf",
 "qiu":"https://www.51774.com/kaogufaxian/67462.html",
 "yujie":"https://51774.com/kaogufaxian/66982.html",
 "stm":"https://www.hnswwkgyjy.cn/ueditor/php/upload/file/20220524/1653363795965934.pdf",
 "stm2":"http://m.hnswwkgyjy.cn/NewsView.php?News_ID=604",
 "zq":"https://www.hnswwkgyjy.cn/NewsView.php?News_ID=1985",
 "ncha":"http://www.ncha.gov.cn/art/2023/3/24/art_2697_180544.html",
 "osgeo":"https://osgeo.cn/post/adc62/",
 "nxm":"http://yxhenan.com/info/kf/sswjx_12957_2633.html",
 "bk":"https://baike.baidu.com/item/%E5%8D%97%E8%96%B0%E9%97%A8/3210585",
 "amap":"https://www.amap.com/place/B017A00KJK",
 "dj":"《东京梦华录》卷一“东都外城”“旧京城”（孟元老）",
}
F=[]
def add(kind,geom,name,desc,conf,layer,src):
    F.append(dict(type="Feature",properties=dict(name=name,desc=desc,confidence=conf,layer=layer,kind=kind,sources=[S[s] for s in src]),geometry=geom))
def pt(la,lo,n,d,c,l,s): add("point",dict(type="Point",coordinates=[round(lo,6),round(la,6)]),n,d,c,l,s)
def ring(cs,n,d,c,l,s): add("polygon",dict(type="Polygon",coordinates=[[[round(x,6),round(y,6)] for y,x in cs+[cs[0]]]]),n,d,c,l,s)
def line(cs,n,d,c,l,s): add("line",dict(type="LineString",coordinates=[[round(x,6),round(y,6)] for y,x in cs]),n,d,c,l,s)
MLAT=111000.0; MLON=111000.0*math.cos(math.radians(34.79))
th=math.radians(10)  # 外城方向190°：整体顺时针偏约10°
E=(math.cos(th),-math.sin(th)); N=(math.sin(th),math.cos(th))
def mv(p,de,dn): return (p[0]+(E[1]*de+N[1]*dn)/MLAT, p[1]+(E[0]*de+N[0]*dn)/MLON)
STM=(34.795556,114.304444)                 # 顺天门 简报中心坐标
SW=mv(STM,0,-2050); SE=mv(SW,6990,0); NW=mv(SW,0,7590); NE=mv(SE,0,7660)
OUT=[NW,NE,SE,SW]
ring(OUT,"外城（新城/罗城）","考古实测东墙7660、西墙7590、南墙6990、北墙6940米，周长约29120米，方向190°。按顺天门坐标与各墙长度、偏角推算","estimated","城墙",["dpm","qiu","osgeo","stm"])
INN=[(34.8139,114.3281),(34.8139,114.3625),(34.7857,114.3625),(34.7857,114.3281)]
ring(INN,"里城（旧城/阙城）","南墙在大南门北约300–350米，北墙在龙亭大殿北约500米，东西墙压在明清砖城东西墙下；周长约11550米","estimated","城墙",["dpm","yujie","osm"])
PAL=[(34.8097,114.3430),(34.8097,114.3492),(34.8035,114.3492),(34.8035,114.3430)]
ring(PAL,"宫城（大内）","考古实测宫城墙：东墙西距龙亭大殿约230米，东西墙长约690米，南北墙约570米，周回约五里。不含文献中轮廓未定的皇城/延福宫外缘","anchored","城墙",["dpm","qiu","osm"])
def onw(a,b,L,d): f=d/L; return (a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f)
og=[ # (起点,终点,墙长,距起点米,名,说明,置信,来源)
 (SW,NW,7590,2050,"新郑门（顺天门）","外城西墙正门，直门两重；2012–2017年发掘，中心坐标114°18′16″E、34°47′44″N","anchored",["stm","stm2","qiu"]),
 (SW,NW,7590,3730,"万胜门（开远门）","西墙北门，半圆形瓮城，南距顺天门1680米","anchored",["dpm"]),
 (SW,NW,7590,5390,"固子门（金耀门）","西墙最北门，2003年河南大学新校区工程探明；简报称南距新郑门3340米","estimated",["dpm"]),
 (SW,NW,7590,3100,"西水门（汴河上水门）","汴河入城水门，在万胜门南","estimated",["dpm","dj"]),
 (SW,NW,7590,6300,"西北水门（金水河）","金水河入城水门，在固子门北","estimated",["dpm"]),
 (SW,SE,6990,3770,"南薰门","外城正南门，直门两重；遗址在第十六中学、学堂门小学，瓮城东西130米南北80米","anchored",["yujie","nxm","bk"]),
 (SW,SE,6990,1700,"戴楼门（安上门）","南墙西门","estimated",["dpm","dj"]),
 (SW,SE,6990,2300,"蔡河上水门（广利水门）","戴楼门东","estimated",["dpm"]),
 (SW,SE,6990,5000,"蔡河下水门（普济水门）","陈州门西","estimated",["dpm"]),
 (SW,SE,6990,5500,"陈州门（宣化门）","南墙东门","estimated",["dpm","nxm"]),
 (SE,NE,7660,1900,"东水门（汴河下水门）","汴河出城水门，南岸上善门、北岸通津门","estimated",["dpm","bk"]),
 (SE,NE,7660,2400,"新宋门（朝阳门）","东墙正门，直门两重，与旧宋门相对","estimated",["dpm","dj"]),
 (SE,NE,7660,3800,"新曹门（含辉门）","东墙北门，半圆形瓮城东西50米南北108米","estimated",["qiu","dpm"]),
 (SE,NE,7660,5100,"东北水门（善利水门/五丈河）","五丈河（广济河）出城水门","estimated",["dpm"]),
 (NE,NW,6940,1300,"陈桥门（景阳门）","北墙最东门","estimated",["dpm"]),
 (NE,NW,6940,2550,"封丘门（永泰门）","北墙正门，直门两重","estimated",["dpm","dj"]),
 (NE,NW,6940,4000,"新酸枣门（通天门）","北墙中西门","estimated",["dpm"]),
 (NE,NW,6940,5300,"卫州门（安肃门）","北墙最西门","estimated",["dpm"])]
for a,b,L,d,n,ds,c,s in og: p=onw(a,b,L,d); pt(p[0],p[1],n,ds,c,"城门",s)
ig=[(34.7857,114.3440,"朱雀门","里城正南门；大南门北约350米中山路下，缺口宽约90米，今朱雀广场","anchored",["yujie","osm"]),
 (34.7857,114.3530,"保康门","里城南墙东门","estimated",["dpm","dj"]),(34.7857,114.3345,"新门（崇明门）","里城南墙西门","estimated",["dpm","dj"]),
 (34.7935,114.3281,"旧郑门（宜秋门）","里城西墙南门","estimated",["dpm"]),(34.8016,114.3281,"梁门（阊阖门）","里城西墙北门；明清大梁门沿其位","estimated",["dpm","osm"]),
 (34.7876,114.3625,"旧宋门（丽景门）","里城东墙南门；明清宋门（仁和门）一带","estimated",["dpm","osm"]),(34.8010,114.3625,"旧曹门（望春门）","里城东墙北门；今曹门一带","estimated",["dpm","osm"]),
 (34.8139,114.3573,"旧封丘门（安远门）","里城北墙东门；明清北门亦名安远门","estimated",["dpm","osm"]),(34.8139,114.3461,"景龙门（旧酸枣门）","里城北墙中门，近艮岳","estimated",["dpm"]),
 (34.8139,114.3330,"天波门（金水门）","里城北墙西门，金水河入里城处","estimated",["dpm"]),
 (34.8035,114.3461,"宣德门（宫城正门）","宫城正南门，御街北端；位于宋都御街北端一带","estimated",["yujie","osgeo","osm"])]
for la,lo,n,d,c,s in ig: pt(la,lo,n,d,c,"城门",s)
NX=onw(SW,SE,6990,3770)
line([(34.8035,114.3461),(34.791338,114.344841),(34.7857,114.3440),NX],"御街","宣德门—州桥—朱雀门—龙津桥—南薰门，叠压于今中山路下7.5–8.5米，全长约8.5华里","anchored","街道",["yujie","bk"])
W1=onw(SW,NW,7590,3100); E1=onw(SE,NE,7660,1900)
line([W1,(34.7915,114.3281),(34.791338,114.344841),(34.7895,114.3489),(34.7880,114.3625),E1],"汴河","自西水门入城，经州桥（宽25–28米）、相国寺南，东出东水门","estimated","河流",["zq","ncha","dpm","dj"])
C1=onw(SW,SE,6990,2300); C2=onw(SW,SE,6990,5000)
line([C1,(34.7815,114.3330),(34.7808,114.3440),(34.7800,114.3560),C2],"蔡河（惠民河）","自广利水门入城，经龙津桥，东南出普济水门","estimated","河流",["dpm","yujie"])
line([(34.8139,114.3600),(34.8200,114.3720),onw(SE,NE,7660,5100)],"五丈河（广济河）","城东北，东出善利水门通京东","estimated","河流",["dpm"])
line([onw(SW,NW,7590,6300),(34.8170,114.3200),(34.8139,114.3330),(34.8097,114.3440)],"金水河（天源河）","自西北水门引入，经天波门入宫城","estimated","河流",["dpm"])

# 金明池示意矩形：东西约1240m、南北约1230m；东岸距外城西墙约300m；方向同外城190°（丘刚述略；澎湃转引2005勘探）
JM_E = 300  # 东岸距西墙
JM_W = 1240
JM_N = 1230
# 外城西墙中点附近：顺天门西北侧。以西墙单位向北：顺天门在西墙距SW 2050；金明池中心约在顺天门北略偏
# 用审计给出的四角（已按外城坐标架推算）
JM=[(34.806598,114.289661),(34.804658,114.303057),(34.793745,114.300713),(34.795685,114.287317)]
ring(JM,"金明池","新郑门（顺天门）外西北皇家水上苑囿；勘探约东西1240米、南北1230米，东岸距外城西墙约300米。本面为示意矩形，OSM点仍保留为标注","estimated","园林",["qiu","dj","osm"])
P=[(34.81663,114.36486,"铁塔（开宝寺塔）","北宋皇祐元年（1049）琉璃砖塔，原开宝寺内，现存。OSM与维基坐标一致","anchored",["osm","wiki"]),
 (34.77061,114.35879,"繁塔（天清寺塔）","北宋开宝七年（974）始建，天清寺遗存，现存。OSM与高德坐标（转WGS84）一致","anchored",["osm","amap"]),
 (34.80939,114.34671,"龙亭大殿（宫城遗址）","清代建筑，坐落于北宋宫城遗址上","anchored",["osm","qiu"]),
 (34.79265,114.34878,"大相国寺","北宋皇家寺院，今址大体沿袭","anchored",["osm","wiki"]),
 (34.791338,114.344841,"州桥（天汉桥）","中山路与自由路十字路口南约50米；2018–2022年发掘，入选2022年度全国十大考古新发现","anchored",["zq","ncha","osm"]),
 (34.7812,114.3440,"龙津桥","御街跨蔡河之桥，朱雀门南","estimated",["yujie","dj"]),
 (34.76986,114.36324,"古吹台（禹王台）","今禹王台公园，北宋时在外城东南","anchored",["osm"]),
 (34.79320,114.34036,"延庆观","元代重阳观旧址，非北宋建筑，仅作现代参照","anchored",["osm"]),
 (34.8060,114.3515,"樊楼（丰乐楼）","东京第一酒楼，在宫城东华门外景明坊","estimated",["dj"]),
 (34.8120,114.3560,"艮岳（万岁山）","宋徽宗所筑皇家园林，宫城东北、景龙门内外","estimated",["dj","osgeo"]),
 (34.80051,114.29285,"金明池","新郑门外西北，皇家水上演武；OSM标注遗址点","anchored",["osm","dj"]),
 (34.7915,114.2935,"琼林苑","新郑门外道南，与金明池相对","estimated",["dj"]),
 (34.7915,114.3400,"开封府（北宋府衙）","《东京梦华录》载在州桥西浚仪桥之西；今复建开封府（34.7906,114.3411）为现代建筑","estimated",["dj","osm"])]
for la,lo,n,d,c,s in P: pt(la,lo,n,d,c,"建筑",s)
def conv(o):
    if isinstance(o[0],list): return [conv(x) for x in o]
    la,lo=gcj(o[1],o[0]); return [round(lo,6),round(la,6)]
json.dump(dict(type="FeatureCollection",crs="WGS84",features=F),open("bianjing_wgs84.geojson","w"),ensure_ascii=False,indent=1)
G2=copy.deepcopy(F)
for f in G2: f["geometry"]["coordinates"]=conv(f["geometry"]["coordinates"]) if f["properties"]["kind"]!="point" else conv([f["geometry"]["coordinates"]])[0]
json.dump(dict(type="FeatureCollection",crs="GCJ-02",features=G2),open("bianjing_gcj02.geojson","w"),ensure_ascii=False,indent=1)
px=[(300,35),(770,105),(735,610),(270,525),(415,195),(620,195),(615,440),(405,440)]
ll=OUT+INN
A=np.array([[x,y,1] for x,y in px]);B=np.array([[lo,la] for la,lo in ll])
M=np.linalg.lstsq(A,B,rcond=None)[0]
cor={k:(np.array(v+[1])@M).tolist() for k,v in {"topLeft":[0,0],"topRight":[1024,0],"bottomRight":[1024,669],"bottomLeft":[0,669]}.items()}
rms=float(np.sqrt((((A@M-B)*[MLON,MLAT])**2).sum(1).mean()))
json.dump({"image":"map2.jpg","pixelFrame":[1024,669],"affine_lonlat":M.tolist(),"rms_m":round(rms),"cornersWGS84_lonlat":cor,"cornersGCJ02_lonlat":{k:conv([v])[0] for k,v in cor.items()}},open("overlay_map2.json","w"),ensure_ascii=False,indent=1)
from collections import Counter
print(len(F),Counter(f["properties"]["confidence"] for f in F),"rms",round(rms),"corners",[tuple(round(c,5) for c in p) for p in OUT],len(S))
# 合并图1转录地名（由 georef.py + map1feat.py 生成）
import os
if os.path.exists("map1_features.json"):
    M1=json.load(open("map1_features.json")); F2=F+M1
    json.dump(dict(type="FeatureCollection",crs="WGS84",features=F2),open("bianjing_wgs84.geojson","w"),ensure_ascii=False,indent=1)
    G3=copy.deepcopy(F2)
    for f in G3: f["geometry"]["coordinates"]=conv(f["geometry"]["coordinates"]) if f["properties"]["kind"]!="point" else conv([f["geometry"]["coordinates"]])[0]
    json.dump(dict(type="FeatureCollection",crs="GCJ-02",features=G3),open("bianjing_gcj02.geojson","w"),ensure_ascii=False,indent=1)
