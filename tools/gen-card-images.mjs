// 各 VOCAB エントリのカードシーン画像を、キャラ参照画像と組み合わせて生成する。
// 出力は images/cards/{slug}.webp（WebPでサイズ圧縮）。
//
// 使い方:
//   node tools/gen-card-images.mjs                ... 未生成の全カードを生成
//   node tools/gen-card-images.mjs --force        ... 全件上書き再生成
//   node tools/gen-card-images.mjs --limit 3      ... 最初の3枚だけ生成（試運転に推奨）
//   node tools/gen-card-images.mjs --slug hop-on-the-treadmill  ... 指定スラッグ1枚だけ
//
// 重要: 先に `node tools/gen-characters.mjs` で参照画像を生成しておくこと。

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { CHARACTERS, pickCharacters } from "./characters.mjs";
import { buildScenePrompt } from "./style.mjs";
import { extractVocab } from "./extract-vocab.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHAR_DIR = path.resolve(__dirname, "characters");
const OUT_DIR = path.resolve(__dirname, "..", "images", "cards");
const MODEL = "gemini-3.1-flash-image-preview";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { force: false, limit: null, slug: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--force") opts.force = true;
    else if (args[i] === "--limit") opts.limit = parseInt(args[++i], 10);
    else if (args[i] === "--slug") opts.slug = args[++i];
  }
  return opts;
}

function requireApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "your_api_key_here") {
    console.error("ERROR: GEMINI_API_KEY is not set in .env");
    console.error("→ Copy .env.example to .env and fill in your key.");
    process.exit(1);
  }
  return key;
}

function loadCharacterRefs(characterIds) {
  return characterIds.map((id) => {
    const refPath = path.join(CHAR_DIR, `${id}.png`);
    if (!fs.existsSync(refPath)) {
      throw new Error(
        `Missing character portrait: ${refPath}\n  → Run "npm run gen:characters" first.`
      );
    }
    return {
      inlineData: {
        mimeType: "image/png",
        data: fs.readFileSync(refPath).toString("base64"),
      },
    };
  });
}

async function generateScene(ai, card, characterIds, outPath) {
  const refImages = loadCharacterRefs(characterIds);
  const prompt = buildScenePrompt(card, characterIds);

  const response = await ai.models.generateContent({
    model: MODEL,
    config: {
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: { imageSize: "1K", aspectRatio: "16:9" },
    },
    contents: [{ role: "user", parts: [...refImages, { text: prompt }] }],
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No content parts in response");

  for (const part of parts) {
    if (part.inlineData) {
      const pngBuffer = Buffer.from(part.inlineData.data, "base64");
      // WebP に変換して保存（PNG比で1/5〜1/10）。16:9 にリサイズ。
      await sharp(pngBuffer)
        .resize(960, 540, { fit: "cover" })
        .webp({ quality: 82 })
        .toFile(outPath);
      const stat = fs.statSync(outPath);
      const sizeKB = (stat.size / 1024).toFixed(0);
      console.log(`  ✓ ${path.basename(outPath)} (${sizeKB} KB) [${characterIds.join("+")}]`);
      return;
    }
  }

  const textMsg = parts.filter((p) => p.text).map((p) => p.text).join(" ");
  throw new Error(`No image generated: ${textMsg || "(empty response)"}`);
}

async function generateWithRetry(ai, card, characterIds, outPath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateScene(ai, card, characterIds, outPath);
    } catch (err) {
      const msg = err?.message || String(err);
      if (msg.includes("SAFETY") || msg.includes("blocked")) {
        console.warn(`  ⚠ safety filter — skipping this card`);
        return null;
      }
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
  const opts = parseArgs();

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 参照画像の存在確認
  for (const c of CHARACTERS) {
    const refPath = path.join(CHAR_DIR, `${c.id}.png`);
    if (!fs.existsSync(refPath)) {
      console.error(`ERROR: missing ${refPath}`);
      console.error("→ Run `npm run gen:characters` first to generate character reference images.");
      process.exit(1);
    }
  }

  const allEntries = extractVocab();
  let entries = allEntries;
  if (opts.slug) entries = entries.filter((e) => e.slug === opts.slug);
  if (opts.limit) entries = entries.slice(0, opts.limit);

  if (entries.length === 0) {
    console.error("No matching entries.");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log(`Generating ${entries.length} card scene image(s) to ${OUT_DIR}`);
  console.log(`Force regenerate: ${opts.force ? "YES" : "no (skipping existing)"}\n`);

  let generated = 0;
  let skipped = 0;
  for (let i = 0; i < entries.length; i++) {
    const card = entries[i];
    const outPath = path.join(OUT_DIR, `${card.slug}.webp`);
    if (!opts.force && fs.existsSync(outPath)) {
      console.log(`  → ${card.slug}.webp exists, skip`);
      skipped++;
      continue;
    }
    const characters = pickCharacters(card, i);
    console.log(`▶ [${i + 1}/${entries.length}] ${card.slug}  ← "${card.en}"`);
    await generateWithRetry(ai, card, characters, outPath);
    generated++;
    // レート制限回避
    if (i < entries.length - 1) await new Promise((r) => setTimeout(r, 5000));
  }

  console.log(`\nDone. Generated: ${generated}, skipped: ${skipped}`);
  if (generated > 0) {
    console.log("→ Open index.html in the browser to see images on the cards.");
    console.log("→ Commit images/cards/*.webp to git so GitHub Pages serves them.");
  }
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
