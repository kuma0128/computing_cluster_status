# ローカルでのチェック手順

このドキュメントでは、ローカル環境でCIと同じチェックを実行する方法を説明します。

## 前提条件

以下のツールがインストールされていることを確認してください：

- Docker & Docker Compose
- jq
- shellcheck（オプション）
- Node.js 18+（フロントエンドチェック用）

## 1. ShellCheck

### Docker経由で実行

```bash
docker run --rm -v "$PWD:/mnt" koalaman/shellcheck:stable sh/*.sh
```

### ローカルで実行（shellcheckがインストール済みの場合）

```bash
make lint-shell
```

または

```bash
shellcheck sh/*.sh
```

### 特定のファイルのみチェック

```bash
shellcheck sh/stat.sh sh/oprate.sh
```

## 2. PHP構文チェック

### Docker経由で実行

```bash
docker run --rm -v "$PWD:/app" -w /app php:8.2-cli \
  sh -c 'find php -name "*.php" -print0 | xargs -0 -n1 php -l'
```

### Makeコマンド

```bash
make lint-php
```

## 3. PHPStan（PHP静的解析）

### Docker経由で実行

```bash
# Composerをインストールして実行
docker run --rm -v "$PWD:/app" -w /app composer:latest install --no-interaction --prefer-dist

docker run --rm -v "$PWD:/app" -w /app php:8.2-cli \
  sh -c './vendor/bin/phpstan analyse --memory-limit=256M'
```

### Makeコマンド（Composer必要）

```bash
make phpstan
```

### Docker Composeで実行

```bash
docker-compose run --rm php-fpm sh -c 'composer install && composer run phpstan'
```

## 4. Psalm（PHP型チェック）

### Docker経由で実行

```bash
# Composerをインストールして実行
docker run --rm -v "$PWD:/app" -w /app composer:latest install --no-interaction --prefer-dist

docker run --rm -v "$PWD:/app" -w /app php:8.2-cli \
  sh -c './vendor/bin/psalm --show-info=true'
```

### Makeコマンド（Composer必要）

```bash
make psalm
```

### Docker Composeで実行

```bash
docker-compose run --rm php-fpm sh -c 'composer install && composer run psalm'
```

## 5. JSON検証

### jqで検証

```bash
make test-json
```

または

```bash
mkdir -p data
find data -name "*.json" -type f -exec sh -c 'echo "Validating {}"; jq empty {} || exit 1' \;
```

## 6. フロントエンド（TypeScript型チェック）

### ローカルで実行

```bash
cd frontend/modern
npm install
npm run type-check
```

### Makeコマンド

```bash
make frontend-type-check
```

## 7. フロントエンド（ESLint）

### ローカルで実行

```bash
cd frontend/modern
npm install
npm run lint
```

### Makeコマンド

```bash
make frontend-lint
```

## 8. フロントエンド（ビルドテスト）

### ローカルで実行

```bash
cd frontend/modern
npm install
npm run build
```

### Makeコマンド

```bash
make frontend-build
```

## 9. すべてのチェックを実行

### バックエンドチェック

```bash
# ShellCheck
make lint-shell

# PHP構文チェック
make lint-php

# PHP静的解析（Composer必要）
make static-analysis
```

### フロントエンドチェック

```bash
# 型チェック
make frontend-type-check

# Lint
make frontend-lint

# ビルド
make frontend-build
```

### Docker Composeで全チェック

```bash
# バックエンド
docker-compose run --rm php-fpm sh -c '
  composer install --no-progress && \
  composer run phpstan && \
  composer run psalm
'

# フロントエンド
cd frontend/modern
npm install
npm run type-check
npm run lint
npm run build
```

## 10. CI並列実行（高速チェック）

複数のチェックを並列で実行して高速化：

```bash
# バックエンド（並列実行）
(make lint-shell &) && \
(make lint-php &) && \
(docker-compose run --rm php-fpm sh -c 'composer install && composer run phpstan' &) && \
(docker-compose run --rm php-fpm sh -c 'composer install && composer run psalm' &) && \
wait

# フロントエンド（並列実行）
cd frontend/modern && \
(npm run type-check &) && \
(npm run lint &) && \
(npm run build &) && \
wait
```

## トラブルシューティング

### Composer依存関係がインストールされない

```bash
# Dockerでインストール
docker run --rm -v "$PWD:/app" -w /app composer:latest install

# または Docker Composeで
docker-compose run --rm php-fpm composer install
```

### Node.js依存関係がインストールされない

```bash
cd frontend/modern
npm install
```

### ShellCheck警告が多すぎる

特定のファイルのみチェック：

```bash
shellcheck sh/collect_metrics.sh
```

### PHPStanメモリ不足エラー

```bash
# メモリ制限を増やす
php -d memory_limit=512M vendor/bin/phpstan analyse
```

## CI/CDとの整合性確認

ローカルチェックが通過すれば、CI/CDも通過するはずです。CI/CDが失敗する場合は：

1. `.github/workflows/ci.yml` の設定を確認
2. 同じPHP/Node.jsバージョンを使用しているか確認
3. キャッシュをクリアして再実行

## まとめ

- **最小限のチェック**: `make lint-shell && make lint-php`
- **完全なチェック**: 上記の全ステップを実行
- **CI/CD並列実行と同等**: 並列実行コマンドを使用

これらのチェックを実行することで、プッシュ前にCI/CDエラーを防ぐことができます。
