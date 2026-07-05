import { NextResponse } from "next/server";
import { pollVideoStatus } from "@/lib/agnes-api";

interface VideoTask {
  videoId: string;
  status: "pending" | "generating" | "completed" | "failed";
  result?: any;
  error?: string;
}

// In-memory task store (use Redis/DB in production)
const videoTasks: Map<string, VideoTask> = new Map();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json({ success: false, error: "videoId is required" }, { status: 400 });
    }

    // Initialize or update task
    let task = videoTasks.get(videoId);
    if (!task) {
      task = { videoId, status: "pending" };
      videoTasks.set(videoId, task);
    }

    // Poll the Agnes API
    const pollResult = await pollVideoStatus(videoId);

    if (!pollResult.success) {
      task.status = "failed";
      task.error = pollResult.error || "Polling failed";
      return NextResponse.json({
        success: true,
        status: "failed",
        error: task.error,
      });
    }

    const data = pollResult.data;
    const apiStatus = data.status || data.state || "";
    const internalStatus = data.internal_status || "";

    if (apiStatus === "completed" || apiStatus === "succeeded" || internalStatus === "completed") {
      task.status = "completed";
      task.result = data;
      return NextResponse.json({
        success: true,
        status: "completed",
        data: data,
      });
    } else if (apiStatus === "failed" || apiStatus === "error") {
      task.status = "failed";
      task.error = data.error || "Generation failed";
      return NextResponse.json({
        success: true,
        status: "failed",
        error: task.error,
      });
    } else {
      // Still generating
      task.status = "generating";
      const progress = data.progress ?? 0;
      return NextResponse.json({
        success: true,
        status: "generating",
        progress,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET returns all task statuses
export async function GET() {
  const tasks = Array.from(videoTasks.values()).map((t) => ({
    videoId: t.videoId,
    status: t.status,
    error: t.error,
  }));
  return NextResponse.json({ tasks });
}
