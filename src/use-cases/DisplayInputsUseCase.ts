import { IInputRepository } from '@domains/repositories/IInputRepository.js'
import { IWorkflowRepository } from '@domains/repositories/IWorkflowRepository.js'
import { IJobSummaryRepository } from '@domains/repositories/IJobSummaryRepository.js'

/**
 * Application Use Case: Display Workflow Inputs
 * Implements business logic for displaying workflow dispatch inputs
 */
export class DisplayInputsUseCase {
  constructor(
    private readonly inputRepository: IInputRepository,
    private readonly workflowRepository: IWorkflowRepository,
    private readonly jobSummaryRepository: IJobSummaryRepository
  ) {}

  /**
   * Execute the use case: fetch inputs and save to Job Summary
   */
  async execute(): Promise<void> {
    // Fetch workflow information to get correct input names
    const workflowInfo = await this.workflowRepository.fetchWorkflowInfo()

    if (!workflowInfo) {
      await this.jobSummaryRepository.saveInputs(null)
      return
    }

    // Fetch inputs using workflow definition
    const inputs = this.inputRepository.fetchInputs()

    // Save inputs to Job Summary (null if no inputs)
    await this.jobSummaryRepository.saveInputs(
      inputs.length === 0 ? null : inputs
    )
  }
}
