# Display Inputs Action

[![CI](https://github.com/VeyronSakai/display-inputs-action/actions/workflows/ci.yml/badge.svg)](https://github.com/VeyronSakai/display-inputs-action/actions/workflows/ci.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

A GitHub Action to display workflow_dispatch input values in a table format on GitHub Job Summary.

## Features

- Automatically retrieves workflow_dispatch inputs
- Displays inputs in an easy-to-read table format on Job Summary
- No `actions/checkout` required - fetches files via GitHub API

---

<img width="929" height="782" alt="Screenshot showing workflow dispatch inputs displayed in table format on GitHub Job Summary" src="https://github.com/user-attachments/assets/3144b51e-26ed-4c38-99ce-7b09ce1c1a44" />

---

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
        uses: VeyronSakai/display-inputs-action@v0.1
```

This action fetches the workflow file using GitHub API, so `actions/checkout` is not required. The `GITHUB_TOKEN` is automatically provided.

### Output Example

When you run this action, a table like the following will be displayed in the Job Summary:

| Name        | Description            | Value      |
| ----------- | ---------------------- | ---------- |
| environment | Deployment Environment | production |
| version     | Version Number         | 1.2.3      |
| debug       | Debug Mode             | true       |

## License

MIT License - See [LICENSE](LICENSE) for details.
