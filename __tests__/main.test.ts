/**
 * Unit tests for the action's main functionality, src/main.ts
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Mock GitHub API
const mockGetContent = jest.fn<() => Promise<{ data: { content: string } }>>()
const mockGetOctokit = jest.fn(() => ({
  rest: {
    repos: {
      getContent: mockGetContent
    }
  }
}))

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => ({
  getOctokit: mockGetOctokit
}))

// The module being tested should be imported dynamically.
const { run } = await import('../src/main.js')

// Get test-with-inputs.yml file path
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const testActionFilePath = path.join(
  __dirname,
  '../.github/workflows/test-with-inputs.yml'
)

describe('main.ts', () => {
  const originalEnv = process.env
  let testActionContent: string

  beforeAll(() => {
    testActionContent = fs.readFileSync(testActionFilePath, 'utf-8')
  })

  beforeEach(() => {
    process.env = { ...originalEnv }
    jest.clearAllMocks()
    core.summary.addHeading.mockReturnValue(core.summary)
    core.summary.addTable.mockReturnValue(core.summary)
    core.summary.addRaw.mockReturnValue(core.summary)
    core.summary.write.mockResolvedValue({})
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('Shows warning and skips execution for non-workflow_dispatch events', async () => {
    process.env.GITHUB_EVENT_NAME = 'push'
    process.env.INPUT_TEST = 'value'

    await run()

    expect(core.warning).toHaveBeenCalledWith(
      'This action is designed for workflow_dispatch events only. Current event: push'
    )
    expect(core.info).toHaveBeenCalledWith('Skipping action execution.')
    expect(mockGetOctokit).not.toHaveBeenCalled()
    expect(core.summary.addHeading).not.toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('Displays inputs with descriptions from test-with-inputs.yml', async () => {
    process.env.GITHUB_EVENT_NAME = 'workflow_dispatch'
    process.env.GITHUB_TOKEN = 'fake-token'
    process.env.GITHUB_WORKFLOW_REF =
      'owner/repo/.github/workflows/test-with-inputs.yml@refs/heads/main'
    process.env.INPUT_ENVIRONMENT = 'production'
    process.env.INPUT_VERSION = '1.2.3'
    process.env.INPUT_ENABLE_DEBUG = 'true'
    process.env.INPUT_LOG_LEVEL = 'debug'

    mockGetContent.mockResolvedValue({
      data: {
        content: Buffer.from(testActionContent).toString('base64')
      }
    })

    await run()

    expect(mockGetOctokit).toHaveBeenCalledWith('fake-token')
    expect(core.summary.addHeading).toHaveBeenCalledWith('Workflow Inputs', 2)
    expect(core.summary.write).toHaveBeenCalled()
  })
})
