/**
 * Integration tests using actual workflow files
 */
import { DisplayInputsUseCase } from '../../src/use-cases/displayInputsUseCase.js'
import { InputRepositoryImpl } from '../../src/infrastructures/repositories/inputRepositoryImpl.js'
import { SpyJobSummaryRepository } from '../test-doubles/repositories/spyJobSummaryRepository.js'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { fileURLToPath } from 'url'
import type { WorkflowInfo } from '../../src/domains/value-objects/workflowInfo.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface WorkflowYaml {
  on?: {
    workflow_dispatch?: {
      inputs?: Record<
        string,
        {
          description?: string
          required?: boolean
          type?: string
          default?: string | boolean | number
          options?: string[]
        }
      >
    }
  }
}

describe('Workflow Integration Tests', () => {
  let jobSummaryRepository: SpyJobSummaryRepository
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = process.env
    process.env = { ...originalEnv }
    jobSummaryRepository = new SpyJobSummaryRepository()
  })

  afterEach(() => {
    process.env = originalEnv
    jobSummaryRepository.reset()
  })

  describe('Real workflow file tests', () => {
    it('should correctly parse and process test-with-inputs.yml workflow', () => {
      const workflowPath = path.join(__dirname, '../../.github/workflows/test-with-inputs.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8')
      const parsedWorkflow = yaml.load(workflowContent) as WorkflowYaml

      // Verify workflow has expected inputs
      expect(parsedWorkflow.on?.workflow_dispatch?.inputs).toBeDefined()
      const inputs = parsedWorkflow.on.workflow_dispatch.inputs

      // Check all expected inputs are present
      expect(inputs).toHaveProperty('environment')
      expect(inputs).toHaveProperty('version')
      expect(inputs).toHaveProperty('enable-debug')
      expect(inputs).toHaveProperty('log-level')
      expect(inputs).toHaveProperty('notes')

      // Verify input configurations
      expect(inputs.environment).toEqual({
        description: 'Deployment Environment',
        required: true,
        type: 'choice',
        options: ['development', 'staging', 'production'],
        default: 'development'
      })

      expect(inputs.version).toEqual({
        description: 'Version Number',
        required: true,
        type: 'string'
      })

      expect(inputs['enable-debug']).toEqual({
        description: 'Enable Debug Mode',
        required: false,
        type: 'boolean',
        default: false
      })
    })

    it('should correctly parse test-without-inputs.yml workflow', () => {
      const workflowPath = path.join(__dirname, '../../.github/workflows/test-without-inputs.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8')
      const parsedWorkflow = yaml.load(workflowContent) as WorkflowYaml

      // Verify workflow has workflow_dispatch but no inputs
      expect(parsedWorkflow.on?.workflow_dispatch).toBeDefined()
      // workflow_dispatch can be null or have no inputs property
      expect(parsedWorkflow.on?.workflow_dispatch?.inputs).toBeUndefined()
    })

    it('should handle workflow with inputs using actual repository implementations', async () => {
      // Create a temporary event payload file
      const tempDir = fs.mkdtempSync(path.join(__dirname, 'temp-'))
      const eventPath = path.join(tempDir, 'event.json')

      const eventPayload = {
        inputs: {
          'environment': 'production',
          'version': '2.0.1',
          'enable-debug': 'true',
          'log-level': 'debug',
          'notes': 'Test deployment'
        }
      }

      fs.writeFileSync(eventPath, JSON.stringify(eventPayload))

      // Set up environment variables to simulate workflow_dispatch with inputs
      process.env.GITHUB_EVENT_NAME = 'workflow_dispatch'
      process.env.GITHUB_TOKEN = 'fake-token'
      process.env.GITHUB_WORKFLOW_REF = 'owner/repo/.github/workflows/test-with-inputs.yml@refs/heads/main'
      process.env.GITHUB_EVENT_PATH = eventPath

      // Parse the actual workflow file
      const workflowPath = path.join(__dirname, '../../.github/workflows/test-with-inputs.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8')
      const parsedWorkflow = yaml.load(workflowContent) as WorkflowYaml

      const workflowInfo: WorkflowInfo = {
        owner: 'owner',
        repo: 'repo',
        workflowFileName: 'test-with-inputs.yml',
        ref: 'main',
        inputs: new Map(
          Object.entries(parsedWorkflow.on?.workflow_dispatch?.inputs || {}).map(([key, value]) => [
            key,
            {
              description: value.description,
              required: value.required,
              type: value.type,
              default: value.default
            }
          ])
        )
      }

      // Create input repository with workflow info
      const inputRepository = new InputRepositoryImpl(workflowInfo)

      // Create a stub for workflow repository that returns expected data
      const stubWorkflowRepo = {
        async fetchWorkflowInfo(): Promise<WorkflowInfo | null> {
          return workflowInfo
        }
      }

      // Create use case with actual input repository and spy job summary repository
      const useCase = new DisplayInputsUseCase(inputRepository, stubWorkflowRepo, jobSummaryRepository)

      await useCase.execute()

      // Verify the correct inputs were saved
      expect(jobSummaryRepository.getSaveCallCount()).toBe(1)
      const savedInputs = jobSummaryRepository.getSavedInputs()

      expect(savedInputs).toEqual([
        { name: 'environment', value: 'production', description: 'Deployment Environment' },
        { name: 'version', value: '2.0.1', description: 'Version Number' },
        { name: 'enable-debug', value: 'true', description: 'Enable Debug Mode' },
        { name: 'log-level', value: 'debug', description: 'Log Level' },
        { name: 'notes', value: 'Test deployment', description: 'Additional Notes' }
      ])

      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true })
    })

    it('should handle workflow without inputs using actual repository implementations', async () => {
      // Create a temporary event payload file
      const tempDir = fs.mkdtempSync(path.join(__dirname, 'temp-'))
      const eventPath = path.join(tempDir, 'event.json')

      const eventPayload = {
        inputs: {}
      }

      fs.writeFileSync(eventPath, JSON.stringify(eventPayload))

      // Set up environment variables for workflow without inputs
      process.env.GITHUB_EVENT_NAME = 'workflow_dispatch'
      process.env.GITHUB_TOKEN = 'fake-token'
      process.env.GITHUB_WORKFLOW_REF = 'owner/repo/.github/workflows/test-without-inputs.yml@refs/heads/main'
      process.env.GITHUB_EVENT_PATH = eventPath

      const workflowInfo: WorkflowInfo = {
        owner: 'owner',
        repo: 'repo',
        workflowFileName: 'test-without-inputs.yml',
        ref: 'main',
        inputs: new Map() // No inputs
      }

      // Create input repository with workflow info (no inputs)
      const inputRepository = new InputRepositoryImpl(workflowInfo)

      // Create a stub for workflow repository that returns no inputs
      const stubWorkflowRepo = {
        async fetchWorkflowInfo(): Promise<WorkflowInfo | null> {
          return workflowInfo
        }
      }

      const useCase = new DisplayInputsUseCase(inputRepository, stubWorkflowRepo, jobSummaryRepository)

      await useCase.execute()

      // Verify null was saved (no inputs to display)
      expect(jobSummaryRepository.getSaveCallCount()).toBe(1)
      expect(jobSummaryRepository.getSavedInputs()).toBeNull()

      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true })
    })
  })
})
