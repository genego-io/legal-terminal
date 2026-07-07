import type {
  Case, Statute, Contract, AnalysisJob, AuditEntry, Workflow,
  CitationResult, PrivilegeResult, BriefOutline, NegotiationGuide, IntegrationStatus
} from './types'

export interface LegalMcpClient {
  // Research
  searchPrecedents(query: string): Promise<Case[]>
  searchCaseLaw(query: string): Promise<Case[]>
  extractStatute(id: string): Promise<Statute | null>
  researchLegalIssue(issue: string): Promise<{ cases: Case[]; statutes: Statute[]; summary: string }>

  // Citation
  validateCitation(citation: string): Promise<CitationResult>
  normalizeCitation(citation: string): Promise<CitationResult>
  verifyCitationIntegrity(citation: string): Promise<CitationResult>

  // Contract
  analyzeContract(contractId: string): Promise<Contract | null>
  compareContracts(a: string, b: string): Promise<{ base: Contract; compare: Contract; diffs: { key: string; change: string }[] }>
  suggestAlternatives(clauseText: string, clauseType: string): Promise<string[]>
  generateNegotiationGuide(contractId: string, partyRole: string): Promise<NegotiationGuide>
  listContracts(): Promise<Contract[]>

  // Document
  analyzeDocument(file: string): Promise<{ metadata: Record<string, string | null>; risk_level: string; clauses: Contract['clauses'] }>
  getAnalysisJobs(): Promise<AnalysisJob[]>
  queueDocumentAnalysis(file: string): Promise<AnalysisJob>

  // Privilege
  checkPrivilegeRisk(file: string, provider: string): Promise<PrivilegeResult>

  // Brief
  generateBriefOutline(caseType: string, facts: string): Promise<BriefOutline>

  // Workflow
  getWorkflows(): Promise<Workflow[]>

  // Audit
  getAuditLog(): Promise<AuditEntry[]>

  // Integration status
  getIntegrationStatus(): Promise<IntegrationStatus>
}
