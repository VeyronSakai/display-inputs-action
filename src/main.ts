import * as core from '@actions/core'
import { ActionHandler } from '@presentations/actionHandler.js'
import { DisplayInputsUseCase } from '@use-cases/DisplayInputsUseCase.js'
import { EnvironmentInputRepository } from '@infrastructures/repositories/EnvironmentInputRepository.js'
import { GitHubApiWorkflowRepository } from '@infrastructures/repositories/GitHubApiWorkflowRepository.js'
import { WorkflowFileParser } from '@infrastructures/parsers/WorkflowFileParser.js'
import { JobSummaryRepository } from '@infrastructures/repositories/JobSummaryRepository.js'

/**
 * The main function for the action.
 * Assembles and executes each layer based on Onion Architecture
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Create Infrastructure layer instances
    const inputRepository = new EnvironmentInputRepository()
    const parser = new WorkflowFileParser()
    const token = process.env.GITHUB_TOKEN || ''
    const workflowRepository = new GitHubApiWorkflowRepository(token, parser)
    const jobSummaryRepository = new JobSummaryRepository()

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
