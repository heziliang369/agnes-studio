import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agnes AI 创意工坊",
  description: "基于 Agnes AI 多模态模型的图像与视频生成平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
