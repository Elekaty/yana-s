export type Dir = "up" | "right" | "down" | "left";
export type Cell = { x: number; y: number };

export type LagoonLevel = {
  id: number;
  start: Cell;
  berry: Cell;
  walls: Cell[];
  solution: Dir[];
};

const wall = (x: number, y: number): Cell => ({ x, y });

export const LEVELS: LagoonLevel[] = [
  { id: 1, start: { x: 0, y: 3 }, berry: { x: 2, y: 3 }, walls: [], solution: ["right", "right"] },
  { id: 2, start: { x: 0, y: 3 }, berry: { x: 0, y: 0 }, walls: [], solution: ["up", "up", "up"] },
  { id: 3, start: { x: 0, y: 3 }, berry: { x: 3, y: 2 }, walls: [], solution: ["right", "right", "right", "up"] },
  {
    id: 4,
    start: { x: 0, y: 3 },
    berry: { x: 3, y: 2 },
    walls: [wall(1, 3), wall(2, 3), wall(3, 3), wall(1, 2), wall(2, 2)],
    solution: ["up", "up", "right", "right", "right", "down"],
  },
  {
    id: 5,
    start: { x: 0, y: 3 },
    berry: { x: 3, y: 2 },
    walls: [wall(1, 3), wall(2, 3), wall(3, 3), wall(1, 2), wall(2, 2), wall(1, 1), wall(2, 1)],
    solution: ["up", "up", "up", "right", "right", "right", "down", "down"],
  },
];

export function levelById(id: number) {
  return LEVELS.find((level) => level.id === id) ?? null;
}

export function step(cell: Cell, dir: Dir): Cell {
  if (dir === "up") return { x: cell.x, y: cell.y - 1 };
  if (dir === "down") return { x: cell.x, y: cell.y + 1 };
  if (dir === "left") return { x: cell.x - 1, y: cell.y };
  return { x: cell.x + 1, y: cell.y };
}

export function walk(level: LagoonLevel, arrows: Dir[]) {
  let pos = level.start;
  for (const dir of arrows.slice(0, 8)) {
    const next = step(pos, dir);
    const outside = next.x < 0 || next.y < 0 || next.x > 3 || next.y > 3;
    const blocked = level.walls.some((cell) => cell.x === next.x && cell.y === next.y);
    if (outside || blocked) return { end: pos, stuck: true };
    pos = next;
  }
  return { end: pos, stuck: false };
}

export function cleared(level: LagoonLevel, arrows: Dir[]) {
  const result = walk(level, arrows);
  return !result.stuck && result.end.x === level.berry.x && result.end.y === level.berry.y;
}
