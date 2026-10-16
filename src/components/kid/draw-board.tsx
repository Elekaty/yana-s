"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Copy } from "@/lib/i18n";

const colors = ["#FFD23F", "#FF2E93", "#7C3AED"] as const;

export function DrawBoard({ copy }: { copy: Copy }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [colorIndex, setColorIndex] = useState(0);
  const color = colors[colorIndex];

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function onDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const at = point(event);
    if (!canvas || !at) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.setPointerCapture(event.pointerId);
    drawing.current = true;
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(at.x, at.y);
  }

  function onMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const at = point(event);
    if (!canvas || !at) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(at.x, at.y);
    ctx.stroke();
  }

  return (
    <div className="grid gap-4">
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="h-64 w-full touch-none rounded-3xl bg-white"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => {
          drawing.current = false;
        }}
      />
      <button
        type="button"
        onClick={() => setColorIndex((colorIndex + 1) % colors.length)}
        className="flex h-14 items-center justify-center rounded-full text-2xl text-plum"
        style={{ background: color }}
      >
        {copy.draw}
      </button>
      <button
        type="button"
        onClick={() => canvasRef.current?.getContext("2d")?.clearRect(0, 0, 640, 480)}
        className="flex h-14 items-center justify-center rounded-full bg-hot text-2xl"
      >
        {copy.clear}
      </button>
      <Link href="/kid/games/cove" className="flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl">
        {copy.back}
      </Link>
    </div>
  );
}
