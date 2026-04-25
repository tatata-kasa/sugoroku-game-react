import { useRef, useLayoutEffect, useEffect } from 'react';
import { SquareData, Player } from '../../types';
import { SQUARE_POS, TOTAL } from '../../constants/boardLayout';
import Square, { Token } from '../Square';
import styles from './Board.module.css';

interface Props {
  squares: SquareData[];
  positions: number[];
  players: Player[];
  curPlayer: number;
  flashingSquare: number | null;
  reachableSquares: Set<number>;
  targetSquare: number | null;
}

export default function Board({
  squares, positions, players, curPlayer,
  flashingSquare, reachableSquares, targetSquare,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const svgRef   = useRef<SVGSVGElement>(null);
  const curPos   = positions[curPlayer];

  const drawRoute = () => {
    const board = boardRef.current;
    const svg   = svgRef.current;
    if (!board || !svg) return;

    const boardRect = board.getBoundingClientRect();
    if (boardRect.width === 0) return;

    const bs    = getComputedStyle(board);
    const bLeft = parseFloat(bs.borderLeftWidth)  || 0;
    const bTop  = parseFloat(bs.borderTopWidth)   || 0;

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const NS = 'http://www.w3.org/2000/svg';
    const pts: ({ x: number; y: number } | null)[] = Array.from({ length: TOTAL }, (_, i) => {
      const el = document.getElementById(`sq${i}`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: r.left - boardRect.left - bLeft + r.width  / 2,
        y: r.top  - boardRect.top  - bTop  + r.height / 2,
      };
    });

    for (let i = 0; i < TOTAL - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (!a || !b) continue;

      const isPast = curPos > 0 && i < curPos;
      const isNext = i === curPos;

      if (isPast) {
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', a.x.toFixed(1)); line.setAttribute('y1', a.y.toFixed(1));
        line.setAttribute('x2', b.x.toFixed(1)); line.setAttribute('y2', b.y.toFixed(1));
        line.setAttribute('stroke', 'rgba(60,45,15,0.45)');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-linecap', 'round');
        svg.appendChild(line);
        continue;
      }

      // Glow line
      const glow = document.createElementNS(NS, 'line');
      glow.setAttribute('x1', a.x.toFixed(1)); glow.setAttribute('y1', a.y.toFixed(1));
      glow.setAttribute('x2', b.x.toFixed(1)); glow.setAttribute('y2', b.y.toFixed(1));
      glow.setAttribute('stroke', `rgba(200,169,81,${isNext ? '0.42' : '0.28'})`);
      glow.setAttribute('stroke-width', isNext ? '18' : '12');
      glow.setAttribute('stroke-linecap', 'round');
      svg.appendChild(glow);

      // Main line
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', a.x.toFixed(1)); line.setAttribute('y1', a.y.toFixed(1));
      line.setAttribute('x2', b.x.toFixed(1)); line.setAttribute('y2', b.y.toFixed(1));
      line.setAttribute('stroke', isNext ? 'rgba(255,235,80,1.0)' : 'rgba(230,200,100,0.9)');
      line.setAttribute('stroke-width', isNext ? '5' : '3.5');
      line.setAttribute('stroke-linecap', 'round');
      if (!isNext) line.style.animation = 'routePulse 1.1s ease-in-out infinite alternate';
      svg.appendChild(line);

      // Arrow at midpoint
      const mx  = (a.x + b.x) / 2;
      const my  = (a.y + b.y) / 2;
      const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', `translate(${mx.toFixed(1)},${my.toFixed(1)}) rotate(${ang.toFixed(1)})`);
      if (!isNext) g.style.animation = 'routePulse 1.1s ease-in-out infinite alternate';

      const outline = document.createElementNS(NS, 'polygon');
      outline.setAttribute('points', isNext ? '-12,-10 18,0 -12,10' : '-11,-8.5 16,0 -11,8.5');
      outline.setAttribute('fill', 'rgba(0,0,0,0.5)');
      g.appendChild(outline);

      const triGlow = document.createElementNS(NS, 'polygon');
      triGlow.setAttribute('points', isNext ? '-11,-9 16,0 -11,9' : '-10,-7.5 14,0 -10,7.5');
      triGlow.setAttribute('fill', `rgba(200,169,81,${isNext ? '0.55' : '0.35'})`);
      g.appendChild(triGlow);

      const tri = document.createElementNS(NS, 'polygon');
      tri.setAttribute('points', isNext ? '-9,-7.5 13,0 -9,7.5' : '-8,-6 12,0 -8,6');
      tri.setAttribute('fill', isNext ? 'rgba(255,245,80,1.0)' : 'rgba(245,215,100,0.95)');
      g.appendChild(tri);

      svg.appendChild(g);
    }
  };

  useLayoutEffect(() => { drawRoute(); });

  useEffect(() => {
    const observer = new ResizeObserver(() => drawRoute());
    if (boardRef.current) observer.observe(boardRef.current);
    return () => observer.disconnect();
  }, []);

  // Build per-square token lists
  const squareTokens: Token[][] = Array.from({ length: TOTAL }, () => []);
  players.forEach((p, i) => {
    squareTokens[positions[i]].push({
      playerIndex: i,
      name: p.name,
      color: p.color,
      isActive: i === curPlayer,
    });
  });

  return (
    <div ref={boardRef} className={styles.board}>
      <svg ref={svgRef} className={styles.routeSvg} width="100%" height="100%" />
      {SQUARE_POS.map((pos, idx) => (
        <Square
          key={idx}
          id={`sq${idx}`}
          index={idx}
          square={squares[idx]}
          tokens={squareTokens[idx]}
          isCurHighlight={positions[curPlayer] === idx}
          isFlashing={flashingSquare === idx}
          isReachable={reachableSquares.has(idx)}
          isTarget={targetSquare === idx}
          gridColumn={pos.c}
          gridRow={pos.r}
        />
      ))}
    </div>
  );
}
