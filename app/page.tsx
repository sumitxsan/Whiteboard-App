import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">Welcome to Whiteboard</h1>

      {/* Example link to a board */}
      <Link 
        href="/board/123"
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Open Board 123
      </Link>
    </div>
  );
}
