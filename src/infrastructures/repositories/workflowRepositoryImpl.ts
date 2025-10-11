import * as github from '@actions/github'
import * as yaml from 'js-yaml'
import { WorkflowInfo } from '@domains/value-objects/workflowInfo.js'
import { WorkflowInputDefinition } from '@domains/value-objects/workflowInputDefinition.js'
import { IWorkflowRepository } from '@domains/repositories/workflowRepository.js'

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
export class WorkflowRepositoryImpl implements IWorkflowRepository {
  constructor(private readonly token: string) {}

  async fetchWorkflowInfo(): Promise<WorkflowInfo | null> {
    try {
      const workflowRef = process.env.GITHUB_WORKFLOW_REF
      if (!workflowRef) {
        console.error('GITHUB_WORKFLOW_REF environment variable is not set')
        return null
      }

      // GITHUB_WORKFLOW_REF format: owner/repo/.github/workflows/workflow.yml@refs/heads/branch
      const match = workflowRef.match(/([^/]+)\/([^/]+)\/\.github\/workflows\/([^@]+)@(.+)/)
      if (!match) {
        console.error(`Invalid GITHUB_WORKFLOW_REF format: ${workflowRef}`)
        return null
      }

      const [, owner, repo, workflowFileName, ref] = match
      const refName = ref.replace(/^refs\/heads\//, '').replace(/^refs\/tags\//, '')

      console.log(`Fetching workflow info for ${owner}/${repo}, workflow: ${workflowFileName}, ref: ${refName}`)

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
        console.error('No content found in GitHub API response')
        return null
      }

      const content = Buffer.from(response.data.content, 'base64').toString('utf-8')

      // Parse YAML to get input definitions
      const inputs = this.parseInputDefinitions(content)

      return {
        owner,
        repo,
        workflowFileName,
        ref: refName,
        inputs
      }
    } catch (error) {
      // Log error details for debugging
      console.error('Error fetching workflow info:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      return null
    }
  }

  /**
   * Extract input definitions from workflow file content
   */
  private parseInputDefinitions(content: string): Map<string, WorkflowInputDefinition> {
    try {
      console.log('=== Debug: Parsing workflow YAML ===')
      const workflow = yaml.load(content) as WorkflowDefinition
      const inputs = workflow?.on?.workflow_dispatch?.inputs || {}

      console.log(`Found workflow_dispatch inputs: ${Object.keys(inputs).length}`)
      console.log('Input names:', Object.keys(inputs))

      const inputMap = new Map<string, WorkflowInputDefinition>()
      for (const [key, value] of Object.entries(inputs)) {
        console.log(`  Adding input: ${key} (${value.type || 'string'})`)
        inputMap.set(key, {
          description: value.description,
          required: value.required,
          defaultValue: value.default,
          type: value.type
        })
      }

      console.log(`=== Total inputs parsed: ${inputMap.size} ===`)
      return inputMap
    } catch (error) {
      // Log parse error for debugging
      console.error('Error parsing workflow YAML:', error)
      return new Map()
    }
  }
}
