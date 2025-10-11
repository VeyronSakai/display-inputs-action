import { WorkflowInputDefinition } from './workflowInputDefinition.js'

/**
 * Domain Value Object: Workflow Information
 * Represents a GitHub Actions workflow definition
 */
export type WorkflowInfo = {
  readonly owner: string
  readonly repo: string
  readonly workflowFileName: string
  readonly ref: string
  readonly inputs: Map<string, WorkflowInputDefinition>
}
