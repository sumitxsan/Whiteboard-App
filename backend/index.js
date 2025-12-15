require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");

// Supabase server client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.id);

  // User joins a board
  socket.on("join", async (boardId) => {
    socket.join(boardId);
    console.log("User joined board:", boardId);

    // Load previous strokes from DB and send to this client
    const { data, error } = await supabase
      .from("strokes")
      .select("*")
      .eq("board_id", boardId)
      .order("created_at", { ascending: true });

    if (data) socket.emit("load-strokes", data);
  });

  // Handle live drawing event
  socket.on("draw", async (data) => {
    const { boardId, x0, y0, x1, y1, color, width } = data;

    // Save stroke to DB
    await supabase.from("strokes").insert({
      board_id: boardId,
      x0,
      y0,
      x1,
      y1,
      color: color || "white",
      width: width || 3,
    });

    // Broadcast to everyone else
    socket.to(boardId).emit("draw", data);
  });

  // Handle board clearing
  socket.on("clear", async ({ boardId }) => {
    console.log("🧹 Clearing board:", boardId);

    // Delete from DB
    await supabase.from("strokes").delete().eq("board_id", boardId);

    // Broadcast to everyone in the board room
    io.in(boardId).emit("clear");
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Socket server running on port ${PORT}`);
});

