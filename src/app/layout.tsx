// src/app/layout.tsx

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Smart Todo App",
  description: "Efficiently manage your tasks with Google Calendar integration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
