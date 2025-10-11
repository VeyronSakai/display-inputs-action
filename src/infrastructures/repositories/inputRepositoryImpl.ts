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

    // Debug: Log all INPUT_ environment variables
    console.log('=== Debug: Environment Variables ===')
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith('INPUT_')) {
        console.log(`${key}: ${value}`)
      }
    }
    console.log('=== End Environment Variables ===')

    // Iterate through workflow input definitions (these have correct names)
    for (const [inputName, inputDef] of this.workflowInfo.inputs.entries()) {
      // Convert input name to environment variable name
      const envVarName = `INPUT_${inputName.replace(/ /g, '_').replace(/-/g, '_').toUpperCase()}`
      console.log(`Looking for input "${inputName}" as env var "${envVarName}"`)
      const value = process.env[envVarName]

      // Only include inputs that have values
      if (value !== undefined) {
        console.log(`  Found value: ${value}`)
        inputs.push({
          name: inputName,
          value: value,
          description: inputDef.description || inputName
        })
      } else {
        console.log(`  No value found`)
      }
    }

    return inputs
  }
}
