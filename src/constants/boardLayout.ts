import { SquarePos } from '../types';

export const TOTAL = 25;
export const GOAL = 24;

// 5x5 spiral layout
// Visible grid (sq index):
//   [00] [01] [02] [03] [04]
//   [15] [16] [17] [18] [05]
//   [14] [23] [24] [19] [06]
//   [13] [22] [21] [20] [07]
//   [12] [11] [10] [09] [08]
// START=sq0 (top-left), GOAL=sq24 (center)
export const SQUARE_POS: SquarePos[] = [
  // Ring 1 outer
  { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 1, c: 4 }, { r: 1, c: 5 }, // sq0-4
  { r: 2, c: 5 }, { r: 3, c: 5 }, { r: 4, c: 5 }, { r: 5, c: 5 },                   // sq5-8
  { r: 5, c: 4 }, { r: 5, c: 3 }, { r: 5, c: 2 }, { r: 5, c: 1 },                   // sq9-12
  { r: 4, c: 1 }, { r: 3, c: 1 }, { r: 2, c: 1 },                                   // sq13-15
  // Ring 2 inner
  { r: 2, c: 2 }, { r: 2, c: 3 }, { r: 2, c: 4 },                                   // sq16-18
  { r: 3, c: 4 }, { r: 4, c: 4 },                                                   // sq19-20
  { r: 4, c: 3 }, { r: 4, c: 2 },                                                   // sq21-22
  { r: 3, c: 2 },                                                                   // sq23
  // Center
  { r: 3, c: 3 },                                                                   // sq24 GOAL
];
