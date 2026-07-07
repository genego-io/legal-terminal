import type { LegalMcpClient } from '../mcp/client'
import type { WorkflowRun, WorkflowStepDef, UserWorkflow } from '../mcp/types'
import { WORKFLOWS } from '../fixtures'
import { workflowStore } from './stores'

let runCounter = 0

type ToolInvoker = (client: LegalMcpClient, params: Record<string, string>) => Promise<unknown>

const TOOL_MAP: Record<string, ToolInvoker> = {
  searchPrecedents: (c, p) => c.searchPrecedents(p.query ?? ''),
  searchCaseLaw: (c, p) => c.searchCaseLaw(p.query ?? ''),
  extractStatute: (c, p) => c.extractStatute(p.id ?? ''),
  researchLegalIssue: (c, p) => c.researchLegalIssue(p.issue ?? ''),
  validateCitation: (c, p) => c.validateCitation(p.citation ?? ''),
  normalizeCitation: (c, p) => c.normalizeCitation(p.citation ?? ''),
  verifyCitationIntegrity: (c, p) => c.verifyCitationIntegrity(p.citation ?? ''),
  analyzeContract: (c, p) => c.analyzeContract(p.contractId ?? ''),
  compareContracts: (c, p) => c.compareContracts(p.a ?? '', p.b ?? ''),
  suggestAlternatives: (c, p) => c.suggestAlternatives(p.clauseText ?? '', p.clauseType ?? ''),
  generateNegotiationGuide: (c, p) => c.generateNegotiationGuide(p.contractId ?? '', p.partyRole ?? 'buyer'),
  listContracts: c => c.listContracts(),
  analyzeDocument: (c, p) => c.analyzeDocument(p.file ?? ''),
  queueDocumentAnalysis: (c, p) => c.queueDocumentAnalysis(p.file ?? ''),
  checkPrivilegeRisk: (c, p) => c.checkPrivilegeRisk(p.file ?? '', p.provider ?? 'openai'),
  generateBriefOutline: (c, p) => c.generateBriefOutline(p.caseType ?? '', p.facts ?? ''),
}

function summarizeResult(_toolId: string, result: unknown): string {
  if (result == null) return 'No result'
  if (Array.isArray(result)) return `${result.length} item(s) returned`
  if (typeof result === 'object') {
    const r = result as Record<string, unknown>
    if ('valid' in r) return r.valid ? 'Citation valid' : 'Citation invalid'
    if ('risk_level' in r) return `Risk: ${r.risk_level}`
    if ('title' in r) return String(r.title)
    if ('diffs' in r && Array.isArray(r.diffs)) return `${(r.diffs as unknown[]).length} diff(s)`
    return 'Completed'
  }
  return String(result)
}

function getSteps(workflowId: string, source: 'builtin' | 'user'): WorkflowStepDef[] | null {
  if (source === 'user') {
    const w = workflowStore.list().find(x => x.id === workflowId)
    return w?.steps ?? null
  }
  const w = WORKFLOWS.find(x => x.id === workflowId)
  return w?.executable_steps ?? null
}

export async function runWorkflow(
  client: LegalMcpClient,
  workflowId: string,
  source: 'builtin' | 'user',
): Promise<WorkflowRun> {
  const steps = getSteps(workflowId, source)
  const run: WorkflowRun = {
    id: `run-${++runCounter}`,
    workflowId,
    source,
    status: 'running',
    startedAt: new Date().toISOString(),
    completedAt: null,
    steps: [],
  }
  if (!steps?.length) {
    run.status = 'error'
    run.completedAt = new Date().toISOString()
    run.steps.push({ stepId: 'none', toolId: '', success: false, duration_ms: 0, summary: 'No executable steps' })
    return run
  }

  for (const step of steps) {
    const invoker = TOOL_MAP[step.toolId]
    if (!invoker) {
      run.steps.push({ stepId: step.id, toolId: step.toolId, success: false, duration_ms: 0, summary: `Unknown tool: ${step.toolId}` })
      run.status = 'error'
      break
    }
    const t0 = Date.now()
    try {
      const result = await invoker(client, step.params)
      run.steps.push({
        stepId: step.id,
        toolId: step.toolId,
        success: true,
        duration_ms: Date.now() - t0,
        summary: summarizeResult(step.toolId, result),
      })
    } catch (e) {
      run.steps.push({
        stepId: step.id,
        toolId: step.toolId,
        success: false,
        duration_ms: Date.now() - t0,
        summary: e instanceof Error ? e.message : 'Step failed',
      })
      run.status = 'error'
      break
    }
  }
  if (run.status === 'running') run.status = 'success'
  run.completedAt = new Date().toISOString()
  return run
}

export function createUserWorkflow(title: string, trigger: string, steps: WorkflowStepDef[]): UserWorkflow {
  const now = new Date().toISOString()
  return {
    id: `user-wf-${Date.now()}`,
    title,
    trigger,
    steps,
    createdAt: now,
    updatedAt: now,
    source: 'user',
  }
}
