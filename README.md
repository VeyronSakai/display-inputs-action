# Display Inputs Action

[![CI](https://github.com/VeyronSakai/display-inputs-action/actions/workflows/ci.yml/badge.svg)](https://github.com/VeyronSakai/display-inputs-action/actions/workflows/ci.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

A GitHub Action to display workflow_dispatch input values in a table format on GitHub Job Summary.

## Features

- Automatically retrieves workflow_dispatch inputs
- Displays inputs in an easy-to-read table format on Job Summary
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

This action fetches the workflow file using GitHub API, so `actions/checkout` is not required.
The `GITHUB_TOKEN` is automatically provided.

### Output Example

When you run this action, a table like the following will be displayed in the Job Summary:

| Description            | Value      |
| ---------------------- | ---------- |
| Deployment Environment | production |
| Version Number         | 1.2.3      |
| Debug Mode             | true       |

## License

MIT License - See [LICENSE](LICENSE) for details.
