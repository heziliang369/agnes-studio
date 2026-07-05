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
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Generation Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-gray-100">🎨 生成新图像</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Prompt */}
          <div>
            <label htmlFor="img-prompt" className="block text-sm font-medium text-gray-400 mb-2">
              提示词
            </label>
            <textarea
              id="img-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要生成的图像..."
              rows={3}
              className="w-full px-4 py-3 bg-black/30 border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none text-sm transition-all"
              disabled={loading}
            />
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">模型</label>
            <div className="grid grid-cols-2 gap-2">
              {IMAGE_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModel(m.id)}
                  disabled={loading}
                  className={`p-3 rounded-xl border text-left transition-all text-sm ${
                    model === m.id
                      ? "border-purple-500/50 bg-purple-500/10 shadow-sm shadow-purple-500/10"
                      : "border-white/[0.08] bg-black/20 hover:border-white/[0.15]"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="font-medium text-white text-sm">{m.display}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.speed} · {m.strengths}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">尺寸</label>
            <div className="grid grid-cols-3 gap-2">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.value}
                  type="button"
                  onClick={() => setAspectRatio(ar.value)}
                  disabled={loading}
                  className={`p-3 rounded-xl border text-center transition-all text-sm ${
                    aspectRatio === ar.value
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-white/[0.08] bg-black/20 hover:border-white/[0.15]"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="text-white">{ar.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className={`w-full py-3 px-6 rounded-xl font-medium text-sm transition-all ${
              loading || !prompt.trim()
                ? "bg-white/[0.06] text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                生成中...
              </span>
            ) : (
              "✨ 生成图像"
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}
      </div>

      {/* Latest Result */}
      {result && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-100">最新生成结果</h3>
            <span className="text-xs text-gray-600">{result.size}</span>
          </div>
          <div className="p-4">
            <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-black/30">
              <img
                src={result.url}
                alt="Generated image"
                className="w-full h-auto"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleDownload(result.url, `agnes-image-${Date.now()}.png`)}
                className="flex-1 py-2 px-4 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl text-xs text-gray-300 transition-colors"
              >
                下载图片
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
                className="flex-1 py-2 px-4 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl text-xs text-gray-300 transition-colors"
              >
                重新生成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Gallery */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-100">生成记录 ({history.length})</h3>
            <button
              onClick={loadHistory}
              className="text-xs text-gray-600 hover:text-gray-300 transition-colors"
            >
              刷新
            </button>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {history.map((item) => (
              <div key={item.id} className="group relative rounded-xl overflow-hidden border border-white/[0.08] bg-black/30 aspect-square">
                <img
                  src={item.resultUrl}
                  alt={item.prompt}
                  className="w-full h-full object-cover"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                  <p className="text-[11px] text-white/90 line-clamp-2 mb-2 leading-relaxed">{item.prompt}</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDownload(item.resultUrl, `agnes-image-${item.id}.png`)}
                      className="flex-1 py-1.5 px-2 bg-purple-600/80 hover:bg-purple-500 rounded-lg text-[11px] text-white transition-colors"
                    >
                      下载
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="py-1.5 px-2.5 bg-red-600/80 hover:bg-red-500 rounded-lg text-[11px] text-white transition-colors"
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
