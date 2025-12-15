"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Room = {
  id: string;
  name: string;
  created_at: string;
};

export default function HomePage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);

  // ============================
  // Load rooms
  // ============================
  const loadRooms = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRooms(data);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  // ============================
  // Create room
  // ============================
  const createRoom = async () => {
    if (!roomName.trim()) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("rooms")
      .insert({ name: roomName })
      .select()
      .single();

    setLoading(false);

    if (error) {
      alert("Failed to create room");
      return;
    }

    // Go to board page
    router.push(`/board/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">🎨 Whiteboard Rooms</h1>

      {/* Create Room */}
      <div className="flex gap-2 mb-8">
        <input
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Enter room name"
          className="px-4 py-2 rounded bg-neutral-800 border border-neutral-700 flex-1"
        />
        <button
          onClick={createRoom}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
        >
          Create
        </button>
      </div>

      {/* Room List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            onClick={() => router.push(`/board/${room.id}`)}
            className="cursor-pointer bg-neutral-800 p-4 rounded border border-neutral-700 hover:border-blue-500 transition"
          >
            <h2 className="text-lg font-semibold">{room.name}</h2>
            <p className="text-sm text-neutral-400">
              {new Date(room.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
