# マイグレーションガイド

このドキュメントは、旧バージョンから新しいアーキテクチャへの移行方法を説明します。

## 主な変更点

### 1. データベース → JSON ファイル

**旧:** MySQL データベースにメトリクスを保存
**新:** `data/*.json` ファイルにメトリクスを保存

#### 利点
- データベースサーバー不要
- セットアップが簡単
- バックアップが容易
- バージョン管理可能

#### 移行手順

```bash
# 1. 既存のデータをエクスポート（必要に応じて）
# MySQLから既存データをJSON形式でエクスポート

# 2. 新しいスクリプトでデータ収集を開始
./sh/collect_metrics.sh

# 3. 古いcronジョブを無効化
# crontab -e で編集

# 4. 新しいcronジョブを追加
0 * * * * /path/to/computing_cluster_status/sh/collect_metrics.sh
```

### 2. jQuery → fetch + D3

**旧:** jQuery を使用したAJAX通信
**新:** ネイティブ fetch API を使用

#### 利点
- 依存ライブラリが減少
- パフォーマンス向上
- モダンなJavaScript

#### 移行手順

```bash
# 旧 index.php をバックアップ
cp php/index.php php/index.php.old

# 新 index_new.php を使用
mv php/index_new.php php/index.php
```

### 3. シェルスクリプトの堅牢化

**旧:** エラーハンドリングなし
**新:** `set -Eeuo pipefail` による厳格なエラーハンドリング

#### 変更内容
- エラー時に即座に停止
- 未定義変数の使用を防止
- パイプラインのエラーを検出
- 原子的なJSON書き込み

### 4. ストレージ抽象化

**新:** プラガブルなストレージバックエンド

```php
// JSON (デフォルト)
$storage = StorageFactory::create('json');

// KyotoCabinet (オプション)
$storage = StorageFactory::create('kyotocabinet');
```

## データ形式

### 負荷平均 (load_average.json)

```json
[
  {
    "cluster": "cluster1",
    "value": 45.67,
    "timestamp": "2025-11-01T12:00:00Z"
  },
  {
    "cluster": "cluster2",
    "value": 78.90,
    "timestamp": "2025-11-01T12:00:00Z"
  }
]
```

### PBS使用率 (pbs_usage.json)

```json
[
  {
    "cluster": "cluster1",
    "value": 60.12,
    "timestamp": "2025-11-01T12:00:00Z"
  }
]
```

### CPU使用率 (cpu_usage.json)

```json
[
  {
    "cluster": "cluster1",
    "value": "45/80",
    "timestamp": "2025-11-01T12:00:00Z"
  }
]
```

### ノード状態

**nodes_alive.json**
```json
["node1", "node2", "node3", "node4"]
```

**nodes_down.json**
```json
["node5"]
```

## 互換性

### 破壊的変更

1. **データベース依存の削除**
   - MySQL への接続が不要
   - 既存のDB設定は無視される

2. **API エンドポイントの変更**
   - `/api/metrics.php` が新しいエンドポイント
   - 旧 `ping.php` などは非推奨

3. **ファイル構造の変更**
   - `data/` ディレクトリにJSONファイルを配置
   - 旧 `cluster/` ディレクトリは使用しない

### 下位互換性

- 旧PHPファイル（`index.php`, `ping.php` など）は保持
- 必要に応じて段階的に移行可能

## トラブルシューティング

### データが表示されない

```bash
# 1. データファイルが存在するか確認
ls -la data/

# 2. JSONファイルの内容を確認
cat data/load_average.json

# 3. メトリクス収集を手動実行
./sh/collect_metrics.sh

# 4. PHPエラーログを確認
docker-compose logs php-fpm
```

### パーミッションエラー

```bash
# data/ ディレクトリの権限を修正
chmod 755 data/
chmod 644 data/*.json
```

### APIが404エラー

```bash
# nginx設定を確認
docker-compose exec nginx cat /etc/nginx/conf.d/default.conf

# nginxをリロード
docker-compose restart nginx
```

## ロールバック

新バージョンで問題が発生した場合：

```bash
# 1. 旧バージョンのファイルを復元
git checkout HEAD~1 -- php/index.php

# 2. 旧cronジョブを再有効化
crontab -e

# 3. Dockerコンテナを停止
docker-compose down
```

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
