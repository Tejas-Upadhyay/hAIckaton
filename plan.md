# Implementation Plan: SWFL StormGuard AI

A hyper-local hurricane preparedness, evacuation intelligence, and multimodal AI damage assessment web application engineered for Southwest Florida (Lee, Collier, and Charlotte counties).

---

## 1. Goal Description

Southwest Florida experiences intense, recurring hurricane impacts (e.g., Ian, Milton, Helene). Residents, students, and local businesses face two critical bottlenecks during storm events:
1. **Evacuation & Life Safety Ambiguity**: Confusion surrounding localized storm-surge evacuation zones (A through E), open emergency shelter capacity (e.g., Alico Arena at FGCU, Hertz Arena in Estero), and rapidly changing boil-water notices.
2. **Post-Landfall Insurance & FEMA Delay**: Filing claims requires rigorous photographic categorization of damage (roof underlayment breaches, waterlines on drywall, structural framing defects). Delays or improper documentation postpone recovery aid by months.

**SWFL StormGuard AI** delivers an all-in-one, high-impact web application featuring:
* **Multimodal Property Damage & Loss Auditor**: Upload a photo of exterior/interior damage or inventory. Vision AI analyzes damage severity, FEMA damage category, detects safety hazards (mold, wiring, collapse risk), and produces an exportable, itemized insurance claim summary.
* **SWFL Evacuation & Zone Navigator**: Instant zone identification (Zones A–E) for Cape Coral, Fort Myers, Sanibel, Naples, Estero, and Punta Gorda, with real-time shelter statuses and supply distribution points.
* **Interactive AI Crisis Copilot & Dynamic Checklist**: Context-aware guidance for generator safety, shutter timing, and pet evacuation protocols.
* **Zero-Failure Offline Demo Engine**: Pre-bundled high-res damage test cases and pre-compiled telemetry ensuring the live 5-minute judge demo never fails, even under poor conference Wi-Fi.

---

## 1.1 Solo Builder & AI Development Team

The participant is **building solo**: one human entrant, project owner, and submission captain. **Codex, OpenCode, and Antigravity (`agy`) are the AI development tools supporting that participant**, not additional human teammates. List all AI tools used in the hackathon submission.

### AI Tool & Model Setup

| Tool | Assigned role | Model configuration |
|---|---|---|
| **Codex** | Lead coordinator and integrator: break down the plan, define shared interfaces, review changes, resolve integration issues, and run final checks. | **`gpt-6.1-sol-medium-fast`** (user-reported selection). |
| **OpenCode** | AI service and data implementation: multimodal request/response handling, response validation, sample cases, and explicit demo fallback behavior. | **DeepSeek V4.1 Flash**, free option in OpenCode, with **max effort** (interpreting the user's “max” setting). |
| **Antigravity (`agy`)** | Frontend and demo experience: React components, responsive layout, upload/preview interactions, printable reports, and browser verification. | **Gemini 3.8**, using **High Effort** (user-reported selection). |

Model names and settings above were supplied by the project owner. They document the intended setup; they have not been independently verified against active sessions or provider API IDs. Resolve each tool's exact CLI model identifier when launching automated tasks. These are the intended assignments, not a claim that an automated connection is already configured. Each tool uses its own authenticated session. Their chat histories are separate; context must be passed through instructions, task handoffs, and committed files.

### Coordination & File Ownership

1. **Agree on shared contracts first.** Codex establishes the scaffold, dependencies, data shapes, and service exports before parallel implementation. Record shared project instructions in root `AGENTS.md`, and explicitly ask every tool to read both `AGENTS.md` and `plan.md` when starting a task.
2. **Give each worker a separate Git worktree and branch.** Keep Codex in the integration checkout, OpenCode on `work/backend`, and Antigravity on `work/frontend`. Create worktrees after the initial project commit. A worker edits only its assigned checkout.
3. **Assign one owner per file.** Codex owns scaffold/configuration and shared contracts; OpenCode owns `src/services/` and `src/data/`; Antigravity owns `src/components/` and presentation styles. Route changes to dependencies, shared contracts, and integration files through Codex.
4. **Dispatch bounded tasks.** Each handoff states the task, allowed files, expected behavior, dependencies, and verification command. If a task requires another worker's files, report the dependency to Codex before editing them.
5. **Return reviewable results.** Each worker reports its branch, commit hash, changed files, checks run, and remaining issues. Codex reviews and merges completed work, then verifies the integrated application. Instructions and status in separate worktrees do not synchronize automatically; pass updated contracts and handoffs explicitly.
6. **Keep the solo participant informed.** Codex surfaces scope decisions and blockers to the project owner. The owner gives the pitch and submits the project; AI tools assist with implementation, review, and rehearsal.

### Application AI Model

**Current integration choice:** OpenRouter, with pinned model `nvidia/nemotron-3.5-super-vl:free` (image input and structured-output support checked in provider metadata November 2, 2026). Set server-only `AI_PROVIDER`, `OPENROUTER_API_KEY`, and `OPENROUTER_MODEL`. Gemini remains an optional alternative. The previously supplied Gemini credential returned 401 UNAUTHENTICATED. A new OpenRouter credential and successful real inference are still required; mocked tests do not establish live availability.

The **Gemini vision/chat model used by StormGuard at runtime is separate from the models powering these development tools**. Using Gemini in the app does not configure OpenCode, Codex, or Antigravity. Confirm the available Gemini model ID and credentials before implementing the service, and record the selected runtime model here. The Gemini 2.0/1.5 Flash references below are provisional choices to verify, not confirmed available endpoints. Development-tool subscriptions or logins do not establish that the application's Gemini API credentials are configured.

If live analysis is unavailable, show an explicit **demo/sample result** label. Pre-computed results must not be presented as a fresh AI assessment of an arbitrary uploaded image.

---

## 2. User Review Required

**Implementation decisions (supersede conflicting proposals below):** Follow `AGENTS.md` and `docs/contracts.md`. Gemini secrets stay server-side in `GEMINI_API_KEY` / `GEMINI_MODEL`; no browser API-key drawer or `VITE_GEMINI_API_KEY`. Runtime model selection remains unconfirmed. Live failures show explicit errors, and samples require explicit selection and labeling. Emergency data remains unavailable without verified sources and timestamps; no city-based evacuation zones or fabricated live shelter capacity. The MVP exports a provisional property documentation draft, with no official FEMA classification or repair quote. Frontend uses React 19, Vite 8, and Tailwind 4 as documented in `docs/dependencies.md`.

> [!IMPORTANT]
> **Demo Reliability & API Fallback**:
> The app defaults to a seamless dual-mode: if an API key (`VITE_GEMINI_API_KEY` or user-entered key in the settings modal) is present, it executes live Gemini 2.0/1.5 Flash multimodal vision analysis. If no key is set or the network fails, it immediately activates the high-fidelity pre-computed SWFL damage dataset without throwing errors.

> [!NOTE]
> **Hackathon Submission Deadline**:
> Build freeze is strictly at **12:40 PM**. The repository will be pushed to a public GitHub repository and prepared for the form submission at `https://forms.cloud.microsoft/r/d17nVEJXvZ` before 12:40 PM.

---

## 3. Open Questions

1. **API Key Setup**: Do you have a Gemini API key ready, or would you like to use the app's interactive API key settings drawer (or rely on the pre-bundled test cases during judging)?
2. **Additional Features**: Would you like an interactive FEMA claim PDF/print export or is a downloadable JSON/formatted report sufficient? (We will implement a print-styled formal claim summary view).

---

## 4. System Architecture

```mermaid
flowchart TD
    subgraph UI["Frontend Layer (React + Vite + Tailwind CSS)"]
        Nav["Navigation & County Alert Banner"]
        Auditor["Multimodal Damage Auditor"]
        ZoneNav["SWFL Evacuation Zone & Shelter Finder"]
        Copilot["Storm Copilot & Dynamic Checklist"]
        Modal["Claim Report Export Modal"]
    end

    subgraph Logic["Application Logic & State"]
        Store["State Management (Active Zone, Claim Data, Chat)"]
        PresetEngine["Pre-seeded Damage Presets (Cape Coral, Sanibel, Fort Myers)"]
    end

    subgraph Service["AI & Knowledge Layer"]
        AIService["AI Service (Gemini 2.0/1.5 Flash Vision API)"]
        LocalDB["SWFL Emergency Database (Lee, Collier, Charlotte)"]
        Fallback["Resilient Offline Fallback Engine"]
    end

    Auditor --> Store
    ZoneNav --> Store
    Copilot --> Store
    Store --> AIService
    AIService -->|Online| CloudAI["Google Gemini API"]
    AIService -->|Offline / No Key| Fallback
    ZoneNav --> LocalDB
    Store --> Modal
```

---

## 5. Proposed Changes

### Component 1: Core Scaffolding & Configuration

#### [NEW] `package.json`
* Lightweight React 19 / Vite stack with Tailwind CSS, Lucide Icons, and `@google/genai` (or native fetch client):
```json
{
  "name": "swfl-stormguard-ai",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^1.16.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "vite": "^6.2.0"
  }
}
```

#### [NEW] `vite.config.js`
* Configures Vite with React plugin and Tailwind CSS v4 support.

#### [NEW] `index.html`
* Root HTML document titled `SWFL StormGuard AI | Hurricane & Damage Intelligence`.

---

### Component 2: Local SWFL Knowledge & Pre-seeded Datasets

#### [NEW] `src/data/swflEmergencyData.js`
Contains accurate geo-data for Southwest Florida:
* **Counties**: Lee, Collier, Charlotte.
* **Municipalities**: Fort Myers, Cape Coral, Sanibel, Naples, Marco Island, Estero, Bonita Springs, Punta Gorda.
* **Evacuation Zones**: Zone A (barrier islands & storm surge < 10ft), Zone B (surge 10–15ft), Zone C (surge 15–20ft), Zone D (surge 20–25ft), Zone E.
* **Shelters with Live Capacity**:
  - *Alico Arena (FGCU Campus, Estero)* - General & Student population, Pet-friendly.
  - *Hertz Arena (Estero)* - General population & Special needs.
  - *Island Coast High School (Cape Coral)* - North Lee County hub.
  - *Golden Gate High School (Naples)* - Collier County hub.
* **Active Emergency Advisories**: Boil-water notices, sandbag distribution sites, and curfew notices.

#### [NEW] `src/data/sampleDamageCases.js`
Provides instant-load sample assets and benchmark AI evaluations for bulletproof live demos:
* **Preset 1 (Cape Coral Roof)**: Tile displacement, underlayment puncture, estimated repair: $4,500 – $7,200.
* **Preset 2 (Fort Myers Beach Waterline)**: 24-inch drywall flood watermark, silt intrusion, mold hazard, estimated repair: $12,000 – $18,500.
* **Preset 3 (Sanibel Lanai Screen)**: High-wind framing separation, debris impact, estimated repair: $1,800 – $3,200.

---

### Component 3: AI Engine & Multimodal Processing

#### [NEW] `src/services/aiService.js`
* **Multimodal Vision Handler**:
  - Ingests user-uploaded images or webcam snapshots.
  - Converts images to base64.
  - Sends a prompt to Gemini 2.0 / 1.5 Flash enforcing strict JSON schema output.
  - Includes transparent fallback logic: If no API key is detected or the API returns an error, cleanly loads the closest pre-seeded scenario so the user interface never breaks.

* **Emergency Copilot Handler**:
  - Handles real-time hurricane preparedness and post-storm guidance queries referencing SWFL county regulations.

---

### Component 4: User Interface & Experience

#### [NEW] `src/components/Header.jsx`
* Top navigation bar with live SWFL alert ticker and settings trigger.

#### [NEW] `src/components/DamageAuditor.jsx`
* The "Hero Feature" for hackathon judging:
  - Drag-and-drop file upload with preview.
  - One-click sample test buttons (*"Cape Coral Roof"*, *"Fort Myers Beach Flood"*, *"Sanibel Lanai"*).
  - Animated scanning overlay effect indicating AI analysis.
  - Diagnostics card: Severity badge, cost estimation, FEMA classification, and safety warnings.
  - *"Generate Formal Insurance Claim"* button.

#### [NEW] `src/components/EvacuationZoneFinder.jsx`
* Interactive address and municipality search with surge chart and shelter capacities.

#### [NEW] `src/components/StormCopilot.jsx`
* AI conversational assistant with quick-prompt chips and dynamic countdown checklist.

#### [NEW] `src/components/ClaimReportModal.jsx`
* Clean, printable insurance report view.

---

## 6. Verification Plan

### Automated Tests & Quality Checks
* **Scaffolding and Build Validation**:
  ```bash
  npm run build
  ```
  Must compile without errors or warnings.
* **Service Unit Verification**:
  - Run a lightweight node script to verify that `aiService.js` correctly parses image payloads and returns valid JSON.

### Manual Verification ("The 5-Minute Pitch Rehearsal")
1. **Introduction (1 min)**: Problem statement (SWFL hurricanes, insurance claim delays, evacuation confusion).
2. **Hero Feature Demo - Multimodal Damage Auditor (2 min)**: Click Cape Coral roof sample -> run AI scan -> show FEMA category, repair estimate, and printable insurance claim export.
3. **Evacuation & Shelter Intelligence (1 min)**: Select Sanibel / Cape Coral -> show Zone A evacuation order and nearest open shelters (Alico Arena at FGCU).
4. **Storm Copilot (30 sec)**: Real-time dynamic emergency checklist.
5. **Impact & Q&A (30 sec)**: Review tech stack, Gemini latency, and reliability.


## Current provider decision (supersedes earlier runtime proposals)

NVIDIA NIM primary (`nvidia/nemotron-3.5-super-vl-120b-a12b`) with OpenRouter backup (`nvidia/nemotron-3.5-super-vl:free`). Separate server-only keys, explicit provider ordering and bounded live failover; no automatic sample substitution. Gemini application integration and saved key removed. Development-tool assignments above remain separate. See server/README.md and docs/contracts.md. Live verification awaits provider keys.
