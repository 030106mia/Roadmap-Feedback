import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import AppHeader from "@/components/AppHeader";
import LeftNav from "@/components/LeftNav";

export const metadata: Metadata = {
  title: "Filo Roadmap",
  description: "Roadmap 管理工具：板块、优先级、排期、来源、描述图、变更记录",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeProvider>
          <div className="flex min-h-screen">
            <LeftNav />
            <div className="min-w-0 flex-1">
              <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8">
                <AppHeader />
                <div className="min-h-0 flex-1">{children}</div>
                <footer className="mt-10 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800/70">
                  Local data storage.
                </footer>
              </div>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
