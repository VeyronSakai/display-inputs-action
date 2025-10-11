import * as core from '@actions/core'
import { InputInfo } from '@domains/value-objects/InputInfo.js'
import { IJobSummaryRepository } from '@domains/repositories/IJobSummaryRepository.js'

/**
 * Infrastructure: Job Summary Repository
 * Persists workflow input information to GitHub Actions Job Summary
 */
export class JobSummaryRepository implements IJobSummaryRepository {
  async saveInputs(inputs: InputInfo[] | null): Promise<void> {
    if (!inputs || inputs.length === 0) {
      await core.summary
        .addHeading('Workflow Inputs', 2)
        .addRaw('No inputs provided.')
        .write()

      core.info('No workflow_dispatch inputs found.')
      return
    }

    const tableData: string[][] = [['Description', 'Value']]

    for (const input of inputs) {
      tableData.push([input.description, input.value])
    }

    await core.summary
      .addHeading('Workflow Inputs', 2)
      .addTable(tableData)
      .write()

    core.info(`Displayed ${inputs.length} input(s) in Job Summary`)
  }
}
