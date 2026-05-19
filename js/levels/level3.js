// Level 3: 滑道→缺口→右落管，需畫兩條線：橋接缺口 + 把水導回左邊漏斗。
// 線1: (175,280)→(285,280) 橫向橋
// 線2: (395,450)左斜導流進漏斗(130~290, y≈455)
export const level3 = {
  id: 3,
  name: '精準導流',
  maxInk: 380,
  particleCount: 60,
  fillThreshold: 24,
  source: { x: 80, y: 80 },
  slides: [
    [{ x: 80, y: 96 }, { x: 175, y: 280 }],
  ],
  walls: [
    { x1: 285, y1: 280, x2: 395, y2: 280 }, // 中段水平架
    { x1: 395, y1: 280, x2: 395, y2: 450 }, // 右落管
  ],
  container: {
    cx: 210,
    funnelTopY: 455, funnelTopWidth: 160,
    cupTop: 520, cupWidth: 80, cupHeight: 145,
    walls: [
      { x1: 130, y1: 455, x2: 170, y2: 520 },
      { x1: 290, y1: 455, x2: 250, y2: 520 },
      { x1: 170, y1: 520, x2: 170, y2: 665 },
      { x1: 250, y1: 520, x2: 250, y2: 665 },
      { x1: 170, y1: 665, x2: 250, y2: 665 },
    ],
    fillZone: { x: 172, y: 535, width: 76, height: 130 },
    fillLineY: 547,
    faceX: 210, faceY: 592,
  },
};
