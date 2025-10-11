import * as github from '@actions/github'
import * as yaml from 'js-yaml'
import { WorkflowInfo } from '@domains/value-objects/WorkflowInfo.js'
import { WorkflowInputDefinition } from '@domains/value-objects/WorkflowInputDefinition.js'
import { IWorkflowRepository } from '@domains/repositories/IWorkflowRepository.js'

type WorkflowDefinition = {
  on?: {
    workflow_dispatch?: {
      inputs?: Record<
        string,
        {
          description?: string
          required?: boolean
          default?: string | boolean
          type?: string
        }
      >
    }
  }
}

/**
 * Infrastructure: GitHub API Workflow Repository
 * Concrete implementation for retrieving workflow information using GitHub API
 */
export class GitHubApiWorkflowRepository implements IWorkflowRepository {
  constructor(private readonly token: string) {}

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
      const inputs = this.parseInputDefinitions(content)

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

  /**
   * Extract input definitions from workflow file content
   */
  private parseInputDefinitions(
    content: string
  ): Map<string, WorkflowInputDefinition> {
    try {
      const workflow = yaml.load(content) as WorkflowDefinition
      const inputs = workflow?.on?.workflow_dispatch?.inputs || {}

      const inputMap = new Map<string, WorkflowInputDefinition>()
      for (const [key, value] of Object.entries(inputs)) {
        inputMap.set(key, {
          description: value.description,
          required: value.required,
          defaultValue: value.default,
          type: value.type
        })
      }

      return inputMap
    } catch {
      // Return empty Map if parse error occurs
      return new Map()
    }
  }
}
