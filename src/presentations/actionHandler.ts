import * as core from '@actions/core'
import { DisplayInputsUseCase } from '@use-cases/displayInputsUseCase.js'

/**
 * Presentation Layer: GitHub Actions Handler
 * GitHub Actions との連携を担当
 */
export class ActionHandler {
  constructor(private useCase: DisplayInputsUseCase) {}

  async run(): Promise<void> {
    try {
      core.info('Starting Display Inputs Action')
      await this.useCase.execute()
      core.info('Display Inputs Action completed successfully')
    } catch (error) {
      if (error instanceof Error) {
        core.setFailed(error.message)
      } else {
        core.setFailed('An unknown error occurred')
      }
    }
  }
}
