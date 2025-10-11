# Display Inputs Action

[![CI](https://github.com/VeyronSakai/display-inputs-action/actions/workflows/ci.yml/badge.svg)](https://github.com/VeyronSakai/display-inputs-action/actions/workflows/ci.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

A TypeScript-based GitHub Action that displays workflow_dispatch input values in
a table format on GitHub Job Summary.

## Features

- Automatically retrieves workflow_dispatch inputs
- Fetches input descriptions from workflow files using GitHub API
- Displays inputs in an easy-to-read table format on Job Summary
- Shows appropriate messages when no inputs are provided
- Fully implemented and tested in TypeScript
- No `actions/checkout` required - fetches files via GitHub API

## Usage

### Basic Example

```yaml
name: Display Workflow Inputs

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment Environment'
        required: true
        type: choice
        options:
          - development
          - staging
          - production
      version:
        description: 'Version Number'
        required: true
        type: string
      debug:
        description: 'Debug Mode'
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

This action fetches the workflow file using GitHub API, so `actions/checkout` is
not required. The `GITHUB_TOKEN` is automatically provided.

### Output Example

When you run this action, a table like the following will be displayed in the
Job Summary:

| Description            | Value      |
| ---------------------- | ---------- |
| Deployment Environment | production |
| Version Number         | 1.2.3      |
| Debug Mode             | true       |

## Display Examples

### With Inputs

```markdown
## Workflow Inputs

| Description            | Value      |
| ---------------------- | ---------- |
| Deployment Environment | production |
| Version Number         | 1.2.3      |
| Debug Mode             | true       |
```

### Without Inputs

```markdown
## Workflow Inputs

No inputs provided.
```

## How It Works

This action operates through the following steps:

1. Retrieves input values from `INPUT_*` environment variables automatically set
   by GitHub Actions
2. Fetches the current workflow file from `GITHUB_WORKFLOW_REF` using GitHub API
3. Parses the workflow file to extract the `description` for each input
4. Displays descriptions and values in a table format on Job Summary

If fetching or parsing the workflow file fails, the input name will be used as
the description.

## Architecture

This project is designed based on **Onion Architecture**.

### Directory Structure

```text
src/
├── domains/                   # Domain Layer (Core)
│   ├── entities/             # Entities
│   │   ├── InputInfo.ts      # Input information entity
│   │   └── WorkflowInfo.ts   # Workflow information entity
│   ├── repositories/         # Repository interfaces
│   │   ├── IInputRepository.ts
│   │   └── IWorkflowRepository.ts
│   ├── services/             # Domain service interfaces
│   │   └── IPresenter.ts
│   └── value-objects/        # Value objects (for future extension)
├── use-cases/                # Application Layer (Use Cases)
│   └── DisplayInputsUseCase.ts  # Display inputs use case
├── infrastructures/          # Infrastructure Layer (External)
│   ├── repositories/         # Repository implementations
│   │   ├── EnvironmentInputRepository.ts
│   │   └── GitHubApiWorkflowRepository.ts
│   ├── parsers/             # Parsers
│   │   └── WorkflowFileParser.ts
│   └── presenters/          # Presenters
│       └── JobSummaryPresenter.ts
├── presentations/            # Presentation Layer (External Interface)
│   └── actionHandler.ts     # GitHub Actions handler
├── main.ts                   # Entry point (DI Container)
└── index.ts                  # Action entry point
```

### Layer Responsibilities

- **Domain Layer** (`domains/`): Defines business logic and entities.
  Independent of other layers
- **Use Cases Layer** (`use-cases/`): Implements application-specific business
  rules. Depends only on Domain Layer
- **Infrastructure Layer** (`infrastructures/`): Implements integration with
  external systems (GitHub API, environment variables)
- **Presentation Layer** (`presentations/`): Handles interactions with external
  interfaces (GitHub Actions)

### Path Aliases

To improve code readability and maintainability, the following path aliases are
used:

- `@domains/*` → `src/domains/*`
- `@use-cases/*` → `src/use-cases/*`
- `@infrastructures/*` → `src/infrastructures/*`
- `@presentations/*` → `src/presentations/*`

This design achieves a highly testable and maintainable codebase.

## Development

### Setup

```bash
npm install
```

### Test

```bash
npm test
```

### Build

```bash
npm run bundle
```

### Format

```bash
npm run format:write
```

### Lint

```bash
npm run lint
```

## License

MIT License - See [LICENSE](LICENSE) for details.

## Author

Yuki Sakai
