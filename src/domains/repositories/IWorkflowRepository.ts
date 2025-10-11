import { WorkflowInfo } from '../value-objects/WorkflowInfo.js'

/**
 * Domain Repository Interface: Workflow Repository
 * Repository interface for retrieving workflow information
 * Concrete implementation is provided by Infrastructure layer
 */
export interface IWorkflowRepository {
  /**
   * Get workflow information using GitHub API
   * @returns Workflow information, or null if unable to retrieve
   */
  fetchWorkflowInfo(): Promise<WorkflowInfo | null>
}
