/**
 * Stub implementation of InputRepository for testing
 * This stub returns pre-configured input values
 */
import type { IInputRepository } from '../../../src/domains/repositories/inputRepository.js'
import type { InputInfo } from '../../../src/domains/value-objects/inputInfo.js'

export class StubInputRepository implements IInputRepository {
  private inputs: InputInfo[] = []

  /**
   * Set the inputs that should be returned by fetchInputs
   * @param inputs Array of input information to return
   */
  setInputs(inputs: InputInfo[]): void {
    this.inputs = inputs
  }

  /**
   * Implementation of IInputRepository.fetchInputs
   * Returns the pre-configured inputs
   */
  fetchInputs(): InputInfo[] {
    return this.inputs
  }

  /**
   * Reset the test double to its initial state
   */
  reset(): void {
    this.inputs = []
  }
}