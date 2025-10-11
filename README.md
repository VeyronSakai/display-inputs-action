# Display Inputs Action

[![CI](https://github.com/VeyronSakai/display-inputs-action/actions/workflows/ci.yml/badge.svg)](https://github.com/VeyronSakai/display-inputs-action/actions/workflows/ci.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

workflow_dispatch で実行された GitHub
Actions ワークフローの入力値を、GitHub の Job
Summary にテーブル形式で表示する TypeScript ベースの Action です。

## 機能

- workflow_dispatch の inputs を自動的に取得
- GitHub API を使用してワークフローファイルから description を取得
- Job Summary に見やすいテーブル形式で表示
- 入力が無い場合の適切なメッセージ表示
- TypeScript で実装され、完全にテスト済み
- `actions/checkout` 不要 - GitHub API を使用してファイルを取得

## 使用方法

### 基本的な使い方

```yaml
name: Display Workflow Inputs

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'デプロイ環境'
        required: true
        type: choice
        options:
          - development
          - staging
          - production
      version:
        description: 'バージョン番号'
        required: true
        type: string
      debug:
        description: 'デバッグモード'
        required: false
        type: boolean
        default: false

jobs:
  display-inputs:
    runs-on: ubuntu-latest
    steps:
      - name: Display workflow inputs
        uses: VeyronSakai/display-inputs-action@v1
```

このアクションは GitHub
API を使用してワークフローファイルを取得するため、`actions/checkout`
は不要です。 `GITHUB_TOKEN` は自動的に提供されます。

### 実行結果

このアクションを実行すると、Job Summary に以下のようなテーブルが表示されます:

| Description    | Value      |
| -------------- | ---------- |
| デプロイ環境   | production |
| バージョン番号 | 1.2.3      |
| デバッグモード | true       |

## 出力例

### 入力がある場合

```markdown
## Workflow Inputs

| Description    | Value      |
| -------------- | ---------- |
| デプロイ環境   | production |
| バージョン番号 | 1.2.3      |
| デバッグモード | true       |
```

### 入力がない場合

```markdown
## Workflow Inputs

No inputs provided.
```

## 仕組み

このアクションは以下の手順で動作します:

1. GitHub Actions が自動的に設定する `INPUT_*` 環境変数から入力値を取得
2. GitHub API を使用して `GITHUB_WORKFLOW_REF`
   から現在のワークフローファイルを取得
3. ワークフローファイルを解析して、各 input の `description` を取得
4. Description と値をテーブル形式で Job Summary に表示

ワークフローファイルの取得や解析に失敗した場合は、input 名を description として使用します。

## アーキテクチャ

このプロジェクトは **Onion Architecture (オニオンアーキテクチャ)**
に基づいて設計されています。

### ディレクトリ構造

```text
src/
├── domains/                   # Domain Layer (中心層)
│   ├── entities/             # エンティティ
│   │   ├── InputInfo.ts      # 入力情報エンティティ
│   │   └── WorkflowInfo.ts   # ワークフロー情報エンティティ
│   ├── repositories/         # リポジトリインターフェース
│   │   ├── IInputRepository.ts
│   │   └── IWorkflowRepository.ts
│   ├── services/             # ドメインサービスインターフェース
│   │   └── IPresenter.ts
│   └── value-objects/        # 値オブジェクト（将来の拡張用）
├── use-cases/                # Application Layer (ユースケース層)
│   └── DisplayInputsUseCase.ts  # 入力表示ユースケース
├── infrastructures/          # Infrastructure Layer (外部層)
│   ├── repositories/         # リポジトリ実装
│   │   ├── EnvironmentInputRepository.ts
│   │   └── GitHubApiWorkflowRepository.ts
│   ├── parsers/             # パーサー
│   │   └── WorkflowFileParser.ts
│   └── presenters/          # プレゼンター
│       └── JobSummaryPresenter.ts
├── presentations/            # Presentation Layer (外部インターフェース層)
│   └── actionHandler.ts     # GitHub Actions ハンドラー
├── main.ts                   # エントリーポイント (DI コンテナ)
└── index.ts                  # Action エントリーポイント
```

### 各層の役割

- **Domain Layer**
  (`domains/`): ビジネスロジックとエンティティを定義。他の層に依存しない
- **Use Cases Layer**
  (`use-cases/`): アプリケーション固有のビジネスルールを実装。Domain
  Layer のみに依存
- **Infrastructure Layer** (`infrastructures/`): 外部システム (GitHub
  API, 環境変数) との連携を実装
- **Presentation Layer** (`presentations/`): 外部インターフェース (GitHub
  Actions) とのやり取りを担当

### パスエイリアス

コードの可読性と保守性を向上させるため、以下のパスエイリアスを使用しています：

- `@domains/*` → `src/domains/*`
- `@use-cases/*` → `src/use-cases/*`
- `@infrastructures/*` → `src/infrastructures/*`
- `@presentations/*` → `src/presentations/*`

この設計により、テスタビリティが高く、保守性の高いコードベースを実現しています。

## 開発

### セットアップ

```bash
npm install
```

### テスト

```bash
npm test
```

### ビルド

```bash
npm run bundle
```

### フォーマット

```bash
npm run format:write
```

### Lint

```bash
npm run lint
```

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。

## 作者

Yuki Sakai
