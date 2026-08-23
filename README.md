# Bezart Official Website

Bezart音楽制作ソフトウェアの公式ウェブサイト

## プロジェクト構成

```
Bezart/
├── index.html              # トップページ
├── components/
│   └── navbar.html        # 共通メニューバー
├── css/
│   ├── style.css          # メインスタイル
│   └── navbar.css         # メニューバースタイル
├── js/
│   ├── navbar.js          # メニューバー読み込み＆機能
│   └── search.js          # 検索機能
├── assets/
│   ├── Bezart.png         # ロゴ
│   └── images/            # その他画像
├── docs/                  # ドキュメントセクション
│   ├── index.html
│   ├── installation/
│   └── usage/
├── products/              # 製品情報セクション
│   ├── index.html
│   ├── pro/
│   └── features/
├── login/                 # ログイン画面
│   └── index.html
├── search-index.json      # 検索インデックス
└── worker.js              # 認証システム（Cloudflare Worker）
```

## 特徴

- **Apple風デザイン**: モダンでクリーンなUIデザイン
- **共通メニューバー**: 全ページで共有されるナビゲーション
- **動的検索**: リアルタイムサイト内検索機能
- **レスポンシブ対応**: モバイルファーストデザイン
- **URL階層構造**: GitHub Pages対応のディレクトリ構造
- **認証統合**: Cloudflare Worker + Supabase認証

## セットアップ

### ローカル開発

1. リポジトリをクローン
2. ローカルサーバーを起動:

```bash
# Python 3
python -m http.server 8000

# Node.js (http-serverを使用)
npx http-server -p 8000
```

3. ブラウザで `http://localhost:8000` にアクセス

### GitHub Pages デプロイ

1. GitHubリポジトリを作成
2. Settings > Pages でソースを設定
3. `main` ブランチからデプロイ
4. サイトは `https://username.github.io/Bezart/` で公開

## 新しいページを追加する方法

### 1. HTMLファイルを作成

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ページタイトル - Bezart</title>
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <div id="navbar-container"></div>
  
  <main class="main-content">
    <!-- コンテンツ -->
  </main>

  <script src="../js/navbar.js"></script>
  <script src="../js/search.js"></script>
</body>
</html>
```

### 2. メニューバーにリンクを追加

`components/navbar.html` を編集:

```html
<li class="navbar-item">
  <a href="/Bezart/your-page/" class="navbar-link">Your Page</a>
</li>
```

### 3. 検索インデックスに追加

`search-index.json` を編集:

```json
{
  "pages": [
    {
      "title": "Your Page",
      "url": "/Bezart/your-page/",
      "description": "ページの説明",
      "keywords": ["keyword1", "keyword2"]
    }
  ]
}
```

## 認証システムの設定

ログイン機能を使用するには:

1. `worker.js` をCloudflare Workerにデプロイ
2. `login/index.html` の `WORKER_URL` を実際のWorker URLに更新
3. Supabaseプロジェクト設定を確認

## カスタマイズ

### スタイルの変更
- `css/style.css` - メインスタイル
- `css/navbar.css` - メニューバースタイル

### メニューバーの変更
- `components/navbar.html` - メニューバー構造

### 検索機能の調整
- `search-index.json` - 検索対象ページ
- `js/search.js` - 検索ロジック

## ブラウザサポート

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## ライセンス

Copyright © 2024 Bezart. All rights reserved.