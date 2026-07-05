import https from "https";
import { AGNES_API_BASE, AGNES_API_KEY } from "./constants";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Safe HTTPS request helper that disables TLS verification
 * (AgnesAI uses internal/self-signed certs).
 */
function httpsRequest(url: string, options: https.RequestOptions, body?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(300000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    if (body) req.write(body);
    req.end();
  });
}

export async function callAgnesImageApi(
  model: string,
  prompt: string,
  size: string
): Promise<ApiResponse<{ url: string }[]>> {
  if (!AGNES_API_KEY) {
    return { success: false, error: "API Key not configured" };
  }

  const body = JSON.stringify({ model, prompt, size });
  const options: https.RequestOptions = {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AGNES_API_KEY}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
    rejectUnauthorized: false,
  };

  try {
    const raw = await httpsRequest(`${AGNES_API_BASE}/images/generations`, options, body);
    const parsed = JSON.parse(raw);
    const data = parsed.data as { url: string }[] | undefined;
    if (!data || !data.length) {
      return { success: false, error: "No images returned" };
    }
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function callAgnesVideoApi(
  prompt: string,
  width: number,
  height: number,
  numFrames: number,
  frameRate: number,
  negativePrompt?: string,
  imageData?: { image?: string; extraBody?: { image?: string[]; mode?: string } }
): Promise<ApiResponse<{ id: string; video_id: string }>> {
  if (!AGNES_API_KEY) {
    return { success: false, error: "API Key not configured" };
  }

  const body: Record<string, any> = {
    model: "agnes-video-v2.0",
    prompt,
    width,
    height,
    num_frames: numFrames,
    frame_rate: frameRate,
  };
  if (negativePrompt) body.negative_prompt = negativePrompt;
  if (imageData) {
    if (imageData.image) body.image = imageData.image;
    if (imageData.extraBody) {
      body.extra_body = imageData.extraBody;
    }
  }

  const jsonBody = JSON.stringify(body);
  const options: https.RequestOptions = {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AGNES_API_KEY}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(jsonBody),
    },
    rejectUnauthorized: false,
  };

  try {
    const raw = await httpsRequest(`${AGNES_API_BASE}/videos`, options, jsonBody);
    const parsed = JSON.parse(raw);
    return { success: true, data: { id: parsed.id, video_id: parsed.video_id } };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function pollVideoStatus(videoId: string): Promise<ApiResponse<any>> {
  if (!AGNES_API_KEY) {
    return { success: false, error: "API Key not configured" };
  }

  const options: https.RequestOptions = {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${AGNES_API_KEY}`,
    },
    rejectUnauthorized: false,
  };

  try {
    const raw = await httpsRequest(
      `${AGNES_API_BASE.replace("/v1", "")}/agnesapi?video_id=${videoId}`,
      options
    );
    const parsed = JSON.parse(raw);
    return { success: true, data: parsed };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { rejectUnauthorized: false }, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

export async function downloadVideo(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = require("fs").createWriteStream(destPath, { flags: "w" });
    https
      .get(url, { rejectUnauthorized: false }, (res) => {
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        require("fs").unlink(destPath).catch(() => {});
        reject(err);
      });
  });
}
