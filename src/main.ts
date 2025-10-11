import * as core from '@actions/core'
import { ActionHandler } from '@presentations/actionHandler.js'
import { DisplayInputsUseCase } from '@use-cases/displayInputsUseCase.js'
import { InputRepositoryImpl } from '@infrastructures/repositories/inputRepositoryImpl.js'
import { WorkflowRepositoryImpl } from '@infrastructures/repositories/workflowRepositoryImpl.js'
import { JobSummaryRepositoryImpl } from '@infrastructures/repositories/jobSummaryRepositoryImpl.js'

/**
 * The main function for the action.
 * Assembles and executes each layer based on Onion Architecture
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Check if the workflow was triggered by workflow_dispatch
    const eventName = process.env.GITHUB_EVENT_NAME
    if (eventName !== 'workflow_dispatch') {
      core.warning(
        `This action is designed for workflow_dispatch events only. Current event: ${eventName}`
      )
      core.info('Skipping action execution.')
      return
    }

    // Create Infrastructure layer instances
    const token = process.env.GITHUB_TOKEN || ''
    const workflowRepository = new WorkflowRepositoryImpl(token)
    const jobSummaryRepository = new JobSummaryRepositoryImpl()

    // Fetch workflow info first
    const workflowInfo = await workflowRepository.fetchWorkflowInfo()

    if (!workflowInfo) {
      throw new Error('Failed to fetch workflow information')
    }

    const inputRepository = new InputRepositoryImpl(workflowInfo)

    // Create Application layer use case
    const useCase = new DisplayInputsUseCase(
      inputRepository,
      workflowRepository,
      jobSummaryRepository
    )

    // Create and execute Presentation layer handler
    const actionHandler = new ActionHandler(useCase)
    await actionHandler.run()
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
