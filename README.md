# 汴京图考 (Bianjing)

> **北宋东京城历史地理信息系统 · 古今空间对照与考古实证研究平台**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg)](https://vitejs.dev/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-4.x-blue.svg)](https://maplibre.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-green.svg)](https://web.dev/progressive-web-apps/)

「汴京图考」是一个以北宋东京开封府为空间本位的数字历史地理与城市形态复原系统。系统以国家文物考古勘探成果（城墙、城门、水关、建筑基址）与国家现存重点文保单位为地面实测控制骨架，结合《宋史·地理志》《东京梦华录》及传世舆图文献，精准复原了北宋东京城**三重城垣**、**四水五渠**、**千步御街**以及 **455 处殿宇、官署、寺观、街巷与酒楼瓦子**。

---

## ✨ 核心特性

- **🏛️ 考古实证与现存实物双重锚定**：采用开宝寺铁塔、天清寺繁塔、延庆观玉清昭应宫故址、延春阁（今龙亭大殿台基）、吹台（禹王台）等国家级重点文保实物，结合顺天门、朱雀门等现代考古发掘基准点进行空间校正。
- **🗺️ 多层级古今无缝对照**：基于天地图（CGCS2000 国家大地坐标系）提供标准矢量、卫星影像、地形晕渲及古卷暖色四种底图，并提供现代开封街道地名浓度调节。
- **🔍 智能时空检索与分类探索**：提供分类筛选（城门水门、宫殿官署、寺观祠庙、桥梁河渠、酒楼瓦子）、关键词即时搜索、跨朝代别名联想（如搜索“铁塔”直达“开宝寺塔”）。
- **📱 现代移动端与 PWA 支持**：原生适配手机浏览器触控交互，支持添加到主屏幕离线运行，内置高精度 GPS 定位实时比对当下身处宋城何处。
- **🔒 密钥分离与开源友好**：天地图 API 密钥完全解耦，支持 `.env.local` 环境变量、URL 查询参数 `?tk=...` 以及网页端一键动态配置，安全无感。

---

## 🚀 快速上手

### 1. 环境准备
确保本机已安装 [Node.js](https://nodejs.org/) (建议 v18 及以上版本)。

### 2. 克隆项目与安装依赖
```bash
git clone https://github.com/你的用户名/bianjing.git
cd bianjing/bianjing_web
npm install
```

### 3. 配置天地图开发者密钥
本项目底图服务依赖国家地理信息公共服务平台（天地图）。请前往 [天地图控制台](https://console.tianditu.gov.cn/api/key) 免费申请：
1. 注册并登录天地图控制台；
2. 点击「创建新应用」，「应用类型」务必选择 **浏览器端 (Web端)**；
3. 复制生成的 Key；
4. 复制配置文件并填入 Key：
```bash
cp .env.example .env.local
```
编辑 `.env.local` 文件：
```env
VITE_TIANDITU_KEY=你的天地图浏览器端Key
```
*(注：`.env.local` 已被 `.gitignore` 保护，不会被上传到 GitHub)*

> 💡 **免构建快速体验**：若直接打开已部署的网页，也可在右上方点击 **「图层」 $\rightarrow$ 「配置密钥」** 直接填入，或在访问链接后附带 `?tk=你的天地图Key` 即可直接生效。

### 4. 启动本地开发服务
```bash
npm run dev
```
打开浏览器访问控制台提示的地址（默认 `http://localhost:5173`）即可浏览。

### 5. 构建生产部署产物
```bash
npm run build
```
构建产物输出在 `dist/` 目录，可直接托管于 GitHub Pages、Vercel、Cloudflare Pages 或任何静态 Web 服务器。

---

## 📂 项目结构

```text
bianjing/
├── bianjing_web/                  # 前端核心应用目录
│   ├── public/
│   │   ├── data/                 # 北宋地理空间 GeoJSON 数据 (WGS84 / GCJ-02)
│   │   │   ├── bianjing_wgs84.geojson    # 城墙、水系、御街与实测基准
│   │   │   ├── places_wgs84.geojson      # 455 处古迹点位及考据属性
│   │   │   ├── places.csv                # 空间校勘与置信度元数据
│   │   │   └── legend.json               # 图例与注记映射配置
│   │   ├── icons/                # 自研定制古建筑与名胜图标
│   │   ├── manifest.webmanifest  # PWA 渐进式应用清单
│   │   └── sw.js                 # Service Worker 离线缓存服务
│   ├── src/
│   │   ├── main.js               # 地图初始化、时空图层管理与交互逻辑
│   │   └── style.css             # 响应式玻璃拟态 UI 样式
│   ├── docs/                     # 考据与校勘学术档案
│   ├── .env.example              # 环境变量配置模板
│   ├── index.html                # 入口 HTML
│   ├── package.json              # 项目依赖配置
│   └── vite.config.js            # Vite 构建配置
├── .gitignore                    # Git 忽略配置
└── README.md                     # 项目说明文档
```

---

## 📜 空间参考与学术依据

1. **考古实测依据**：河南省文物考古研究院《北宋东京城城垣及城门遗址发掘报告》、开封州桥遗址与汴河遗址考古重大成果、开封顺天门遗址发掘简报；
2. **传世历史文献**：宋·孟元老《东京梦华录》、宋·李诫《营造法式》、《宋史·地理志》、明·李濂《汴京遗迹志》、清·《如梦录》；
3. **坐标系统规范**：古迹空间矢量以 **CGCS2000 / WGS84** 为基准坐标系，国内高德/腾讯卫星影像配套转换提供 **GCJ-02** 纠偏图层。

---

## 📄 开源许可证

本项目采用 [MIT 许可证](LICENSE)。欢迎提交 Issue 与 Pull Request 共同完善北宋东京城时空复原考订。
