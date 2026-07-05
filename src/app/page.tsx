"use client";

import { useState, useEffect } from "react";
import ImageGenerator from "@/components/ImageGenerator";
import VideoGenerator from "@/components/VideoGenerator";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 z-40 bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <span className="text-sm font-bold">A</span>
            </div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Agnes AI 创意工坊
            </h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            用 AI 创造你的想象力
          </h2>
          <p className="text-gray-400 text-lg">
            基于 Agnes AI 多模态模型，一键生成高质量图像与视频内容
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
        <div className="flex gap-2 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("image")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "image"
                ? "border-purple-500 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            🎨 图像生成
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "video"
                ? "border-purple-500 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            🎬 视频生成
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "image" ? <ImageGenerator /> : <VideoGenerator />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-gray-600">
          Powered by AgnesAI · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
