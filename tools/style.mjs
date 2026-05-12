// 共通スタイル定義 + プロンプトビルダー。
// 全画像（キャラ参照・カードシーン）でこのスタイルガイドを冒頭に必ず含めることで、
// 40枚以上の画像が同じ世界観で揃う。

import { CHARACTERS } from "./characters.mjs";

export const STYLE_BASE = `Friendly flat illustration style for a gym/fitness learning app.

Style rules:
- Slightly deformed, cute character proportions (about 4.5 to 5 head-tall ratio), friendly round faces with simple expressive features (dot or bean-shaped eyes, simple eyebrows, clear smile lines)
- Flat coloring with subtle soft cell-shading shadows (NOT fully flat, NOT photorealistic 3D rendering)
- Bold dark outlines (1-2px) on characters AND on key gym equipment
- Warm, energetic color palette: deep charcoal background tones (#1a1a1a area), bright yellow-orange accents (#f5d547 / #ff5e3a), muted cream / brick / terracotta for environment
- Gym interior atmosphere: visible equipment (treadmills, racks, dumbbells, benches, mirrors) drawn with enough detail to be clearly recognizable, but slightly softened in the background
- Characters always have warm, approachable, encouraging expressions — this is a friendly gym, not an intimidating one
- Simple clear composition, the main subject is large and centered
- NOT photorealistic, NOT 3D rendered, NOT anime style, NOT watercolor, NOT pixel art

CRITICAL: The image must contain ZERO text. No letters, no numbers, no labels, no signs, no words in any language, no captions, no annotations, no speech bubbles, no logos on clothing or equipment, no weight numbers on plates. Every element must be purely visual/graphical only.`;

// 各カードのシーン生成時、参照画像と一緒にこの説明文を必ず含めて
// 「参照画像のキャラを再現してね」と明示する。
export const CHARACTER_REFERENCE_DESC = `The attached reference images show our 3 consistent gym-buddy mascot characters:
1. Marcus — a young man with warm brown skin, short curly black hair, big confident smile, orange sleeveless tank top, dark gray shorts, optional thin yellow sweatband
2. Aya — a young woman with light tan skin, long black hair in a high ponytail, bright cheerful smile, light teal-blue sports tank, dark navy leggings
3. Coach Joe — a fresh young athletic coach in his early 30s with light skin, short neat black hair, completely clean-shaven face (no beard, no stubble), bright friendly smile, solid sturdy broad-shouldered gym-coach build, light-blue fitted athletic t-shirt, dark charcoal shorts, silver whistle on a navy lanyard

CRITICAL: Reproduce these EXACT three characters with consistent facial features, hair, body proportions, and outfits across every illustration. Treat them as recurring cast members — viewers should immediately recognize the same person from card to card. Match their skin tones, hair, and clothing colors precisely as shown in the references.`;

// キャラ単体の参照画像（portrait）生成用プロンプト
export function buildPortraitPrompt(character) {
  return `${STYLE_BASE}

Generate a CHARACTER REFERENCE SHEET for use as a recurring mascot in a gym English learning app.

${character.portraitPrompt}

The pose is a neutral standing reference pose (T-pose-ish but relaxed and natural). The character should be clearly readable: face, hair, outfit, and full body all visible at once. Plain pale cream background (no gym equipment in this reference shot — keep it clean for use as a multimodal reference).

Square 1:1 composition, character centered, full body visible from head to feet with a small margin.

Remember: absolutely no text anywhere in the image. No letters or numbers on clothing.`;
}

// カードシーン生成用プロンプト
export function buildScenePrompt(card, characterIds) {
  const characterNames = characterIds
    .map((id) => CHARACTERS.find((c) => c.id === id)?.name)
    .filter(Boolean);

  const castLine =
    characterNames.length === 1
      ? `Featured character: ${characterNames[0]} (use the exact design from the reference images).`
      : `Featured characters: ${characterNames.join(" and ")} (use the exact designs from the reference images, both visible in the scene together).`;

  return `${STYLE_BASE}

${CHARACTER_REFERENCE_DESC}

${castLine}

SCENE TO DEPICT
English phrase: "${card.en}"
Context / meaning: ${card.hint}

Show the character(s) in a gym setting actually doing or saying this phrase, with body language and facial expression that matches the situation. Include relevant gym equipment or environment to make the scene clearly readable at a glance. The mood should feel friendly, encouraging, and lightly energetic — like a positive social moment between gym regulars.

Composition: 16:9 horizontal aspect ratio, character(s) prominent in the foreground, gym environment in the background. Frame from roughly chest-up if a single character (the head and shoulders should be clearly visible); wider framing showing both characters if two characters are interacting.

Remember: absolutely no text anywhere in the image. No letters, numbers, labels, brand logos, or signs.`;
}
