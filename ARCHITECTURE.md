# アーキテクチャドキュメント

## プロジェクト構成

```
computing_cluster_status/
│
├── frontend/                    # フロントエンド（段階的移行）
│   ├── classic/                # ビルド不要版（現行）
│   │   ├── js/
│   │   │   ├── app.js         # メインアプリケーション
│   │   │   ├── api/           # API クライアント
│   │   │   ├── charts/        # チャートモジュール
│   │   │   └── utils/         # ユーティリティ
│   │   ├── css/
│   │   └── index.html
│   │
│   └── modern/                 # Vite/React版（移行先）
│       ├── src/
│       ├── vite.config.js
│       └── package.json
│
├── backend/                    # バックエンド
│   ├── php/
│   │   ├── api/               # APIエンドポイント
│   │   │   ├── metrics.php   # メトリクスAPI
│   │   │   └── cluster.php   # クラスタAPI
│   │   ├── lib/               # ライブラリ
│   │   │   └── Storage.php
│   │   └── public/            # 公開ディレクトリ
│   │
│   ├── phpstan.neon           # PHPStan設定
│   ├── psalm.xml              # Psalm設定
│   └── composer.json          # PHP依存関係
│
├── scripts/                    # データ収集スクリプト
│   ├── sh/
│   └── lib/
│
├── data/                       # データストレージ
├── secrets/                    # 暗号化された秘密情報
│   ├── .env.enc               # sopsで暗号化
│   └── .sops.yaml             # sops設定
│
├── docker/                     # Docker設定
├── .github/workflows/          # CI/CD
└── docs/                       # ドキュメント
```

## フロントエンド段階的移行戦略

### Phase 1: ビルド不要版の完成（現在）
- ES6 modules を使用
- ビルドステップなし
- ブラウザで直接実行
- D3.js による可視化

### Phase 2: 段階的モダナイゼーション
- app.js でアプリケーション統合
- モジュール化されたチャート
- TypeScript型定義追加（JSDoc）

### Phase 3: Vite/React移行（オプション）
- 並行開発可能
- 段階的な機能移行
- 完全移行まで両方サポート

## チャートアーキテクチャ

### ベースチャートクラス
```javascript
class BaseChart {
  constructor(containerId, options)
  render(data)
  update(data)
  clear()
  resize()
}
```

### 実装チャート
1. **ClusterOverviewChart** - クラスタ概要
2. **PerUserBreakdownChart** - ユーザー別使用率
3. **DiskHeatmapChart** - ディスク使用量ヒートマップ
4. **TimeSeriesChart** - 時系列グラフ

## API設計

### RESTful エンドポイント

```
GET  /api/metrics?type=current          # 現在のメトリクス
GET  /api/metrics?type=nodes            # ノード状態
GET  /api/cluster/:name                 # 特定クラスタの詳細
GET  /api/cluster/:name/users           # クラスタのユーザー別使用率
GET  /api/cluster/:name/disk            # クラスタのディスク使用量
GET  /api/cluster/:name/history?days=7  # 履歴データ
```

### レスポンス形式

```json
{
  "data": { /* 実データ */ },
  "meta": {
    "timestamp": "2025-11-01T12:00:00Z",
    "has_data": true,
    "is_dummy": false,
    "cache_hit": false
  },
  "links": {
    "self": "/api/cluster/asuka",
    "users": "/api/cluster/asuka/users"
  }
}
```

## 静的解析

### PHPStan
- Level: 8 (最高レベル)
- 型チェック
- null安全性
- 未使用コード検出

### Psalm
- 型推論
- セキュリティ分析
- より厳密な型チェック

## Secrets管理

### sops + age

```yaml
# .sops.yaml
creation_rules:
  - path_regex: secrets/.*\.env$
    age: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
```

```bash
# 暗号化
sops -e secrets/.env > secrets/.env.enc

# 復号化
sops -d secrets/.env.enc > secrets/.env
```

## データフロー

```
┌─────────────────────┐
│  Data Collection    │  sh/collect_metrics.sh
│  (cron/systemd)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  JSON Storage       │  data/*.json
│  (or KyotoCabinet)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  PHP API            │  /api/*
│  (Storage Layer)    │  - PHPStan/Psalm checked
└──────────┬──────────┘  - Type-safe
           │
           ▼
┌─────────────────────┐
│  Frontend           │  app.js
│  (ES6 Modules)      │  - ModularCharts
└─────────────────────┘  - Type hints (JSDoc)
```

## セキュリティ

1. **入力検証**
   - すべてのAPI入力をサニタイズ
   - PHPStan/Psalmで型安全性保証

2. **認証/認可**
   - JWT トークン（オプション）
   - セッションベース認証

3. **CORS設定**
   - 許可されたオリジンのみ
   - 適切なヘッダー設定

4. **Secrets管理**
   - sops/age で暗号化
   - 平文の秘密情報をGitにコミットしない

## パフォーマンス

1. **キャッシング**
   - APIレスポンスのキャッシュ
   - ブラウザキャッシュ活用

2. **遅延ロード**
   - チャートの遅延描画
   - データの段階的読み込み

3. **最適化**
   - D3.jsの効率的な使用
   - 不要な再描画を避ける

## テスト戦略

```
tests/
├── php/
│   ├── Unit/              # PHPユニットテスト
│   ├── Integration/       # 統合テスト
│   └── phpunit.xml
│
├── frontend/
│   ├── unit/              # JavaScriptユニットテスト
│   └── e2e/               # E2Eテスト
│
└── scripts/
    └── shellcheck/        # シェルスクリプト検証
```

## デプロイ

### 開発環境
```bash
make dev-setup
```

### 本番環境
```bash
# Secrets復号化
sops -d secrets/.env.enc > .env

# デプロイ
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD
- GitHub Actions
- PHPStan/Psalm自動チェック
- ShellCheck
- E2Eテスト

---

このアーキテクチャは段階的な改善を可能にし、将来的な拡張にも対応できます。
