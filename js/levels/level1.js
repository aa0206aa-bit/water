// Level 1: Water falls from top-left, hits a shelf.
// Player draws one diagonal line from shelf edge → container.
export const level1 = {
  id: 1,
  name: '初識水流',
  maxInk: 280,
  particleCount: 60,
  fillThreshold: 32,
  source: { x: 100, y: 70 },
  // Pre-built static walls (rendered as teal pipes)
  walls: [
    { x1: 30,  y1: 130, x2: 30,  y2: 280 },  // left vertical pipe
    { x1: 30,  y1: 280, x2: 240, y2: 280 },  // horizontal shelf
  ],
  // Triangular container (open top): two angled sides + flat bottom
  container: {
    cx: 320, cy: 580,
    walls: [
      { x1: 210, y1: 490, x2: 270, y2: 650 },  // left side
      { x1: 430, y1: 490, x2: 370, y2: 650 },  // right side
      { x1: 270, y1: 650, x2: 370, y2: 650 },  // bottom
    ],
    fillZone: { x: 218, y: 535, width: 184, height: 110 },
    fillLineY: 540,
    faceX: 320, faceY: 580,
  },
};
