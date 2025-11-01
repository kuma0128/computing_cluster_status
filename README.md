# Computing Cluster Status Monitor

ローカルネットワーク内でクラスターごとの稼働率やディスク使用率を確認できるWebアプリケーション

## 🚀 クイックスタート

```bash
# 依存関係のチェック
make install

# 開発環境のセットアップ（Docker起動まで自動）
make dev-setup

# ブラウザで http://localhost:8080 にアクセス
```

## 📊 データフロー

```
┌─────────────────┐
│  Shell Scripts  │  sh/collect_metrics.sh
│   (収集)        │  - クラスタ情報収集
└────────┬────────┘  - 堅牢化済み (set -Eeuo pipefail)
         │
         ▼
┌─────────────────┐
│  JSON Files     │  data/*.json
│   (保存)        │  - 原子的書き込み (tmp → rename)
└────────┬────────┘  - load_average.json
         │           - pbs_usage.json
         │           - cpu_usage.json
         │           - nodes_alive.json
         ▼           - nodes_down.json
┌─────────────────┐
│  PHP API        │  /api/metrics.php
│  (提供)         │  - ストレージ抽象化層
└────────┬────────┘  - JSON / KyotoCabinet 対応
         │
         ▼
┌─────────────────┐
│  Frontend       │  php/index_new.php
│  (描画)         │  - fetch API (jQuery不使用)
└─────────────────┘  - D3.js による可視化
```

## 🏗️ アーキテクチャ

### ストレージ抽象化層

データストレージは抽象化されており、以下のバックエンドをサポート：

1. **JSON ファイル（デフォルト）**
   - 依存なし、シンプル
   - 原子的書き込み保証

2. **KyotoCabinet（オプション）**
   - 高速なキーバリューストア
   - 環境変数で切り替え可能

```php
// 環境変数で切り替え
STORAGE_TYPE=json        # デフォルト
STORAGE_TYPE=kyotocabinet # KyotoCabinet使用時
```

### ディレクトリ構造

```
.
├── docker/              # Docker設定
│   ├── nginx/          # Nginx設定
│   └── php/            # PHP-FPM Dockerfile
├── sh/                 # データ収集スクリプト
│   ├── lib/            # 共通ライブラリ
│   │   └── json_writer.sh  # JSON書き込みライブラリ
│   └── collect_metrics.sh  # メインの収集スクリプト
├── php/                # PHPアプリケーション
│   ├── lib/            # PHPライブラリ
│   │   └── Storage.php # ストレージ抽象化層
│   ├── api/            # APIエンドポイント
│   │   └── metrics.php # メトリクスAPI
│   └── index_new.php   # フロントエンド (jQuery不使用)
├── data/               # JSONデータ保存先
├── js/                 # JavaScriptライブラリ (D3.js)
├── css/                # スタイルシート
├── docker-compose.yml  # Docker Compose設定
└── Makefile           # 便利コマンド
```

## 🛠️ セットアップ

### 必要な環境

- Docker & Docker Compose
- jq (JSON処理用)
- ShellCheck (開発時のみ)

### インストール

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd computing_cluster_status

# 2. 依存関係をインストール
make install

# 3. Docker環境を起動
make docker-up

# 4. メトリクスを収集（オプション）
make collect-metrics
```

### 手動セットアップ（Docker不使用の場合）

```bash
# PHP 8.1以上が必要
php -v

# Webサーバーを起動（開発用）
cd php
php -S localhost:8000

# メトリクス収集スクリプトを実行
sh/collect_metrics.sh
```

## 📝 使用方法

### メトリクス収集

```bash
# 手動実行
./sh/collect_metrics.sh

# または Makeコマンド
make collect-metrics
```

### cronでの自動実行（本番環境）

```cron
# 1時間ごとにメトリクスを収集
0 * * * * /path/to/computing_cluster_status/sh/collect_metrics.sh
```

### API エンドポイント

```bash
# 現在のメトリクスを取得
curl http://localhost:8080/api/metrics.php?type=current

# ノード状態を取得
curl http://localhost:8080/api/metrics.php?type=nodes

# 負荷平均を取得
curl http://localhost:8080/api/metrics.php?type=load

# すべてのデータを取得
curl http://localhost:8080/api/metrics.php?type=all
```

## 🧪 テスト

```bash
# すべてのテストを実行
make test

# Shell スクリプトのリント
make lint-shell

# PHP 構文チェック
make lint-php

# JSON ファイルの検証
make test-json
```

## 🔧 開発

### Docker コマンド

```bash
# コンテナ起動
make docker-up

# コンテナ停止
make docker-down

# ログ表示
make docker-logs

# 再ビルド
make docker-rebuild
```

### ストレージバックエンドの変更

#### JSONファイル（デフォルト）

```bash
# 環境変数なしで使用
docker-compose up
```

#### KyotoCabinet

```bash
# docker-compose.yml の環境変数を設定
services:
  php-fpm:
    environment:
      - STORAGE_TYPE=kyotocabinet
      - STORAGE_PATH=/var/www/html/data/cluster.kch
```

### カスタムストレージの実装

`php/lib/Storage.php` の `StorageInterface` を実装することで、
独自のストレージバックエンドを追加できます：

```php
class CustomStorage implements StorageInterface {
    public function get(string $key): ?array { /* ... */ }
    public function set(string $key, array $data): bool { /* ... */ }
    // ...
}

// StorageFactory に追加
class StorageFactory {
    public static function create(string $type = 'json', array $config = []): StorageInterface {
        switch (strtolower($type)) {
            case 'custom':
                return new CustomStorage($config);
            // ...
        }
    }
}
```

## 🔒 セキュリティ

- CSRFトークンの実装（認証機能使用時）
- 入力値のサニタイゼーション
- JSONファイルへのディレクトリトラバーサル対策
- セキュリティヘッダーの設定（Nginx）

## 📦 デプロイ

### 本番環境

```bash
# Docker Composeで起動
docker-compose -f docker-compose.yml up -d

# または nginx + PHP-FPM を手動設定
# nginx 設定: docker/nginx/default.conf を参照
```

### 環境変数

```bash
# .env ファイルに設定
STORAGE_TYPE=json
STORAGE_PATH=/var/www/html/data
LOG_LEVEL=info
```

## 🤝 貢献

1. Fork する
2. Feature ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Request を作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 👥 作者

- 伊藤大晟
- 佐藤大和

## 🙏 謝辞

- D3.js - データ可視化
- Nginx - Webサーバー
- PHP-FPM - アプリケーションサーバー
