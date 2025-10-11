import * as core from '@actions/core'
import * as fs from 'fs'
import { InputInfo } from '@domains/value-objects/inputInfo.js'
import { WorkflowInfo } from '@domains/value-objects/workflowInfo.js'
import { IInputRepository } from '@domains/repositories/inputRepository.js'

/**
 * Repository for fetching inputs from workflow definition
 * Uses workflow definition as the source of truth for input names
 */
export class InputRepositoryImpl implements IInputRepository {
  constructor(private readonly workflowInfo: WorkflowInfo) {}

  /**
   * Fetch inputs using correct names from workflow definition
   * For workflow_dispatch events, reads inputs from the GitHub event payload
   */
  fetchInputs(): InputInfo[] {
    const inputs: InputInfo[] = []

    // Get inputs from GitHub event payload (for workflow_dispatch events)
    const eventPath = process.env.GITHUB_EVENT_PATH
    if (!eventPath) {
      core.debug('GITHUB_EVENT_PATH not found')
      return inputs
    }

    try {
      // Read the event payload
      const eventPayload = JSON.parse(fs.readFileSync(eventPath, 'utf8'))
      core.debug(`Event payload: ${JSON.stringify(eventPayload, null, 2)}`)

      // For workflow_dispatch events, inputs are in the 'inputs' field
      const eventInputs = eventPayload.inputs || {}

      core.debug('=== Debug: Event Inputs ===')
      core.debug(`Found ${Object.keys(eventInputs).length} inputs in event payload:`)
      for (const [key, value] of Object.entries(eventInputs)) {
        core.debug(`  ${key}: ${value}`)
      }
      core.debug('=== End Event Inputs ===')

      // Match inputs from event with workflow definitions
      core.debug('=== Debug: Mapping Inputs ===')
      for (const [inputName, inputDef] of this.workflowInfo.inputs.entries()) {
        core.debug(`Looking for input: "${inputName}"`)

        // The input name in the event payload should match exactly
        const value = eventInputs[inputName]

        if (value !== undefined && value !== null && value !== '') {
          core.debug(`  ✓ Found value: ${value}`)
          inputs.push({
            name: inputName,
            value: String(value), // Ensure it's a string
            description: inputDef.description || inputName
          })
        } else {
          core.debug(`  ✗ No value found or empty`)
        }
      }
      core.debug('=== End Mapping ===')
      core.debug(`Total inputs found: ${inputs.length}`)
    } catch (error) {
      core.debug(`Error reading event payload: ${error}`)
      console.error('Failed to read GitHub event payload:', error)
    }

    return inputs
  }
}
