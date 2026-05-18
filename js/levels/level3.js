// Level 3: Pipe has a gap mid-way, and the exit pipe goes wrong direction.
// Player needs two lines: one to bridge the gap, one to redirect to container.
export const level3 = {
  id: 3,
  name: '精準導流',
  maxInk: 360,
  particleCount: 60,
  fillThreshold: 28,
  source: { x: 80, y: 70 },
  walls: [
    { x1: 30,  y1: 140, x2: 30,  y2: 260 },  // left drop pipe
    { x1: 30,  y1: 260, x2: 170, y2: 260 },  // left pipe section
    // Gap x=170 to x=280 — player bridges it
    { x1: 280, y1: 260, x2: 450, y2: 260 },  // right pipe section
    { x1: 450, y1: 260, x2: 450, y2: 460 },  // right drop pipe
    // Water exits right pipe going down toward bottom-right — player redirects left
  ],
  container: {
    cx: 200, cy: 600,
    walls: [
      { x1:  90, y1: 510, x2: 145, y2: 670 },
      { x1: 310, y1: 510, x2: 255, y2: 670 },
      { x1: 145, y1: 670, x2: 255, y2: 670 },
    ],
    fillZone: { x: 98, y: 555, width: 204, height: 110 },
    fillLineY: 560,
    faceX: 200, faceY: 600,
  },
};
