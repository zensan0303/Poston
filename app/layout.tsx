import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "ポストン - ホーム",
  description: "ポストンの予定・試合結果を確認できます",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=M+PLUS+Rounded+1c:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" style={{ fontFamily: '"M PLUS Rounded 1c", "Poppins", sans-serif' }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
