import { InputInfo } from '@domains/value-objects/InputInfo.js'
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
   * Execute the use case: fetch inputs, enrich with descriptions, and save to Job Summary
   */
  async execute(): Promise<void> {
    // Fetch workflow information first to get correct input names
    const workflowInfo = await this.workflowRepository.fetchWorkflowInfo()

    if (!workflowInfo) {
      // If workflow info cannot be fetched, fall back to environment variables
      const rawInputs = this.inputRepository.fetchInputs()
      if (rawInputs.length === 0) {
        await this.jobSummaryRepository.saveInputs(null)
        return
      }
      await this.jobSummaryRepository.saveInputs(rawInputs)
      return
    }

    // Build inputs using correct names from workflow definition
    const inputs = this.buildInputsFromWorkflow(workflowInfo)

    // Handle case with no inputs
    if (inputs.length === 0) {
      await this.jobSummaryRepository.saveInputs(null)
      return
    }

    // Save inputs to Job Summary
    await this.jobSummaryRepository.saveInputs(inputs)
  }

  /**
   * Build input information using correct names from workflow definition
   */
  private buildInputsFromWorkflow(
    workflowInfo: NonNullable<
      Awaited<ReturnType<IWorkflowRepository['fetchWorkflowInfo']>>
    >
  ): InputInfo[] {
    const inputs: InputInfo[] = []

    // Iterate through workflow input definitions (these have correct names)
    for (const [inputName, inputDef] of workflowInfo.inputs.entries()) {
      // Convert input name to environment variable name
      const envVarName = `INPUT_${inputName.replace(/ /g, '_').replace(/-/g, '_').toUpperCase()}`
      const value = process.env[envVarName]

      // Only include inputs that have values
      if (value !== undefined) {
        inputs.push({
          name: inputName,
          value: value,
          description: inputDef.description || inputName
        })
      }
    }

    return inputs
  }
}
