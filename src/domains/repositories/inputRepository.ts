import { InputInfo } from '../value-objects/inputInfo.js'

/**
 * Domain Repository Interface: Input Repository
 * Repository interface for retrieving input information from environment variables
 */
export interface IInputRepository {
  /**
   * Get input information from INPUT_* environment variables
   * @returns Array of input information
   */
  fetchInputs(): InputInfo[]
}
