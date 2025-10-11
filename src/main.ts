import * as core from '@actions/core'
import { ActionHandler } from '@presentations/actionHandler.js'
import { DisplayInputsUseCase } from '@use-cases/displayInputsUseCase.js'
import { WorkflowInputRepository } from '@infrastructures/repositories/workflowInputRepository.js'
import { GitHubApiWorkflowRepository } from '@infrastructures/repositories/gitHubApiWorkflowRepository.js'
import { JobSummaryRepository } from '@infrastructures/repositories/jobSummaryRepository.js'

/**
 * The main function for the action.
 * Assembles and executes each layer based on Onion Architecture
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Create Infrastructure layer instances
    const token = process.env.GITHUB_TOKEN || ''
    const workflowRepository = new GitHubApiWorkflowRepository(token)
    const jobSummaryRepository = new JobSummaryRepository()

    // Fetch workflow info first
    const workflowInfo = await workflowRepository.fetchWorkflowInfo()

    if (!workflowInfo) {
      throw new Error('Failed to fetch workflow information')
    }

    const inputRepository = new WorkflowInputRepository(workflowInfo)

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
