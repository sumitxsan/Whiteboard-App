// app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Whiteboard App",
  description: "Realtime collaborative whiteboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-900 text-white">
        {children}
      </body>
    </html>
  );
}
