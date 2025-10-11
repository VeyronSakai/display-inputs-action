import * as github from '@actions/github'
import { WorkflowInfo } from '@domains/value-objects/WorkflowInfo.js'
import { IWorkflowRepository } from '@domains/repositories/IWorkflowRepository.js'
import { WorkflowFileParser } from '@infrastructures/parsers/WorkflowFileParser.js'

/**
 * Infrastructure: GitHub API Workflow Repository
 * Concrete implementation for retrieving workflow information using GitHub API
 */
export class GitHubApiWorkflowRepository implements IWorkflowRepository {
  constructor(
    private readonly token: string,
    private readonly parser: WorkflowFileParser
  ) {}

  async fetchWorkflowInfo(): Promise<WorkflowInfo | null> {
    try {
      const workflowRef = process.env.GITHUB_WORKFLOW_REF
      if (!workflowRef) {
        return null
      }

      // GITHUB_WORKFLOW_REF format: owner/repo/.github/workflows/workflow.yml@refs/heads/branch
      const match = workflowRef.match(
        /([^/]+)\/([^/]+)\/\.github\/workflows\/([^@]+)@(.+)/
      )
      if (!match) {
        return null
      }

      const [, owner, repo, workflowFileName, ref] = match
      const refName = ref.replace('refs/heads/', '').replace('refs/tags/', '')

      // Get workflow file from GitHub API
      const octokit = github.getOctokit(this.token)
      const response = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: `.github/workflows/${workflowFileName}`,
        ref: refName
      })

      // Extract content from response
      if (!('content' in response.data)) {
        return null
      }

      const content = Buffer.from(response.data.content, 'base64').toString(
        'utf-8'
      )

      // Parse YAML to get input definitions
      const inputs = this.parser.parseInputDefinitions(content)

      return {
        owner,
        repo,
        workflowFileName,
        ref: refName,
        inputs
      }
    } catch {
      // Return null if an error occurs
      return null
    }
  }
}
