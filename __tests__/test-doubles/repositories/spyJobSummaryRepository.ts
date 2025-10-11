/**
 * Spy implementation of JobSummaryRepository for testing
 * This spy records calls and allows verification of saved inputs
 */
import type { IJobSummaryRepository } from '../../../src/domains/repositories/jobSummaryRepository.js'
import type { InputInfo } from '../../../src/domains/value-objects/inputInfo.js'

export class SpyJobSummaryRepository implements IJobSummaryRepository {
  private savedInputs: InputInfo[] | null = null
  private saveCallCount = 0
  private shouldReject = false
  private rejectError: Error | null = null

  /**
   * Configure the test double to reject the promise with an error
   * @param error The error to reject with
   */
  setShouldReject(error: Error): void {
    this.shouldReject = true
    this.rejectError = error
  }

  /**
   * Implementation of IJobSummaryRepository.saveInputs
   * Saves the inputs for verification in tests
   */
  async saveInputs(inputs: InputInfo[] | null): Promise<void> {
    if (this.shouldReject && this.rejectError) {
      throw this.rejectError
    }
    this.savedInputs = inputs
    this.saveCallCount++
  }

  /**
   * Get the last saved inputs for verification in tests
   */
  getSavedInputs(): InputInfo[] | null {
    return this.savedInputs
  }

  /**
   * Get the number of times saveInputs was called
   */
  getSaveCallCount(): number {
    return this.saveCallCount
  }

  /**
   * Verify that saveInputs was called with specific inputs
   * @param expectedInputs The inputs to verify against
   * @returns true if the inputs match, false otherwise
   */
  verifySavedInputs(expectedInputs: InputInfo[] | null): boolean {
    if (expectedInputs === null && this.savedInputs === null) {
      return true
    }
    if (expectedInputs === null || this.savedInputs === null) {
      return false
    }
    if (expectedInputs.length !== this.savedInputs.length) {
      return false
    }
    return expectedInputs.every((expectedInput, index) => {
      const savedInput = this.savedInputs![index]
      return (
        expectedInput.name === savedInput.name &&
        expectedInput.value === savedInput.value &&
        expectedInput.description === savedInput.description
      )
    })
  }

  /**
   * Reset the test double to its initial state
   */
  reset(): void {
    this.savedInputs = null
    this.saveCallCount = 0
    this.shouldReject = false
    this.rejectError = null
  }
}