import { InputInfo } from '@domains/value-objects/InputInfo.js'
import { IInputRepository } from '@domains/repositories/IInputRepository.js'

/**
 * Infrastructure: Environment Input Repository
 * Concrete implementation for retrieving input information from INPUT_* environment variables
 */
export class EnvironmentInputRepository implements IInputRepository {
  fetchInputs(): InputInfo[] {
    const inputs: InputInfo[] = []
    const inputPrefix = 'INPUT_'

    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(inputPrefix) && value !== undefined) {
        const inputName = key
          .slice(inputPrefix.length)
          .toLowerCase()
          .replace(/_/g, '-')
        inputs.push({
          name: inputName,
          value: value,
          description: inputName
        })
      }
    }

    return inputs
  }
}
