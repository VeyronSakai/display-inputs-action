import * as yaml from 'js-yaml'
import { WorkflowInputDefinition } from '@domains/value-objects/WorkflowInputDefinition.js'

type WorkflowDefinition = {
  on?: {
    workflow_dispatch?: {
      inputs?: Record<
        string,
        {
          description?: string
          required?: boolean
          default?: string | boolean
          type?: string
        }
      >
    }
  }
}

/**
 * Infrastructure: Workflow File Parser
 * Parses workflow files in YAML format
 */
export class WorkflowFileParser {
  /**
   * Extract input definitions from workflow file content
   */
  parseInputDefinitions(content: string): Map<string, WorkflowInputDefinition> {
    try {
      const workflow = yaml.load(content) as WorkflowDefinition
      const inputs = workflow?.on?.workflow_dispatch?.inputs || {}

      const inputMap = new Map<string, WorkflowInputDefinition>()
      for (const [key, value] of Object.entries(inputs)) {
        inputMap.set(key, {
          description: value.description,
          required: value.required,
          defaultValue: value.default,
          type: value.type
        })
      }

      return inputMap
    } catch {
      // Return empty Map if parse error occurs
      return new Map()
    }
  }
}
