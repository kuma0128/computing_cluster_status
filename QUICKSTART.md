# クイックスタートガイド

## 最短距離でセットアップ

### 前提条件

- Docker & Docker Compose がインストール済み
- ポート 8080 が空いている

### 3ステップでスタート

```bash
# 1. 依存関係チェック
make install

# 2. 開発環境起動
make dev-setup

# 3. ブラウザでアクセス
open http://localhost:8080
```

これで完了！サンプルデータが表示されます。

## データフロー確認

```bash
# メトリクスを収集（サンプルデータ生成）
make collect-metrics

# APIエンドポイントを確認
curl http://localhost:8080/api/metrics.php?type=current | jq

# ノード状態を確認
curl http://localhost:8080/api/metrics.php?type=nodes | jq
```

## ディレクトリ構造

```
computing_cluster_status/
│
├── sh/                        # データ収集スクリプト
│   ├── lib/json_writer.sh    # JSON書き込みライブラリ
│   └── collect_metrics.sh    # メトリクス収集
│
├── data/                      # JSONデータ (自動生成)
│   ├── load_average.json     # 負荷平均
│   ├── pbs_usage.json        # PBS使用率
│   ├── cpu_usage.json        # CPU使用率
│   ├── nodes_alive.json      # 稼働ノード
│   └── nodes_down.json       # ダウンノード
│
├── php/                       # PHPアプリケーション
│   ├── lib/Storage.php       # ストレージ抽象化
│   ├── api/metrics.php       # REST API
│   └── index.php             # フロントエンド
│
└── docker-compose.yml         # Docker設定
```

## 主要コマンド

```bash
# Docker管理
make docker-up        # 起動
make docker-down      # 停止
make docker-logs      # ログ表示
make docker-rebuild   # 再ビルド

# テスト
make test            # すべてのテスト
make lint-shell      # シェルスクリプトリント
make lint-php        # PHP構文チェック
make test-json       # JSON検証

# メトリクス
make collect-metrics # データ収集
```

## トラブルシューティング

### ポート競合

```bash
# ポート8080が使われている場合
# docker-compose.yml を編集
services:
  nginx:
    ports:
      - "8081:80"  # 変更
```

### データが表示されない

```bash
# サンプルデータを再生成
cat > data/load_average.json <<EOF
[{"cluster": "test", "value": 50.0, "timestamp": "2025-11-01T12:00:00Z"}]
EOF

# APIをテスト
curl http://localhost:8080/api/metrics.php?type=load
```

### コンテナが起動しない

```bash
# ログを確認
docker-compose logs

# クリーンな状態から再起動
make docker-down
make docker-rebuild
```

## 次のステップ

1. **本番環境のメトリクス収集**
   - `sh/collect_metrics.sh` をカスタマイズ
   - PBS/クラスター情報の取得ロジックを実装

2. **自動更新の設定**
   ```bash
   # crontabに追加
   0 * * * * /path/to/sh/collect_metrics.sh
   ```

3. **認証の追加**
   - `php/login.php` を活用
   - nginx の basic auth を設定

4. **KyotoCabinet への移行**
   ```bash
   # docker-compose.yml
   environment:
     - STORAGE_TYPE=kyotocabinet
   ```

## ヘルプ

```bash
# 利用可能なコマンドを表示
make help
```

詳細は [README.md](README.md) を参照してください。
