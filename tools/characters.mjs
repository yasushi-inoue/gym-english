// ジム仲間マスコットキャラクター定義。
// 各キャラの参照画像（portrait）を tools/gen-characters.mjs で1度だけ生成し、
// その画像を tools/gen-card-images.mjs で参照画像として読み込んで各シーンを描く。
// → どのカードでも「同じ人」が場面に登場することで、親しみやすい一貫性を作る。

export const CHARACTERS = [
  {
    id: "marcus",
    name: "Marcus",
    description:
      "A friendly young man in his late 20s with warm brown skin, short curly black hair, and a confident relaxed smile. Athletic but approachable build (not heavily muscular). Wears a bright orange sleeveless gym tank top and dark gray shorts. Sometimes wears a thin yellow sweatband on his forehead.",
    portraitPrompt:
      "Full-body character reference sheet, standing pose, facing forward, neutral background. Character: a friendly young man in his late 20s with warm brown skin, short curly black hair, and a confident relaxed smile. Athletic but approachable build (NOT heavily muscular). Wears a bright orange sleeveless gym tank top and dark charcoal-gray athletic shorts. A thin yellow sweatband on his forehead. Bare arms, normal cartoon hands at his sides, white sneakers.",
  },
  {
    id: "aya",
    name: "Aya",
    description:
      "A friendly young woman in her late 20s with light tan skin, long black hair tied in a high ponytail, and a bright cheerful smile. Slim athletic build. Wears a light teal-blue sports tank top and dark navy leggings.",
    portraitPrompt:
      "Full-body character reference sheet, standing pose, facing forward, neutral background. Character: a friendly young woman in her late 20s with light tan skin, long straight black hair tied in a high ponytail, bright cheerful smile, slim athletic build. Wears a fitted light teal-blue sports tank top and dark navy ankle-length leggings. Normal cartoon hands at her sides, white-and-pink sneakers.",
  },
  {
    id: "joe",
    name: "Coach Joe",
    description:
      "A fresh, friendly young athletic coach in his early 30s with light skin, short neat black hair (clean style), a clean-shaven face, and a bright confident smile. Solid sturdy build, broad-shouldered and visibly strong (gym coach physique). Wears a clean fitted light-blue short-sleeve athletic t-shirt and dark charcoal shorts. A simple silver whistle on a navy lanyard around his neck.",
    portraitPrompt:
      "Full-body character reference sheet, standing pose, facing forward, neutral background. Character: a fresh and friendly young athletic coach in his early 30s with light skin, short neat black hair (clean modern style, slightly tousled on top, NOT salt-and-pepper, NOT gray), a completely clean-shaven face (absolutely NO beard, NO mustache, NO stubble), bright confident warm smile. Solid sturdy build: broad-shouldered, thick chest and arms, visibly strong (a gym coach physique — substantial, NOT slim, NOT lean). Wears a clean fitted light-blue short-sleeve athletic t-shirt with a small ribbed crew neck, and dark charcoal-gray knee-length athletic shorts. A simple silver whistle hanging on a navy-blue lanyard around his neck. Normal cartoon hands at his sides, clean white sneakers.",
  },
];

// カードのカテゴリと文脈から、登場キャラを自動的に選ぶ。
// 一人登場の場面が多いほどキャラが立つので、phrase（会話）だけ2人にする。
// indexに応じてローテーションさせ、3人とも均等に出すようにする。
export function pickCharacters(card, index) {
  const all = CHARACTERS.map((c) => c.id);
  if (card.cat === "phrase") {
    const first = all[index % all.length];
    const second = all[(index + 1) % all.length];
    return [first, second];
  }
  return [all[index % all.length]];
}
