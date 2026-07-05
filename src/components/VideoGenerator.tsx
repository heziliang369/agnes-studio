"use client";

import { useState, useRef, useEffect, FormEvent, useCallback } from "react";
import { VIDEO_MODEL, VIDEO_DURATIONS, VIDEO_RESOLUTIONS } from "@/lib/constants";
import { addRecord, getRecordsByType, deleteRecord, GenerationRecord } from "@/lib/db";

export default function VideoGenerator() {
  const [mode, setMode] = useState<"text" | "image">("text");
  const [subMode, setSubMode] = useState<"single" | "multi" | "keyframes">("single");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [duration, setDuration] = useState(121);
  const [resolution, setResolution] = useState({ width: 1152, height: 768 });
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
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

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) {
      const newFiles = [...files, ...selected];
      setFiles(newFiles.slice(0, 10)); // Limit to 10 images
      const newPreviews = selected.map(f => URL.createObjectURL(f));
      setFilePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
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
    if (mode === "image" && files.length === 0) {
      setError("请至少上传一张参考图片");
      return;
    }

    setLoading(true);
    setError(null);
    setResult("");
    setProgress(0);
    setStatus("creating");

    try {
      // Convert files to base64 data URLs for the API
      const imageUrls = await Promise.all(files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });
      }));

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
          image: mode === "image" && files.length === 1 ? imageUrls[0] : undefined,
          extraBody: mode === "image" && files.length > 1 ? {
            image: imageUrls,
            mode: subMode === "keyframes" ? "keyframes" : undefined,
          } : undefined,
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
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Generation Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-gray-100">🎬 生成新视频</h3>
        </div>

        <div className="p-6 space-y-5">
          {/* Main Mode Toggle */}
          <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
            <button
              onClick={() => setMode("text")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === "text"
                  ? "bg-purple-500/15 text-purple-300"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              disabled={loading}
            >
              文生视频
            </button>
            <button
              onClick={() => setMode("image")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === "image"
                  ? "bg-purple-500/15 text-purple-300"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              disabled={loading}
            >
              图生视频
            </button>
          </div>

          {/* Sub-mode Toggle (for image mode) */}
          {mode === "image" && (
            <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
              <button
                onClick={() => setSubMode("single")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  subMode === "single"
                    ? "bg-purple-500/15 text-purple-300"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                disabled={loading}
              >
                单图
              </button>
              <button
                onClick={() => setSubMode("multi")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  subMode === "multi"
                    ? "bg-purple-500/15 text-purple-300"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                disabled={loading}
              >
                多图
              </button>
              <button
                onClick={() => setSubMode("keyframes")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  subMode === "keyframes"
                    ? "bg-purple-500/15 text-purple-300"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                disabled={loading}
              >
                关键帧
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Prompt */}
            <div>
              <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-400 mb-2">
                提示词
              </label>
              <textarea
                id="video-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你想要的视频内容..."
                rows={3}
                className="w-full px-4 py-3 bg-black/30 border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none text-sm transition-all"
                disabled={loading}
              />
            </div>

            {/* Reference Images (img2video) */}
            {mode === "image" && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  参考图片 {subMode === "single" ? "(1张)" : `(最多10张)`}
                </label>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Reference ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-white/[0.08]"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-500 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {filePreviews.length < 10 && (
                      <label className="block cursor-pointer">
                        <div className="border-2 border-dashed border-white/[0.08] hover:border-purple-500/40 rounded-lg h-24 flex items-center justify-center transition-colors bg-black/20">
                          <span className="text-gray-600 text-xs">+ 添加图片</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple={subMode !== "single"}
                          onChange={handleFilesChange}
                          className="hidden"
                          disabled={loading}
                        />
                      </label>
                    )}
                  </div>
                  {files.length === 0 && (
                    <label className="block cursor-pointer">
                      <div className="border-2 border-dashed border-white/[0.08] hover:border-purple-500/40 rounded-xl p-6 text-center transition-colors bg-black/20">
                        <p className="text-gray-600 text-sm">点击或拖拽上传图片</p>
                        <p className="text-xs mt-1 text-gray-700">支持 JPG、PNG 格式</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple={subMode !== "single"}
                        onChange={handleFilesChange}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Negative Prompt */}
            <div>
              <label htmlFor="neg-prompt" className="block text-sm font-medium text-gray-400 mb-2">
                反向提示词 <span className="text-gray-600">（可选）</span>
              </label>
              <input
                id="neg-prompt"
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="不想要的内容..."
                className="w-full px-4 py-3 bg-black/30 border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-sm transition-all"
                disabled={loading}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">视频时长</label>
              <div className="grid grid-cols-3 gap-2">
                {VIDEO_DURATIONS.map((d) => (
                  <button
                    key={d.frames}
                    type="button"
                    onClick={() => setDuration(d.frames)}
                    disabled={loading}
                    className={`p-3 rounded-xl border text-center transition-all text-sm ${
                      duration === d.frames
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-white/[0.08] bg-black/20 hover:border-white/[0.15]"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="text-white">{d.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">分辨率</label>
              <div className="grid grid-cols-2 gap-2">
                {VIDEO_RESOLUTIONS.map((r) => (
                  <button
                    key={`${r.width}x${r.height}`}
                    type="button"
                    onClick={() => setResolution(r)}
                    disabled={loading}
                    className={`p-3 rounded-xl border text-center transition-all text-sm ${
                      resolution.width === r.width
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-white/[0.08] bg-black/20 hover:border-white/[0.15]"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="text-white">{r.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
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
                  {status === "creating" ? "创建任务中..." : "生成视频中..."}
                </span>
              ) : (
                "✨ 生成视频"
              )}
            </button>
          </form>

          {/* Progress Bar */}
          {(status === "generating" || status === "creating") && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{status === "creating" ? "创建任务中..." : "生成视频中..."}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-700">视频生成通常需要 30-120 秒，请耐心等待...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Latest Result */}
      {status === "completed" && result && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-100">最新生成结果</h3>
          </div>
          <div className="p-4">
            <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-black/30">
              <video src={result} controls className="w-full" />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleDownload(result, `agnes-video-${Date.now()}.mp4`)}
                className="flex-1 py-2 px-4 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl text-xs text-gray-300 transition-colors"
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
                  setFiles([]);
                  setFilePreviews([]);
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
            <h3 className="text-base font-semibold text-gray-100">视频记录 ({history.length})</h3>
            <button
              onClick={loadHistory}
              className="text-xs text-gray-600 hover:text-gray-300 transition-colors"
            >
              刷新
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {history.map((item) => (
              <div key={item.id} className="group relative rounded-xl overflow-hidden border border-white/[0.08] bg-black/30">
                <video
                  src={item.resultUrl}
                  className="w-full aspect-video object-cover"
                  muted
                  loop
                  onMouseOver={(e) => e.currentTarget.play()}
                  onMouseOut={(e) => e.currentTarget.pause()}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-[11px] text-white/90 line-clamp-2 mb-2 leading-relaxed">{item.prompt}</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDownload(item.resultUrl, `agnes-video-${item.id}.mp4`)}
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