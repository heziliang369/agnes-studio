export const AGNES_API_BASE = "https://apihub.agnes-ai.com/v1";
export const AGNES_API_KEY = process.env.AGNES_API_KEY || "";

export const IMAGE_MODELS = [
  { id: "agnes-image-2.0-flash", display: "AgnesAI Image 2.0 Flash", speed: "~5s", strengths: "Fast, general purpose" },
  { id: "agnes-image-2.1-flash", display: "AgnesAI Image 2.1 Flash", speed: "~8s", strengths: "Higher fidelity" },
];

export const VIDEO_MODEL = "agnes-video-v2.0";

export const ASPECT_RATIOS = [
  { label: "横屏 16:9", value: "1024x768" },
  { label: "方形 1:1", value: "1024x1024" },
  { label: "竖屏 9:16", value: "768x1024" },
];

export const VIDEO_DURATIONS = [
  { label: "3 秒", frames: 73, fps: 24 },
  { label: "5 秒", frames: 121, fps: 24 },
  { label: "10 秒", frames: 241, fps: 24 },
];

export const VIDEO_RESOLUTIONS = [
  { label: "768p (推荐)", width: 1152, height: 768 },
  { label: "1152p", width: 1728, height: 1152 },
];
