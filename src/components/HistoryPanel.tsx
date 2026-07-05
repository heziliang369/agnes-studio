"use client";

import { useState, useRef, useCallback } from "react";

interface GenerationHistoryItem {
  id: string;
  type: "image" | "video";
  prompt: string;
  resultUrl: string;
  timestamp: number;
  model?: string;
}

export default function HistoryPanel({
  isOpen,
  onClose,
  history,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  history: GenerationHistoryItem[];
  onSelect: (item: GenerationHistoryItem) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">生成历史</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无生成记录</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="group bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-purple-500 rounded-lg overflow-hidden transition-all text-left"
                >
                  <div className="aspect-video bg-gray-950 flex items-center justify-center overflow-hidden">
                    {item.type === "image" ? (
                      <img
                        src={item.resultUrl}
                        alt={item.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <video
                        src={item.resultUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        onMouseOver={(e) => (e.currentTarget.play())}
                        onMouseOut={(e) => (e.currentTarget.pause())}
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-400 truncate">{item.prompt}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {item.model} · {new Date(item.timestamp).toLocaleString("zh-CN")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
