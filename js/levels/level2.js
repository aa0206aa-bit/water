// Level 2: Water falls from top-center.
// A horizontal blocker diverts it. Player must bridge to the right container.
export const level2 = {
  id: 2,
  name: '繞過障礙',
  maxInk: 320,
  particleCount: 60,
  fillThreshold: 32,
  source: { x: 80, y: 70 },
  walls: [
    { x1: 30,  y1: 200, x2: 30,  y2: 330 },  // left vertical
    { x1: 30,  y1: 330, x2: 200, y2: 330 },  // left shelf
    // Gap here (x=200 to x=290) — player bridges it
    { x1: 290, y1: 250, x2: 290, y2: 400 },  // right vertical blocker
    { x1: 290, y1: 400, x2: 450, y2: 400 },  // right shelf
  ],
  container: {
    cx: 370, cy: 590,
    walls: [
      { x1: 260, y1: 500, x2: 315, y2: 660 },
      { x1: 480, y1: 500, x2: 425, y2: 660 },
      { x1: 315, y1: 660, x2: 425, y2: 660 },
    ],
    fillZone: { x: 268, y: 545, width: 204, height: 110 },
    fillLineY: 550,
    faceX: 370, faceY: 590,
  },
};
