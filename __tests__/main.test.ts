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

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

// Get test-action.yml file path
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const testActionFilePath = path.join(
  __dirname,
  '../.github/workflows/test-action.yml'
)

describe('main.ts', () => {
  const originalEnv = process.env
  let testActionContent: string

  beforeAll(() => {
    // Load test-action.yml content
    testActionContent = fs.readFileSync(testActionFilePath, 'utf-8')
  })

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv }

    // Reset all mocks
    jest.clearAllMocks()

    // Re-setup the mock chain for summary
    core.summary.addHeading.mockReturnValue(core.summary)
    core.summary.addTable.mockReturnValue(core.summary)
    core.summary.addRaw.mockReturnValue(core.summary)
    core.summary.write.mockResolvedValue({})
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('Displays inputs with descriptions from test-action.yml', async () => {
    // Set up environment
    process.env.GITHUB_TOKEN = 'fake-token'
    process.env.GITHUB_WORKFLOW_REF =
      'owner/repo/.github/workflows/test-action.yml@refs/heads/main'
    process.env.INPUT_ENVIRONMENT = 'production'
    process.env.INPUT_VERSION = '1.2.3'
    process.env.INPUT_ENABLE_DEBUG = 'true'
    process.env.INPUT_LOG_LEVEL = 'debug'

    // Mock GitHub API response with actual test-action.yml content
    mockGetContent.mockResolvedValue({
      data: {
        content: Buffer.from(testActionContent).toString('base64')
      }
    })

    await run()

    // Verify API was called correctly
    expect(mockGetOctokit).toHaveBeenCalledWith('fake-token')
    expect(mockGetContent).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      path: '.github/workflows/test-action.yml',
      ref: 'main'
    })

    // Verify that summary methods were called with descriptions from test-action.yml
    expect(core.summary.addHeading).toHaveBeenCalledWith('Workflow Inputs', 2)
    expect(core.summary.addTable).toHaveBeenCalledWith([
      ['Description', 'Value'],
      ['Deployment Environment', 'production'],
      ['Version Number', '1.2.3'],
      ['Enable Debug Mode', 'true'],
      ['Log Level', 'debug']
    ])
    expect(core.summary.write).toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith(
      'Displayed 4 input(s) in Job Summary'
    )
  })

  it('Falls back to input names when GitHub API fails', async () => {
    // Set up some mock inputs without valid API response
    process.env.INPUT_NAME = 'test-user'
    process.env.INPUT_ENVIRONMENT = 'production'
    process.env.GITHUB_TOKEN = 'fake-token'
    process.env.GITHUB_WORKFLOW_REF =
      'owner/repo/.github/workflows/test-action.yml@refs/heads/main'

    // Mock API to fail
    mockGetContent.mockRejectedValue(new Error('API Error'))

    await run()

    // Verify that summary uses input names as descriptions
    expect(core.summary.addHeading).toHaveBeenCalledWith('Workflow Inputs', 2)
    expect(core.summary.addTable).toHaveBeenCalledWith([
      ['Description', 'Value'],
      ['name', 'test-user'],
      ['environment', 'production']
    ])
    expect(core.summary.write).toHaveBeenCalled()
  })

  it('Handles case with no inputs', async () => {
    // No INPUT_ environment variables set
    await run()

    // Verify that appropriate message was displayed
    expect(core.summary.addHeading).toHaveBeenCalledWith('Workflow Inputs', 2)
    expect(core.summary.addRaw).toHaveBeenCalledWith('No inputs provided.')
    expect(core.summary.write).toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith('No workflow_dispatch inputs found.')
  })

  it('Handles errors gracefully', async () => {
    // Mock write to throw an error
    core.summary.write.mockRejectedValueOnce(
      new Error('Failed to write summary')
    )

    await run()

    // Verify that the action was marked as failed
    expect(core.setFailed).toHaveBeenCalledWith('Failed to write summary')
  })

  it('Works without GITHUB_TOKEN (uses input names)', async () => {
    // Set up inputs without token
    process.env.INPUT_TEST = 'value'
    // No GITHUB_TOKEN set

    await run()

    // Should fall back to using input name as description
    expect(core.summary.addTable).toHaveBeenCalledWith([
      ['Description', 'Value'],
      ['test', 'value']
    ])
  })

  it('Handles invalid GITHUB_WORKFLOW_REF', async () => {
    process.env.GITHUB_TOKEN = 'fake-token'
    process.env.GITHUB_WORKFLOW_REF = 'invalid-format'
    process.env.INPUT_TEST = 'value'

    await run()

    // Should fall back to using input name as description
    expect(core.summary.addTable).toHaveBeenCalledWith([
      ['Description', 'Value'],
      ['test', 'value']
    ])
  })
})
