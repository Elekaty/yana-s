"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Copy } from "@/lib/i18n";
import { StickerPlay } from "@/components/kid/sticker-play";

const colors = [
  { hex: "#FFD23F", fr: "jaune", en: "yellow" },
  { hex: "#FF2E93", fr: "rose", en: "pink" },
  { hex: "#7C3AED", fr: "violet", en: "purple" },
  { hex: "#2A0B4A", fr: "prune", en: "plum" },
  { hex: "#3DB7FF", fr: "bleu", en: "blue" },
  { hex: "#3DDC97", fr: "vert", en: "green" },
  { hex: "#FF8A3D", fr: "orange", en: "orange" },
  { hex: "#FFFFFF", fr: "blanc", en: "white" },
  { hex: "#8D5A3C", fr: "brun", en: "brown" },
  { hex: "#1A1A1A", fr: "noir", en: "black" },
] as const;

const stamps = ["star", "heart", "flower", "bow", "balloon", "fish", "sun", "cloud"] as const;
type Stamp = (typeof stamps)[number];
type Tool = "pen" | "eraser" | Stamp;

const stampGlyph: Record<Stamp, string> = {
  star: "⭐",
  heart: "♥",
  flower: "🌸",
  bow: "🎀",
  balloon: "🎈",
  fish: "🐟",
  sun: "☀️",
  cloud: "☁️",
};

export function DrawBoard({ copy, lang }: { copy: Copy; lang: "fr" | "en" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [mode, setMode] = useState<"draw" | "paint" | "stickers">("draw");
  const [colorIndex, setColorIndex] = useState(0);
  const [tool, setTool] = useState<Tool>("pen");
  const [brush, setBrush] = useState(0);
  const color = colors[colorIndex] ?? colors[0];

  function context() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return null;
    return { canvas, ctx };
  }

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
    const pair = context();
    const at = point(event);
    if (!pair || !at) return;
    pair.canvas.setPointerCapture(event.pointerId);
    if (tool !== "pen" && tool !== "eraser") {
      drawStamp(pair.ctx, tool, at.x, at.y, color.hex);
      return;
    }
    drawing.current = true;
    pair.ctx.globalAlpha = mode === "paint" ? 0.85 : 1;
    pair.ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color.hex;
    pair.ctx.lineWidth = tool === "eraser" ? 28 : mode === "paint" ? [22, 36, 52][brush] ?? 22 : 8;
    pair.ctx.lineCap = "round";
    pair.ctx.lineJoin = "round";
    pair.ctx.fillStyle = tool === "eraser" ? "#ffffff" : color.hex;
    pair.ctx.beginPath();
    pair.ctx.arc(at.x, at.y, pair.ctx.lineWidth / 2, 0, Math.PI * 2);
    pair.ctx.fill();
    pair.ctx.beginPath();
    pair.ctx.moveTo(at.x, at.y);
  }

  function onMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const pair = context();
    const at = point(event);
    if (!pair || !at) return;
    pair.ctx.lineTo(at.x, at.y);
    pair.ctx.stroke();
  }

  function onUp() {
    drawing.current = false;
    const pair = context();
    if (pair) pair.ctx.globalAlpha = 1;
  }

  function fillPaper() {
    const pair = context();
    if (!pair) return;
    pair.ctx.globalAlpha = 1;
    pair.ctx.fillStyle = color.hex;
    pair.ctx.fillRect(0, 0, pair.canvas.width, pair.canvas.height);
  }

  function drawOutline() {
    const pair = context();
    if (!pair) return;
    const { ctx } = pair;
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, 640, 480);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 640, 480);
    ctx.strokeStyle = "#2A0B4A";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.ellipse(320, 300, 90, 70, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(320, 210, 70, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(270, 160);
    ctx.lineTo(250, 100);
    ctx.lineTo(300, 150);
    ctx.moveTo(370, 160);
    ctx.lineTo(390, 100);
    ctx.lineTo(340, 150);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(295, 205, 8, 0, Math.PI * 2);
    ctx.arc(345, 205, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(320, 230, 16, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }

  function clear() {
    const pair = context();
    if (!pair) return;
    pair.ctx.globalAlpha = 1;
    pair.ctx.clearRect(0, 0, pair.canvas.width, pair.canvas.height);
  }

  const brushLabels = lang === "en" ? ["Small brush", "Medium brush", "Big brush"] : ["Petit pinceau", "Pinceau moyen", "Gros pinceau"];

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-3 gap-3" role="group" aria-label={lang === "en" ? "Drawing, painting, or stickers" : "Dessin, peinture ou collage"}>
        <ModeButton active={mode === "draw"} onClick={() => { setMode("draw"); setTool("pen"); }}>
          {copy.draw}
        </ModeButton>
        <ModeButton active={mode === "paint"} onClick={() => { setMode("paint"); setTool("pen"); }}>
          {copy.paint}
        </ModeButton>
        <ModeButton active={mode === "stickers"} onClick={() => setMode("stickers")}>
          {copy.stickers}
        </ModeButton>
      </div>
      <p className="text-center text-lg">{mode === "paint" ? copy.paintHint : mode === "stickers" ? copy.stickerHint : copy.drawHint}</p>
      {mode === "stickers" ? (
        <StickerPlay copy={copy} lang={lang} />
      ) : (
        <>
      <div className="rounded-[28px] bg-white p-2" style={{ boxShadow: mode === "paint" ? "0 0 0 4px #7C3AED" : "0 0 0 4px #FFD23F" }}>
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          aria-label={mode === "paint" ? copy.paint : copy.draw}
          className="h-72 w-full touch-none rounded-3xl bg-white"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-3" role="group" aria-label={lang === "en" ? "Colors" : "Couleurs"}>
        {colors.map((swatch, index) => (
          <button
            key={swatch.hex}
            type="button"
            aria-label={swatch[lang]}
            aria-pressed={colorIndex === index}
            onClick={() => setColorIndex(index)}
            className={colorIndex === index ? "h-16 w-16 rounded-full ring-4 ring-sun" : "h-16 w-16 rounded-full ring-2 ring-white/40"}
            style={{ background: swatch.hex }}
          />
        ))}
      </div>
      {mode === "draw" ? (
        <div className="flex flex-wrap justify-center gap-3" role="group" aria-label={copy.stamps}>
          <ToolButton active={tool === "pen"} onClick={() => setTool("pen")} label={copy.draw}>
            ✏️
          </ToolButton>
          <ToolButton active={tool === "eraser"} onClick={() => setTool("eraser")} label={copy.eraser}>
            {copy.eraser}
          </ToolButton>
          {stamps.map((stamp) => (
            <ToolButton key={stamp} active={tool === stamp} onClick={() => setTool(stamp)} label={stampGlyph[stamp]}>
              {stampGlyph[stamp]}
            </ToolButton>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {brushLabels.map((label, index) => (
            <button
              key={label}
              type="button"
              aria-pressed={brush === index && tool === "pen"}
              onClick={() => {
                setBrush(index);
                setTool("pen");
              }}
              className={brush === index && tool === "pen" ? "h-16 rounded-full bg-sun text-lg text-plum ring-4 ring-white" : "h-16 rounded-full bg-white/15 text-lg"}
            >
              {label}
            </button>
          ))}
          <button type="button" onClick={fillPaper} className="col-span-2 h-16 rounded-full bg-white/15 text-lg">
            {copy.paper}
          </button>
          <button type="button" onClick={drawOutline} className="h-16 rounded-full bg-hot text-lg">
            {copy.outline}
          </button>
        </div>
      )}
      <button type="button" onClick={clear} className="flex h-16 items-center justify-center rounded-full bg-hot text-2xl">
        {copy.clear}
      </button>
        </>
      )}
      <Link href="/kid/games/cove" className="flex h-16 items-center justify-center rounded-full bg-white/15 text-2xl">
        {copy.back}
      </Link>
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={active ? "h-16 rounded-full bg-sun text-lg text-plum ring-4 ring-white" : "h-16 rounded-full bg-white/15 text-lg"}
    >
      {children}
    </button>
  );
}

function ToolButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={active ? "flex h-16 min-w-16 items-center justify-center rounded-full bg-sun px-3 text-2xl text-plum ring-4 ring-white" : "flex h-16 min-w-16 items-center justify-center rounded-full bg-white/15 px-3 text-2xl"}
    >
      {children}
    </button>
  );
}

function drawStamp(ctx: CanvasRenderingContext2D, stamp: Stamp, x: number, y: number, color: string) {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.translate(x, y);
  if (stamp === "star") {
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 === 0 ? 26 : 11;
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (stamp === "heart") {
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(-28, -10, -16, -28, 0, -12);
    ctx.bezierCurveTo(16, -28, 28, -10, 0, 10);
    ctx.fill();
  } else if (stamp === "flower") {
    for (let i = 0; i < 5; i += 1) {
      const angle = (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 14, Math.sin(angle) * 14, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#FFD23F";
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (stamp === "bow") {
    ctx.beginPath();
    ctx.ellipse(-14, 0, 14, 10, -0.4, 0, Math.PI * 2);
    ctx.ellipse(14, 0, 14, 10, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (stamp === "balloon") {
    ctx.beginPath();
    ctx.ellipse(0, -8, 16, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(0, 28);
    ctx.stroke();
  } else if (stamp === "fish") {
    ctx.beginPath();
    ctx.ellipse(-4, 0, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(28, -12);
    ctx.lineTo(28, 12);
    ctx.closePath();
    ctx.fill();
  } else if (stamp === "sun") {
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 8; i += 1) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 16, Math.sin(angle) * 16);
      ctx.lineTo(Math.cos(angle) * 26, Math.sin(angle) * 26);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.arc(-12, 4, 12, 0, Math.PI * 2);
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.arc(14, 6, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
