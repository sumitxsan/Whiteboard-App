"use client";

import { useEffect, useRef } from "react";
import { socket } from "../components/lib/socket";
import { useParams } from "next/navigation";

export default function CanvasBoard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<any>(null);
  const { boardId } = useParams();

  useEffect(() => {
    let fabric: any;
    let canvas: any;

    const setup = async () => {
      // DYNAMIC IMPORT — This is the ONLY correct way
      const fabricModule = await import("fabric");
      fabric = fabricModule.fabric;

      // Join socket room
      socket.emit("join-room", boardId);

      // Setup Fabric.js canvas
      canvas = new fabric.Canvas("whiteboard", {
        isDrawingMode: true,
        backgroundColor: "white",
      });

      fabricCanvasRef.current = canvas;

      // Draw event from this user
      canvas.on("path:created", (e: any) => {
        const pathData = e.path.toJSON();

        socket.emit("draw", {
          boardId,
          path: pathData,
        });
      });

      // Receive drawing from others
      socket.on("draw", ({ path }) => {
        fabric.util.enlivenObjects([path], {}, (objects: any[]) => {
          objects.forEach((o) => {
            canvas.add(o);
          });
          canvas.renderAll();
        });
      });
    };

    setup();

    return () => {
      socket.off("draw");
      canvas?.dispose();
    };
  }, [boardId]);

  return (
    <div className="w-full h-full flex justify-center items-center">
      <canvas id="whiteboard" width={1000} height={600} className="border" />
    </div>
  );
}
