import type {
  Case, Statute, Contract, AnalysisJob, AuditEntry, Workflow,
  CitationResult, PrivilegeResult, BriefOutline, NegotiationGuide, IntegrationStatus,
  UserWorkflow, WorkflowRun, Automation, TriggerRule, ParalegalInboxConfig,
  InboxMessage, TriggerCategory, ToolCatalogEntry, AppSettings,
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
  getUserWorkflows(): Promise<UserWorkflow[]>
  saveUserWorkflow(w: UserWorkflow): Promise<UserWorkflow>
  deleteUserWorkflow(id: string): Promise<void>
  runWorkflow(workflowId: string, source: 'builtin' | 'user'): Promise<WorkflowRun>
  getToolCatalog(): Promise<ToolCatalogEntry[]>

  // Automations
  getAutomations(): Promise<Automation[]>
  saveAutomation(a: Automation): Promise<Automation>
  deleteAutomation(id: string): Promise<void>
  toggleAutomation(id: string, enabled: boolean): Promise<Automation>
  runAutomationNow(id: string): Promise<WorkflowRun | null>

  // Triggers + Inbox
  getTriggerCategories(): Promise<TriggerCategory[]>
  getTriggerRules(): Promise<TriggerRule[]>
  saveTriggerRule(r: TriggerRule): Promise<TriggerRule>
  deleteTriggerRule(id: string): Promise<void>
  getParalegalInboxConfig(): Promise<ParalegalInboxConfig>
  saveParalegalInboxConfig(cfg: ParalegalInboxConfig): Promise<ParalegalInboxConfig>
  getInboxMessages(): Promise<InboxMessage[]>
  simulateInboundMessage(seedId?: string): Promise<InboxMessage>
  processInboxMessage(id: string): Promise<InboxMessage | null>
  dismissInboxMessage(id: string): Promise<void>
  testPop3Connection(): Promise<{ ok: boolean; message: string }>

  // Settings
  getAppSettings(): Promise<AppSettings>
  saveAppSettings(partial: Partial<AppSettings>): Promise<AppSettings>

  // Audit
  getAuditLog(): Promise<AuditEntry[]>

  // Integration status
  getIntegrationStatus(): Promise<IntegrationStatus>
}
