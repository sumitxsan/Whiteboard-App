require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
app.use(cors());

// ✅ Health check (VERY IMPORTANT for Render)
app.get("/", (req, res) => {
  res.send("Socket server running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://YOUR-VERCEL-FRONTEND.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.id);

  socket.on("join", async (boardId) => {
    socket.join(boardId);

    const { data } = await supabase
      .from("strokes")
      .select("*")
      .eq("board_id", boardId)
      .order("created_at", { ascending: true });

    if (data) socket.emit("load-strokes", data);
  });

  socket.on("draw", async (data) => {
    const { boardId, x0, y0, x1, y1, color, width } = data;

    await supabase.from("strokes").insert({
      board_id: boardId,
      x0,
      y0,
      x1,
      y1,
      color: color || "white",
      width: width || 3,
    });

    socket.to(boardId).emit("draw", data);
  });

  socket.on("clear", async ({ boardId }) => {
    await supabase.from("strokes").delete().eq("board_id", boardId);
    io.in(boardId).emit("clear");
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`🚀 Socket server running on port ${PORT}`);
});
