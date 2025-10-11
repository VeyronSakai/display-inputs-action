/**
 * Unit tests for DisplayInputsUseCase
 */
import { DisplayInputsUseCase } from '../src/use-cases/displayInputsUseCase.js'
import { StubInputRepository } from './test-doubles/repositories/stubInputRepository.js'
import { StubWorkflowRepository } from './test-doubles/repositories/stubWorkflowRepository.js'
import { SpyJobSummaryRepository } from './test-doubles/repositories/spyJobSummaryRepository.js'
import type { InputInfo } from '../src/domains/value-objects/inputInfo.js'
import type { WorkflowInfo } from '../src/domains/value-objects/workflowInfo.js'

describe('DisplayInputsUseCase', () => {
  let inputRepository: StubInputRepository
  let workflowRepository: StubWorkflowRepository
  let jobSummaryRepository: SpyJobSummaryRepository
  let useCase: DisplayInputsUseCase

  beforeEach(() => {
    // Create test double instances
    inputRepository = new StubInputRepository()
    workflowRepository = new StubWorkflowRepository()
    jobSummaryRepository = new SpyJobSummaryRepository()

    // Create use case instance with test doubles
    useCase = new DisplayInputsUseCase(inputRepository, workflowRepository, jobSummaryRepository)
  })

  afterEach(() => {
    // Reset all test doubles to their initial state
    inputRepository.reset()
    workflowRepository.reset()
    jobSummaryRepository.reset()
  })

  it('should save inputs when workflow info and inputs are available', async () => {
    const mockWorkflowInfo: WorkflowInfo = {
      owner: 'test-owner',
      repo: 'test-repo',
      workflowFileName: 'test.yml',
      ref: 'main',
      inputs: new Map([
        [
          'environment',
          {
            description: 'Deployment Environment',
            required: true,
            type: 'string'
          }
        ]
      ])
    }

    const mockInputs: InputInfo[] = [
      {
        name: 'environment',
        value: 'production',
        description: 'Deployment Environment'
      }
    ]

    // Configure test doubles
    workflowRepository.setWorkflowInfo(mockWorkflowInfo)
    inputRepository.setInputs(mockInputs)

    // Execute the use case
    await useCase.execute()

    // Verify the results
    expect(jobSummaryRepository.getSaveCallCount()).toBe(1)
    expect(jobSummaryRepository.verifySavedInputs(mockInputs)).toBe(true)
  })

  it('should save null when workflow info is not available', async () => {
    // Configure test double to return null
    workflowRepository.setWorkflowInfo(null)

    // Execute the use case
    await useCase.execute()

    // Verify the results
    expect(jobSummaryRepository.getSaveCallCount()).toBe(1)
    expect(jobSummaryRepository.verifySavedInputs(null)).toBe(true)
  })

  it('should save null when workflow info is available but no inputs exist', async () => {
    const mockWorkflowInfo: WorkflowInfo = {
      owner: 'test-owner',
      repo: 'test-repo',
      workflowFileName: 'test-without-inputs.yml',
      ref: 'main',
      inputs: new Map()
    }

    // Configure test doubles
    workflowRepository.setWorkflowInfo(mockWorkflowInfo)
    inputRepository.setInputs([])

    // Execute the use case
    await useCase.execute()

    // Verify the results
    expect(jobSummaryRepository.getSaveCallCount()).toBe(1)
    expect(jobSummaryRepository.verifySavedInputs(null)).toBe(true)
  })

  it('should save multiple inputs correctly', async () => {
    const mockWorkflowInfo: WorkflowInfo = {
      owner: 'test-owner',
      repo: 'test-repo',
      workflowFileName: 'test.yml',
      ref: 'main',
      inputs: new Map([
        ['environment', { description: 'Environment', type: 'string' }],
        ['version', { description: 'Version', type: 'string' }],
        ['debug', { description: 'Debug Mode', type: 'boolean' }]
      ])
    }

    const mockInputs: InputInfo[] = [
      { name: 'environment', value: 'production', description: 'Environment' },
      { name: 'version', value: '1.0.0', description: 'Version' },
      { name: 'debug', value: 'true', description: 'Debug Mode' }
    ]

    // Configure test doubles
    workflowRepository.setWorkflowInfo(mockWorkflowInfo)
    inputRepository.setInputs(mockInputs)

    // Execute the use case
    await useCase.execute()

    // Verify the results
    expect(jobSummaryRepository.getSaveCallCount()).toBe(1)
    expect(jobSummaryRepository.verifySavedInputs(mockInputs)).toBe(true)
  })

  it('should handle workflow info with inputs defined but no values provided', async () => {
    const mockWorkflowInfo: WorkflowInfo = {
      owner: 'test-owner',
      repo: 'test-repo',
      workflowFileName: 'test.yml',
      ref: 'main',
      inputs: new Map([
        [
          'optional-input',
          {
            description: 'Optional Input',
            required: false,
            type: 'string'
          }
        ]
      ])
    }

    // No inputs provided (environment variables not set)
    workflowRepository.setWorkflowInfo(mockWorkflowInfo)
    inputRepository.setInputs([])

    // Execute the use case
    await useCase.execute()

    // Verify the results
    expect(jobSummaryRepository.getSaveCallCount()).toBe(1)
    expect(jobSummaryRepository.verifySavedInputs(null)).toBe(true)
  })
})
