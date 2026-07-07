import { CONTRACTS, DOCUMENT_PROFILES, PANEL_META } from './fixtures'

export {
  CASES, STATUTES, CONTRACTS, JOBS, AUDIT_LOG, WORKFLOWS,
  NEGOTIATION_GUIDES, CLAUSE_ALTERNATIVES, DOCUMENT_PROFILES, BRIEF_OUTLINES,
  PANEL_META,
} from './fixtures'

/** Contract picker — derived from canonical fixtures */
export const CONTRACT_PICKER = CONTRACTS.map(c => ({
  id: c.id,
  label: c.short_label ?? c.title,
  title: c.title,
  type: c.type,
  risk_level: c.risk_level,
  parties: c.parties,
  governing_law: c.governing_law,
  term: c.term,
}))

/** Example document filenames for DOCA / PRIV panels */
export const MOCK_DOCUMENT_FILES = Object.keys(DOCUMENT_PROFILES).filter(
  f => !f.startsWith('fail_')
)

/** Panel constants from fixtures/panel_meta.json */
export const SEARCH_EXAMPLES = PANEL_META.search_examples
export const BRIEF_CASE_TYPES = PANEL_META.brief_case_types
export const CITATION_EXAMPLES = PANEL_META.citation_examples
export const STATUTE_QUICK_LINKS = PANEL_META.statute_quick_links
export const AI_PROVIDERS = PANEL_META.ai_providers
export const PRIVILEGE_RISK_LABELS = PANEL_META.privilege_risk_labels
export const PRIVILEGE_DEMO_FILES = PANEL_META.privilege_demo_files
