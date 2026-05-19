// Level 1: 水從左上水源落下，玩家畫一條斜滑道導入杯子（教學關）
// 水路: 水源(130,80) → 垂直管落至(130,270) → 水平架至(240,270) → 玩家畫斜滑道 → 杯口(290~390, y=420)
export const level1 = {
  id: 1,
  name: '初識水流',
  maxInk: 300,
  particleCount: 60,
  fillThreshold: 28,
  source: { x: 130, y: 80 },
  walls: [
    { x1: 130, y1: 100, x2: 130, y2: 270 },  // 左垂直管
    { x1: 130, y1: 270, x2: 240, y2: 270 },  // 水平架
  ],
  container: {
    cx: 340,
    cupWidth: 100,
    cupHeight: 210,
    cupTop: 430,
    walls: [
      { x1: 290, y1: 430, x2: 290, y2: 640 },
      { x1: 390, y1: 430, x2: 390, y2: 640 },
      { x1: 290, y1: 640, x2: 390, y2: 640 },
    ],
    fillZone: { x: 296, y: 508, width: 88, height: 132 },
    fillLineY: 518,
    faceX: 340, faceY: 568,
  },
};
