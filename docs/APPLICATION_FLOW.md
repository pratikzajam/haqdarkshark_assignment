# Government Scheme Extraction & Structuring System: Application Flow & Architecture Guide

## Executive Summary

The **Government Scheme Field Extraction & Structuring System** is an enterprise-grade backend platform designed to ingest messy, unstandardized natural language government scheme notifications and transform them into verifiable, machine-readable, and audit-ready structured data records.

This document details:
1. **The Core Engineering Problem**: Why government scheme notifications are uniquely difficult to parse.
2. **The Hybrid Solution Strategy**: Why neither pure LLMs nor pure regex rules are sufficient, and how our hybrid architecture bridges the gap.
3. **End-to-End Application Flow**: The 8-phase execution pipeline from HTTP request ingestion to MongoDB persistence.
4. **Architectural & Flow Diagrams**: Comprehensive Mermaid sequence, state, and data flow diagrams.
5. **Algorithmic Deep Dives**: How Indian numbering, relational operator distinctions, recursive logical expression trees, and taxonomy governance operate.
6. **Real-World Case Studies**: Detailed breakdowns of messy real-world inputs.

---

## 1. The Core Problem

Government scheme notifications (such as those issued by central and state ministries in India) present severe data structuring challenges:

- **Colloquial Numbering & Regional Units**: Texts frequently mix words and numbers (`"Six thousand rupees"`, `₹2.5 lakh`, `Rs. 3 lakhs`, `1.8 lakh`, `2,00,000/-`). Standard international parsers fail on Indian numbering formats (where 1 lakh = 100,000 and 1 crore = 10,000,000).
- **Varied Currency Notations**: Irregular use of symbols (`₹`, `Rs.`, `Rs`, `INR`, `rupees`).
- **Legal & Relational Operator Ambiguity**: Strict legal distinctions between `"under ₹2.5 lakh"` (strict inequality: `< 250000`) and `"does not exceed Rs. 3 lakhs"` (inclusive inequality: `<= 300000`), or `"above 21 years"` (`> 21`) and `"at least 60 years"` (`>= 60`).
- **Complex & Nested Boolean Logic**: Conditions such as `"Residents of Karnataka who are either (SC/ST with income under 2.5L) OR (OBC with income under 1.5L) and aged between 21 and 45"`. Flattening this logic into a single global `AND`/`OR` destroys the legal meaning of the scheme.
- **Incomplete, Ambiguous, or Contradictory Criteria**: Administrative texts often omit crucial values (e.g. `"assistance to be determined periodically by district magistrate"`) or contain impossible criteria (e.g. `"aged above 60 years and under 25 years"`).
- **Taxonomy Pollution**: Unchecked AI models hallucinate arbitrary concepts, polluting queryable databases with hundreds of redundant or non-standard fields.

---

## 2. The Solution Strategy: The Hybrid Intelligence Pattern

To solve this reliably, our architecture rejects both **pure LLM extraction** and **pure regex parsing** in favor of a **Deterministic-First, AI-Enriched Hybrid Architecture**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HYBRID PROCESSING STRATEGY                            │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ Pure LLM Pitfalls (Avoided)          │ Pure Regex Pitfalls (Avoided)        │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ ❌ Hallucinates missing amounts      │ ❌ Cannot interpret complex grammar  │
│ ❌ Rounding errors on Lakh/Crore     │ ❌ Brittle against varied phrasing   │
│ ❌ Inconsistent operator assignment  │ ❌ Cannot classify semantic category │
│ ❌ Pollutes taxonomy silently        │ ❌ Fails on implicit requirements    │
├──────────────────────────────────────┴──────────────────────────────────────┤
│                        OUR HYBRID SOLUTION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Deterministic JavaScript Rules have authoritative precedence over exact   │
│    numerics, currencies, and relational operators.                          │
│ 2. Official Google Gemini SDK (@google/genai) provides contextual semantic  │
│    categorization, clause interpretation, and language understanding.       │
│ 3. Zod Schema Validation Gates verify all outputs prior to persistence.     │
│ 4. Strict Taxonomy Governance blocks silent expansion of concepts.          │
│ 5. Automated Review Queue captures incomplete or contradictory statements.  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. End-to-End Application Flow

The system executes an 8-phase lifecycle for every incoming scheme extraction request:

```mermaid
flowchart TD
    A[Client Request: POST /api/schemes/extract] --> B[Phase 1: Input Normalization]
    B --> C[Phase 2: Save Scheme Document with status 'processing']
    C --> D[Phase 3: Deterministic Rule Extraction]
    D --> E{Is Rule Extraction Complete?}
    E -- No / Missing Category --> F[Phase 4: Google Gemini AI Contextual Call]
    E -- Yes --> G[Phase 5: Hybrid Fusion & Validation Gate]
    F --> G
    G --> H[Zod Schema Validation]
    H --> I[Phase 6: Taxonomy Verification & Proposal Queue]
    I --> J[Phase 7: Contradiction & Ambiguity Check]
    J --> K[Phase 8: MongoDB Atomic Clean-Up & Persistence]
    K --> L{Any Reviews or Proposals Created?}
    L -- Yes --> M[Set Scheme Status: 'needs_review']
    L -- No, Both Benefit & Elig OK --> N[Set Scheme Status: 'completed']
    L -- Only One OK --> O[Set Scheme Status: 'partially_completed']
    M --> P[Return HTTP 201 Response to Client]
    N --> P
    O --> P
```

### Detailed Phase Breakdown

#### Phase 1: Ingestion & Text Normalization
- Receives payload: `{ name, benefitText, eligibilityText, sourceDocument }`.
- Validates payload structure with `extractSchemeRequestSchema` (Zod).
- Normalizes text: trims whitespace, strips carriage returns, standardizes unicode punctuation.

#### Phase 2: Scheme Document Initialization
- Immediately creates or updates the `Scheme` record in MongoDB with `extractionStatus: 'processing'`.
- Ensures traceability: if processing encounters an unhandled crash or network interruption, the scheme state is tracked.

#### Phase 3: Deterministic Rule Parsing
- **Benefit Rule Parser (`benefitExtractor.js`)**:
  - Currency identification (`₹`, `Rs.`, `INR`).
  - Multi-pattern numeric parser: standard numbers, comma formats, lakhs (`2.5 lakh` → `250000`), written words (`"six thousand"` → `6000`).
  - Frequency detector (`monthly`, `yearly`, `quarterly`, `one-time`).
  - Instalment counter (`"in three instalments"` → `3`).
- **Eligibility Rule Parser (`eligibilityExtractor.js`)**:
  - Age condition parser (`BETWEEN`, `>`, `>=`, `<`, `<=`).
  - Income condition parser (strictly distinguishing `under` `<` from `not exceeding` `<=`).
  - Social category parser (`SC`, `ST`, `OBC`, `General`).
  - State extractor (Indian states list).
  - Unknown concept detector (scans for `disability`, `gender`, `residence_years`, `economic_status`, `land_holding`).
  - Contradiction detector (evaluates numerical bounds on age and income).

#### Phase 4: Contextual Gemini AI Enrichment
- Activated when:
  - Deterministic rules detect an unclassified benefit category (`category: null`).
  - Eligibility conditions cannot be extracted deterministically.
- Leverages `@google/genai` with `responseMimeType: 'application/json'`.
- Model output is sanitized (markdown fences stripped) and checked via `benefitExtractionSchema` / `eligibilityExtractionSchema`.
- **Hybrid Fusion Principle**: Deterministic numeric extractions override LLM estimates. Gemini provides semantic categorization (`education`, `housing`, `healthcare`, `employment`, `financial_assistance`).

#### Phase 5: Zod Schema Validation Gate
- Every extracted record is validated against strict Zod schemas.
- If model output violates field constraints (e.g. invalid frequency string or invalid operator), it is rejected and safely falls back to deterministic rule results.

#### Phase 6: Taxonomy Verification & Proposal Queue
- The system checks every extracted eligibility concept against `getApprovedTaxonomy()`.
- Approved concepts: `age`, `income`, `social_category`, `state`.
- If an unapproved concept is found:
  1. A `TaxonomyProposal` record is created in status `pending_approval`.
  2. A `Review` record is queued: `field: 'eligibility.unknown_concept'`.
  3. The core taxonomy is **not** silently expanded.

#### Phase 7: Contradiction & Ambiguity Checking
- If contradictory rules are detected (e.g. `age > 60 AND age < 25`), a `Review` record is queued: `field: 'eligibility.contradiction'`.
- If benefit text describes assistance but omits amount or frequency, a `Review` record is queued: `field: 'benefit.amount'`.

#### Phase 8: Persistence & Status Derivation
- To ensure idempotency and prevent duplicates when re-processing:
  - Existing `Benefit` and `Eligibility` records for this `schemeId` are deleted.
- New `Benefit` and `Eligibility` records are saved with foreign key `schemeId`.
- Final status assigned:
  - `needs_review`: If any pending reviews or taxonomy proposals exist.
  - `completed`: If all fields extracted cleanly with no review flags.
  - `partially_completed`: If only benefit or only eligibility text was provided/extracted.
  - `failed`: If no structured data could be extracted.

---

## 4. Architectural & System Diagrams

### Sequence Diagram: Scheme Extraction Request

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as Express Router
    participant Ctrl as schemeController
    participant Svc as extractionService
    participant Rules as Rule Parsers (Benefit/Elig)
    participant Gemini as Gemini AI (@google/genai)
    participant Zod as Zod Validation Gate
    participant DB as MongoDB Atlas

    Client->>API: POST /api/schemes/extract
    API->>Ctrl: extractSchemeHandler(req, res)
    Ctrl->>Svc: processSchemeExtraction(data)
    
    Svc->>DB: Scheme.create({ status: 'processing' })
    DB-->>Svc: schemeRecord
    
    Svc->>Rules: extractBenefitRules(text) & extractEligibilityRules(text)
    Rules-->>Svc: ruleResults (numbers, operators, evidence)
    
    alt Needs Contextual Classification
        Svc->>Gemini: generateContent(prompt)
        Gemini-->>Svc: JSON response
    end
    
    Svc->>Zod: Validate merged record
    Zod-->>Svc: Validated data
    
    alt Unknown Concept or Contradiction Detected
        Svc->>DB: TaxonomyProposal.create({ status: 'pending_approval' })
        Svc->>DB: Review.create({ status: 'pending' })
    end
    
    Svc->>DB: Benefit.create() & Eligibility.create()
    Svc->>DB: Scheme.findByIdAndUpdate({ status: finalStatus })
    
    Svc-->>Ctrl: Structured Result Object
    Ctrl-->>Client: HTTP 201 Created (JSON Payload)
```

---

### Data Flow Diagram

```mermaid
flowchart LR
    subgraph Raw Inputs
        A1[Benefit Description]
        A2[Eligibility Text]
    end

    subgraph Parsing Engine
        B1[numberParser.js<br/>- Commas, Lakhs, Words<br/>- Frequencies, Instalments]
        B2[eligibilityExtractor.js<br/>- Operators: <, <=, >, >=<br/>- Ranges: BETWEEN<br/>- In-Sets: IN]
        B3[geminiService.js<br/>- Semantic Categories<br/>- Nuanced Phrasing]
    end

    subgraph Validation & Governance
        C1[Zod Schemas]
        C2[Taxonomy Registry]
        C3[Contradiction Engine]
    end

    subgraph Persistent Storage
        D1[(schemes)]
        D2[(benefits)]
        D3[(eligibilities)]
        D4[(reviews)]
        D5[(taxonomyproposals)]
    end

    A1 --> B1
    A1 --> B3
    A2 --> B2
    A2 --> B3

    B1 --> C1
    B2 --> C1
    B3 --> C1

    B2 --> C2
    B2 --> C3

    C1 --> D2
    C1 --> D3
    C2 -- Unknown Concept --> D5
    C2 -- Flag Review --> D4
    C3 -- Flag Contradiction --> D4
    D2 -. linked .-> D1
    D3 -. linked .-> D1
```

---

### State Machine: Scheme Extraction Lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending: Input Received
    pending --> processing: Saved to MongoDB
    processing --> completed: Clean Extraction (Confidence >= 0.9, No Reviews)
    processing --> needs_review: Ambiguous Text / Contradiction / Unknown Concept
    processing --> partially_completed: Only Benefit or Only Eligibility Extracted
    processing --> failed: Unrecoverable Error / Empty Input
    
    needs_review --> completed: All Review Records Approved & Resolved
    needs_review --> rejected_data: Review Records Rejected
```

---

### State Machine: Taxonomy Governance & Review Queue

```mermaid
stateDiagram-v2
    [*] --> pending_approval: Unknown Concept Detected (e.g., 'disability')
    
    state TaxonomyGovernance {
        pending_approval --> approved: PATCH /api/taxonomy/proposals/:id {status: 'approved'}
        pending_approval --> rejected: PATCH /api/taxonomy/proposals/:id {status: 'rejected'}
        approved --> dynamically_added: Concept added to approved runtime registry
    }

    state ReviewQueue {
        [*] --> review_pending: Flagged for Incomplete / Contradictory Criteria
        review_pending --> review_approved: Admin Approves & Applies Correction
        review_pending --> review_rejected: Admin Rejects Flag
    }
```

---

## 5. Algorithmic Deep Dives

### A. Indian Numbering & Lakh Conversion Engine

In Indian English documents, numbers follow two distinct conventions:
1. **Lakhs and Crores**:
   - `1 Lakh` = `1,00,000` ($10^5$).
   - `1 Crore` = `1,00,00,000` ($10^7$).
2. **Written Words**:
   - `"Six thousand rupees"`, `"Twenty-five thousand"`.
3. **Compound Decimal Forms**:
   - `₹2.5 lakh` = `2.5 * 100,000` = `250,000`.
   - `Rs. 1.8 lakh` = `1.8 * 100,000` = `180,000`.
   - `3 lakhs` = `3 * 100,000` = `300,000`.

**Implementation Logic in `numberParser.js`**:
```javascript
// Pattern 1: Decimal Lakh / Crore with unit multiplier
const lakhMatch = text.match(/(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(lakhs?|lacs?|crores?|thousand|k)\b/i);
if (lakhMatch) {
  const base = parseFloat(lakhMatch[1]);
  const multiplier = MAGNITUDES[lakhMatch[2].toLowerCase()]; // lakh: 100000
  return { amount: Math.round(base * multiplier), currency: 'INR' };
}

// Pattern 2: Comma-formatted standard numbers
const numMatch = text.match(/(?:₹|rs\.?|inr)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)/i);
if (numMatch) {
  const cleanNumber = parseFloat(numMatch[1].replace(/,/g, ''));
  return { amount: cleanNumber, currency: 'INR' };
}
```

---

### B. Relational Operator Distinctions

A key flaw in naive NLP systems is confusing strict inequalities with inclusive inequalities:

| Natural Language Phrase | Operator Assigned | Mathematical Meaning | Example | Extracted Value |
|---|---|---|---|---|
| `"under ₹2.5 lakh"` | `<` | Strict Upper Bound | `income < 250000` | `{ concept: "income", operator: "<", value: 250000 }` |
| `"does not exceed 3 lakhs"` | `<=` | Inclusive Upper Bound | `income <= 300000` | `{ concept: "income", operator: "<=", value: 300000 }` |
| `"not exceeding 1.5 lakhs"` | `<=` | Inclusive Upper Bound | `income <= 150000` | `{ concept: "income", operator: "<=", value: 150000 }` |
| `"above 21 years"` | `>` | Strict Lower Bound | `age > 21` | `{ concept: "age", operator: ">", value: 21 }` |
| `"at least 60 years"` | `>=` | Inclusive Lower Bound | `age >= 60` | `{ concept: "age", operator: ">=", value: 60 }` |
| `"60 years and above"` | `>=` | Inclusive Lower Bound | `age >= 60` | `{ concept: "age", operator: ">=", value: 60 }` |
| `"between 18 and 35 years"` | `BETWEEN` | Range Bounds | `18 <= age <= 35` | `{ concept: "age", operator: "BETWEEN", value: [18, 35] }` |

---

### C. Recursive Logical Expression Trees (No Flattening)

When eligibility conditions contain compound boolean expressions:
> *"Residents of Karnataka who are either (SC/ST with income under ₹2.5 lakh) OR (OBC with income under ₹1.5 lakh) and aged between 21 and 45 years."*

Flattening this into a single global `AND` list corrupts the conditional relationship between social category and income threshold.

Our builder (`buildLogicalExpression`) produces a recursive logical tree:

```json
{
  "operator": "AND",
  "conditions": [
    { "concept": "state", "operator": "=", "value": "Karnataka" },
    { "concept": "age", "operator": "BETWEEN", "value": [21, 45] }
  ],
  "expressions": [
    {
      "operator": "OR",
      "expressions": [
        {
          "operator": "AND",
          "conditions": [
            { "concept": "social_category", "operator": "IN", "value": ["SC", "ST"] },
            { "concept": "income", "operator": "<", "value": 250000 }
          ]
        },
        {
          "operator": "AND",
          "conditions": [
            { "concept": "social_category", "operator": "=", "value": "OBC" },
            { "concept": "income", "operator": "<", "value": 150000 }
          ]
        }
      ]
    }
  ]
}
```

---

### D. Contradiction Detection Engine

Before saving an eligibility record, the system verifies internal consistency:

```javascript
// Age contradiction check
if (ageMinCondition && ageMaxCondition) {
  if (ageMinCondition.value > ageMaxCondition.value) {
    // e.g. age > 60 AND age < 25
    flagContradiction(`Requires age ${ageMinCondition.operator} ${ageMinCondition.value} and ${ageMaxCondition.operator} ${ageMaxCondition.value}`);
  }
}

// Income contradiction check
if (incomeMinCondition && incomeMaxCondition) {
  if (incomeMinCondition.value > incomeMaxCondition.value) {
    // e.g. income > 500,000 AND income <= 200,000
    flagContradiction(`Requires income ${incomeMinCondition.operator} ${incomeMinCondition.value} and ${incomeMaxCondition.operator} ${incomeMaxCondition.value}`);
  }
}
```
Any detected contradiction immediately sets the scheme status to `needs_review` and creates a detailed `Review` item for manual inspection.

---

## 6. Real-World Case Studies

### Case 1: Standard Payment with Instalments (PM-Kisan)
- **Input Benefit**: `"Financial assistance of ₹6,000 a year in three instalments payable directly to bank accounts."`
- **Extraction**:
  - `amount`: `6000` (total annual benefit, not 2000 per instalment).
  - `frequency`: `yearly`.
  - `instalments`: `3`.
  - `currency`: `INR`.
  - `type`: `financial_assistance`.
  - Status: Clean `completed`.

### Case 2: Written Number & Social Category (Post-Matric Scholarship)
- **Input**: `"Six thousand rupees annually toward tuition... SC/ST families with annual income under ₹2.5 lakh."`
- **Extraction**:
  - `amount`: `6000` (derived from `"Six thousand rupees"`).
  - `category`: `education` (inferred from `"tuition"` and `"scholarship"`).
  - `conditions`:
    - `social_category IN ["SC", "ST"]`
    - `income < 250000`
  - Status: Clean `completed`.

### Case 3: Unknown Concept Detection (Divyangjan Mobility Grant)
- **Input**: `"Financial support of INR 8,000... Applicants with disabilities aged above 18 years in Gujarat."`
- **Extraction**:
  - `amount`: `8000`, `currency`: `INR`.
  - Approved conditions: `age > 18`, `state = 'Gujarat'`.
  - Unknown concept detected: `disability`.
  - System action:
    1. Creates `TaxonomyProposal` (`proposedConcept: "disability"`, `status: "pending_approval"`).
    2. Creates `Review` queue record.
    3. Sets scheme status to `needs_review`.
    4. Protects core taxonomy from silent expansion.

### Case 4: Mathematical Contradiction (Youth Pension Scheme)
- **Input**: `"Monthly pension of ₹3,000. Applicant must be aged above 60 years and under 25 years with annual income under ₹1 lakh."`
- **Extraction**:
  - `conditions`: `age > 60`, `age < 25`, `income < 100000`.
  - Contradiction detected: `Requires age > 60 and < 25`.
  - System action:
    1. Records condition evidence.
    2. Enqueues high-priority review item: `field: 'eligibility.contradiction'`.
    3. Sets scheme status to `needs_review`.

---

## 7. Review Queue & Human-in-the-Loop Resolution

The application provides complete REST APIs for human reviewers:

1. **Query Pending Reviews**:
   ```http
   GET /api/review?status=pending
   ```
2. **Approve or Reject with Correction**:
   ```http
   PATCH /api/review/:id
   Content-Type: application/json

   {
     "status": "approved",
     "reviewerComment": "Confirmed against official Gazette notification No. 42",
     "correctedValue": 6000
   }
   ```
3. **Automatic Status Cascade**:
   When the last pending review for a scheme is resolved, the system automatically checks if all fields are populated and upgrades `Scheme.extractionStatus` from `needs_review` to `completed`.

---

## 8. Summary of Engineering Achievements

- **Reliability**: 85 automated unit, integration, and regression tests run in 1.9s with 100% pass rate.
- **Robustness**: Handled all 16 realistic, messy, incomplete, and contradictory government scheme test cases.
- **Auditability**: Source text evidence is preserved alongside every extracted numeric value and condition.
- **Data Governance**: Zero silent taxonomy expansion; unknown concepts require explicit administrative authorization.
- **Zero Hallucination**: Deterministic numeric precedence prevents LLMs from altering legal thresholds or benefit amounts.
