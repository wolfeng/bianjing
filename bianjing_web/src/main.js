import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './style.css'

// ==================== 天地图密钥解析与多层级配置 ====================
// 优先级：URL 参数 ?tk= > 本地存储 localStorage > 环境变量 VITE_TIANDITU_KEY > 全局 window.__TIANDITU_KEY__
function resolveTiandituKey() {
  try {
    const urlTk = new URLSearchParams(window.location.search).get('tk')
    if (urlTk && urlTk.trim()) return urlTk.trim()
  } catch (_) {}

  try {
    const localTk = localStorage.getItem('TIANDITU_KEY')
    if (localTk && localTk.trim()) return localTk.trim()
  } catch (_) {}

  if (import.meta.env.VITE_TIANDITU_KEY) {
    const envTk = String(import.meta.env.VITE_TIANDITU_KEY).trim()
    if (envTk) return envTk
  }

  if (typeof window !== 'undefined' && window.__TIANDITU_KEY__) {
    const winTk = String(window.__TIANDITU_KEY__).trim()
    if (winTk) return winTk
  }

  return ''
}

const TIANDITU_KEY = resolveTiandituKey()
if (!TIANDITU_KEY) {
  console.warn(
    '💡 [天地图] 未检测到天地图开发者密钥。如需正常浏览现代卫星/矢量底图，请在 .env.local 中配置 VITE_TIANDITU_KEY，或点击图层面板中的「配置密钥」。'
  )
}

function tiandituTiles(layer) {
  // 使用浏览器端 Key，直连天地图官方高可用并发集群（t0-t4）
  const tk = TIANDITU_KEY || ''
  return [
    `https://t0.tianditu.gov.cn/DataServer?T=${layer}_w&x={x}&y={y}&l={z}&tk=${tk}`,
    `https://t1.tianditu.gov.cn/DataServer?T=${layer}_w&x={x}&y={y}&l={z}&tk=${tk}`,
    `https://t2.tianditu.gov.cn/DataServer?T=${layer}_w&x={x}&y={y}&l={z}&tk=${tk}`,
    `https://t3.tianditu.gov.cn/DataServer?T=${layer}_w&x={x}&y={y}&l={z}&tk=${tk}`,
  ]
}

const DEFAULT_CENTER = [114.3465, 34.8005]
const DEFAULT_ZOOM = 12.3
const NEAR_ZOOM_THRESHOLD = 13.0

// 类别近景图标默认映射表（涵盖主要古迹建筑形态）
const CATEGORY_NEAR_ICONS = {
  '城门': 'icon_gate',
  '水门': 'icon_water_gate',
  '宫殿': 'icon_palace',
  '官署': 'icon_palace',
  '学校': 'icon_palace',
  '寺院': 'icon_pagoda',
  '道观': 'icon_pagoda',
  '祠庙': 'icon_pagoda',
  '桥梁': 'icon_bridge',
  '河渠': 'icon_water_gate',
  '市场酒楼': 'icon_tavern',
  '宅第': 'icon_courtyard',
  '园林池苑': 'icon_garden',
  '仓库': 'icon_courtyard',
  '军营': 'icon_gate',
  '街巷': 'icon_street',
  '其他': 'icon_courtyard',
}

// 正下方毛玻璃菜单配置（全城总览等视野专题）
const MENU_PRESETS = [
  {
    id: 'overview',
    barText: '北宋 · 全城总览 · 三重城池与508处古迹',
    title: '全城总览 · 三重城池与四水',
    desc: '外城（罗城）周回五十里、里城（旧城）周回二十里、大内宫城居中偏北。',
    center: [114.3465, 34.8005],
    zoom: 12.3,
    filterMode: 'all',
  },
  {
    id: 'palace_axis',
    barText: '北宋 · 大内宫城与千步御街中轴',
    title: '大内宫城 · 御街千步廊',
    desc: '自宣德门经州桥、朱雀门、龙津桥至外城正南门南薰门，叠压于今中山路下。',
    center: [114.3455, 34.7985],
    zoom: 13.5,
    filterMode: 'all',
    selectName: '宣德门（宫城正门）',
  },
  {
    id: 'four_rivers',
    barText: '北宋 · 四水贯都 · 汴河漕运与州桥夜市',
    title: '四水贯都 · 汴河桥梁与水门',
    desc: '汴河、蔡河、五丈河、金水河四水穿城，展现州桥夜市与水陆都会格局。',
    center: [114.3448, 34.7915],
    zoom: 13.6,
    filterMode: 'categories',
    categories: ['桥梁', '水门', '河渠', '市场酒楼', '仓库'],
    selectName: '州桥（天汉桥）',
  },
  {
    id: 'gardens_west',
    barText: '北宋 · 西郊苑囿 · 金明池争标与琼林苑',
    title: '西郊皇家苑囿 · 金明池与琼林苑',
    desc: '顺天门（新郑门）外西北皇家水上苑囿金明池，南侧对望新科进士赐宴之琼林苑。',
    center: [114.2985, 34.7985],
    zoom: 13.6,
    filterMode: 'all',
    selectName: '金明池',
  },
  {
    id: 'temples_markets',
    barText: '北宋 · 瓦子酒楼 · 相国寺万姓交易',
    title: '寺观瓦子 · 相国寺与七十二正店',
    desc: '大相国寺每月五次开放万姓交易，樊楼（白矾楼）、潘楼等酒楼林立。',
    center: [114.3488, 34.7965],
    zoom: 13.6,
    filterMode: 'categories',
    categories: ['寺院', '道观', '祠庙', '市场酒楼', '宅第'],
    selectName: '大相国寺',
  },
  {
    id: 'anchored_only',
    barText: '考据 · 考古发掘与现存实证遗址（15处锚点）',
    title: '考古实证 · 15 处考古发掘与现存实证基准锚点',
    desc: '筛选经国家考古发掘证实（顺天门、州桥、朱雀门等）或地面现存实物（铁塔、繁塔等）的基准锚点。',
    center: [114.3465, 34.7995],
    zoom: 12.3,
    filterMode: 'anchored',
  },
]

// ==================== 全局状态 ====================
const state = {
  basemap: 'parchment',
  showTiandituLabels: true,
  labelOpacity: 0.65,
  showWalls: true,
  showRivers: true,
  showPlaces: true,
  showAllConflictLines: false,
  histOverlay: 'none',
  histOverlayOpacity: 0.65,
  iconMode: 'near',
  isNearZoom: false,
  legend: null,
  visibleCats: new Set(),
  specialFilter: null,
  placesGeojson: null,
  structureGeojson: null,
  gappedWallLinesGeojson: null,
  gappedWallCornersGeojson: null,
  conflictLinesGeojson: null,
  selectedFeature: null,
  compareDualPins: false,
  menuIndex: 0,
  searchQuery: '',
  searchChip: 'all',
  activePopover: null, // 'legend' | 'layers' | 'search' | 'menu' | 'detail' | null
}

// ==================== DOM 引用 ====================
const appEl = document.getElementById('app')
const el = {
  btnBrand: document.getElementById('btn-brand'),
  btnLegend: document.getElementById('btn-legend'),
  btnLayers: document.getElementById('btn-layers'),
  btnSearch: document.getElementById('btn-search'),
  searchTriggerText: document.getElementById('search-trigger-text'),
  btnZoomIn: document.getElementById('btn-zoom-in'),
  btnZoomOut: document.getElementById('btn-zoom-out'),
  btnResetView: document.getElementById('btn-reset-view'),
  btnGPSLocate: document.getElementById('btn-gps-locate'),
  legendBadge: document.getElementById('legend-badge'),
  layerBadge: document.getElementById('layer-badge'),

  selectionPill: document.getElementById('selection-pill'),
  selectionExpandBtn: document.getElementById('selection-expand-btn'),
  selectionTitle: document.getElementById('selection-title'),
  selectionCloseBtn: document.getElementById('selection-close-btn'),

  menuPrevBtn: document.getElementById('menu-prev-btn'),
  menuNextBtn: document.getElementById('menu-next-btn'),
  menuCenterBtn: document.getElementById('menu-center-btn'),
  menuCurrentLabel: document.getElementById('menu-current-label'),
  btnSourceTag: document.getElementById('btn-source-tag'),

  backdrop: document.getElementById('popover-backdrop'),
  popLegend: document.getElementById('popover-legend'),
  popLayers: document.getElementById('popover-layers'),
  popSearch: document.getElementById('popover-search'),
  popMenu: document.getElementById('popover-menu'),
  popDetail: document.getElementById('popover-detail'),

  legendZoomHint: document.getElementById('legend-zoom-hint'),
  legendGrid: document.getElementById('legend-grid'),

  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  searchChipsContainer: document.getElementById('search-chips-container'),
  searchFilterChips: document.getElementById('search-filter-chips'),
  searchChipScrollLeft: document.getElementById('search-chip-scroll-left'),
  searchChipScrollRight: document.getElementById('search-chip-scroll-right'),
  searchChipToggleExpand: document.getElementById('search-chip-toggle-expand'),
  searchResultCount: document.getElementById('search-result-count'),
  searchResultsList: document.getElementById('search-results-list'),

  menuPresetsList: document.getElementById('menu-presets-list'),
  menuAnchorsGrid: document.getElementById('menu-anchors-grid'),

  detailIconWrap: document.getElementById('detail-icon-wrap'),
  detailBadges: document.getElementById('detail-badges'),
  detailName: document.getElementById('detail-name'),
  detailBody: document.getElementById('detail-body'),
}

const popoversMap = {
  legend: el.popLegend,
  layers: el.popLayers,
  search: el.popSearch,
  menu: el.popMenu,
  detail: el.popDetail,
}

// ==================== 初始化 MapLibre + 天地图 ====================
const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      'tdt-vec': {
        type: 'raster',
        tiles: tiandituTiles('vec'),
        tileSize: 256,
        maxzoom: 18,
      },
      'tdt-cva': {
        type: 'raster',
        tiles: tiandituTiles('cva'),
        tileSize: 256,
        maxzoom: 18,
      },
      'tdt-img': {
        type: 'raster',
        tiles: tiandituTiles('img'),
        tileSize: 256,
        maxzoom: 18,
      },
      'tdt-cia': {
        type: 'raster',
        tiles: tiandituTiles('cia'),
        tileSize: 256,
        maxzoom: 18,
      },
      'tdt-ter': {
        type: 'raster',
        tiles: tiandituTiles('ter'),
        tileSize: 256,
        maxzoom: 14,
      },
    },
    layers: [
      {
        id: 'bg-paper',
        type: 'background',
        paint: { 'background-color': '#f2ede0' },
      },
      {
        id: 'tdt-vec-layer',
        type: 'raster',
        source: 'tdt-vec',
        paint: { 'raster-opacity': 0.96 },
      },
      {
        id: 'tdt-img-layer',
        type: 'raster',
        source: 'tdt-img',
        layout: { visibility: 'none' },
      },
      {
        id: 'tdt-ter-layer',
        type: 'raster',
        source: 'tdt-ter',
        layout: { visibility: 'none' },
      },
      {
        id: 'tdt-cva-layer',
        type: 'raster',
        source: 'tdt-cva',
        paint: { 'raster-opacity': state.labelOpacity },
      },
      {
        id: 'tdt-cia-layer',
        type: 'raster',
        source: 'tdt-cia',
        layout: { visibility: 'none' },
        paint: { 'raster-opacity': state.labelOpacity },
      },
    ],
  },
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  minZoom: 9.5,
  maxZoom: 19,
  maxPitch: 45,
  attributionControl: false,
})
window.map = map
window.state = state

// ==================== 工具函数 ====================
function distanceMeters(a, b) {
  const dx = (a[0] - b[0]) * 91200
  const dy = (a[1] - b[1]) * 111000
  return Math.round(Math.hypot(dx, dy))
}

function getCategoryMeta(catName) {
  const c = state.legend?.categories?.find((item) => item.category === catName)
  const fallbackIcon = CATEGORY_NEAR_ICONS[catName] || null
  return (
    c
      ? { ...c, nearIcon: c.nearIcon || fallbackIcon }
      : {
          category: catName || '其他',
          color: '#696969',
          emoji: '📍',
          nearIcon: fallbackIcon,
        }
  )
}

function getPlaceIconName(props) {
  const ov = state.legend?.placeIconOverrides?.[props.name]
  if (ov?.nearIcon) return ov.nearIcon
  return CATEGORY_NEAR_ICONS[props.category] || null
}

function isEffectiveNear() {
  return true
}

function polygonCenter(coords) {
  const ring = coords[0] || []
  if (!ring.length) return DEFAULT_CENTER
  let sx = 0
  let sy = 0
  const n = ring.length > 1 ? ring.length - 1 : ring.length
  for (let i = 0; i < n; i++) {
    sx += ring[i][0]
    sy += ring[i][1]
  }
  return [sx / n, sy / n]
}

function lineMidpoint(coords) {
  if (!coords || !coords.length) return DEFAULT_CENTER
  return coords[Math.floor(coords.length / 2)]
}

// 将全角括号转为半角括号，解决 MapLibre 默认 PBF 字库缺失 U+FF08/U+FF09 导致括号不显示的问题
function formatMapLabel(str) {
  if (!str) return ''
  return str.replace(/（/g, '(').replace(/）/g, ')')
}

// 点到线段投影与参数计算
function pointToSegmentProj(p, a, b) {
  const dx = (b[0] - a[0]) * 91200
  const dy = (b[1] - a[1]) * 111000
  const l2 = dx * dx + dy * dy
  if (l2 === 0) return { dist: distanceMeters(p, a), t: 0 }
  let t = ((p[0] - a[0]) * 91200 * dx + (p[1] - a[1]) * 111000 * dy) / l2
  t = Math.max(0, Math.min(1, t))
  const projX = a[0] + t * (b[0] - a[0])
  const projY = a[1] + t * (b[1] - a[1])
  return { dist: distanceMeters(p, [projX, projY]), t, proj: [projX, projY] }
}

// 为外城、里城、宫城生成艺术城墙段与城门缺口几何（每个城门处留出通畅券门缺口）
function generateGappedWallsData(structure, places) {
  const allGates = []
  const seen = new Set()
  const nonGateCats = new Set(['街巷', '军营', '市场酒楼', '桥梁', '寺院', '道观', '宅第', '园林池苑', '官署', '仓库'])
  ;[...structure.features, ...places.features].forEach((f) => {
    const name = f.properties.name || ''
    const cat = f.properties.category || f.properties.layer || ''
    if (nonGateCats.has(cat)) return
    if (name.includes('大街') || name.includes('街') || name.includes('营') || name.includes('瓦子') || 
        name.includes('夜市') || name.includes('山门') || name.includes('艮岳') || name.includes('图1') || name.includes('角门子')) {
      return
    }
    const isGate = cat === '城门' || cat === '水门' || (!cat && (name.includes('门') || name.includes('水门')))
    if (isGate) {
      const k = name + f.geometry.coordinates.join(',')
      if (!seen.has(k)) {
        seen.add(k)
        allGates.push({ name, coords: f.geometry.coordinates })
      }
    }
  })

  // 宫城四大禁门坐标
  const palaceGates = [
    { name: '宣德门（宫城正门）', coords: [114.3461, 34.8035] },
    { name: '拱宸门', coords: [114.3461, 34.8097] },
    { name: '东华门', coords: [114.3492, 34.8066] },
    { name: '西华门', coords: [114.343, 34.8066] },
  ]

  const wallDefs = [
    { name: '外城', gapM: 135, gates: allGates },
    { name: '里城', gapM: 120, gates: allGates },
    { name: '宫城', gapM: 95, gates: palaceGates },
  ]

  const lineFeatures = []
  const cornerFeatures = []

  for (const wDef of wallDefs) {
    const polyFeature = structure.features.find(
      (f) => f.geometry.type === 'Polygon' && f.properties.name.includes(wDef.name)
    )
    if (!polyFeature) continue
    const ring = polyFeature.geometry.coordinates[0]

    for (let s = 0; s < ring.length - 1; s++) {
      const a = ring[s]
      const b = ring[s + 1]

      cornerFeatures.push({
        type: 'Feature',
        properties: { wall: wDef.name, kind: 'corner-bastion' },
        geometry: { type: 'Point', coordinates: a },
      })

      const segLen = distanceMeters(a, b)
      const halfGapT = wDef.gapM / 2 / segLen

      const onSeg = []
      wDef.gates.forEach((g) => {
        const res = pointToSegmentProj(g.coords, a, b)
        if (res.dist < 50 && res.t >= 0.02 && res.t <= 0.98) {
          onSeg.push({ name: g.name, t: res.t })
        }
      })

      onSeg.sort((x, y) => x.t - y.t)

      let currT = 0
      for (const g of onSeg) {
        const tStart = Math.max(currT, g.t - halfGapT)
        const tEnd = Math.min(1, g.t + halfGapT)
        if (tStart > currT + 0.004) {
          const p1 = [a[0] + currT * (b[0] - a[0]), a[1] + currT * (b[1] - a[1])]
          const p2 = [a[0] + tStart * (b[0] - a[0]), a[1] + tStart * (b[1] - a[1])]
          lineFeatures.push({
            type: 'Feature',
            properties: { wall: wDef.name, segIndex: s },
            geometry: { type: 'LineString', coordinates: [p1, p2] },
          })
        }
        currT = tEnd
      }
      if (currT < 0.996) {
        const p1 = [a[0] + currT * (b[0] - a[0]), a[1] + currT * (b[1] - a[1])]
        const p2 = b
        lineFeatures.push({
          type: 'Feature',
          properties: { wall: wDef.name, segIndex: s },
          geometry: { type: 'LineString', coordinates: [p1, p2] },
        })
      }
    }
  }

  return {
    linesGeojson: { type: 'FeatureCollection', features: lineFeatures },
    cornersGeojson: { type: 'FeatureCollection', features: cornerFeatures },
  }
}

// ==================== 河流曲线平滑处理（贝塞尔圆角倒角，消除硬折角） ====================
function smoothRiverCoordinates(coords, maxRadiusM = 420, maxCutRatio = 0.38, steps = 20) {
  if (!coords || coords.length < 3) return coords
  const n = coords.length
  const segLens = []
  for (let i = 0; i < n - 1; i++) {
    segLens.push(distanceMeters(coords[i], coords[i + 1]))
  }

  const cuts = []
  for (let i = 1; i < n - 1; i++) {
    const dIn = segLens[i - 1]
    const dOut = segLens[i]
    const vIn = [coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]]
    const vOut = [coords[i + 1][0] - coords[i][0], coords[i + 1][1] - coords[i][1]]
    const mIn = Math.hypot(vIn[0], vIn[1])
    const mOut = Math.hypot(vOut[0], vOut[1])
    const dot = (vIn[0] * vOut[0] + vIn[1] * vOut[1]) / (mIn * mOut)
    const angle = Math.acos(Math.max(-1.0, Math.min(1.0, dot)))

    let baseR = 260.0
    if (angle > (60 * Math.PI) / 180) {
      baseR = maxRadiusM
    } else if (angle > (25 * Math.PI) / 180) {
      baseR = maxRadiusM * 0.8
    }

    const cutIn = Math.min(baseR, dIn * maxCutRatio)
    const cutOut = Math.min(baseR, dOut * maxCutRatio)
    cuts.push([cutIn, cutOut])
  }

  for (let i = 0; i < cuts.length - 1; i++) {
    if (cuts[i][1] + cuts[i + 1][0] > segLens[i + 1] * 0.85) {
      const scale = (segLens[i + 1] * 0.85) / (cuts[i][1] + cuts[i + 1][0])
      cuts[i][1] *= scale
      cuts[i + 1][0] *= scale
    }
  }

  const result = [coords[0].slice()]
  for (let i = 1; i < n - 1; i++) {
    const pPrev = coords[i - 1]
    const pCurr = coords[i]
    const pNext = coords[i + 1]
    const dIn = segLens[i - 1]
    const dOut = segLens[i]
    const [cutIn, cutOut] = cuts[i - 1]

    const tIn = 1.0 - cutIn / dIn
    const tOut = cutOut / dOut

    const pStart = [
      pPrev[0] + (pCurr[0] - pPrev[0]) * tIn,
      pPrev[1] + (pCurr[1] - pPrev[1]) * tIn,
    ]
    const pEnd = [
      pCurr[0] + (pNext[0] - pCurr[0]) * tOut,
      pCurr[1] + (pNext[1] - pCurr[1]) * tOut,
    ]

    result.push([Number(pStart[0].toFixed(6)), Number(pStart[1].toFixed(6))])

    const c1 = [
      pStart[0] + (pCurr[0] - pStart[0]) * 0.552,
      pStart[1] + (pCurr[1] - pStart[1]) * 0.552,
    ]
    const c2 = [
      pEnd[0] + (pCurr[0] - pEnd[0]) * 0.552,
      pEnd[1] + (pCurr[1] - pEnd[1]) * 0.552,
    ]

    for (let s = 1; s < steps; s++) {
      const u = s / steps
      const b0 = (1 - u) ** 3
      const b1 = 3 * (1 - u) ** 2 * u
      const b2 = 3 * (1 - u) * u ** 2
      const b3 = u ** 3
      const x = b0 * pStart[0] + b1 * c1[0] + b2 * c2[0] + b3 * pEnd[0]
      const y = b0 * pStart[1] + b1 * c1[1] + b2 * c2[1] + b3 * pEnd[1]
      result.push([Number(x.toFixed(6)), Number(y.toFixed(6))])
    }

    result.push([Number(pEnd[0].toFixed(6)), Number(pEnd[1].toFixed(6))])
  }

  result.push(coords[coords.length - 1].slice())
  return result
}

// ==================== 加载数据与图标 ====================
async function loadAllData() {
  const [legend, structure, places] = await Promise.all([
    fetch('/data/legend.json').then((r) => r.json()),
    fetch('/data/bianjing_wgs84.geojson').then((r) => r.json()),
    fetch('/data/places_wgs84.geojson').then((r) => r.json()),
  ])

  state.legend = legend
  state.visibleCats = new Set(legend.categories.map((c) => c.category))
  // 过滤掉金明池的示意多边形边界，仅保留三重城墙（外城、里城、宫城）及河渠御街
  structure.features = structure.features.filter(
    (f) => !(f.geometry.type === 'Polygon' && f.properties.name === '金明池')
  )

  // 对水系河流进行高阶圆润曲线倒角处理，尤其消除折角处的尖锐直角折线
  for (const f of structure.features) {
    if (f.properties?.layer === '河流' && f.geometry?.type === 'LineString') {
      f.geometry.coordinates = smoothRiverCoordinates(f.geometry.coordinates)
    }
  }

  state.structureGeojson = structure

  const gapped = generateGappedWallsData(structure, places)
  state.gappedWallLinesGeojson = gapped.linesGeojson
  state.gappedWallCornersGeojson = gapped.cornersGeojson

  const descByName = new Map()
  for (const f of structure.features) {
    const p = f.properties
    p.label = formatMapLabel(p.name)
    if (p.name && p.desc) {
      descByName.set(p.name, p.desc)
      const shortName = p.name.split('（')[0]
      if (!descByName.has(shortName)) descByName.set(shortName, p.desc)
    }
  }

  for (const f of places.features) {
    const p = f.properties
    const overrideLabel = legend.placeIconOverrides?.[p.name]?.label
    p.label = formatMapLabel(overrideLabel || p.name)
    const shortName = p.name.split('（')[0]
    p.desc =
      p.desc ||
      descByName.get(p.name) ||
      descByName.get(shortName) ||
      (p.position_source?.startsWith('calibrated:')
        ? descByName.get(p.position_source.replace('calibrated:', ''))
        : '') ||
      ''
    p.iconName = getPlaceIconName(p) || ''
    p.isOverride = Boolean(legend.placeIconOverrides?.[p.name])
    const cat = p.category
    if (p.isOverride) {
      p.sortKey = 1
    } else if (p.confidence === 'anchored') {
      p.sortKey = 2
    } else if (['宫殿', '官署', '城门', '水门'].includes(cat)) {
      p.sortKey = 3
    } else if (['寺院', '道观', '桥梁', '学校'].includes(cat)) {
      p.sortKey = 4
    } else if (['市场酒楼', '园林池苑', '军营'].includes(cat)) {
      p.sortKey = 5
    } else {
      p.sortKey = 6
    }
  }

  state.placesGeojson = places

  // 动态更新搜索标签与顶部底栏的真实数量
  const totalCount = places.features.length
  const anchoredCount = places.features.filter((f) => f.properties.confidence === 'anchored').length

  SEARCH_CHIPS[0].label = `全部 (${totalCount})`
  SEARCH_CHIPS[1].label = `考古锚点 (${anchoredCount})`

  MENU_PRESETS[0].barText = `北宋 · 全城总览 · 三重城池与${totalCount}处古迹`
  if (el.menuCurrentLabel && state.menuIndex === 0) {
    el.menuCurrentLabel.textContent = MENU_PRESETS[0].barText
  }
  const selectAllBtn = document.getElementById('leg-select-all')
  if (selectAllBtn) selectAllBtn.textContent = `全选 (${totalCount})`
  const searchResultCountEl = document.getElementById('search-result-count')
  if (searchResultCountEl) searchResultCountEl.textContent = `共 ${totalCount} 处古迹`
  const swTitle = document.querySelector('.sw-title')
  if (swTitle) swTitle.textContent = `北宋古地名标注（${totalCount} 处）`
}

async function loadMapIcons() {
  const iconNames = [
    'icon_gate',
    'icon_palace',
    'icon_pagoda',
    'icon_bridge',
    'icon_water_gate',
    'icon_tavern',
    'icon_courtyard',
    'icon_tieta',
    'icon_fanta',
    'icon_garden',
    'icon_street',
    'icon_daqingdian',
  ]
  await Promise.all(
    iconNames.map(async (name) => {
      try {
        if (map.hasImage(name)) return
        const res = await map.loadImage(`/icons/${name}.png`)
        if (res?.data && !map.hasImage(name)) {
          map.addImage(name, res.data, { pixelRatio: 2 })
        }
      } catch (e) {
        console.warn('Icon load skipped:', name, e)
      }
    })
  )

  // 注册发光选中高亮微光（完全同心共圆，柔和琥珀光晕，替代生硬红圈）
  try {
    if (!map.hasImage('selection_ring')) {
      const cx = 63.5
      const cy = 66.5
      const ringCanvas = document.createElement('canvas')
      ringCanvas.width = 128
      ringCanvas.height = 128
      const ctx = ringCanvas.getContext('2d')
      if (ctx) {
        // 1. 柔和扩散的温润琥珀微光晕（从徽章边缘向外自然渐变，无生硬边缘）
        const grad = ctx.createRadialGradient(cx, cy, 48, cx, cy, 74)
        grad.addColorStop(0, 'rgba(245, 158, 11, 0.50)')
        grad.addColorStop(0.35, 'rgba(245, 158, 11, 0.40)')
        grad.addColorStop(0.70, 'rgba(251, 191, 36, 0.20)')
        grad.addColorStop(1.0, 'rgba(251, 191, 36, 0.0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(cx, cy, 74, 0, Math.PI * 2)
        ctx.fill()

        // 2. 徽章外缘温润金边（完全贴合 56.5px 徽章轮廓，同心共圆）
        ctx.beginPath()
        ctx.arc(cx, cy, 56.5, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.65)'
        ctx.lineWidth = 2.5
        ctx.stroke()

        // 3. 徽章内缘高光细线（晶莹通透的高亮感）
        ctx.beginPath()
        ctx.arc(cx, cy, 55.0, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)'
        ctx.lineWidth = 1.2
        ctx.stroke()

        const ringData = ctx.getImageData(0, 0, 128, 128)
        map.addImage('selection_ring', ringData, { pixelRatio: 2 })
      }
    }
  } catch (err) {
    console.warn('Failed to create selection_ring image:', err)
  }
}

// ==================== 构建地图图层 ====================
function buildColorMatchExpression() {
  const expr = ['match', ['get', 'category']]
  for (const c of state.legend.categories) {
    expr.push(c.category, c.color)
  }
  expr.push('#696969')
  return expr
}

function setupMapLayers() {
  // 1. 城墙文字标注（外城与内城在大尺度展示，宫城仅在放大后以小尺寸展示，不响应点击）
  const areaLabels = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          label: '外城 (罗城) · 周回五十里',
          kind: 'outer',
        },
        geometry: { type: 'Point', coordinates: [114.3480, 34.8300] },
      },
      {
        type: 'Feature',
        properties: {
          label: '内城 (里城) · 周回二十里',
          kind: 'inner',
        },
        geometry: { type: 'Point', coordinates: [114.3380, 34.7945] },
      },
      {
        type: 'Feature',
        properties: {
          label: '宫城 (大内) · 周回五里',
          kind: 'palace',
        },
        geometry: { type: 'Point', coordinates: [114.3461, 34.8066] },
      },
    ],
  }

  map.addSource('structure', { type: 'geojson', data: state.structureGeojson })
  map.addSource('walls-gapped-lines', {
    type: 'geojson',
    data: state.gappedWallLinesGeojson,
  })
  map.addSource('walls-corner-bastions', {
    type: 'geojson',
    data: state.gappedWallCornersGeojson,
  })
  map.addSource('area-labels', { type: 'geojson', data: areaLabels })

  // 1.1 艺术效果城墙：城门缺口、垛口雉堞、厚重阴影与角楼敌台（仅作为背景美化，不响应点击）
  map.addLayer({
    id: 'walls-gapped-shadow',
    type: 'line',
    source: 'walls-gapped-lines',
    paint: {
      'line-color': 'rgba(65, 35, 10, 0.22)',
      'line-width': ['interpolate', ['linear'], ['zoom'], 10.5, 6.0, 13, 8.5, 15.5, 11.0],
      'line-blur': 3.5,
      'line-offset': 1.6,
    },
  })

  map.addLayer({
    id: 'walls-gapped-casing',
    type: 'line',
    source: 'walls-gapped-lines',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': 'rgba(255, 250, 240, 0.95)',
      'line-width': ['interpolate', ['linear'], ['zoom'], 10.5, 4.2, 13, 5.8, 15.5, 7.5],
    },
  })

  map.addLayer({
    id: 'walls-gapped-body',
    type: 'line',
    source: 'walls-gapped-lines',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'wall'], '宫城'],
        '#991b1b',
        ['==', ['get', 'wall'], '里城'],
        '#c2410c',
        '#78350f',
      ],
      'line-width': ['interpolate', ['linear'], ['zoom'], 10.5, 2.8, 13, 3.8, 15.5, 5.0],
    },
  })

  map.addLayer({
    id: 'walls-gapped-crenellations',
    type: 'line',
    source: 'walls-gapped-lines',
    layout: { 'line-cap': 'butt', 'line-join': 'round' },
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'wall'], '宫城'],
        '#fecaca',
        ['==', ['get', 'wall'], '里城'],
        '#fed7aa',
        '#fef08a',
      ],
      'line-width': ['interpolate', ['linear'], ['zoom'], 10.5, 1.2, 13, 1.8, 15.5, 2.2],
      'line-dasharray': [2.5, 2.0],
    },
  })

  map.addLayer({
    id: 'walls-corner-bastions',
    type: 'circle',
    source: 'walls-corner-bastions',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10.5, 3.2, 13, 4.8, 15.5, 6.2],
      'circle-color': [
        'case',
        ['==', ['get', 'wall'], '宫城'],
        '#991b1b',
        ['==', ['get', 'wall'], '里城'],
        '#c2410c',
        '#78350f',
      ],
      'circle-stroke-width': 2.0,
      'circle-stroke-color': '#ffffff',
    },
  })

  map.addLayer({
    id: 'rivers-casing',
    type: 'line',
    source: 'structure',
    filter: ['==', ['geometry-type'], 'LineString'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': 'rgba(255, 255, 255, 0.82)',
      'line-width': ['case', ['==', ['get', 'layer'], '河流'], 5.8, 4.8],
    },
  })

  map.addLayer({
    id: 'rivers-line',
    type: 'line',
    source: 'structure',
    filter: ['==', ['geometry-type'], 'LineString'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'layer'], '河流'],
        '#2578e6',
        '#d9480f',
      ],
      'line-width': ['case', ['==', ['get', 'layer'], '河流'], 3.4, 2.8],
    },
  })

  map.addLayer({
    id: 'rivers-label',
    type: 'symbol',
    source: 'structure',
    filter: ['==', ['geometry-type'], 'LineString'],
    layout: {
      'symbol-placement': 'line',
      'text-field': ['get', 'label'],
      'text-size': 12.5,
      'symbol-spacing': 260,
    },
    paint: {
      'text-color': [
        'case',
        ['==', ['get', 'layer'], '河流'],
        '#1d6fd8',
        '#b91c1c',
      ],
      'text-halo-color': 'rgba(255, 255, 255, 0.95)',
      'text-halo-width': 2.0,
    },
  })

  // 1.2 大尺度城池标注：外城与内城（里城）在大尺度展示，进入微观街巷时自然淡出
  map.addLayer({
    id: 'area-labels-city',
    type: 'symbol',
    source: 'area-labels',
    filter: ['!=', ['get', 'kind'], 'palace'],
    layout: {
      'text-field': ['get', 'label'],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10.0,
        12.0,
        12.3,
        14.0,
        13.5,
        14.0,
      ],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': [
        'case',
        ['==', ['get', 'kind'], 'inner'],
        '#9a3412',
        '#78350f',
      ],
      'text-halo-color': 'rgba(255, 255, 255, 0.96)',
      'text-halo-width': 2.6,
      'text-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10.0,
        0.95,
        13.3,
        0.95,
        13.8,
        0,
      ],
    },
  })

  // 1.3 宫城标注：宫城尺度较小（周回五里），在全城大尺度下不展示，仅在放大至大内近景（zoom >= 13.1）时以适当紧凑小字优雅显现
  map.addLayer({
    id: 'area-labels-palace',
    type: 'symbol',
    source: 'area-labels',
    filter: ['==', ['get', 'kind'], 'palace'],
    layout: {
      'text-field': ['get', 'label'],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        13.1,
        11.0,
        14.0,
        12.5,
        15.5,
        13.5,
      ],
      'text-allow-overlap': false,
      'text-ignore-placement': false,
    },
    paint: {
      'text-color': '#991b1b',
      'text-halo-color': 'rgba(255, 255, 255, 0.96)',
      'text-halo-width': 2.0,
      'text-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        13.0,
        0,
        13.2,
        0.95,
        15.2,
        0.95,
        16.0,
        0,
      ],
    },
  })

  // 4. 古地名点位层
  map.addSource('places', { type: 'geojson', data: state.placesGeojson })
  const colorExpr = buildColorMatchExpression()

  map.addLayer({
    id: 'places-dots',
    type: 'circle',
    source: 'places',
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10.5,
        ['case', ['==', ['get', 'confidence'], 'anchored'], 4.2, 3.0],
        12.5,
        ['case', ['==', ['get', 'confidence'], 'anchored'], 5.8, 4.4],
        15,
        ['case', ['==', ['get', 'confidence'], 'anchored'], 7.4, 5.8],
      ],
      'circle-color': colorExpr,
      'circle-stroke-width': [
        'case',
        ['==', ['get', 'confidence'], 'anchored'],
        2.0,
        1.4,
      ],
      'circle-stroke-color': [
        'case',
        ['==', ['get', 'confidence'], 'anchored'],
        '#1c1917',
        '#ffffff',
      ],
    },
  })

  map.addLayer({
    id: 'places-icons',
    type: 'symbol',
    source: 'places',
    layout: {
      visibility: 'visible',
      'symbol-sort-key': ['get', 'sortKey'],
      'icon-image': ['get', 'iconName'],
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10.5,
        ['case', ['==', ['get', 'isOverride'], true], 0.26, 0.20],
        12.3,
        ['case', ['==', ['get', 'isOverride'], true], 0.32, 0.25],
        14.0,
        ['case', ['==', ['get', 'isOverride'], true], 0.40, 0.32],
        16.0,
        ['case', ['==', ['get', 'isOverride'], true], 0.50, 0.42],
      ],
      'icon-anchor': 'bottom',
      'icon-allow-overlap': false,
      'icon-ignore-placement': false,
      'icon-optional': false,
      'icon-padding': 1.5,

      'text-field': ['get', 'label'],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        11.0,
        ['case', ['<=', ['get', 'sortKey'], 3], 11, 9.5],
        12.8,
        ['case', ['<=', ['get', 'sortKey'], 3], 12, 10.5],
        15.0,
        ['case', ['<=', ['get', 'sortKey'], 3], 13.5, 12],
      ],
      'text-variable-anchor': ['top', 'bottom', 'right', 'left'],
      'text-radial-offset': 0.25,
      'text-justify': 'auto',
      'text-padding': 1.5,
      'text-optional': true,
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': [
        'case',
        ['==', ['get', 'confidence'], 'anchored'],
        '#1d1d1f',
        '#2c2c2e',
      ],
      'text-halo-color': 'rgba(255, 255, 255, 0.96)',
      'text-halo-width': 1.8,
      'text-opacity': [
        'step',
        ['zoom'],
        ['case', ['<=', ['get', 'sortKey'], 3], 1, 0],
        12.2,
        1,
      ],
    },
  })

  map.addLayer({
    id: 'places-labels',
    type: 'symbol',
    source: 'places',
    layout: {
      visibility: 'none',
      'symbol-sort-key': ['get', 'sortKey'],
      'text-field': ['get', 'label'],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        11,
        ['case', ['==', ['get', 'confidence'], 'anchored'], 12, 10.5],
        12.8,
        ['case', ['==', ['get', 'confidence'], 'anchored'], 12.5, 11.2],
      ],
      'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
      'text-radial-offset': 0.75,
      'text-justify': 'auto',
      'text-padding': 3,
      'text-optional': true,
    },
    paint: {
      'text-color': [
        'case',
        ['==', ['get', 'confidence'], 'anchored'],
        '#1d1d1f',
        '#2c2c2e',
      ],
      'text-halo-color': 'rgba(255, 255, 255, 0.96)',
      'text-halo-width': 1.8,
      'text-opacity': [
        'step',
        ['zoom'],
        ['case', ['<=', ['get', 'sortKey'], 2], 1, 0],
        12.2,
        1,
      ],
    },
  })

  // 5. 选中高亮层
  map.addSource('selected-overlay', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })

  // 选中高亮微光（柔和同心发光，保留原图标与原文字）
  map.addLayer({
    id: 'selected-icon-ring',
    type: 'symbol',
    source: 'selected-overlay',
    filter: ['==', ['get', 'role'], 'selected-pt'],
    layout: {
      'icon-image': 'selection_ring',
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10.5,
        ['case', ['==', ['get', 'isOverride'], true], 0.26, 0.20],
        12.3,
        ['case', ['==', ['get', 'isOverride'], true], 0.32, 0.25],
        14.0,
        ['case', ['==', ['get', 'isOverride'], true], 0.40, 0.32],
        16.0,
        ['case', ['==', ['get', 'isOverride'], true], 0.50, 0.42],
      ],
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  })
}

// ==================== 筛选与图例同步 ====================
function applyPlaceFilters() {
  if (!map.getLayer('places-dots')) return

  const cats = [...state.visibleCats]
  const conds = ['all']

  if (cats.length === 0) {
    conds.push(['==', ['get', 'category'], '__none__'])
  } else {
    conds.push(['in', ['get', 'category'], ['literal', cats]])
  }

  if (state.specialFilter === 'anchored') {
    conds.push(['==', ['get', 'confidence'], 'anchored'])
  }

  for (const id of ['places-dots', 'places-labels', 'places-icons']) {
    map.setFilter(id, conds)
  }

  const visibleCount = (state.placesGeojson?.features || []).filter((f) => {
    const p = f.properties
    if (!state.visibleCats.has(p.category)) return false
    if (state.specialFilter === 'anchored' && p.confidence !== 'anchored') return false
    return true
  }).length

  const isFiltered =
    state.visibleCats.size < (state.legend?.categories?.length || 17) ||
    state.specialFilter !== null

  el.legendBadge.classList.toggle('hidden', !isFiltered)
  if (isFiltered) {
    el.legendBadge.textContent = `${visibleCount}`
  }

  syncZoomSymbolMode()
}

function syncZoomSymbolMode() {
  if (!map.getLayer('places-icons')) return
  const showPlaces = state.showPlaces

  // 全尺度特色建筑徽章模式（自适应智能避让，随缩放平滑适配）
  map.setLayoutProperty('places-dots', 'visibility', 'none')
  map.setLayoutProperty('places-labels', 'visibility', 'none')
  map.setLayoutProperty('places-icons', 'visibility', showPlaces ? 'visible' : 'none')
  if (el.legendZoomHint) {
    el.legendZoomHint.textContent = '北宋汴京古迹类别 · 考据可信度图式'
  }

  renderLegendGrid()
}

// ==================== 弹出层控制（点击打开/再次点击关闭） ====================
function openPopover(name) {
  if (state.activePopover === name) {
    closeAllPopovers()
    return
  }
  state.activePopover = name
  Object.entries(popoversMap).forEach(([k, node]) => {
    node.classList.toggle('hidden', k !== name)
  })
  el.backdrop.classList.remove('hidden')

  el.btnLegend.classList.toggle('active', name === 'legend')
  el.btnLayers.classList.toggle('active', name === 'layers')
  el.btnSearch.classList.toggle('active', name === 'search')

  if (name === 'search') {
    renderSearchResults()
    setTimeout(() => {
      el.searchInput.focus()
      updateSearchChipsScroll()
    }, 60)
  } else if (name === 'legend') {
    renderLegendGrid()
  } else if (name === 'menu') {
    renderMenuPopover()
  }
}

function closeAllPopovers() {
  state.activePopover = null
  Object.values(popoversMap).forEach((node) => {
    node.classList.add('hidden')
  })
  el.backdrop.classList.add('hidden')
  el.btnLegend.classList.remove('active')
  el.btnLayers.classList.remove('active')
  el.btnSearch.classList.remove('active')
}

// ==================== 选中地点与再次点击弹出详情 ====================
function updateSelectedOverlay() {
  const src = map.getSource('selected-overlay')
  if (!src) return

  const feats = []
  if (state.selectedFeature?.kind === 'place') {
    const p = state.selectedFeature.props
    const coords = state.selectedFeature.coords
    const labelText = formatMapLabel(p.name)
    feats.push({
      type: 'Feature',
      properties: {
        role: 'selected-pt',
        name: p.name,
        isOverride: Boolean(p.isOverride || state.legend?.placeIconOverrides?.[p.name]),
      },
      geometry: { type: 'Point', coordinates: coords },
    })
  }
  src.setData({ type: 'FeatureCollection', features: feats })
}

/**
 * 选中地点：
 * - 第一次选中：在正下方显示选中的地点名称胶囊（如 `开封府（北宋府衙）· 官署 ^ ✕`），不立即弹窗遮挡地图
 * - 如果已经选中同一个地点再次点击（或点击下方地点胶囊）：弹出详情面板！
 */
function selectFeature(item, options = {}) {
  if (!item) {
    state.selectedFeature = null
    state.compareDualPins = false
    el.selectionPill.classList.add('hidden')
    if (state.activePopover === 'detail') closeAllPopovers()
    updateSelectedOverlay()
    return
  }

  const isSameFeature =
    state.selectedFeature &&
    state.selectedFeature.props.name === item.props.name &&
    state.selectedFeature.kind === item.kind

  state.selectedFeature = item
  if (!isSameFeature) {
    state.compareDualPins = false
  }

  const p = item.props
  const catLabel = item.kind === 'place' ? p.category : p.layer || '城池要素'
  let displayTitle = `${p.name} · ${catLabel}`
  if (item.kind === 'structure' && (p.kind === 'polygon' || !p.category)) {
    if (p.name.includes('宫城')) displayTitle = '宫城 (大内皇城) · 周回五里'
    else if (p.name.includes('里城')) displayTitle = '内城 (旧城/阙城) · 周回二十里'
    else if (p.name.includes('外城')) displayTitle = '外城 (罗城/新城) · 周回五十里'
  }
  el.selectionTitle.textContent = displayTitle
  el.selectionPill.classList.remove('hidden')

  updateSelectedOverlay()
  renderDetailPopover(item)

  if (options.flyTo && item.coords) {
    map.flyTo({
      center: item.coords,
      zoom: options.zoom ?? Math.max(map.getZoom(), 13.8),
      duration: 600,
    })
  }

  // 如果显式要求打开详情，或者用户再次点击了同一个已选中的地点，弹出详情！
  if (options.openDetail || (isSameFeature && !options.silent)) {
    openPopover('detail')
  }
}

function formatPositionSource(str, confLabel) {
  if (!str) return confLabel || '古图控制点配准推算'
  if (str.startsWith('calibrated:')) {
    return `实测锚点基准 · ${str.replace('calibrated:', '')}`
  }
  if (str.includes('map1')) {
    return str.replace('map1', '张驭寰复原图')
  }
  if (str.includes('map2')) {
    return str.replace('map2', '东京梦华录手绘图')
  }
  return str
}

function renderDetailPopover(item) {
  const p = item.props
  const coords = item.coords || DEFAULT_CENTER

  const confLabel =
    p.confidence === 'anchored'
      ? '考古实测锚点'
      : p.confidence === 'user_verified'
        ? '人工校对确认'
        : p.confidence === 'text_derived'
          ? '据文献推定'
          : '古图控制点配准推算'

  const catLabel = item.kind === 'place' ? p.category : p.layer || '城池结构'
  const catMeta = getCategoryMeta(catLabel)
  const iconName = getPlaceIconName(p) || 'icon_courtyard'

  if (el.detailIconWrap) {
    el.detailIconWrap.style.background = `${catMeta.color}15`
    el.detailIconWrap.style.border = `1.5px solid ${catMeta.color}35`
    el.detailIconWrap.innerHTML = `<img src="/icons/${iconName}.png" alt="${catLabel}" onerror="this.style.display='none'" />`
  }

  const confTag =
    p.confidence === 'anchored'
      ? '<span class="detail-tag detail-tag-anchored">★ 考古实测锚点</span>'
      : p.confidence === 'user_verified'
        ? '<span class="detail-tag detail-tag-verified">✓ 人工校定</span>'
        : p.confidence === 'text_derived'
          ? '<span class="detail-tag detail-tag-derived">📖 文献考证</span>'
          : '<span class="detail-tag detail-tag-estimated">📐 古图配准推算</span>'

  const isPostSongRef = Boolean(p.is_post_song_ref || p.name?.includes('（今'))
  const postSongTag = isPostSongRef
    ? '<span class="detail-tag" style="background:#fef3c7;color:#92400e;border-color:#fcd34d">🏛️ 宋名为主 · 今存实物参照</span>'
    : ''

  el.detailBadges.innerHTML = `
    <span class="detail-tag" style="background:${catMeta.color}15;color:${catMeta.color};border-color:${catMeta.color}35">${catMeta.emoji || '📍'} ${catLabel}</span>
    ${confTag}
    ${postSongTag}
  `

  el.detailName.textContent = p.name

  const sources = Array.isArray(p.sources)
    ? p.sources
    : typeof p.sources === 'string'
      ? JSON.parse(p.sources || '[]')
      : []

  const ocrRaw = Array.isArray(p.ocr_raw)
    ? p.ocr_raw
    : typeof p.ocr_raw === 'string'
      ? JSON.parse(p.ocr_raw || '[]')
      : []

  // 1. 顶部操作行
  const actionBarHtml = `
    <div class="detail-action-bar">
      <button type="button" id="btn-detail-zoom" class="detail-action-btn">
        <span>🎯</span> 居中放大
      </button>
      <button type="button" id="btn-detail-copy" class="detail-action-btn">
        <span>📋</span> 复制坐标
      </button>
    </div>
  `

  // 2. 考据与形制说明
  const descText =
    p.desc ||
    `北宋东京城「${catLabel}」类古迹。${p.position_source ? `定位基准：${formatPositionSource(p.position_source, confLabel)}。` : ''}`

  const descSectionHtml = `
    <div class="detail-section">
      <div class="detail-section-title">
        <span>考据与形制说明</span>
      </div>
      <div class="detail-desc-box" style="border-left-color:${catMeta.color}">
        <p class="detail-desc-text">${descText}</p>
      </div>
    </div>
  `

  // 3. 空间地理与校勘档案
  const formattedSource = formatPositionSource(p.position_source, confLabel)
  const archiveRows = [
    `
    <div class="archive-row">
      <span class="archive-label">CGCS2000 / WGS84 坐标</span>
      <span class="archive-val"><code class="coord-code">${coords[1].toFixed(5)}°N, ${coords[0].toFixed(5)}°E</code></span>
    </div>
    `,
    `
    <div class="archive-row">
      <span class="archive-label">定位依据</span>
      <span class="archive-val">${formattedSource}</span>
    </div>
    `,
  ]

  if (ocrRaw.length > 0) {
    archiveRows.push(`
      <div class="archive-row">
        <span class="archive-label">古图原字 / 校勘记</span>
        <span class="archive-val">
          <div class="ocr-tags">
            ${ocrRaw.map((t) => `<span class="ocr-tag">${t}</span>`).join('')}
          </div>
        </span>
      </div>
    `)
  }

  const archiveSectionHtml = `
    <div class="detail-section">
      <div class="detail-section-title">
        <span>空间地理与校勘档案</span>
      </div>
      <div class="detail-archive-card">
        ${archiveRows.join('')}
      </div>
    </div>
  `

  // 4. 周边毗邻古迹
  let nearbyHtml = ''
  if (state.placesGeojson) {
    const nearby = state.placesGeojson.features
      .filter((f) => f.properties.name !== p.name)
      .map((f) => ({
        feature: f,
        dist: distanceMeters(coords, f.geometry.coordinates),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 6)

    nearbyHtml = `
      <div class="detail-section">
        <div class="detail-section-title">
          <span>周边毗邻古迹</span>
          <span class="title-sub-tag">点击直接漫游</span>
        </div>
        <div class="nearby-grid">
          ${nearby
            .map((n) => {
              const nMeta = getCategoryMeta(n.feature.properties.category)
              return `
                <button type="button" class="nearby-card-btn" data-jump-place="${n.feature.properties.name}" title="${n.feature.properties.name}">
                  <div class="nearby-card-left">
                    <span class="nearby-dot" style="background:${nMeta.color}"></span>
                    <span class="nearby-name">${n.feature.properties.name}</span>
                  </div>
                  <span class="nearby-dist-pill">${n.dist}m</span>
                </button>
              `
            })
            .join('')}
        </div>
      </div>
    `
  }

  // 5. 文献与考古资料来源
  let sourcesHtml = ''
  if (sources.length > 0) {
    sourcesHtml = `
      <div class="detail-section">
        <div class="detail-section-title">
          <span>文献与考古资料来源</span>
        </div>
        <div class="detail-sources-card">
          <ul class="sources-list">
            ${sources
              .map((s) =>
                s.startsWith('http')
                  ? `<li><span class="src-icon">🔗</span><a href="${s}" target="_blank" rel="noopener noreferrer">${s}</a></li>`
                  : `<li><span class="src-icon">📖</span>${s}</li>`
              )
              .join('')}
          </ul>
        </div>
      </div>
    `
  }

  el.detailBody.innerHTML = `
    ${actionBarHtml}
    ${descSectionHtml}
    ${archiveSectionHtml}
    ${nearbyHtml}
    ${sourcesHtml}
  `

  document.getElementById('btn-detail-zoom')?.addEventListener('click', () => {
    closeAllPopovers()
    map.flyTo({ center: coords, zoom: 15.2, duration: 600 })
  })

  document.getElementById('btn-detail-copy')?.addEventListener('click', (e) => {
    const text = `${p.name}（${catLabel}）：${coords[1].toFixed(5)}°N, ${coords[0].toFixed(5)}°E ${p.desc || ''}`
    navigator.clipboard?.writeText(text)
    const btn = e.currentTarget
    btn.textContent = '✅ 已复制'
    setTimeout(() => {
      btn.textContent = '📋 复制坐标'
    }, 1500)
  })

  el.detailBody.querySelectorAll('[data-jump-place]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetName = btn.getAttribute('data-jump-place')
      const found = state.placesGeojson.features.find(
        (f) => f.properties.name === targetName
      )
      if (found) {
        selectFeature(
          {
            kind: 'place',
            props: found.properties,
            coords: found.geometry.coordinates,
          },
          { flyTo: true, zoom: 14.8, openDetail: true }
        )
      }
    })
  })
}

// ==================== 凡例面板渲染 ====================
function renderLegendGrid() {
  if (!state.legend) return
  const near = isEffectiveNear()
  el.legendGrid.innerHTML = ''

  for (const c of state.legend.categories) {
    const active = state.visibleCats.has(c.category)
    const card = document.createElement('div')
    card.className = `legend-card ${active ? '' : 'off'}`

    const swatchHtml =
      near && c.nearIcon
        ? `<img src="/icons/${c.nearIcon}.png" alt="${c.category}" />`
        : `<span class="dot" style="background:${c.color}"></span>`

    card.innerHTML = `
      <div class="leg-swatch" style="background:${c.color}18">
        ${swatchHtml}
      </div>
      <div class="leg-info">
        <span class="leg-name">${c.category}</span>
        <span class="leg-count">${c.count}</span>
      </div>
    `

    card.addEventListener('click', () => {
      if (state.visibleCats.has(c.category)) {
        state.visibleCats.delete(c.category)
      } else {
        state.visibleCats.add(c.category)
      }
      updateQuickFilterChipsUI()
      applyPlaceFilters()
    })

    card.addEventListener('dblclick', () => {
      state.visibleCats = new Set([c.category])
      state.specialFilter = null
      updateQuickFilterChipsUI()
      applyPlaceFilters()
    })

    el.legendGrid.appendChild(card)
  }
}

function updateQuickFilterChipsUI() {
  const allCount = state.legend?.categories?.length || 17
  const isAll = state.visibleCats.size === allCount && state.specialFilter === null
  document.getElementById('leg-select-all')?.classList.toggle('active', isAll)
  document
    .getElementById('leg-only-anchored')
    ?.classList.toggle('active', state.specialFilter === 'anchored')
}

// ==================== 搜索弹出面板 ====================
const SEARCH_CHIPS = [
  { id: 'all', label: '全部 (508)' },
  { id: 'anchored', label: '考古锚点 (15)' },
  { id: '城门水门', label: '城门水门', cats: ['城门', '水门'] },
  { id: '宫殿官署', label: '宫殿官署', cats: ['宫殿', '官署'] },
  { id: '寺观祠庙', label: '寺观祠庙', cats: ['寺院', '道观', '祠庙'] },
  { id: '桥梁河渠', label: '桥梁河渠', cats: ['桥梁', '河渠'] },
  { id: '市场酒楼', label: '酒楼瓦子', cats: ['市场酒楼'] },
]

function updateSearchChipsScroll() {
  if (!el.searchChipScrollLeft || !el.searchChipScrollRight || !el.searchFilterChips) return
  const isExpanded = el.searchChipsContainer?.classList.contains('is-expanded')
  if (isExpanded) {
    el.searchChipScrollLeft.classList.add('hidden')
    el.searchChipScrollRight.classList.add('hidden')
    el.searchChipsContainer?.classList.remove('at-start', 'at-end')
    return
  }
  const maxScroll = el.searchFilterChips.scrollWidth - el.searchFilterChips.clientWidth
  if (maxScroll <= 4) {
    el.searchChipScrollLeft.classList.add('hidden')
    el.searchChipScrollRight.classList.add('hidden')
    el.searchChipsContainer?.classList.add('at-start', 'at-end')
    return
  }
  const isStart = el.searchFilterChips.scrollLeft <= 4
  const isEnd = el.searchFilterChips.scrollLeft >= maxScroll - 4
  el.searchChipScrollLeft.classList.toggle('hidden', isStart)
  el.searchChipScrollRight.classList.toggle('hidden', isEnd)
  el.searchChipsContainer?.classList.toggle('at-start', isStart)
  el.searchChipsContainer?.classList.toggle('at-end', isEnd)
}

function initSearchPopover() {
  el.searchFilterChips.innerHTML = SEARCH_CHIPS.map(
    (ch) =>
      `<button type="button" class="chip-btn ${ch.id === state.searchChip ? 'active' : ''}" data-search-chip="${ch.id}">${ch.label}</button>`
  ).join('')

  el.searchFilterChips.querySelectorAll('[data-search-chip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.searchChip = btn.getAttribute('data-search-chip')
      el.searchFilterChips
        .querySelectorAll('[data-search-chip]')
        .forEach((b) => b.classList.toggle('active', b === btn))
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      renderSearchResults()
    })
  })

  // 1. 左右滚动箭头按钮点击响应
  el.searchChipScrollLeft?.addEventListener('click', (e) => {
    e.stopPropagation()
    el.searchFilterChips.scrollBy({ left: -160, behavior: 'smooth' })
  })

  el.searchChipScrollRight?.addEventListener('click', (e) => {
    e.stopPropagation()
    el.searchFilterChips.scrollBy({ left: 160, behavior: 'smooth' })
  })

  el.searchFilterChips.addEventListener('scroll', updateSearchChipsScroll, { passive: true })

  // 2. 展开 / 收起平铺全部标签切换
  el.searchChipToggleExpand?.addEventListener('click', (e) => {
    e.stopPropagation()
    const isExpanded = el.searchChipsContainer.classList.toggle('is-expanded')
    el.searchChipToggleExpand.querySelector('.icon-expand')?.classList.toggle('hidden', isExpanded)
    el.searchChipToggleExpand.querySelector('.icon-collapse')?.classList.toggle('hidden', !isExpanded)
    el.searchChipToggleExpand.title = isExpanded ? '收起为横向单行' : '平铺展开全部标签'
    updateSearchChipsScroll()
  })

  // 3. 鼠标与触摸横向自由拖拽平移（Drag-to-Scroll）
  let isDown = false
  let startX = 0
  let scrollLeft = 0
  let hasDragged = false

  el.searchFilterChips.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return
    isDown = true
    hasDragged = false
    startX = e.pageX
    scrollLeft = el.searchFilterChips.scrollLeft
    el.searchFilterChips.classList.add('is-dragging')
  })

  window.addEventListener('pointermove', (e) => {
    if (!isDown) return
    const dx = e.pageX - startX
    if (Math.abs(dx) > 3) {
      hasDragged = true
      el.searchFilterChips.scrollLeft = scrollLeft - dx
      updateSearchChipsScroll()
    }
  })

  const endDrag = () => {
    if (!isDown) return
    isDown = false
    el.searchFilterChips.classList.remove('is-dragging')
    if (hasDragged) {
      const suppressClick = (ev) => {
        ev.stopPropagation()
        ev.preventDefault()
      }
      el.searchFilterChips.addEventListener('click', suppressClick, { capture: true, once: true })
      setTimeout(() => el.searchFilterChips.removeEventListener('click', suppressClick, { capture: true }), 80)
    }
    hasDragged = false
  }

  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)

  // 4. 鼠标滚轮直接横向滑动标签
  el.searchFilterChips.addEventListener(
    'wheel',
    (e) => {
      if (el.searchChipsContainer?.classList.contains('is-expanded')) return
      if (e.deltaY !== 0 && el.searchFilterChips.scrollWidth > el.searchFilterChips.clientWidth) {
        e.preventDefault()
        el.searchFilterChips.scrollLeft += e.deltaY * 0.9
        updateSearchChipsScroll()
      }
    },
    { passive: false }
  )

  window.addEventListener('resize', updateSearchChipsScroll)

  el.searchInput.addEventListener('input', () => {
    state.searchQuery = el.searchInput.value.trim()
    el.searchClearBtn.classList.toggle('hidden', !state.searchQuery)
    el.searchTriggerText.textContent = state.searchQuery || '搜索'
    renderSearchResults()
  })

  el.searchClearBtn.addEventListener('click', () => {
    el.searchInput.value = ''
    state.searchQuery = ''
    el.searchClearBtn.classList.add('hidden')
    el.searchTriggerText.textContent = '搜索'
    renderSearchResults()
    el.searchInput.focus()
  })
}

function renderSearchResults() {
  if (!state.placesGeojson) return
  const q = state.searchQuery.toLowerCase()
  const chip = SEARCH_CHIPS.find((c) => c.id === state.searchChip) || SEARCH_CHIPS[0]

  const matched = state.placesGeojson.features.filter((f) => {
    const p = f.properties
    if (chip.id === 'anchored' && p.confidence !== 'anchored') return false
    if (chip.cats && !chip.cats.includes(p.category)) return false
    if (!q) return true
    const hay = `${p.name} ${p.category} ${p.desc || ''} ${(p.ocr_raw || []).join(' ')}`.toLowerCase()
    return hay.includes(q)
  })

  matched.sort((a, b) => {
    const pa = a.properties
    const pb = b.properties
    if (pa.sortKey !== pb.sortKey) return pa.sortKey - pb.sortKey
    return pa.name.localeCompare(pb.name, 'zh-CN')
  })

  el.searchResultCount.textContent = `找到 ${matched.length} 处古迹`

  const slice = matched.slice(0, 100)
  el.searchResultsList.innerHTML = slice
    .map((f) => {
      const p = f.properties
      const cat = getCategoryMeta(p.category)
      const confBadge =
        p.confidence === 'anchored'
          ? '<span class="badge badge-anchored">实测锚点</span>'
          : ''
      return `
        <button type="button" class="search-item" data-place-name="${p.name}">
          <div class="leg-swatch" style="background:${cat.color}18">
            ${
              p.iconName
                ? `<img src="/icons/${p.iconName}.png" alt="${p.category}" />`
                : `<span class="dot" style="background:${cat.color}"></span>`
            }
          </div>
          <div class="search-item-main">
            <div class="search-item-title">
              <span>${p.name}</span>
              ${confBadge}
            </div>
            <div class="search-item-sub">
              ${p.category} · ${p.desc || p.position_source || '北宋东京城考据点位'}
            </div>
          </div>
        </button>
      `
    })
    .join('')

  el.searchResultsList.querySelectorAll('[data-place-name]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-place-name')
      const feat = state.placesGeojson.features.find((f) => f.properties.name === name)
      if (!feat) return
      state.visibleCats.add(feat.properties.category)
      applyPlaceFilters()
      closeAllPopovers()
      // 选中后在下方显示名称胶囊，再次点击该胶囊弹出详情
      selectFeature(
        {
          kind: 'place',
          props: feat.properties,
          coords: feat.geometry.coordinates,
        },
        { flyTo: true, zoom: 14.5, silent: true }
      )
    })
  })
}

// ==================== 正下方全城总览等菜单逻辑 ====================
function initMenuPopover() {
  renderMenuPopover()

  const coreAnchors = (state.structureGeojson?.features || []).filter(
    (f) =>
      f.geometry.type === 'Point' &&
      f.properties.layer !== '图1地名' &&
      f.properties.confidence === 'anchored'
  )

  const captionEl = el.menuAnchorsGrid.previousElementSibling
  if (captionEl && captionEl.classList.contains('section-caption')) {
    captionEl.textContent = `二、考古发掘与现存地面基准锚点（${coreAnchors.length} 处）`
  }

  el.menuAnchorsGrid.innerHTML = coreAnchors
    .map(
      (f) => `
      <button type="button" class="anchor-btn" data-anchor-name="${f.properties.name}">
        <strong>📍 ${f.properties.name}</strong>
        <span>${f.properties.layer} · 实测基准</span>
      </button>
    `
    )
    .join('')

  el.menuAnchorsGrid.querySelectorAll('[data-anchor-name]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-anchor-name')
      jumpToPlaceByName(name, { flyTo: true })
    })
  })
}

function renderMenuPopover() {
  const current = MENU_PRESETS[state.menuIndex]
  el.menuCurrentLabel.textContent = current.barText

  el.menuPresetsList.innerHTML = MENU_PRESETS.map(
    (item, idx) => `
      <button type="button" class="menu-preset-card ${idx === state.menuIndex ? 'active' : ''}" data-menu-idx="${idx}">
        <div>
          <div class="mp-title">${item.title}</div>
          <div class="mp-desc">${item.desc}</div>
        </div>
      </button>
    `
  ).join('')

  el.menuPresetsList.querySelectorAll('[data-menu-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-menu-idx'))
      applyMenuPreset(idx)
      closeAllPopovers()
    })
  })
}

function applyMenuPreset(index) {
  state.menuIndex = (index + MENU_PRESETS.length) % MENU_PRESETS.length
  const item = MENU_PRESETS[state.menuIndex]

  if (item.filterMode === 'all') {
    state.visibleCats = new Set(state.legend.categories.map((c) => c.category))
    state.specialFilter = null
  } else if (item.filterMode === 'categories' && item.categories) {
    state.visibleCats = new Set(item.categories)
    state.specialFilter = null
  } else if (item.filterMode === 'anchored') {
    state.visibleCats = new Set(state.legend.categories.map((c) => c.category))
    state.specialFilter = 'anchored'
  }

  updateQuickFilterChipsUI()
  applyPlaceFilters()
  renderMenuPopover()

  map.flyTo({
    center: item.center,
    zoom: item.zoom,
    duration: 700,
  })

  if (item.selectName) {
    jumpToPlaceByName(item.selectName, { flyTo: false })
  } else {
    selectFeature(null)
  }
}

function jumpToPlaceByName(name, opts = {}) {
  const short = name.split('（')[0]
  // 1. 完全精确匹配全名
  let foundPlace = state.placesGeojson?.features.find((f) => f.properties.name === name)

  // 2. 精确匹配主名（括号前）
  if (!foundPlace) {
    foundPlace = state.placesGeojson?.features.find((f) => f.properties.name.split('（')[0] === short)
  }

  // 3. 别名与专指关键词匹配
  if (!foundPlace) {
    foundPlace = state.placesGeojson?.features.find((f) => {
      const fn = f.properties.name
      if ((name.includes('龙亭') || name.includes('延春阁') || name.includes('后苑')) && (fn.includes('龙亭') || fn.includes('延春阁'))) return true
      if ((name.includes('吹台') || name.includes('禹王')) && (fn.includes('吹台') || fn.includes('禹王'))) return true
      if (name.includes('铁塔') && (fn.includes('铁塔') || fn.includes('开宝寺'))) return true
      if (name.includes('繁塔') && (fn.includes('繁塔') || fn.includes('天清寺'))) return true
      if (name.includes('延庆观') && (fn.includes('延庆观') || fn.includes('玉清'))) return true
      return false
    })
  }

  // 4. 前缀或子串包含匹配
  if (!foundPlace) {
    foundPlace = state.placesGeojson?.features.find((f) => {
      const fn = f.properties.name
      return fn.includes(short)
    })
  }

  closeAllPopovers()

  if (foundPlace) {
    state.visibleCats.add(foundPlace.properties.category)
    applyPlaceFilters()
    selectFeature(
      {
        kind: 'place',
        props: foundPlace.properties,
        coords: foundPlace.geometry.coordinates,
      },
      { flyTo: opts.flyTo, zoom: 15.2, openDetail: true }
    )
  }
}

// ==================== 全局轻提示与 GPS 定位 ====================
let toastTimeout = null
function showToast(msg) {
  let toastEl = document.getElementById('app-toast')
  if (!toastEl) {
    toastEl = document.createElement('div')
    toastEl.id = 'app-toast'
    toastEl.className = 'app-toast'
    document.body.appendChild(toastEl)
  }
  toastEl.textContent = msg
  toastEl.classList.add('visible')
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('visible')
  }, 2600)
}

let gpsMarker = null
function handleGPSLocate() {
  if (!window.isSecureContext) {
    showToast('浏览器安全限制：非 HTTPS 无法使用定位，请使用 localhost 或配置 HTTPS')
    return
  }

  if (!navigator.geolocation) {
    showToast('当前浏览器环境不支持 GPS 定位')
    return
  }

  const btn = el.btnGPSLocate
  btn?.classList.add('locating')

  const onLocationSuccess = (pos) => {
    btn?.classList.remove('locating')
    const userCoords = [pos.coords.longitude, pos.coords.latitude]

    if (!gpsMarker) {
      const markerEl = document.createElement('div')
      markerEl.className = 'gps-user-marker'
      markerEl.innerHTML = '<div class="gps-pulse"></div><div class="gps-dot"></div>'
      gpsMarker = new maplibregl.Marker({ element: markerEl, anchor: 'center' })
        .setLngLat(userCoords)
        .addTo(map)
    } else {
      gpsMarker.setLngLat(userCoords)
    }

    closeAllPopovers()
    map.flyTo({
      center: userCoords,
      zoom: Math.max(map.getZoom(), 14.5),
      pitch: 0,
      bearing: 0,
      duration: 900,
    })

    const distM = distanceMeters(userCoords, DEFAULT_CENTER)
    const distKm = (distM / 1000).toFixed(1)
    const accuracy = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null
    const accTip = accuracy ? `（精度 ±${accuracy}m）` : ''
    if (distM < 15000) {
      showToast(`已定位到当前位置${accTip}，位于北宋汴京境内`)
    } else {
      showToast(`已定位到实际位置${accTip}（距北宋汴京中心约 ${distKm} 公里）`)
    }
  }

  // 阶梯式定位策略：针对移动端 Edge / Chromium 室内无法调用海外网络定位、GPS冷启动超时的特性
  // 阶段 1: 尝试高精度定位 (12秒超时，允许使用 10 秒内有效缓存)
  navigator.geolocation.getCurrentPosition(
    onLocationSuccess,
    (err) => {
      // 若权限被拒绝 (code === 1)，无需降级，直接提示权限设置排查
      if (err.code === 1) {
        btn?.classList.remove('locating')
        showToast('定位权限被拒绝：请检查手机系统设置中 Edge 的【位置信息】和【精确位置】是否开启，以及 Edge 网址锁头中的授权')
        return
      }

      // 阶段 2: 若高精度超时 (code 3) 或不可用 (code 2)，自动平滑降级为基站/粗略定位 (容许 5 分钟内系统缓存)
      console.warn('[GPS] 高精度定位失败，自动降级为标准/基站定位模式:', err)
      navigator.geolocation.getCurrentPosition(
        onLocationSuccess,
        (fallbackErr) => {
          // 阶段 3: 若仍未获取，尝试利用 watchPosition 监听单次突发锁星
          let watchId = null
          const watchTimer = setTimeout(() => {
            if (watchId !== null) {
              navigator.geolocation.clearWatch(watchId)
              btn?.classList.remove('locating')
              let msg = '获取定位失败'
              if (fallbackErr.code === 2) {
                msg = '无法获取 GPS 信号（如在室内，由于 Edge 依赖的海外网络辅助定位受阻，建议移步开阔处或打开自带地图预热后再试）'
              } else if (fallbackErr.code === 3) {
                msg = '获取位置超时（GPS 搜星超时，建议开启系统“精确位置”或在室外重试）'
              }
              showToast(msg)
            }
          }, 8000)

          try {
            watchId = navigator.geolocation.watchPosition(
              (pos) => {
                clearTimeout(watchTimer)
                if (watchId !== null) {
                  navigator.geolocation.clearWatch(watchId)
                  watchId = null
                }
                onLocationSuccess(pos)
              },
              () => {
                // 由 watchTimer 统一做超时处理
              },
              { enableHighAccuracy: false, timeout: 7000, maximumAge: 600000 }
            )
          } catch {
            clearTimeout(watchTimer)
            btn?.classList.remove('locating')
            showToast('获取位置超时，请在开阔室外重试')
          }
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      )
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
  )
}

// ==================== 事件绑定 ====================
function bindUIEvents() {
  el.btnBrand.addEventListener('click', () => {
    closeAllPopovers()
    applyMenuPreset(0)
  })

  el.btnLegend.addEventListener('click', () => openPopover('legend'))
  el.btnLayers.addEventListener('click', () => openPopover('layers'))
  el.btnSearch.addEventListener('click', () => openPopover('search'))

  el.btnZoomIn.addEventListener('click', () => map.zoomIn({ duration: 250 }))
  el.btnZoomOut.addEventListener('click', () => map.zoomOut({ duration: 250 }))

  // 复位至汴京全城视野
  el.btnResetView?.addEventListener('click', () => {
    closeAllPopovers()
    map.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 0,
      bearing: 0,
      duration: 600,
    })
    showToast('已复位至汴京全城视野')
  })

  // GPS 实时定位当前设备位置
  el.btnGPSLocate?.addEventListener('click', () => {
    handleGPSLocate()
  })

  // 正下方选中地点胶囊：点击弹出详情，点 ✕ 取消选中
  el.selectionExpandBtn.addEventListener('click', () => {
    if (state.selectedFeature) {
      openPopover('detail')
    }
  })
  el.selectionCloseBtn.addEventListener('click', () => {
    selectFeature(null)
  })

  // 正下方全城总览等专题菜单胶囊
  el.menuPrevBtn.addEventListener('click', () => applyMenuPreset(state.menuIndex - 1))
  el.menuNextBtn.addEventListener('click', () => applyMenuPreset(state.menuIndex + 1))
  el.menuCenterBtn.addEventListener('click', () => openPopover('menu'))
  el.btnSourceTag.addEventListener('click', () => openPopover('menu'))

  el.backdrop.addEventListener('click', closeAllPopovers)
  document.querySelectorAll('[data-close-popover]').forEach((btn) => {
    btn.addEventListener('click', closeAllPopovers)
  })

  // 键盘 Esc 关闭弹出层
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllPopovers()
  })

  // 凡例快速筛选
  document.getElementById('leg-select-all')?.addEventListener('click', () => {
    state.visibleCats = new Set(state.legend.categories.map((c) => c.category))
    state.specialFilter = null
    updateQuickFilterChipsUI()
    applyPlaceFilters()
  })

  document.getElementById('leg-only-anchored')?.addEventListener('click', () => {
    state.visibleCats = new Set(state.legend.categories.map((c) => c.category))
    state.specialFilter = state.specialFilter === 'anchored' ? null : 'anchored'
    updateQuickFilterChipsUI()
    applyPlaceFilters()
  })

  document.getElementById('leg-select-none')?.addEventListener('click', () => {
    state.visibleCats.clear()
    state.specialFilter = null
    updateQuickFilterChipsUI()
    applyPlaceFilters()
  })

  // 图层面板控制
  document.querySelectorAll('.basemap-card').forEach((card) => {
    card.addEventListener('click', () => {
      const bm = card.getAttribute('data-basemap')
      state.basemap = bm
      document
        .querySelectorAll('.basemap-card')
        .forEach((c) => c.classList.toggle('active', c === card))

      appEl.classList.toggle('mode-parchment', bm === 'parchment')

      const isVec = bm === 'parchment' || bm === 'vec'
      const isImg = bm === 'img'
      const isTer = bm === 'ter'

      map.setLayoutProperty('tdt-vec-layer', 'visibility', isVec ? 'visible' : 'none')
      map.setLayoutProperty('tdt-img-layer', 'visibility', isImg ? 'visible' : 'none')
      map.setLayoutProperty('tdt-ter-layer', 'visibility', isTer ? 'visible' : 'none')

      updateTiandituLabelsVisibility()
    })
  })

  document.getElementById('tog-tianditu-labels')?.addEventListener('change', (e) => {
    state.showTiandituLabels = e.target.checked
    updateTiandituLabelsVisibility()
  })

  document.getElementById('rng-label-opacity')?.addEventListener('input', (e) => {
    const val = Number(e.target.value)
    state.labelOpacity = val / 100
    document.getElementById('val-label-opacity').textContent = `${val}%`
    if (map.getLayer('tdt-cva-layer')) {
      map.setPaintProperty('tdt-cva-layer', 'raster-opacity', state.labelOpacity)
    }
    if (map.getLayer('tdt-cia-layer')) {
      map.setPaintProperty('tdt-cia-layer', 'raster-opacity', state.labelOpacity)
    }
  })

  document.getElementById('tog-walls')?.addEventListener('change', (e) => {
    state.showWalls = e.target.checked
    const v = state.showWalls ? 'visible' : 'none'
    for (const id of ['walls-fill', 'walls-casing', 'walls-line', 'area-labels-layer']) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v)
    }
  })

  document.getElementById('tog-rivers')?.addEventListener('change', (e) => {
    state.showRivers = e.target.checked
    const v = state.showRivers ? 'visible' : 'none'
    for (const id of ['rivers-casing', 'rivers-line', 'rivers-label']) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v)
    }
  })

  document.getElementById('tog-places')?.addEventListener('change', (e) => {
    state.showPlaces = e.target.checked
    syncZoomSymbolMode()
  })

  // 天地图密钥配置 UI
  initTiandituKeyUI()
}

function initTiandituKeyUI() {
  const statusEl = document.getElementById('tianditu-key-status')
  const maskedEl = document.getElementById('tianditu-key-masked')
  const btnEl = document.getElementById('btn-config-tianditu-key')

  if (statusEl && maskedEl) {
    if (TIANDITU_KEY) {
      statusEl.textContent = '已配置'
      statusEl.style.color = '#15803d'
      statusEl.style.fontWeight = '600'
      const masked =
        TIANDITU_KEY.length > 8
          ? `${TIANDITU_KEY.slice(0, 4)}••••${TIANDITU_KEY.slice(-4)}`
          : '••••••••'
      maskedEl.textContent = `Token: ${masked}`
    } else {
      statusEl.textContent = '未配置 (底图将不可见)'
      statusEl.style.color = '#b45309'
      statusEl.style.fontWeight = '600'
      maskedEl.textContent = '点击右侧按钮输入天地图 Key'
    }
  }

  if (btnEl) {
    btnEl.addEventListener('click', () => {
      const current = localStorage.getItem('TIANDITU_KEY') || ''
      const input = prompt(
        '请输入天地图 Web 端开发者密钥 (Browser Token)：\n（可在国家地理信息公共服务平台申请：https://console.tianditu.gov.cn/api/key）\n留空确认则清除自定义密钥并重置。',
        current
      )
      if (input !== null) {
        const trimmed = input.trim()
        if (trimmed) {
          localStorage.setItem('TIANDITU_KEY', trimmed)
        } else {
          localStorage.removeItem('TIANDITU_KEY')
        }
        window.location.reload()
      }
    })
  }
}

function updateTiandituLabelsVisibility() {
  const isImg = state.basemap === 'img'
  const showCva = state.showTiandituLabels && !isImg
  const showCia = state.showTiandituLabels && isImg

  if (map.getLayer('tdt-cva-layer')) {
    map.setLayoutProperty('tdt-cva-layer', 'visibility', showCva ? 'visible' : 'none')
  }
  if (map.getLayer('tdt-cia-layer')) {
    map.setLayoutProperty('tdt-cia-layer', 'visibility', showCia ? 'visible' : 'none')
  }
}

// ==================== 地图触摸与点击拾取 ====================
function setupMapInteractions() {
  const onZoomCheck = () => {
    const nearNow = map.getZoom() >= NEAR_ZOOM_THRESHOLD
    if (nearNow !== state.isNearZoom) {
      state.isNearZoom = nearNow
      syncZoomSymbolMode()
    }
  }
  map.on('zoom', onZoomCheck)
  map.on('zoomend', onZoomCheck)

  map.on('click', (e) => {
    const pad = 14
    const bbox = [
      [e.point.x - pad, e.point.y - pad],
      [e.point.x + pad, e.point.y + pad],
    ]

    // 1. 命中具体古迹地名点位（仅地名点位响应点击）
    const placeLayers = [
      'selected-icon-ring',
      'places-icons',
      'places-dots',
      'places-labels',
    ].filter((id) => map.getLayer(id))
    const placeHits = map.queryRenderedFeatures(bbox, { layers: placeLayers })
    if (placeHits.length > 0) {
      const f = placeHits[0]
      const targetName = f.properties.name
      const fullFeature =
        state.placesGeojson.features.find((x) => x.properties.name === targetName) || f
      selectFeature({
        kind: 'place',
        props: fullFeature.properties,
        coords: fullFeature.geometry.coordinates.slice(),
      })
      return
    }

    // 2. 命中河渠与御街中轴线
    const riverLayers = ['rivers-line', 'rivers-casing'].filter((id) => map.getLayer(id))
    const riverHits = map.queryRenderedFeatures(bbox, { layers: riverLayers })
    if (riverHits.length > 0) {
      const f = riverHits[0]
      selectFeature({
        kind: 'structure',
        props: f.properties,
        coords: [e.lngLat.lng, e.lngLat.lat],
      })
      return
    }

    // 3. 点击空白区域（失去焦点）：取消选中
    selectFeature(null)
  })

  // 仅对可点击的地名点位与河渠御街展示 pointer 光标（城墙与城池标注为纯背景展示）
  for (const layerId of ['places-icons', 'places-dots', 'rivers-line']) {
    map.on('mouseenter', layerId, () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = ''
    })
  }
}

// ==================== 载入屏解构 ====================
function dismissAppLoader() {
  const loader = document.getElementById('app-loader')
  const app = document.getElementById('app')
  if (app) app.classList.add('app-ready')
  if (loader && !loader.classList.contains('fade-out')) {
    loader.classList.add('fade-out')
    setTimeout(() => {
      try {
        loader.remove()
      } catch (_) {}
    }, 500)
  }
}

// 兜底超时：避免因极低网络波动导致载入屏长期停留
setTimeout(dismissAppLoader, 6000)

// ==================== 启动入口 ====================
bindUIEvents()

map.on('load', async () => {
  await Promise.all([loadAllData(), loadMapIcons()])
  setupMapLayers()
  setupMapInteractions()
  initSearchPopover()
  initMenuPopover()

  state.isNearZoom = map.getZoom() >= NEAR_ZOOM_THRESHOLD
  applyPlaceFilters()

  // 默认选中「开封府」（仅在下方显示胶囊与图上红点，不自动弹窗遮挡）
  const defaultPlace = state.placesGeojson.features.find(
    (f) => f.properties.name === '开封府' || f.properties.name.includes('开封府')
  )
  if (defaultPlace) {
    selectFeature(
      {
        kind: 'place',
        props: defaultPlace.properties,
        coords: defaultPlace.geometry.coordinates,
      },
      { silent: true }
    )
  }

  // 地图要素与界面初始化就绪，淡出载入屏
  dismissAppLoader()
})
