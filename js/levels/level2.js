// Level 2: 兩段滑道中間有缺口，玩家畫橋接線讓水連通兩段。
// 水路: 水源→滑道1(190,290)→[玩家橋]→滑道2(295,290)→(405,435)→漏斗
export const level2 = {
  id: 2,
  name: '繞過障礙',
  maxInk: 320,
  particleCount: 60,
  fillThreshold: 28,
  source: { x: 100, y: 80 },
  slides: [
    [{ x: 100, y: 96 }, { x: 190, y: 290 }],   // 第一段滑道
    [{ x: 295, y: 290 }, { x: 405, y: 435 }],  // 第二段滑道（缺口後）
  ],
  walls: [],
  container: {
    cx: 360,
    funnelTopY: 450, funnelTopWidth: 150,
    cupTop: 515, cupWidth: 80, cupHeight: 145,
    walls: [
      { x1: 285, y1: 450, x2: 320, y2: 515 },
      { x1: 435, y1: 450, x2: 400, y2: 515 },
      { x1: 320, y1: 515, x2: 320, y2: 660 },
      { x1: 400, y1: 515, x2: 400, y2: 660 },
      { x1: 320, y1: 660, x2: 400, y2: 660 },
    ],
    fillZone: { x: 322, y: 530, width: 76, height: 130 },
    fillLineY: 542,
    faceX: 360, faceY: 588,
  },
};
