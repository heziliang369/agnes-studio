"use client";

import { useState, useEffect } from "react";
import ImageGenerator from "@/components/ImageGenerator";
import VideoGenerator from "@/components/VideoGenerator";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d0d24] to-[#0a0a1a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a1a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent">
              Agnes AI 创意工坊
            </h1>
          </div>
          <div className="text-xs text-gray-600">
            v1.0
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-10 sm:py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
            用 AI 创造你的想象力
          </h2>
          <p className="text-gray-500 text-base sm:text-lg">
            基于 Agnes AI 多模态模型，一键生成高质量图像与视频内容
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-2">
        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit mx-auto">
          <button
            onClick={() => setActiveTab("image")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "image"
                ? "bg-purple-500/15 text-purple-300 shadow-sm shadow-purple-500/10"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span className="text-base">🎨</span>
            <span className="hidden sm:inline">图像生成</span>
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "video"
                ? "bg-purple-500/15 text-purple-300 shadow-sm shadow-purple-500/10"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span className="text-base">🎬</span>
            <span className="hidden sm:inline">视频生成</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Use key to prevent remount — preserves state across tab switches */}
        <div key={activeTab}>
          {activeTab === "image" ? <ImageGenerator /> : <VideoGenerator />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-gray-700">
          Powered by AgnesAI · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
