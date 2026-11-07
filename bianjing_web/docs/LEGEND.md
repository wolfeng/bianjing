# 图例（LEGEND）

两套显示：
- **尺度小**（俯瞰）：彩色圆点（`farStyle=dot`）
- **尺度大**（放大）：特色图标（`nearStyle=icon`，切换阈值约 `latitudeDelta ≤ 0.04`）

| 类别 | 远景颜色 | SF Symbol | 近景图标 | 数量 |
|---|---|---|---|---|
| 城门 | `#B22222` | `door.left.hand.closed` | icon_gate | 34 |
| 水门 | `#1E90FF` | `water.waves` | water.waves | 13 |
| 宫殿 | `#DAA520` | `crown.fill` | icon_palace | 50 |
| 官署 | `#8B4513` | `building.columns.fill` | building.columns.fill | 37 |
| 寺院 | `#FF8C00` | `building.fill` | icon_pagoda | 46 |
| 道观 | `#6A5ACD` | `sparkles` | sparkles | 15 |
| 祠庙 | `#C71585` | `flame.fill` | flame.fill | 22 |
| 桥梁 | `#4682B4` | `arrow.left.and.right` | icon_bridge | 38 |
| 街巷 | `#808080` | `road.lanes` | road.lanes | 80 |
| 市场酒楼 | `#DC143C` | `cup.and.saucer.fill` | icon_tavern | 39 |
| 园林池苑 | `#2E8B57` | `leaf.fill` | leaf.fill | 43 |
| 仓库 | `#A0522D` | `shippingbox.fill` | shippingbox.fill | 10 |
| 军营 | `#556B2F` | `shield.fill` | shield.fill | 14 |
| 宅第 | `#CD853F` | `house.fill` | icon_courtyard | 40 |
| 学校 | `#008B8B` | `book.fill` | book.fill | 3 |
| 河渠 | `#00BFFF` | `drop.fill` | drop.fill | 22 |
| 其他 | `#696969` | `mappin` | mappin | 2 |

## 专用图标（近景覆盖）
| 地名 | 图标 |
|---|---|
| 上方寺（佑国寺塔/铁塔） | `icon_tieta` |
| 天清寺（繁塔） | `icon_fanta` |
| 州桥（天汉桥） | `icon_bridge` |

- 置信度：anchored 加粗外圈；conflict=true 红圈。
- 自定义 PNG 在 `BianjingMap/Resources/Icons/`。