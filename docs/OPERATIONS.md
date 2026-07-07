# Operations Guide — Workflows, Automations & Triggers

This guide covers the **Operations** stack in the web terminal (v0.2.0-pre.3+):

| Mnemonic | Module | Purpose |
|----------|--------|---------|
| `WKFL` | Workflows | Browse system playbooks · build custom tool sequences |
| `AUTM` | Automations | Schedule workflows on time or events (F8) |
| `TRIG` | Triggers | Paralegal inbox · POP3 config · category routing rules |

---

## How they fit together

```
Inbound email (simulated)  →  TRIG categorizes  →  rule matches  →  AUTM runs workflow
                                                              └→  CHAT prompt (optional)
```

User-built workflows in **WKFL Builder** can be referenced by **AUTM** and **TRIG** the same way as system playbooks (when they have executable steps).

---

## 1. Workflow Builder (`WKFL`)

### Browse tab
- Lists **system playbooks** from `fixtures/workflows.json`
- Playbooks with `executable_steps` show **Run workflow** (executes MCP tools in sequence)
- Others show **Open {mnemonic} →** (navigates to the related panel)

### Builder tab
1. Click **+ New workflow**
2. Set **title** and **trigger description**
3. **Add step** — pick a tool from the MCP catalog, fill required params
4. **Save** — stored in `localStorage` key `legal-term-user-workflows`
5. **Test run** — executes steps and shows per-step results

---

## 2. Automations (`AUTM`)

1. Open **Automations** (sidebar or `F8`)
2. Click **+ New automation**
3. Choose **workflow** (system with executable steps, or custom)
4. Set **schedule**:
   - **Daily / Weekly / Once** — time-based (checked every 30s while tab is open)
   - **On event** — `job_complete`, `document_upload`, `contract_selected`, `email_received`, `app_open`
5. **Enable** the checkbox in the list
6. **Run now** to test manually

Stored in `legal-term-automations`. Seed automations load on first visit.

---

## 3. Triggers (`TRIG`)

### Paralegal Inbox
- Shows configured inbox address and pending messages
- **Simulate inbound** — injects a seed message (NDA, privilege memo, deposition)
- **Process** — runs category rules → automation → optional Paralegal prompt
- **Open in Paralegal** — navigates to `CHAT`

### POP3 configuration
- Save host, port, username, password, TLS
- **Test connection** returns simulated success (real POP3 requires a server-side worker)
- Banner explains pre-release limitation

### Category rules
Categories: **Contract**, **Privilege**, **Litigation**, **HR / Employment**, **General**

Each rule can specify:
- Subject keywords, sender domains, attachment types
- Linked **automation** (optional)
- **Agent prompt template** with tokens:

| Token | Replaced with |
|-------|----------------|
| `{{subject}}` | Email subject |
| `{{from}}` | Sender address |
| `{{category}}` | Category label |
| `{{filename}}` | First attachment name |
| `{{attachmentCount}}` | Number of attachments |

Enable **Auto-run in Paralegal** to queue the prompt in `CHAT` when a message is processed.

---

## Data persistence (localStorage)

| Key | Contents |
|-----|----------|
| `legal-term-user-workflows` | Custom workflows |
| `legal-term-automations` | Scheduled automations |
| `legal-term-trigger-rules` | Category routing rules |
| `legal-term-inbox-config` | POP3 + inbox address |
| `legal-term-inbox-messages` | Inbound queue |
| `legal-term-settings` | CONF tab settings |
| `legal-term-ops-seeded` | First-visit seed flag |

Data is **per browser** — clearing site data removes it.

---

## Limitations (pre-release)

- Automations and triggers only run **while the terminal tab is open**
- Inbound mail is **simulated** — no real POP3 from the browser
- Live MCP mode uses the same local stores (no server CRUD yet)
- Built-in playbooks need `executable_steps` in JSON to be schedulable

---

## Demo walkthrough

1. **WKFL → Browse** — run **Citation Cleanup** workflow
2. **WKFL → Builder** — create a 2-step workflow (`listContracts` → `analyzeContract`)
3. **AUTM** — schedule it on **job_complete**, enable, upload a file in **JOBS**
4. **TRIG → Simulate inbound** — pick "Revised NDA", click **Process**
5. **CHAT** — see the auto-queued prompt from the Contract category rule
