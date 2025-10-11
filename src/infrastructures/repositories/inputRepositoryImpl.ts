import * as core from '@actions/core'
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
   * Converts input names to environment variable names and retrieves values
   */
  fetchInputs(): InputInfo[] {
    const inputs: InputInfo[] = []

    // Debug: Log workflow info
    core.debug('=== Debug: Workflow Info ===')
    core.debug(`Number of inputs in workflow definition: ${this.workflowInfo.inputs.size}`)
    for (const [name, def] of this.workflowInfo.inputs.entries()) {
      core.debug(`  Input: ${name} - Description: ${def.description || 'N/A'}`)
    }
    core.debug('=== End Workflow Info ===')

    // Debug: Log all INPUT_ environment variables
    core.debug('=== Debug: Environment Variables ===')
    const inputEnvVars = Object.entries(process.env).filter(([key]) => key.startsWith('INPUT_'))
    core.debug(`Found ${inputEnvVars.length} INPUT_ environment variables:`)
    for (const [key, value] of inputEnvVars) {
      core.debug(`  ${key}: ${value}`)
    }
    core.debug('=== End Environment Variables ===')

    // Iterate through workflow input definitions (these have correct names)
    core.debug('=== Debug: Mapping Inputs ===')
    for (const [inputName, inputDef] of this.workflowInfo.inputs.entries()) {
      // Convert input name to environment variable name
      const envVarName = `INPUT_${inputName.replace(/ /g, '_').replace(/-/g, '_').toUpperCase()}`
      core.debug(`Mapping: "${inputName}" -> "${envVarName}"`)
      const value = process.env[envVarName]

      // Only include inputs that have values
      if (value !== undefined) {
        core.debug(`  ✓ Found value: ${value}`)
        inputs.push({
          name: inputName,
          value: value,
          description: inputDef.description || inputName
        })
      } else {
        core.debug(`  ✗ No value found (undefined)`)
      }
    }
    core.debug('=== End Mapping ===')
    core.debug(`Total inputs found: ${inputs.length}`)

    return inputs
  }
}
