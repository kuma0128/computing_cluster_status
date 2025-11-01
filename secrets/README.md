# Secrets Management

このディレクトリには暗号化された機密情報が保存されます。

## セットアップ

### 1. age のインストール

```bash
# macOS
brew install age

# Linux
apt-get install age  # Debian/Ubuntu
yum install age      # RHEL/CentOS
```

### 2. sops のインストール

```bash
# macOS
brew install sops

# Linux
# Download from https://github.com/mozilla/sops/releases
wget https://github.com/mozilla/sops/releases/download/v3.8.1/sops-v3.8.1.linux.amd64
sudo mv sops-v3.8.1.linux.amd64 /usr/local/bin/sops
sudo chmod +x /usr/local/bin/sops
```

### 3. age キーペアの生成

```bash
# 新しいキーペアを生成
age-keygen -o age-key.txt

# 出力例:
# Public key: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
# Secret key: AGE-SECRET-KEY-...
```

**重要:** `age-key.txt` は安全な場所に保管し、絶対にGitにコミットしないでください！

### 4. 公開鍵の登録

`.sops.yaml` ファイルの `age:` フィールドに公開鍵を設定します。

## 使い方

### シークレットの暗号化

```bash
# .env ファイルを暗号化
sops -e secrets/.env > secrets/.env.enc

# または、直接編集
sops secrets/.env.enc
```

### シークレットの復号化

```bash
# 一時的に復号化して表示
sops -d secrets/.env.enc

# 復号化してファイルに保存
sops -d secrets/.env.enc > .env
```

### 環境変数の設定

```bash
# age secret key を環境変数に設定
export SOPS_AGE_KEY_FILE=~/.config/sops/age/keys.txt
# または
export SOPS_AGE_KEY="AGE-SECRET-KEY-..."
```

## CI/CD での使用

GitHub Actions などのCIでは、secret key をシークレットとして登録：

```yaml
- name: Decrypt secrets
  env:
    SOPS_AGE_KEY: ${{ secrets.SOPS_AGE_KEY }}
  run: |
    sops -d secrets/.env.enc > .env
```

## ファイル構造

```
secrets/
├── .env.enc           # 暗号化された環境変数
├── database.json.enc  # 暗号化されたデータベース設定
└── age-key.txt       # age秘密鍵（ローカルのみ、Gitには含めない）
```

## セキュリティのベストプラクティス

1. **秘密鍵を共有しない**: age-key.txt は個人的に保管
2. **暗号化ファイルのみコミット**: *.enc ファイルだけをGitに含める
3. **定期的にキーをローテーション**: 3-6ヶ月ごとに鍵を更新
4. **アクセス制御**: 必要な人だけに鍵を共有
5. **監査ログ**: 誰がいつ復号化したかを記録

## トラブルシューティング

### エラー: "no age keys found"

```bash
# 環境変数を設定
export SOPS_AGE_KEY_FILE=/path/to/age-key.txt
```

### エラー: "failed to decrypt"

- 正しい秘密鍵を使用しているか確認
- `.sops.yaml` の公開鍵が正しいか確認
- ファイルが破損していないか確認

## 参考リンク

- [SOPS Documentation](https://github.com/mozilla/sops)
- [age Encryption](https://github.com/FiloSottile/age)
- [Secret Management Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
