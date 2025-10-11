import { InputInfo } from '../value-objects/inputInfo.js'

/**
 * Domain Repository Interface: Job Summary Repository
 * Repository interface for persisting workflow inputs to GitHub Job Summary
 */
export interface IJobSummaryRepository {
  /**
   * Save workflow inputs to Job Summary
   * @param inputs Array of input information to save, or null if no inputs
   */
  saveInputs(inputs: InputInfo[] | null): Promise<void>
}
