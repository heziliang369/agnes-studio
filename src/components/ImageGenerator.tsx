"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { IMAGE_MODELS, ASPECT_RATIOS } from "@/lib/constants";
import { addRecord, getRecordsByType, deleteRecord, GenerationRecord } from "@/lib/db";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("agnes-image-2.0-flash");
  const [aspectRatio, setAspectRatio] = useState("landscape");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; size: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GenerationRecord[]>([]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const records = await getRecordsByType("image");
      setHistory(records);
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  };

  const handleSaveToHistory = useCallback(async (imageUrl: string, size: string) => {
    try {
      const record = await addRecord({
        type: "image",
        prompt: prompt.trim(),
        resultUrl: imageUrl,
        model,
        aspectRatio: size,
      });
      setHistory((prev) => [record, ...prev]);
    } catch (e) {
      console.error("Failed to save to history:", e);
    }
  }, [prompt, model]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteRecord(id);
    setHistory((prev) => prev.filter((r) => r.id !== id));
    if (result?.url === id) {
      setResult(null);
    }
  }, [result]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          aspectRatio,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "生成失败");
        setLoading(false);
        return;
      }

      if (data.images?.[0]?.url) {
        const imgUrl = data.images[0].url;
        setResult({ url: imgUrl, size: data.size });
        // Save to history after a short delay to ensure URL is stable
        setTimeout(() => handleSaveToHistory(imgUrl, data.size), 500);
      } else {
        setError("未获取到图片 URL");
      }
    } catch (err: any) {
      setError(err.message || "网络错误");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Generation Form */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">生成新图像</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
              提示词
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要生成的图像..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">模型</label>
            <div className="flex gap-3">
              {IMAGE_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModel(m.id)}
                  className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                    model === m.id
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-gray-700 bg-gray-900 hover:border-gray-600"
                  }`}
                  disabled={loading}
                >
                  <div className="text-sm font-medium text-white">{m.display}</div>
                  <div className="text-xs text-gray-400 mt-1">{m.speed} · {m.strengths}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">尺寸</label>
            <div className="flex gap-3">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.value}
                  type="button"
                  onClick={() => setAspectRatio(ar.value)}
                  className={`flex-1 p-3 rounded-lg border text-center transition-all ${
                    aspectRatio === ar.value
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-gray-700 bg-gray-900 hover:border-gray-600"
                  }`}
                  disabled={loading}
                >
                  <div className="text-sm text-white">{ar.label}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
              loading || !prompt.trim()
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                生成中...
              </span>
            ) : (
              "生成图像"
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Latest Result */}
      {result && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">最新生成结果</h3>
          <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
            <img
              src={result.url}
              alt="Generated image"
              className="w-full h-auto"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleDownload(result.url, `agnes-image-${Date.now()}.png`)}
              className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-white transition-colors"
            >
              下载图片
            </button>
            <button
              onClick={() => {
                setResult(null);
                setError(null);
              }}
              className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-white transition-colors"
            >
              重新生成
            </button>
          </div>
        </div>
      )}

      {/* History Gallery */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">生成记录 ({history.length})</h3>
            <button
              onClick={loadHistory}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              刷新
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {history.map((item) => (
              <div key={item.id} className="group relative rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
                <img
                  src={item.resultUrl}
                  alt={item.prompt}
                  className="w-full aspect-square object-cover"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <p className="text-xs text-white line-clamp-2 mb-1">{item.prompt}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDownload(item.resultUrl, `agnes-image-${item.id}.png`)}
                      className="flex-1 py-1 px-2 bg-purple-600 hover:bg-purple-500 rounded text-xs text-white transition-colors"
                    >
                      下载
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="py-1 px-2 bg-red-600 hover:bg-red-500 rounded text-xs text-white transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
