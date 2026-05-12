# gym-english

ジム英語学習アプリ。iPhoneでサッと開いてジム英会話のチャンク学習＋AIロールプレイができる、単一HTMLアプリ。

公開URL: https://yasushi-inoue.github.io/gym-english/

---

## アプリ本体（index.html）

特別なビルドは不要。`index.html` をブラウザで開けば動く。VS Code Live Server 拡張で開くのが推奨。

- HOME：進捗とその日のフレーズ
- CARDS：チャンク（意味の塊）単位のフラッシュカード。シャドーイング機能つき
- ROLEPLAY：Claude API を呼んでジム仲間役と英語チャット

---

## 画像生成パイプライン（Phase 2）

カードに「場面イラスト」を表示するための、Gemini Image Preview による事前生成ツール群。
GitHub Pages からは静的画像として配信され、実行時に API は呼ばない。

### マスコットキャラ

毎カード同じ3人が登場することで親しみやすさを出している：

- **Marcus** — 笑顔の青年、オレンジ・タンクトップ
- **Aya** — ポニーテール、ティールブルーのスポーツタンク
- **Coach Joe** — 髭のベテラントレーナー、グレーのポロシャツ

### セットアップ（初回のみ）

1. **API キー取得**：https://aistudio.google.com/apikey で無料キーを発行
2. **`.env` 作成**：

   ```bash
   cp .env.example .env
   ```

   `.env` を開いて `GEMINI_API_KEY=` に取得したキーを貼り付け。`.env` は `.gitignore` 済みなので絶対にコミットされない。
3. **依存インストール**：

   ```bash
   npm install
   ```

### キャラ参照画像の生成（1回だけ）

```bash
npm run gen:characters
```

`tools/characters/{marcus,aya,joe}.png` に各キャラのポートレートが保存される。気に入らなければ `node tools/gen-characters.mjs --force` で再生成。

### カード場面画像の生成

まず3枚だけ試運転して、スタイルが好みかチェック：

```bash
npm run gen:cards:limit
```

問題なければ全件（40枚）：

```bash
npm run gen:cards
```

`images/cards/{slug}.webp` に保存される。既存ファイルはスキップされるので、何度実行しても増えるだけ。

その他のオプション：

```bash
node tools/gen-card-images.mjs --force                 # 全件再生成
node tools/gen-card-images.mjs --slug hop-on-the-treadmill   # 1枚だけ
```

### 画像のコミット

生成された `images/cards/*.webp`（と参照したいなら `tools/characters/*.png`）は git にコミットして push。GitHub Pages 側で自動的に配信される。

```bash
git add images/cards/ tools/characters/
git commit -m "画像生成：カードシーン40枚を追加"
git push
```

`index.html` 側は `images/cards/{slug}.webp` を自動で参照し、画像が無いカードは絵文字プレースホルダーを表示する設計なので、画像追加は段階的でOK（3枚だけ生成→push、後日残りを生成→push でも問題なし）。

### コスト目安

Gemini 3.1 Flash Image Preview ≒ 1枚 $0.04。

- キャラ参照3枚: $0.12
- カード40枚: $1.60
- 合計約 $2

### セキュリティ・運用上の注意

- `.env` は絶対にコミットしない（`.gitignore` 済）
- API キーが漏洩した場合は AI Studio で即座にリボーク（無料で再発行可能）
- 生成スクリプトはローカルでのみ実行する。CI/CD に乗せたい場合はキーをシークレットに登録すること
- 5秒間隔でリクエストするので、40枚生成に約4分かかる
- 安全性フィルタでブロックされたカードはスキップされる（コンソールに警告が出る）
