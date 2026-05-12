// Marcus / Aya / Coach Joe の参照画像（portrait）を1人ずつ生成する。
// 生成済みの画像は次のステップ（gen-card-images.mjs）で参照画像として使う。
//
// 使い方:
//   node tools/gen-characters.mjs           ... 未生成のキャラだけ生成
//   node tools/gen-characters.mjs --force   ... 上書き再生成

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { CHARACTERS } from "./characters.mjs";
import { buildPortraitPrompt } from "./style.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "characters");
const MODEL = "gemini-3.1-flash-image-preview";

function requireApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "your_api_key_here") {
    console.error("ERROR: GEMINI_API_KEY is not set in .env");
    console.error("→ Copy .env.example to .env and fill in your key from https://aistudio.google.com/apikey");
    process.exit(1);
  }
  return key;
}

async function generatePortrait(ai, character, outPath) {
  const prompt = buildPortraitPrompt(character);
  const response = await ai.models.generateContent({
    model: MODEL,
    config: {
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: { imageSize: "1K", aspectRatio: "1:1" },
    },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No content parts in response");

  for (const part of parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      // PNG として一旦保存（gen-card-images.mjs では PNG を参照画像として使う）
      fs.writeFileSync(outPath, buffer);
      const sizeKB = (buffer.length / 1024).toFixed(0);
      console.log(`  ✓ ${path.basename(outPath)} (${sizeKB} KB)`);
      return;
    }
  }

  const textMsg = parts
    .filter((p) => p.text)
    .map((p) => p.text)
    .join(" ");
  throw new Error(`No image generated: ${textMsg || "(empty response)"}`);
}

async function generateWithRetry(ai, character, outPath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generatePortrait(ai, character, outPath);
    } catch (err) {
      const msg = err?.message || String(err);
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        console.warn(`  ⚠ rate limit — waiting 30s (attempt ${attempt}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, 30000));
        continue;
      }
      if (attempt < maxRetries) {
        console.warn(`  ⚠ retry ${attempt}/${maxRetries}: ${msg}`);
        await new Promise((r) => setTimeout(r, 8000 * attempt));
      } else {
        throw err;
      }
    }
  }
}

async function main() {
  const apiKey = requireApiKey();
  const force = process.argv.includes("--force");

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const ai = new GoogleGenAI({ apiKey });

  console.log(`Generating ${CHARACTERS.length} character portraits to ${OUT_DIR}`);
  console.log(`Force regenerate: ${force ? "YES" : "no (skipping existing)"}\n`);

  for (const character of CHARACTERS) {
    const outPath = path.join(OUT_DIR, `${character.id}.png`);
    if (!force && fs.existsSync(outPath)) {
      console.log(`  → ${character.id}.png already exists, skipping`);
      continue;
    }
    console.log(`▶ ${character.name} (${character.id})`);
    await generateWithRetry(ai, character, outPath);
    // 連続リクエストでレート制限に当たらないよう少し休む
    await new Promise((r) => setTimeout(r, 5000));
  }

  console.log("\nDone. Review the portraits in tools/characters/ before running gen-card-images.");
  console.log("If any character looks off, re-run with --force to regenerate.");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
