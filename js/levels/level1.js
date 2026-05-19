// Level 1: 教學關。水從水龍頭落下 → 沿滑水道滑向右方 → 玩家畫一條線橋接到漏斗開口。
export const level1 = {
  id: 1,
  name: '初識水流',
  maxInk: 260,
  particleCount: 60,
  fillThreshold: 28,
  source: { x: 130, y: 80 },
  // 預建滑水道路徑（陣列of點，相鄰兩點形成一段）
  slides: [
    [{ x: 130, y: 96 }, { x: 235, y: 345 }],
  ],
  walls: [],
  container: {
    cx: 340,
    // 漏斗參數
    funnelTopY: 390, funnelTopWidth: 160,
    // 杯身參數
    cupTop: 455, cupWidth: 80, cupHeight: 170,
    // 物理牆（與幾何參數保持一致）
    walls: [
      { x1: 260, y1: 390, x2: 300, y2: 455 }, // 左漏斗
      { x1: 420, y1: 390, x2: 380, y2: 455 }, // 右漏斗
      { x1: 300, y1: 455, x2: 300, y2: 625 }, // 左杯身
      { x1: 380, y1: 455, x2: 380, y2: 625 }, // 右杯身
      { x1: 300, y1: 625, x2: 380, y2: 625 }, // 底部
    ],
    fillZone: { x: 302, y: 470, width: 76, height: 155 },
    fillLineY: 495,
    faceX: 340, faceY: 545,
  },
};
