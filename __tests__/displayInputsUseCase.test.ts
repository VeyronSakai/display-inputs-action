/**
 * Unit tests for DisplayInputsUseCase
 */
import { jest } from '@jest/globals'
import { DisplayInputsUseCase } from '../src/use-cases/displayInputsUseCase.js'
import type { IInputRepository } from '../src/domains/repositories/inputRepository.js'
import type { IWorkflowRepository } from '../src/domains/repositories/workflowRepository.js'
import type { IJobSummaryRepository } from '../src/domains/repositories/jobSummaryRepository.js'
import type { InputInfo } from '../src/domains/value-objects/inputInfo.js'
import type { WorkflowInfo } from '../src/domains/value-objects/workflowInfo.js'

describe('DisplayInputsUseCase', () => {
  let mockInputRepository: jest.Mocked<IInputRepository>
  let mockWorkflowRepository: jest.Mocked<IWorkflowRepository>
  let mockJobSummaryRepository: jest.Mocked<IJobSummaryRepository>
  let useCase: DisplayInputsUseCase

  beforeEach(() => {
    // Create mock repositories
    mockInputRepository = {
      fetchInputs: jest.fn<() => InputInfo[]>()
    }

    mockWorkflowRepository = {
      fetchWorkflowInfo: jest.fn<() => Promise<WorkflowInfo | null>>()
    }

    mockJobSummaryRepository = {
      saveInputs: jest.fn<(inputs: InputInfo[] | null) => Promise<void>>()
    }

    // Create use case instance
    useCase = new DisplayInputsUseCase(mockInputRepository, mockWorkflowRepository, mockJobSummaryRepository)
  })

  afterEach(() => {
    jest.clearAllMocks()
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

    mockWorkflowRepository.fetchWorkflowInfo.mockResolvedValue(mockWorkflowInfo)
    mockInputRepository.fetchInputs.mockReturnValue(mockInputs)

    await useCase.execute()

    expect(mockWorkflowRepository.fetchWorkflowInfo).toHaveBeenCalledTimes(1)
    expect(mockInputRepository.fetchInputs).toHaveBeenCalledTimes(1)
    expect(mockJobSummaryRepository.saveInputs).toHaveBeenCalledWith(mockInputs)
  })

  it('should save null when workflow info is not available', async () => {
    mockWorkflowRepository.fetchWorkflowInfo.mockResolvedValue(null)

    await useCase.execute()

    expect(mockWorkflowRepository.fetchWorkflowInfo).toHaveBeenCalledTimes(1)
    expect(mockInputRepository.fetchInputs).not.toHaveBeenCalled()
    expect(mockJobSummaryRepository.saveInputs).toHaveBeenCalledWith(null)
  })

  it('should save null when workflow info is available but no inputs exist', async () => {
    const mockWorkflowInfo: WorkflowInfo = {
      owner: 'test-owner',
      repo: 'test-repo',
      workflowFileName: 'test-without-inputs.yml',
      ref: 'main',
      inputs: new Map()
    }

    mockWorkflowRepository.fetchWorkflowInfo.mockResolvedValue(mockWorkflowInfo)
    mockInputRepository.fetchInputs.mockReturnValue([])

    await useCase.execute()

    expect(mockWorkflowRepository.fetchWorkflowInfo).toHaveBeenCalledTimes(1)
    expect(mockInputRepository.fetchInputs).toHaveBeenCalledTimes(1)
    expect(mockJobSummaryRepository.saveInputs).toHaveBeenCalledWith(null)
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

    mockWorkflowRepository.fetchWorkflowInfo.mockResolvedValue(mockWorkflowInfo)
    mockInputRepository.fetchInputs.mockReturnValue(mockInputs)

    await useCase.execute()

    expect(mockWorkflowRepository.fetchWorkflowInfo).toHaveBeenCalledTimes(1)
    expect(mockInputRepository.fetchInputs).toHaveBeenCalledTimes(1)
    expect(mockJobSummaryRepository.saveInputs).toHaveBeenCalledWith(mockInputs)
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
    mockWorkflowRepository.fetchWorkflowInfo.mockResolvedValue(mockWorkflowInfo)
    mockInputRepository.fetchInputs.mockReturnValue([])

    await useCase.execute()

    expect(mockWorkflowRepository.fetchWorkflowInfo).toHaveBeenCalledTimes(1)
    expect(mockInputRepository.fetchInputs).toHaveBeenCalledTimes(1)
    expect(mockJobSummaryRepository.saveInputs).toHaveBeenCalledWith(null)
  })
})
