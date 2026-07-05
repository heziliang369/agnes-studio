"use client";

import { useState, useRef, useEffect, FormEvent, useCallback } from "react";
import { VIDEO_MODEL, VIDEO_DURATIONS, VIDEO_RESOLUTIONS } from "@/lib/constants";
import { addRecord, getRecordsByType, deleteRecord, GenerationRecord } from "@/lib/db";

export default function VideoGenerator() {
  const [mode, setMode] = useState<"text" | "image">("text");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [duration, setDuration] = useState(121);
  const [resolution, setResolution] = useState({ width: 1152, height: 768 });
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<"idle" | "creating" | "generating" | "completed" | "failed">("idle");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string>("");
  const [history, setHistory] = useState<GenerationRecord[]>([]);

  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadHistory();
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  const loadHistory = async () => {
    try {
      const records = await getRecordsByType("video");
      setHistory(records);
    } catch (e) {
      console.error("Failed to load video history:", e);
    }
  };

  const handleSaveToHistory = useCallback(async (videoUrl: string) => {
    try {
      const record = await addRecord({
        type: "video",
        prompt: prompt.trim(),
        resultUrl: videoUrl,
        model: VIDEO_MODEL,
        duration: `${(duration / 24).toFixed(0)}s`,
        negativePrompt: negativePrompt.trim() || undefined,
      });
      setHistory((prev) => [record, ...prev]);
    } catch (e) {
      console.error("Failed to save video to history:", e);
    }
  }, [prompt, duration, negativePrompt]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteRecord(id);
    setHistory((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setFilePreview(URL.createObjectURL(selected));
    }
  };

  const startPolling = async (vid: string) => {
    setVideoId(vid);
    pollInterval.current = setInterval(async () => {
      try {
        const res = await fetch("/api/videos/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: vid }),
        });
        const data = await res.json();

        if (!data.success) {
          stopPolling();
          setStatus("failed");
          setError(data.error || "轮询失败");
          setLoading(false);
          return;
        }

        setProgress(data.progress ?? 0);

        if (data.status === "completed") {
          stopPolling();
          setStatus("completed");
          setLoading(false);
          // Extract video URL from the response data
          const videoUrl = data.data?.url || "";
          setResult(videoUrl);
          if (videoUrl) {
            handleSaveToHistory(videoUrl);
          }
        } else if (data.status === "failed") {
          stopPolling();
          setStatus("failed");
          setError(data.error || "生成失败");
          setLoading(false);
        }
      } catch (err: any) {
        stopPolling();
        setStatus("failed");
        setError(err.message || "轮询出错");
        setLoading(false);
      }
    }, 5000);
  };

  const stopPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult("");
    setProgress(0);
    setStatus("creating");

    try {
      const res = await fetch("/api/videos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          width: resolution.width,
          height: resolution.height,
          numFrames: duration,
          frameRate: 24,
          negativePrompt: negativePrompt.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success || !data.videoId) {
        throw new Error(data.error || "创建视频任务失败");
      }

      setVideoId(data.videoId);
      setStatus("generating");
      startPolling(data.videoId);
    } catch (err: any) {
      setStatus("failed");
      setError(err.message || "请求失败");
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
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("text")}
          className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
            mode === "text"
              ? "border-purple-500 bg-purple-500/10 text-white"
              : "border-gray-700 bg-gray-900 text-gray-400 hover:text-white"
          }`}
          disabled={loading}
        >
          文生视频
        </button>
        <button
          onClick={() => setMode("image")}
          className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
            mode === "image"
              ? "border-purple-500 bg-purple-500/10 text-white"
              : "border-gray-700 bg-gray-900 text-gray-400 hover:text-white"
          }`}
          disabled={loading}
        >
          图生视频
        </button>
      </div>

      {/* Generation Form */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">生成新视频</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-300 mb-2">
              提示词
            </label>
            <textarea
              id="video-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要的视频内容..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>

          {mode === "image" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">参考图片</label>
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-gray-700 hover:border-purple-500 rounded-lg p-8 text-center transition-colors">
                  {filePreview ? (
                    <div className="relative">
                      <img
                        src={filePreview}
                        alt="Reference"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setFile(null);
                          setFilePreview("");
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <p>点击或拖拽上传图片</p>
                      <p className="text-xs mt-1">支持 JPG、PNG 格式</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
          )}

          <div>
            <label htmlFor="neg-prompt" className="block text-sm font-medium text-gray-300 mb-2">
              反向提示词（可选）
            </label>
            <input
              id="neg-prompt"
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="不想要的内容..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">视频时长</label>
            <div className="flex gap-3">
              {VIDEO_DURATIONS.map((d) => (
                <button
                  key={d.frames}
                  type="button"
                  onClick={() => setDuration(d.frames)}
                  className={`flex-1 p-3 rounded-lg border text-center transition-all ${
                    duration === d.frames
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-gray-700 bg-gray-900 hover:border-gray-600"
                  }`}
                  disabled={loading}
                >
                  <div className="text-sm text-white">{d.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">分辨率</label>
            <div className="flex gap-3">
              {VIDEO_RESOLUTIONS.map((r) => (
                <button
                  key={`${r.width}x${r.height}`}
                  type="button"
                  onClick={() => setResolution(r)}
                  className={`flex-1 p-3 rounded-lg border text-center transition-all ${
                    resolution.width === r.width
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-gray-700 bg-gray-900 hover:border-gray-600"
                  }`}
                  disabled={loading}
                >
                  <div className="text-sm text-white">{r.label}</div>
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
                创建任务中...
              </span>
            ) : (
              "生成视频"
            )}
          </button>
        </form>

        {/* Progress */}
        {(status === "generating" || status === "creating") && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{status === "creating" ? "创建任务中..." : "生成视频中..."}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">视频生成通常需要 30-120 秒，请耐心等待...</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Latest Result */}
      {status === "completed" && result && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">最新生成结果</h3>
          <div className="rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
            <video src={result} controls className="w-full" />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleDownload(result, `agnes-video-${Date.now()}.mp4`)}
              className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-white transition-colors"
            >
              下载视频
            </button>
            <button
              onClick={() => {
                setStatus("idle");
                setError(null);
                setResult("");
                setProgress(0);
                setPrompt("");
                setNegativePrompt("");
                setDuration(121);
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
            <h3 className="text-lg font-semibold text-white">视频记录 ({history.length})</h3>
            <button
              onClick={loadHistory}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              刷新
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {history.map((item) => (
              <div key={item.id} className="group relative rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
                <video
                  src={item.resultUrl}
                  className="w-full aspect-video object-cover"
                  muted
                  loop
                  onMouseOver={(e) => e.currentTarget.play()}
                  onMouseOut={(e) => e.currentTarget.pause()}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-xs text-white line-clamp-2 mb-2">{item.prompt}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDownload(item.resultUrl, `agnes-video-${item.id}.mp4`)}
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
