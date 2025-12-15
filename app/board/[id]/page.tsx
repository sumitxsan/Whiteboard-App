"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { socket } from "../../../components/lib/socket";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BoardPage() {
  const { id: boardId } = useParams();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // ============================
  // Load saved strokes
  // ============================
  const loadBoard = async (ctx: CanvasRenderingContext2D) => {
    const { data, error } = await supabase
      .from("strokes")
      .select("*")
      .eq("board_id", boardId)
      .order("created_at", { ascending: true });

    if (error) {
      console.log("Failed loading board:", error);
      return;
    }

    console.log("Loaded strokes:", data.length);

    data.forEach((stroke) => {
      ctx.beginPath();
      ctx.moveTo(stroke.x0, stroke.y0);
      ctx.lineTo(stroke.x1, stroke.y1);
      ctx.stroke();
      ctx.closePath();
    });
  };

  // ============================
  // Save a single stroke
  // ============================
  const saveStroke = async (stroke: any) => {
    await supabase.from("strokes").insert({
      board_id: boardId,
      x0: stroke.x0,
      y0: stroke.y0,
      x1: stroke.x1,
      y1: stroke.y1,
    });
  };

  // ============================
  // Delete all strokes
  // ============================
const clearBoard = async () => {
  const canvas = canvasRef.current!;
  const ctx = canvas.getContext("2d")!;

  // Clear canvas locally
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Delete from DB
  await supabase.from("strokes").delete().eq("board_id", boardId);

  console.log("Board cleared in DB");

  // Notify all socket peers
  socket.emit("clear", { boardId }); // send as object
};

  // ============================
  // Main effect
  // ============================
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "white";

    loadBoard(ctx);

    socket.emit("join", boardId);

    const getXY = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    // ============================
    // Local Drawing
    // ============================
    const startDrawing = (e: MouseEvent) => {
      isDrawing.current = true;
      lastPos.current = getXY(e);
    };

    const draw = (e: MouseEvent) => {
      if (!isDrawing.current) return;

      const { x, y } = getXY(e);
      const { x: lastX, y: lastY } = lastPos.current;

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.closePath();

      const stroke = {
        boardId,
        x0: lastX,
        y0: lastY,
        x1: x,
        y1: y,
      };

      socket.emit("draw", stroke);
      saveStroke(stroke);

      lastPos.current = { x, y };
    };

    const stopDrawing = () => {
      isDrawing.current = false;
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);

    // ============================
    // Remote Draw
    // ============================
    const handleRemoteDraw = ({ x0, y0, x1, y1 }: any) => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.closePath();
    };

    socket.on("draw", handleRemoteDraw);

    // ============================
    // Remote Clear
    // ============================
    const handleRemoteClear = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    socket.on("clear", handleRemoteClear);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseleave", stopDrawing);

      socket.off("draw", handleRemoteDraw);
      socket.off("clear", handleRemoteClear);
    };
  }, [boardId]);
  

  return (
    <div className="min-h-screen w-full flex flex-col items-center gap-4 bg-neutral-900 p-4">
      <button
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        onClick={clearBoard}
      >
        Clear Drawing
      </button>

      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        className="border border-white rounded-md hover:cursor-crosshair"
      />
    </div>
  );
}
