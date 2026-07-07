export interface Case {
  id: string
  name: string
  citation: string
  court: string
  jurisdiction: string
  year: number
  topics: string[]
  holding: string
  summary: string
  disposition: string
  relevance_score: number
  cites: string[]
}

export interface Statute {
  id: string
  title: string
  jurisdiction: string
  citation: string
  text: string
  enacted: string
  last_amended: string
  history: string
  topics: string[]
}

export interface ContractClause {
  key: string
  label: string
  text: string
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  risk_note: string
}

export interface Contract {
  id: string
  title: string
  type: string
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  clauses: ContractClause[]
  missing_clauses: string[]
  parties: Record<string, string>
  governing_law: string
  term: string
  liability_cap: string | null
}

export interface AnalysisJob {
  id: string
  file: string
  status: 'queued' | 'processing' | 'complete' | 'error'
  queued_at: string
  completed_at: string | null
  risk_level: string | null
  clause_count: number | null
  flags: number | null
  error?: string
}

export interface AuditEntry {
  id: string
  timestamp: string
  tool: string
  user: string
  category: string
  input: Record<string, unknown>
  success: boolean
  duration_ms: number
}

export interface WorkflowStep {
  n: number
  tool: string
  desc: string
}

export interface Workflow {
  id: string
  mnemonic: string
  title: string
  trigger: string
  steps: WorkflowStep[]
}

export interface CitationResult {
  citation: string
  valid: boolean
  normalized: string
  reporter: string
  reporter_name: string
  issues: string[]
  integrity: 'verified' | 'not_found' | 'mismatch'
}

export interface PrivilegeResult {
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  label: string
  provider: string
  indicators: string[]
  recommendation: string
  notice: string
}

export interface BriefOutline {
  case_type: string
  sections: { title: string; content: string }[]
  argument_structure: { issue: string; rule: string; analysis: string; conclusion: string }
  issue_statement: string
}

export interface NegotiationGuide {
  contract_id: string
  party_role: string
  clauses: {
    key: string
    label: string
    recommended_position: 'accept' | 'negotiate' | 'reject'
    rationale: string
    fallback_text: string
  }[]
  missing_clauses: string[]
  notice: string
}

export interface IntegrationStatus {
  courtlistener: { enabled: boolean; url: string }
  pacer: { enabled: boolean; environment: string; fee_warning: string }
  server_config: { transport: string; port: number; categories_enabled: string[] }
}
