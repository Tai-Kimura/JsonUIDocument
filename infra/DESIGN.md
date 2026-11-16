# JsonUI Documentation — AWS インフラ設計書

最終更新: 2026-06-18
対象サイト: `jsonui-doc-web`（Next.js 16 静的エクスポート）
公開 URL: **https://jsonui.tanosys.com**

---

## 1. 目的とゴール

JsonUI ドキュメントサイトを AWS 上で公開する。要件は以下。

| # | 要件 | 方針 |
|---|------|------|
| G1 | 固定費を最小化したい | 常駐サーバーを持たないサーバーレス静的ホスティング（S3 + CloudFront）。固定費は実質 Route 53 ホストゾーン **$0.50/月** のみ |
| G2 | `jsonui.tanosys.com` で公開（`tanosys.com` は取得済み） | ACM(us-east-1) 無料証明書 + CloudFront 代替ドメイン名 + DNS にサブドメイン登録 |
| G3 | HTTPS 必須・高速配信 | CloudFront(CDN) + HTTP→HTTPS リダイレクト + TLS1.2 以上 |
| G4 | 再現性・変更管理 | Terraform で IaC 化。手動コンソール作業を残さない |
| G5 | デプロイの簡素化 | `npm run build` → S3 sync → CloudFront invalidation（後段で GitHub Actions 自動化） |

### サイトの性質（設計の前提）
- `next.config.ts` が `output: "export"` → **完全な静的サイト**。サーバー実行環境（SSR/API/画像最適化）は一切不要。
- ビルド成果物は `jsonui-doc-web/out/`（HTML/CSS/JS と `_next/static/` のハッシュ付き資産）。
- 動的ルートセグメントなし。約90ページの静的HTML。検索インデックス・OG画像も `prebuild` で生成済み。
- ルーティング規約（`docker/nginx.conf` 由来）:
  - `trailingSlash: false` → `/foo` に対して `foo.html` を返す
  - `/dir/` → `/dir/index.html`
  - 404 は `/404.html`
  - ハッシュ付き資産は長期キャッシュ、HTML はノーキャッシュ

---

## 2. アーキテクチャ

```
                         ┌──────────────────────────────────────┐
   Browser               │            AWS (global)              │
  jsonui.tanosys.com     │                                      │
        │  HTTPS          │   ┌───────────────────────────┐      │
        └────────────────▶│   │  CloudFront Distribution  │      │
                          │   │  - CNAME: jsonui.tanosys… │      │
   DNS (Route 53 / 外部)  │   │  - Viewer cert: ACM(us-e-1)│     │
  jsonui → dxxxx.cloudfront│  │  - Default root: index.html│     │
                          │   │  - CF Function (URL書換)   │      │
                          │   │  - Cache: HTML/資産で分離  │      │
                          │   │  - 403/404 → /404.html     │      │
                          │   └────────────┬──────────────┘      │
                          │      OAC (SigV4, 限定公開)            │
                          │                ▼                     │
                          │   ┌───────────────────────────┐      │
                          │   │  S3 Bucket (ap-northeast-1)│      │
                          │   │  - Block Public Access: ON │      │
                          │   │  - Website hosting: OFF     │     │
                          │   │  - out/ をホスト           │      │
                          │   └───────────────────────────┘      │
                          └──────────────────────────────────────┘
                                          ▲
                       aws s3 sync out/ ──┘ （ローカル or GitHub Actions）
```

### 構成方針のキモ
- **S3 は非公開（REST オリジン + OAC）**。S3 静的ウェブサイトエンドポイントは使わない。
  - OAC (Origin Access Control) は OAI の後継で現行推奨。バケットは Block Public Access 全ONのまま、CloudFront からの SigV4 署名リクエストのみ許可。
  - ウェブサイトエンドポイントだと「公開バケット + HTTP のみ」になるため不採用。OAC + CloudFront Function で「非公開 + HTTPS + クリーンURL」を両立する。
- **クリーンURL（`/foo`→`foo.html`）は CloudFront Functions（viewer-request）で実現**。nginx の `try_files` 相当をエッジで再現。CloudFront Functions は無料枠が大きく（200万呼び出し/月無料）固定費に影響しない。

---

## 3. コンポーネント詳細

### 3.1 S3 バケット
| 項目 | 設定 |
|------|------|
| バケット名 | `jsonui-tanosys-com-site`（グローバル一意。要調整） |
| リージョン | `ap-northeast-1`（東京）。配信は CloudFront 経由なので体感速度には影響せず、管理/同期の近さで選定 |
| Block Public Access | 4項目すべて ON |
| 静的ウェブサイトホスティング | 無効 |
| バージョニング | 任意（誤上書きロールバック用。容量極小なので有効化推奨） |
| バケットポリシー | CloudFront ディストリビューション ARN（`AWS:SourceArn`）からの `s3:GetObject` のみ許可 |
| ライフサイクル | 旧 `_next/static` 資産の肥大化防止に「非現行バージョン90日で削除」等を任意設定 |

### 3.2 ACM 証明書
| 項目 | 設定 |
|------|------|
| ドメイン | `jsonui.tanosys.com` |
| リージョン | **`us-east-1`（必須）** — CloudFront のビューア証明書は us-east-1 のみ参照可能 |
| 検証方式 | DNS 検証（CNAME） |

### 3.3 CloudFront ディストリビューション
| 項目 | 設定 |
|------|------|
| 代替ドメイン名 (CNAME) | `jsonui.tanosys.com` |
| ビューア証明書 | 上記 ACM (us-east-1) |
| 最小 TLS | `TLSv1.2_2021` |
| ビューアプロトコル | HTTP → HTTPS リダイレクト |
| デフォルトルートオブジェクト | `index.html` |
| オリジン | S3 バケットのリージョナルドメイン名（REST）+ OAC |
| 価格クラス | `PriceClass_200`（北米/欧州/アジア。全エッジ不要でコスト最適化。`PriceClass_All` でも可） |
| HTTP バージョン | HTTP/2 + HTTP/3 |
| 圧縮 | 自動圧縮 ON（gzip/brotli） |

#### キャッシュビヘイビア
| パスパターン | 対象 | キャッシュ方針 |
|--------------|------|----------------|
| `/_next/static/*` | ハッシュ付き不変資産 | 長期キャッシュ（max-age=1年, immutable）。Managed-CachingOptimized 相当 |
| `*`（デフォルト） | HTML 等 | アップロード時の `Cache-Control` を尊重（HTML は revalidate）。デプロイ毎に invalidation で確実反映 |

#### CloudFront Function（viewer-request, URL 書き換え）
nginx `try_files $uri $uri.html $uri/index.html` をエッジで再現:
```js
function handler(event) {
  var req = event.request;
  var uri = req.uri;
  if (uri.endsWith('/')) {
    req.uri = uri + 'index.html';        // /dir/ → /dir/index.html
  } else if (uri.lastIndexOf('.') < uri.lastIndexOf('/')) {
    req.uri = uri + '.html';             // /foo → /foo.html（拡張子なしパスのみ）
  }
  return req;                            // 拡張子付き（.js/.css/.png 等）はそのまま
}
```
※ 本サイトの slug は kebab-case でドットを含まないため、上記判定で誤検知しない。

#### カスタムエラーレスポンス（404 ハンドリング）
S3 + OAC では存在しないキーへのアクセスは **403 (AccessDenied)** を返す（`ListBucket` 未付与のため）。そこで:
| 受信エラー | 応答 | ステータス |
|-----------|------|-----------|
| 403 | `/404.html` | 404 |
| 404 | `/404.html` | 404 |

### 3.4 DNS（`jsonui.tanosys.com`）
`tanosys.com` の DNS 管理場所により分岐（**§7 の確認事項 D1**）:

- **パターン A: `tanosys.com` が Route 53 のパブリックホストゾーンにある（推奨・全自動）**
  - Terraform が ACM 検証用 CNAME を自動登録
  - `jsonui.tanosys.com` の **A/AAAA ALIAS レコード** → CloudFront を自動登録
- **パターン B: DNS が外部（レジストラ/Cloudflare 等）**
  - Terraform は ACM 証明書を作成し、検証用 CNAME を **出力**（手動で外部DNSに登録）
  - `jsonui.tanosys.com` の **CNAME** → `dxxxx.cloudfront.net` を手動登録
  - サブドメインなので CNAME で問題なし（apex の制約は受けない）

### 3.5 セキュリティヘッダ（推奨・任意）
CloudFront のレスポンスヘッダポリシーで付与:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN`（または CSP frame-ancestors）

---

## 4. セキュリティ

| 領域 | 対策 |
|------|------|
| S3 公開防止 | Block Public Access 全ON。バケットポリシーは OAC の `AWS:SourceArn` 条件で当該ディストリビューションのみ許可 |
| 通信 | CloudFront で HTTPS 強制、TLS1.2 以上、HSTS |
| 認証情報 | デプロイは GitHub Actions OIDC ロール（静的アクセスキーを発行しない）を推奨 |
| 最小権限 | デプロイ用ロールは対象バケットの Put/Delete と当該ディストリビューションの CreateInvalidation のみ |

---

## 5. コスト試算（月額）

| 項目 | 課金 | 見積り |
|------|------|--------|
| S3 ストレージ | 数十MB | ほぼ $0（月数セント） |
| S3 リクエスト | CloudFront 経由のオリジンフェッチのみ | 数セント |
| CloudFront 転送/リクエスト | 永続無料枠 1TB転送 + 1000万リクエスト/月 | ドキュメントサイト規模では実質 **$0** |
| CloudFront Functions | 200万/月無料 | $0 |
| ACM 証明書 | 無料 | $0 |
| Route 53 ホストゾーン | $0.50/ゾーン/月 | **$0.50**（`tanosys.com` ゾーンが既存なら増分なし） |
| Route 53 クエリ | 100万/月あたり $0.40 | 数セント |
| **固定費合計** | | **約 $0〜$0.50/月** |

---

## 6. デプロイ / 運用

> **ビルド前提（重要）**: `jsonui-doc-web/src/generated/*`（ColorManager / StringManager / コンポーネントTSX）と `rjui_tools/` は **未コミット**で、`jui build` が `docs/screens/` から生成する。素の `npm run build` は `Module not found: @/generated/ColorManager` で失敗する。`jui`(jsonui-cli) ツールチェーンが必要:
> - 取得: `git clone https://github.com/Tai-Kimura/jsonui-cli.git` → `JSONUI_CLI_PATH` に設定
> - Ruby 3.2.2（`rjui_tools/.ruby-version`）/ Python3 / Node 20
> - 手順: `jui sync_tool` → `jui build --web-only` → `npm run build`

### 6.1 手動デプロイ（初期）
```bash
# 0) ツールチェーン（初回のみ）: rjui_tools 同期 + 生成物ビルド
export JSONUI_CLI_PATH=/path/to/jsonui-cli         # clone 済みの main
python3 "$JSONUI_CLI_PATH/jui_tools/bin/jui" sync_tool
python3 "$JSONUI_CLI_PATH/jui_tools/bin/jui" build --web-only --clean

cd jsonui-doc-web
npm ci
npm run build            # prebuild で検索index・OG画像も生成 → out/

# 1) 不変資産（HTML以外）を長期キャッシュで同期
aws s3 sync out/ s3://<BUCKET> --exclude "*.html" \
  --cache-control "public,max-age=31536000,immutable"

# 2) HTML を revalidate 指定で同期
aws s3 sync out/ s3://<BUCKET> --exclude "*" --include "*.html" \
  --cache-control "public,max-age=0,must-revalidate"

# 3) CloudFront キャッシュ無効化（毎月1000パスまで無料）
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```
> 注: `--delete` は孤立した旧ハッシュ資産を消すが、配信中クライアントの取りこぼし回避のため初期は付与せず、肥大化は S3 ライフサイクルで回収する方針。

### 6.2 自動デプロイ（実装済み: `.github/workflows/deploy.yml`）
GitHub Actions（`Tai-Kimura/JsonUIDocument`）:
- トリガ: `main` への push（`jsonui-doc-web/**` `docs/**` `tests/**` 変更時）+ 手動 `workflow_dispatch`
- 認証: AWS OIDC（`aws-actions/configure-aws-credentials`、静的キーなし。ロール `jsonui-doc-gha-deploy`）
- ステップ:
  1. Node 20 / Ruby 3.2.2 / Python 3.11 セットアップ
  2. `git clone jsonui-cli@main`（→ `JSONUI_CLI_PATH`）
  3. `jui sync_tool` → `jui build --web-only --clean`
  4. `npm ci` → `npm run build`
  5. S3 sync 2パス（資産=長期 / HTML=revalidate）→ CloudFront invalidation
- 補足: jsonui-cli は `main` 追従。再現性を固めるならワークフロー env の `JSONUI_CLI_REF` を特定 SHA に固定する。

---

## 7. IaC 設計（Terraform）

### ディレクトリ構成
```
infra/
├── DESIGN.md                ← 本書
└── terraform/
    ├── versions.tf          ← required_providers / terraform バージョン
    ├── providers.tf         ← aws(default=ap-northeast-1) と aws.us_east_1(ACM用) の2プロバイダ
    ├── variables.tf         ← domain_name, subdomain, bucket_name, manage_dns(=A/B), price_class 等
    ├── s3.tf                ← バケット + BPA + ポリシー(OAC) + バージョニング/ライフサイクル
    ├── acm.tf               ← us-east-1 証明書 + DNS検証
    ├── cloudfront.tf        ← OAC + ディストリビューション + CFファンクション + キャッシュ/エラー設定
    ├── functions/rewrite.js ← URL書き換え関数
    ├── route53.tf           ← manage_dns=true のとき検証CNAME + ALIAS（false なら出力のみ）
    ├── outputs.tf           ← distribution_id, distribution_domain, 検証レコード, バケット名
    └── terraform.tfvars     ← 実値（機微なし。コミット可。状態ファイルは除外）
```

### state 管理
- 初期は **ローカル state**（`.gitignore` 済み）で着手可能。
- 推奨は **S3 backend**（+ DynamoDB ロック or S3 ネイティブロック）。バックエンド用バケットを1つ用意。固定費はほぼ無視できる。

### 適用順序の注意
1. ACM は DNS 検証完了まで `apply` がブロックする（パターンBは手動レコード登録待ち）。
2. CloudFront 作成・反映に数分〜十数分。
3. 反映後、初回の `aws s3 sync` でコンテンツ投入。

---

## 8. 確認が必要な事項（着手前の決定ポイント）

| ID | 確認事項 | 既定案 |
|----|----------|--------|
| **D1** | `tanosys.com` の DNS はどこで管理？（Route 53 にパブリックホストゾーンがある？／外部DNS？） | Route 53 にある前提（パターンA・全自動）。なければパターンBで進行 |
| **D2** | 適用先 AWS アカウント / CLI プロファイル / 認証情報はローカルで利用可能か（`aws sts get-caller-identity` が通るか） | ユーザー提供のプロファイルを使用。`terraform apply` はユーザー承認後に実行 |
| **D3** | IaC ツールは Terraform で良いか（CDK/CloudFormation 希望があれば変更） | Terraform |
| **D4** | Terraform state はローカル / S3 backend どちらで開始するか | S3 backend 推奨。まずローカルで可 |
| **D5** | GitHub Actions 自動デプロイ(OIDC) を今回含めるか | 後段で追加（まず手動デプロイで疎通確認） |
| **D6** | バケット名・価格クラス・セキュリティヘッダの採否 | 本書の既定値 |

---

## 9. 作業ロードマップ

1. **[本書] 設計合意** — §8 の D1〜D6 を確定
2. Terraform 一式を作成（`infra/terraform/`）
3. `terraform init && plan` をユーザーと確認
4. `terraform apply`（ACM 検証 → CloudFront 作成）※パターンBは手動DNS登録を挟む
5. `npm run build` → `aws s3 sync` → invalidation で初回公開
6. `https://jsonui.tanosys.com` の疎通・ルーティング・404・キャッシュ確認
7. （任意）GitHub Actions OIDC 自動デプロイを追加
```
