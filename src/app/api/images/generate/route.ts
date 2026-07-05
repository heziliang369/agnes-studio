import { NextResponse } from "next/server";
import { callAgnesImageApi } from "@/lib/agnes-api";
import { ASPECT_RATIOS } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, model, aspectRatio } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const sizeMap: Record<string, string> = {
      "landscape": "1024x768",
      "square": "1024x1024",
      "portrait": "768x1024",
    };
    const size = sizeMap[aspectRatio || "landscape"] || "1024x768";
    const imageModel = model || "agnes-image-2.0-flash";

    const result = await callAgnesImageApi(imageModel, prompt.trim(), size);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      images: result.data!,
      model: imageModel,
      size,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
