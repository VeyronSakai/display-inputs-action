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

    // Iterate through workflow input definitions (these have correct names)
    for (const [inputName, inputDef] of this.workflowInfo.inputs.entries()) {
      // Convert input name to environment variable name
      const envVarName = `INPUT_${inputName.replace(/ /g, '_').replace(/-/g, '_').toUpperCase()}`
      const value = process.env[envVarName]

      // Only include inputs that have values
      if (value !== undefined) {
        inputs.push({
          name: inputName,
          value: value,
          description: inputDef.description || inputName
        })
      }
    }

    return inputs
  }
}
