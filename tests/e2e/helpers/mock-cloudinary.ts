import { createServer, type IncomingMessage, type Server } from "node:http";

import { signParams } from "../../../lib/uploads/signature";

/**
 * Local stand-in for Cloudinary's REST API used by the e2e suite.
 *
 * It verifies every request's signature with the shared secret exactly as
 * Cloudinary does, so a passing test proves the app signs uploads, deletes
 * and private download links correctly — without real credentials.
 */

export const MOCK = {
  port: 4599,
  cloudName: "apon-test",
  apiKey: "test-key",
  apiSecret: "test-secret-0123456789",
};

export interface StoredAsset {
  publicId: string;
  resourceType: string;
  type: string;
  format: string;
  data: Buffer;
  params: Record<string, string>;
}

export interface MockCloudinary {
  assets: Map<string, StoredAsset>;
  uploads: StoredAsset[];
  destroyed: string[];
  rejected: string[];
  close: () => Promise<void>;
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

const FORMATS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "application/pdf": "pdf" };

export async function startMockCloudinary(): Promise<MockCloudinary> {
  const state: MockCloudinary = { assets: new Map(), uploads: [], destroyed: [], rejected: [], close: async () => {} };

  const server: Server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${MOCK.port}`);
    const send = (status: number, body: unknown, type = "application/json") => {
      res.writeHead(status, { "content-type": type });
      res.end(type === "application/json" ? JSON.stringify(body) : (body as Buffer));
    };
    const [, version, cloud, resourceType, action] = url.pathname.split("/");
    if (version !== "v1_1" || cloud !== MOCK.cloudName) return send(404, { error: { message: "Unknown cloud" } });

    // ------------------------------------------------ signed private download
    if (req.method === "GET" && action === "download") {
      const params = Object.fromEntries(url.searchParams);
      const { signature, api_key, ...rest } = params;
      if (api_key !== MOCK.apiKey || signParams(rest, MOCK.apiSecret) !== signature) {
        state.rejected.push("download:signature");
        return send(401, { error: { message: "Invalid signature" } });
      }
      if (Number(rest.expires_at) < Date.now() / 1000) return send(401, { error: { message: "Expired" } });
      const asset = state.assets.get(rest.public_id);
      if (!asset || asset.type !== "authenticated") return send(404, { error: { message: "Not found" } });
      return send(200, asset.data, asset.format === "pdf" ? "application/pdf" : `image/${asset.format}`);
    }

    if (req.method !== "POST") return send(405, { error: { message: "Method not allowed" } });

    const body = await readBody(req);
    const form = await new Request(url, { method: "POST", headers: req.headers as HeadersInit, body: new Uint8Array(body) }).formData();
    const params: Record<string, string> = {};
    let file: File | null = null;
    for (const [k, v] of form.entries()) {
      if (typeof v === "string") params[k] = v;
      else file = v;
    }
    const { signature, api_key, ...signed } = params;
    if (api_key !== MOCK.apiKey || signParams(signed, MOCK.apiSecret) !== signature) {
      state.rejected.push(`${action}:signature`);
      return send(401, { error: { message: "Invalid Signature" } });
    }

    if (action === "upload") {
      if (!file) return send(400, { error: { message: "Missing file" } });
      const data = Buffer.from(await file.arrayBuffer());
      const publicId = `${params.folder}/${params.public_id}`;
      const format = FORMATS[file.type] ?? "bin";
      const type = params.type ?? "upload";
      const asset: StoredAsset = { publicId, resourceType, type, format, data, params };
      state.assets.set(publicId, asset);
      state.uploads.push(asset);
      const ext = resourceType === "raw" ? "" : `.${format}`;
      return send(200, {
        public_id: publicId,
        version: 1700000000,
        resource_type: resourceType,
        type,
        format,
        bytes: data.byteLength,
        width: resourceType === "image" ? 64 : undefined,
        height: resourceType === "image" ? 64 : undefined,
        secure_url: `https://res.cloudinary.com/${MOCK.cloudName}/${resourceType}/${type}/v1700000000/${publicId}${ext}`,
      });
    }

    if (action === "destroy") {
      state.destroyed.push(params.public_id);
      state.assets.delete(params.public_id);
      return send(200, { result: "ok" });
    }

    return send(404, { error: { message: "Unknown action" } });
  });

  await new Promise<void>((resolve) => server.listen(MOCK.port, "127.0.0.1", resolve));
  state.close = () => new Promise((resolve) => server.close(() => resolve()));
  return state;
}
