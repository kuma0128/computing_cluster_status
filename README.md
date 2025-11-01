# Computing Cluster Status Monitor

ローカルネットワーク内でクラスターごとの稼働率やディスク使用率を確認できる、モダンなWebアプリケーション

## ✨ 新機能 (v3.0.0)

- 📊 **Per-User Breakdown Chart** - ユーザー別リソース使用率の可視化
- 🔥 **Disk Heatmap** - ノードごとのディスク使用状況をヒートマップで表示
- 🏗️ **モジュラーアーキテクチャ** - app.js による統合管理
- 🔒 **Secrets管理** - sops/age による暗号化
- 🔍 **静的解析** - PHPStan & Psalm による型安全性
- ⚛️ **Vite/React 実装** - モダンなフロントエンド環境（完全実装済み）
- 🚀 **2つのフロントエンド** - クラシック版とモダン版を選択可能

## 🚀 クイックスタート

### クラシック版（ビルド不要）

```bash
# 依存関係のチェック
make install

# 開発環境のセットアップ（Docker起動まで自動）
make dev-setup

# ブラウザで http://localhost:8080 にアクセス
```

### モダン版（Vite/React/TypeScript）

```bash
# フル開発環境のセットアップ
make dev-full

# Vite dev serverを起動
make frontend-dev

# ブラウザで http://localhost:3000 にアクセス
```

### 高度な機能を使う

```bash
# 静的解析を実行（PHP）
make static-analysis

# フロントエンドの型チェック
make frontend-type-check

# シークレットを復号化
make decrypt-secrets

# フロントエンドをビルド
make frontend-build
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
│  PHP API        │  /api/metrics.php (総合)
│  (提供)         │  /api/cluster.php (クラスタ別) ← NEW!
└────────┬────────┘  - PHPStan/Psalm でチェック済み
         │           - ストレージ抽象化層
         │           - JSON / KyotoCabinet 対応
         ▼
┌─────────────────┐
│  Frontend       │  js/app.js (統合管理) ← NEW!
│  (描画)         │  - ES6 modules
└─────────────────┘  - モジュラーチャート
                     - Per-User Breakdown ← NEW!
                     - Disk Heatmap ← NEW!
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
│   └── index.php       # フロントエンド (jQuery不使用)
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

#### メトリクスAPI
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

#### クラスタAPI（新規）
```bash
# クラスタ概要
curl http://localhost:8080/api/cluster.php?name=asuka&type=overview

# ユーザー別使用率
curl http://localhost:8080/api/cluster.php?name=asuka&type=users

# ディスク使用状況
curl http://localhost:8080/api/cluster.php?name=asuka&type=disk

# 履歴データ
curl http://localhost:8080/api/cluster.php?name=asuka&type=history&days=7
```

## 🧪 テスト

### すべてのチェックを実行（CI/CDと同等）

```bash
# バックエンド + フロントエンドの全チェック
make check-all

# バックエンドのみ
make check-backend

# フロントエンドのみ
make check-frontend
```

### 個別のテスト

```bash
# Shell スクリプトのリント
make lint-shell

# PHP 構文チェック
make lint-php

# JSON ファイルの検証
make test-json

# 静的解析（Composer必要）
make static-analysis  # PHPStan + Psalm
make phpstan          # PHPStan のみ
make psalm            # Psalm のみ

# フロントエンドのテスト
make frontend-type-check  # TypeScript型チェック
make frontend-lint        # ESLint
make frontend-build       # ビルドテスト
```

### Docker経由でのチェック（Composer/Nodeなしでも可）

```bash
# PHPStan/Psalm をDockerで実行
make docker-phpstan
make docker-psalm

# すべてのバックエンドチェックをDockerで実行
make docker-check-backend
```

詳細は [LOCAL_CHECK.md](LOCAL_CHECK.md) を参照してください。

## 🔄 CI/CD

GitHub Actions による自動テストパイプライン（全9ジョブ）：

**バックエンド:**
- ✅ ShellCheck - シェルスクリプト静的解析
- ✅ PHP Lint (8.1, 8.2, 8.3) - PHP構文チェック
- ✅ PHPStan (Level 8) - PHP静的解析
- ✅ Psalm (Level 3) - PHP型チェック
- ✅ JSON Validation - JSONファイル検証
- ✅ Docker Build - Dockerビルドテスト

**フロントエンド:**
- ✅ TypeScript Type Check - 型チェック
- ✅ Frontend ESLint - コード品質チェック
- ✅ Frontend Build Test - ビルドテスト

すべてのプッシュとプルリクエストで自動実行されます。

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

### シークレット管理（新規）

```bash
# シークレットの復号化
make decrypt-secrets

# シークレットの暗号化
make encrypt-secret FILE=secrets/.env

# 手動での暗号化/復号化
sops -e secrets/.env > secrets/.env.enc
sops -d secrets/.env.enc > secrets/.env
```

詳細は `secrets/README.md` を参照。

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

## 📚 ドキュメント

- [ARCHITECTURE.md](ARCHITECTURE.md) - システムアーキテクチャ
- [ADVANCED_REFACTORING.md](docs/ADVANCED_REFACTORING.md) - 高度なリファクタリングガイド
- [MIGRATION.md](MIGRATION.md) - 移行ガイド
- [QUICKSTART.md](QUICKSTART.md) - クイックスタート
- [BUGFIX_SUMMARY.md](BUGFIX_SUMMARY.md) - バグ修正サマリー

## 🔗 関連リンク

- [PHPStan Documentation](https://phpstan.org/)
- [Psalm Documentation](https://psalm.dev/)
- [SOPS](https://github.com/mozilla/sops)
- [age Encryption](https://github.com/FiloSottile/age)
- [D3.js](https://d3js.org/)

## 🙏 謝辞

- D3.js - データ可視化
- Nginx - Webサーバー
- PHP-FPM - アプリケーションサーバー
- PHPStan - 静的解析
- Psalm - 型チェック
- SOPS & age - シークレット管理
