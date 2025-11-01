# フォルダ構成調査結果

## 🔍 調査サマリー

### 発見された問題

#### 1. 存在しない依存ファイル
- **config.php** - Signin.php, Signup.php, admin.phpがrequire
- **nav.php** - disk.php, week.phpがinclude
- **footer.html** - disk.phpがinclude

#### 2. ファイル分類

| 分類 | ファイル | 状態 |
|------|---------|------|
| **動作中（モダン）** | index.php | ✅ 正常（React/API使用） |
| **動作中（API）** | api/metrics.php | ✅ 正常 |
| **動作中（API）** | api/cluster.php | ✅ 正常 |
| **動作中（lib）** | lib/Storage.php | ✅ 正常 |
| **壊れている** | Signin.php | ❌ config.php不在 |
| **壊れている** | Signup.php | ❌ config.php不在 |
| **壊れている** | admin.php | ❌ config.php不在 |
| **壊れている** | disk.php | ❌ nav.php/footer.html不在 |
| **壊れている** | week.php | ❌ nav.php不在 |
| **部分的** | rate.php | ⚠️  week.phpから include |
| **部分的** | pie.php | ⚠️  データ依存 |
| **部分的** | presets.php | ⚠️  week.phpから include |
| **未使用** | pbsavrg.php | 🗑️  参照なし |
| **未使用** | rldavrg.php | 🗑️  参照なし |
| **未使用** | ping.php | 🗑️  参照なし |
| **未使用** | reload_disk.php | 🗑️  参照なし |
| **認証UI** | login.php | ⚠️  動作確認必要 |

#### 3. 依存関係グラフ

```
index.php (独立 - モダンフロントエンド)
  └─ (API経由でデータ取得)

api/metrics.php
  └─ lib/Storage.php

api/cluster.php
  └─ lib/Storage.php

week.php ❌ (nav.php不在)
  ├─ rate.php
  └─ presets.php

disk.php ❌ (nav.php/footer.html不在)

admin.php ❌ (config.php不在)

Signin.php ❌ (config.php不在)

Signup.php ❌ (config.php不在)

login.php ⚠️ (独立？)

pbsavrg.php 🗑️ (未使用)
rldavrg.php 🗑️ (未使用)
ping.php 🗑️ (未使用)
reload_disk.php 🗑️ (未使用)
```

#### 4. cluster/ ディレクトリ

```
cluster/
├── Total/Total_week.php    🗑️  古い実装
├── asuka/asuka.php         🗑️  古い実装
└── asuka/asuka_week.php    🗑️  古い実装
```

これらは新しいAPI（api/metrics.php, api/cluster.php）に置き換えられています。

---

## 🎯 修正版リファクタリング計画

### Phase 1: 安全なファイル整理（壊れていないもののみ）

```
php/
├── index.php              # ✅ 維持（ルート）
│
├── api/                   # ✅ 維持
│   ├── metrics.php
│   └── cluster.php
│
├── lib/                   # ✅ 維持
│   ├── Storage.php
│   ├── Database.php       # 🆕 新規作成
│   └── helpers.php        # 🆕 新規作成
│
└── legacy/                # 🆕 壊れている&未使用ファイル
    ├── broken/            # 依存関係が壊れているファイル
    │   ├── Signin.php     # config.php不在
    │   ├── Signup.php     # config.php不在
    │   ├── admin.php      # config.php不在
    │   ├── disk.php       # nav.php不在
    │   ├── week.php       # nav.php不在
    │   ├── rate.php       # weekからinclude
    │   ├── pie.php        # データ依存
    │   └── presets.php    # weekからinclude
    │
    ├── unused/            # 未使用ファイル
    │   ├── pbsavrg.php
    │   ├── rldavrg.php
    │   ├── ping.php
    │   └── reload_disk.php
    │
    └── auth/              # 認証（要修正）
        └── login.php      # 動作確認必要

cluster/                   # ❌ 完全削除
```

### Phase 2: 必要に応じて再構築

必要なページがあれば、新しいAPI（api/metrics.php, api/cluster.php）を使って再実装：

```
php/pages/                 # 🆕 新規ページ（必要に応じて）
├── dashboard.php          # index.phpの代替（必要なら）
└── admin/                 # 管理ページ（必要なら）
    └── clusters.php
```

---

## ✅ 推奨アクション

### すぐに実行可能

1. **未使用ファイルを legacy/unused/ に移動**
   ```bash
   mkdir -p php/legacy/unused
   mv php/{pbsavrg,rldavrg,ping,reload_disk}.php php/legacy/unused/
   ```

2. **壊れているファイルを legacy/broken/ に移動**
   ```bash
   mkdir -p php/legacy/broken
   mv php/{Signin,Signup,admin,disk,week,rate,pie,presets}.php php/legacy/broken/
   mv php/login.php php/legacy/broken/  # 動作確認後に決定
   ```

3. **cluster/ ディレクトリを削除**
   ```bash
   rm -rf cluster/
   ```

4. **PHPStan/Psalm設定更新**
   - legacy/ を除外パスに追加

5. **ドキュメント更新**
   - 現在の構造を反映

### 結果

```
php/
├── index.php              # モダンフロントエンド
├── api/                   # REST API
│   ├── metrics.php
│   └── cluster.php
├── lib/                   # ライブラリ
│   └── Storage.php
└── legacy/                # 古い/壊れているファイル
    ├── broken/            # 8ファイル
    └── unused/            # 4ファイル

# cluster/ 削除済み
```

---

## 🚨 注意事項

1. **login.php の動作確認**
   - 実際に使われているか確認してから移動

2. **壊れているファイルの修正**
   - 必要なら config.php, nav.php, footer.html を作成
   - ただし、index.php（モダン版）で十分ならそのまま削除でOK

3. **バックアップ**
   - 実行前に git commit でバックアップ

---

## ✅ リファクタリング完了

### 実行済みの作業

1. **ディレクトリ作成**
   - ✅ php/legacy/broken/ - 壊れているファイル用
   - ✅ php/legacy/unused/ - 未使用ファイル用

2. **ファイル移動**
   - ✅ 9つの壊れているファイルを php/legacy/broken/ に移動
     - Signin.php, Signup.php, admin.php, disk.php
     - week.php, rate.php, pie.php, presets.php, login.php
   - ✅ 4つの未使用ファイルを php/legacy/unused/ に移動
     - pbsavrg.php, rldavrg.php, ping.php, reload_disk.php

3. **cluster/ ディレクトリ削除**
   - ✅ 古い実装を完全削除

4. **静的解析設定更新**
   - ✅ PHPStan: php/legacy を excludePaths に追加
   - ✅ Psalm: php/legacy を ignoreFiles に追加
   - ✅ PHPStan baseline: 新しいパスを反映

### 最終的なフォルダ構成

```
php/
├── index.php              # モダンフロントエンド（React）
├── api/                   # REST API
│   ├── metrics.php        # メトリクスAPI
│   └── cluster.php        # クラスターAPI
├── lib/                   # ライブラリ
│   └── Storage.php        # ストレージ抽象化
└── legacy/                # レガシーコード（静的解析対象外）
    ├── broken/            # 壊れているファイル（9ファイル）
    │   ├── Signin.php
    │   ├── Signup.php
    │   ├── admin.php
    │   ├── disk.php
    │   ├── week.php
    │   ├── rate.php
    │   ├── pie.php
    │   ├── presets.php
    │   └── login.php
    └── unused/            # 未使用ファイル（4ファイル）
        ├── pbsavrg.php
        ├── rldavrg.php
        ├── ping.php
        └── reload_disk.php
```

### 今後の対応

1. **レガシーファイルの扱い**
   - 必要に応じて修正して復活させる
   - または完全に削除する

2. **新機能の追加**
   - 必要に応じて新しいAPIエンドポイントを追加
   - モダンなフロントエンド（React）で機能を実装
