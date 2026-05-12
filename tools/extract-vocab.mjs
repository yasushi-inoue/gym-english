// index.html から VOCAB を抽出する。
// VOCAB は1エントリ1行で書かれている前提（{ en: "...", chunks: [...], ... } の単一行）。
// 抽出後の各エントリは画像生成スクリプトでスラッグ・ファイル名生成に使う。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_HTML = path.resolve(__dirname, "..", "index.html");

// 英文を画像ファイル名用のスラッグに変換。
// 例: "Hop on the treadmill" → "hop-on-the-treadmill"
//     "Are you using this?"  → "are-you-using-this"
export function slugify(en) {
  return en
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 60);
}

export function extractVocab() {
  const html = fs.readFileSync(INDEX_HTML, "utf-8");
  const blockMatch = html.match(/const VOCAB\s*=\s*\{[\s\S]*?\n\};/);
  if (!blockMatch) {
    throw new Error("Could not locate VOCAB block in index.html");
  }
  const block = blockMatch[0];

  const entries = [];
  let currentLevel = null;
  for (const raw of block.split("\n")) {
    const line = raw.trim();
    const levelMatch = line.match(/^(beginner|intermediate)\s*:\s*\[/);
    if (levelMatch) {
      currentLevel = levelMatch[1];
      continue;
    }
    if (!currentLevel) continue;
    const enMatch = line.match(/^\{\s*en:\s*"([^"]+)"/);
    if (!enMatch) continue;
    const en = enMatch[1];
    const hint = (line.match(/hint:\s*"((?:[^"\\]|\\.)*)"/) || [])[1] || "";
    const cat = (line.match(/cat:\s*"([^"]+)"/) || [])[1] || "";
    const emoji = (line.match(/emoji:\s*"([^"]+)"/) || [])[1] || "";
    entries.push({
      level: currentLevel,
      en,
      hint: hint.replace(/\\"/g, '"'),
      cat,
      emoji,
      slug: slugify(en),
    });
  }
  return entries;
}

// CLI から直接呼ばれた場合のデバッグ出力
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  const entries = extractVocab();
  console.log(`Found ${entries.length} VOCAB entries:`);
  for (const e of entries) {
    console.log(`  [${e.level}/${e.cat}] ${e.slug.padEnd(40)} ← "${e.en}"`);
  }
}
