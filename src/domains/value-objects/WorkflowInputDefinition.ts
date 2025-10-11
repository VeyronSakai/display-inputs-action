/**
 * Domain Value Object: Workflow Input Definition
 * Represents the definition of a workflow_dispatch input
 */
export type WorkflowInputDefinition = {
  readonly description?: string
  readonly required?: boolean
  readonly defaultValue?: string | boolean
  readonly type?: string
}
