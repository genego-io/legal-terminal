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
  short_label?: string
  title: string
  type: string
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  clauses: ContractClause[]
  missing_clauses: string[]
  parties: Record<string, string>
  party_roles?: { buyer: string; seller: string; mutual: string }
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
  result_summary?: string
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

export interface NegotiationGuideEntry {
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

export type NegotiationGuidesMap = Record<
  string,
  Partial<Record<'buyer' | 'seller' | 'mutual', NegotiationGuideEntry>>
>

export type ClauseAlternativesMap = Record<string, string[]>

export interface DocumentProfile {
  contract_id: string | null
  payment_terms: string | null
  document_type?: string
  page_count?: number | null
  summary?: string
  snippet?: string | null
  privilege: {
    risk_override?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    indicators: string[]
  }
  queue_fail?: boolean
}

export interface PanelMeta {
  search_examples: string[]
  brief_case_types: string[]
  citation_examples: string[]
  statute_quick_links: { label: string; id: string }[]
  ai_providers: { id: string; label: string; zdr: boolean; training: boolean; hipaa: boolean }[]
  privilege_risk_labels: Record<string, string>
  privilege_demo_files: string[]
}

export type DocumentProfilesMap = Record<string, DocumentProfile>

export type BriefOutlinesMap = Record<string, Omit<BriefOutline, 'case_type'> & { case_type: string }>
