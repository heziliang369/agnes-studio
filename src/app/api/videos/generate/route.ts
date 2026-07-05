import { NextResponse } from "next/server";
import { callAgnesVideoApi, pollVideoStatus } from "@/lib/agnes-api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, width, height, numFrames, frameRate, negativePrompt, image, extraBody } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const result = await callAgnesVideoApi(
      prompt.trim(),
      width || 1152,
      height || 768,
      numFrames || 121,
      frameRate || 24,
      negativePrompt,
      { image, extraBody }
    );

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to create video task" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      taskId: result.data.id,
      videoId: result.data.video_id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
