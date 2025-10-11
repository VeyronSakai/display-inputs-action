/**
 * Stub implementation of WorkflowRepository for testing
 * This stub returns pre-configured workflow information
 */
import type { IWorkflowRepository } from '../../../src/domains/repositories/workflowRepository.js'
import type { WorkflowInfo } from '../../../src/domains/value-objects/workflowInfo.js'

export class StubWorkflowRepository implements IWorkflowRepository {
  private workflowInfo: WorkflowInfo | null = null
  private shouldReject = false
  private rejectError: Error | null = null

  /**
   * Set the workflow info that should be returned by fetchWorkflowInfo
   * @param info Workflow information to return, or null
   */
  setWorkflowInfo(info: WorkflowInfo | null): void {
    this.workflowInfo = info
  }

  /**
   * Configure the test double to reject the promise with an error
   * @param error The error to reject with
   */
  setShouldReject(error: Error): void {
    this.shouldReject = true
    this.rejectError = error
  }

  /**
   * Implementation of IWorkflowRepository.fetchWorkflowInfo
   * Returns the pre-configured workflow info or rejects if configured to do so
   */
  async fetchWorkflowInfo(): Promise<WorkflowInfo | null> {
    if (this.shouldReject && this.rejectError) {
      throw this.rejectError
    }
    return this.workflowInfo
  }

  /**
   * Reset the test double to its initial state
   */
  reset(): void {
    this.workflowInfo = null
    this.shouldReject = false
    this.rejectError = null
  }
}
