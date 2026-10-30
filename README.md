# Government Scheme Field Extraction & Structuring System

A robust, enterprise-grade backend service built with Node.js, Express, MongoDB Atlas, and Google Gemini that converts messy, unstructured natural language government scheme descriptions into clean, machine-readable, and audit-ready structured data.

---

## Table of Contents

1. [Project Objective](#1-project-objective)
2. [Architecture & System Design](#2-architecture--system-design)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Installation & Setup](#5-installation--setup)
6. [Environment Variables](#6-environment-variables)
7. [MongoDB Atlas Configuration](#7-mongodb-atlas-configuration)
8. [Google Gemini API Configuration](#8-google-gemini-api-configuration)
9. [MongoDB Collection Design](#9-mongodb-collection-design)
10. [Rules vs. Gemini AI Decisions](#10-rules-vs-gemini-ai-decisions)
11. [Review Queue Workflow](#11-review-queue-workflow)
12. [Taxonomy Governance System](#12-taxonomy-governance-system)
13. [REST API Endpoints & Documentation](#13-rest-api-endpoints--documentation)
14. [Sample Requests & Responses](#14-sample-requests--responses)
15. [Running Unit & Integration Tests](#15-running-unit--integration-tests)
16. [Known Limitations](#16-known-limitations)

---

## 1. Project Objective

Government scheme notifications in India and worldwide are notoriously messy, featuring colloquial phrasing, varied currency symbols (`₹`, `Rs.`, `INR`, `rupees`), regional number units (`lakh`, `crore`), complex eligibility conditions, contradictory guidelines, and non-standard benefit distributions.

This system provides:
- **Deterministic Extraction**: High-precision normalization of currencies, Indian numbering systems (`2.5 lakh` → `250000`), instalment counts, and relational operators (`under` vs. `not exceeding`, `above` vs. `at least`).
- **Contextual AI Interpretation**: Powered strictly by the official Google Gemini SDK (`@google/genai`) for semantic understanding and classification where deterministic rules need contextual backing.
- **Strict Taxonomy Enforcement**: Prevents hallucinated or arbitrary concepts from polluting the database.
- **Auditability & Review Queue**: Flags incomplete, ambiguous, or contradictory text for human-in-the-loop verification.
- **Taxonomy Governance**: Requires explicit administrative approval before unknown concepts are incorporated into the approved taxonomy.

---

## 2. Architecture & System Design

The system employs a **Hybrid Pipeline Architecture**:

```
[ Natural Language Scheme Text ]
               │
               ▼
   [ Text Normalization Layer ]
               │
               ├──────────────────────────────────────────────┐
               ▼                                              ▼
 [ Deterministic Rule Parser ]                    [ Gemini Contextual AI ]
 - Currency normalization (₹, Rs., INR)          - Official @google/genai SDK
 - Indian numbering (Lakh / Crore / Words)       - Semantic categorization
 - Frequency & instalment counting               - Complex clause interpretation
 - Operator mapping (<, <=, >, >=, BETWEEN)
               │                                              │
               └──────────────────────┬───────────────────────┘
                                      │
                                      ▼
                        [ Hybrid Fusion & Resolution ]
                        - Deterministic precedence for numbers
                        - AI semantic classification
                                      │
                                      ▼
                          [ Zod Validation Gate ]
                        - Strict type enforcement
                        - Rejection of malformed records
                                      │
                                      ▼
                         [ Taxonomy Compliance Check ]
                         - Is concept in approved taxonomy?
                         - Yes: Proceed to condition tree
                         - No: Generate Taxonomy Proposal & Review Flag
                                      │
                                      ▼
                         [ Contradiction & Ambiguity Check ]
                         - Impossible age or income ranges?
                         - Missing amount or frequency?
                         - Yes: Queue Review Record
                                      │
                                      ▼
                      [ MongoDB Atlas Persistence ]
     ┌─────────────────┬──────────────────┬─────────────────┬─────────────────┐
     ▼                 ▼                  ▼                 ▼                 ▼
 [ schemes ]      [ benefits ]     [ eligibilities ]   [ reviews ]    [ taxonomyproposals ]
```

---

## 3. Technology Stack

- **Runtime**: Node.js (v20+ / v24+)
- **Module System**: ES Modules (`"type": "module"`)
- **Web Framework**: Express.js 4.x
- **Database**: MongoDB Atlas with Mongoose 8.x ODM
- **AI Provider**: Google Gemini API exclusively using `@google/genai` (Official SDK)
- **Validation**: Zod (Schema validation for API requests and LLM outputs)
- **Test Runner**: Vitest 3.x
- **Configuration**: dotenv

> **Strict Compliance**:
> - NO OpenAI, NO Anthropic, NO LangChain, NO SQLite.
> - Pure JavaScript (no TypeScript compilation step required).

---

## 4. Project Structure

```
scheme-extractor/
│
├── src/
│   ├── app.js                         # Express application factory
│   ├── server.js                      # Server entry point & graceful shutdown
│   │
│   ├── config/
│   │   ├── database.js                # Mongoose connection & lifecycle events
│   │   └── gemini.js                  # @google/genai SDK client configuration
│   │
│   ├── models/
│   │   ├── Scheme.js                  # Primary Scheme metadata & status
│   │   ├── Benefit.js                 # Structured benefit records
│   │   ├── Eligibility.js             # Eligibility conditions & logical tree
│   │   ├── Review.js                  # Human review queue records
│   │   └── TaxonomyProposal.js        # Proposed taxonomy concepts
│   │
│   ├── controllers/
│   │   ├── schemeController.js        # Scheme extraction & retrieval
│   │   ├── benefitController.js       # Benefit query controller
│   │   ├── eligibilityController.js   # Eligibility query controller
│   │   ├── reviewController.js        # Review approval/rejection
│   │   └── taxonomyController.js      # Taxonomy & proposal governance
│   │
│   ├── services/
│   │   ├── extractionService.js       # Master extraction pipeline orchestrator
│   │   ├── benefitExtractor.js        # Deterministic benefit extraction
│   │   ├── eligibilityExtractor.js    # Eligibility parsing & nested tree builder
│   │   ├── numberParser.js            # Indian number, lakh, and currency utilities
│   │   ├── geminiService.js           # Gemini API integration with Zod validation
│   │   └── reviewService.js           # Review queue operations & resolution
│   │
│   ├── routes/
│   │   ├── schemeRoutes.js            # /api/schemes
│   │   ├── benefitRoutes.js           # /api/benefits
│   │   ├── eligibilityRoutes.js       # /api/eligibility
│   │   ├── reviewRoutes.js            # /api/review
│   │   └── taxonomyRoutes.js          # /api/taxonomy
│   │
│   ├── validators/
│   │   └── schemas.js                 # Zod validation schemas
│   │
│   ├── data/
│   │   ├── taxonomy.js                # Core taxonomy definitions & dynamic registry
│   │   └── sampleInputs.js            # 16 realistic messy sample scheme examples
│   │
│   └── middleware/
│       └── errorHandler.js            # Centralized error handler
│
├── tests/
│   ├── benefit.test.js                # Tests for currency, lakh, frequency, instalments
│   ├── eligibility.test.js            # Tests for operators (< vs <=, > vs >=), age ranges
│   ├── review.test.js                 # Tests for review queue & taxonomy governance
│   ├── extractionPipeline.test.js     # Verification of all 16 sample dataset schemes
│   └── geminiAndApi.test.js           # API route & Gemini mock tests
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 5. Installation & Setup

### Prerequisites
- Node.js (version 20.0.0 or higher)
- npm (version 10.0.0 or higher)
- MongoDB Atlas cluster URI (or local MongoDB 6.0+)
- Google Gemini API Key

### Step-by-Step Installation

1. **Clone or navigate to the workspace directory**:
   ```bash
   cd scheme-extractor
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your connection credentials.

4. **Start the application**:
   ```bash
   # Production mode
   npm start

   # Development mode with file watch
   npm run dev
   ```

5. **Run the test suite**:
   ```bash
   npm test
   ```

---

## 6. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/scheme_extractor?retryWrites=true&w=majority
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
GEMINI_MODEL=gemini-2.5-flash
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Port for Express HTTP server |
| `MONGODB_URI` | Yes | - | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Yes | - | Google Gemini API Key |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name |

---

## 7. MongoDB Atlas Configuration

1. Log into your [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account.
2. Under **Database Access**, create a database user with `readWrite` permissions.
3. Under **Network Access**, allow IP access (e.g. your server IP or `0.0.0.0/0` for sandbox testing).
4. Under **Database Deployments**, click **Connect** → **Drivers** (Node.js).
5. Copy the connection string and paste it into `MONGODB_URI` in `.env`.

The application handles connection lifecycle states, automatic reconnects, and graceful process shutdowns via `src/config/database.js`.

---

## 8. Google Gemini API Configuration

1. Obtain a Gemini API Key from [Google AI Studio](https://aistudio.google.com/).
2. Place the key in `.env` as `GEMINI_API_KEY`.
3. The application connects using the **official `@google/genai` SDK**:
   ```javascript
   import { GoogleGenAI } from '@google/genai';
   const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
   ```
4. Gemini calls request structured JSON output (`responseMimeType: 'application/json'`). All outputs are strictly validated through Zod before database persistence.

---

## 9. MongoDB Collection Design

### A. `schemes`
Maintains original input text, document source, and overall lifecycle status.

```javascript
{
  "_id": ObjectId("..."),
  "name": "PM-Kisan Samman Nidhi Yojana",
  "originalBenefitText": "Financial assistance of ₹6,000 a year in three instalments.",
  "originalEligibilityText": "Small and marginal farmers holding cultivable land up to 2 hectares.",
  "sourceDocument": "gazette_notification_2024.pdf",
  "extractionStatus": "needs_review", // pending, processing, completed, partially_completed, needs_review, failed
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### B. `benefits`
Structured representation of monetary or in-kind assistance.

```javascript
{
  "_id": ObjectId("..."),
  "schemeId": ObjectId("..."),
  "category": "financial_assistance", // education, housing, healthcare, employment, financial_assistance
  "type": "financial_assistance",    // grant, subsidy, pension, scholarship, allowance
  "amount": 6000,
  "currency": "INR",
  "frequency": "yearly",              // monthly, yearly, quarterly, half_yearly, one-time
  "instalments": 3,
  "originalText": "Financial assistance of ₹6,000 a year in three instalments.",
  "extractionMethod": "hybrid",       // rule_based, gemini_ai, hybrid
  "confidence": 0.95,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### C. `eligibilities`
Structured criteria conditions and recursive logical expression tree.

```javascript
{
  "_id": ObjectId("..."),
  "schemeId": ObjectId("..."),
  "conditions": [
    {
      "concept": "social_category",
      "operator": "IN",
      "value": ["SC", "ST"],
      "evidence": "SC/ST families",
      "isApprovedConcept": true
    },
    {
      "concept": "income",
      "operator": "<",
      "value": 250000,
      "evidence": "annual income under ₹2.5 lakh",
      "isApprovedConcept": true
    },
    {
      "concept": "age",
      "operator": "BETWEEN",
      "value": [18, 35],
      "evidence": "age between 18 and 35 years",
      "isApprovedConcept": true
    }
  ],
  "logicalExpression": {
    "operator": "AND",
    "conditions": [ ... ],
    "expressions": [ ... ] // Supports nested OR/AND without flattening
  },
  "originalText": "SC/ST families with annual income under ₹2.5 lakh and age between 18 and 35 years.",
  "extractionMethod": "rule_based",
  "confidence": 0.95,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### D. `reviews`
Tracks uncertain, contradictory, or incomplete fields requiring human review.

```javascript
{
  "_id": ObjectId("..."),
  "schemeId": ObjectId("..."),
  "field": "eligibility.contradiction",
  "originalText": "Applicant must be aged above 60 years and under 25 years.",
  "reason": "Contradictory age criteria: Requires age > 60 and < 25.",
  "extractionMethod": "rule_based",
  "proposedValue": null,
  "status": "pending", // pending, approved, rejected
  "reviewerComment": null,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### E. `taxonomyproposals`
Tracks unknown concepts extracted from text that are not part of the approved taxonomy.

```javascript
{
  "_id": ObjectId("..."),
  "proposedConcept": "disability",
  "originalText": "Applicants with disabilities",
  "reason": "Physical or mental disability criteria extracted from text",
  "status": "pending_approval", // pending_approval, approved, rejected
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

---

## 10. Rules vs. Gemini AI Decisions

| Task | Handled By | Rationale |
|---|---|---|
| **Currency Detection (`₹`, `Rs.`, `INR`)** | Deterministic Rules | Exact pattern matching; deterministic regex avoids LLM hallucinations. |
| **Lakh / Crore Conversion (`2.5 lakh` → `250000`)** | Deterministic Rules | Mathematical precision; zero tolerance for LLM rounding mistakes. |
| **Written English Numbers (`Six thousand` → `6000`)** | Deterministic Rules | Finite vocabulary mapped deterministically to integers. |
| **Instalment Count Parsing** | Deterministic Rules | Regex matching for numeric and word counts (`three instalments` → `3`). |
| **Relational Operators (`under` vs `not exceeding`)** | Deterministic Rules | Legal precision: `under` is strictly `<`; `not exceeding` is strictly `<=`. |
| **Relational Operators (`above` vs `at least`)** | Deterministic Rules | Legal precision: `above` is strictly `>`; `at least` is strictly `>=`. |
| **Contradiction Detection** | Deterministic Rules | Formal inequality checking (`minAge > maxAge`). |
| **Complex Phrasing & Natural Language** | Google Gemini AI | Contextual understanding when grammar is ambiguous or non-standard. |
| **Benefit Semantic Categorization** | Hybrid (Rule + Gemini) | Rules check keywords (`scholarship` → `education`); Gemini classifies nuanced terms. |
| **Implicit Clauses & Context** | Google Gemini AI | Understanding eligibility implicit in narrative paragraphs. |

---

## 11. Review Queue Workflow

The review queue ensures zero unverified assumptions enter downstream systems:

```
                  [ New Extraction Processed ]
                                │
       ┌────────────────────────┼────────────────────────┐
       ▼                        ▼                        ▼
[ Ambiguous Data ]     [ Contradiction ]       [ Unknown Concept ]
(Missing amount,       (Impossible age or      (Criteria not in
 unclear frequency)     income conditions)       approved taxonomy)
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                │
                                ▼
                   [ Review Record Created ]
                    status: "pending"
                    scheme.extractionStatus = "needs_review"
                                │
                                ▼
                    [ Human Reviewer Action ]
                    PATCH /api/review/:id
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
         [ APPROVED ]                      [ REJECTED ]
   - Corrected value applied         - Flagged as invalid
   - Reviewer comment saved          - Reviewer comment saved
               │                                 │
               └────────────────┬────────────────┘
                                │
                                ▼
           [ Are all reviews resolved for Scheme? ]
                     ├── Yes ──► Set Scheme status to "completed"
                     └── No  ──► Retain "needs_review" status
```

---

## 12. Taxonomy Governance System

### Approved Core Taxonomy
- **Concepts**: `age`, `income`, `social_category`, `state`
- **Benefit Categories**: `education`, `housing`, `healthcare`, `employment`, `financial_assistance`
- **Supported Operators**: `=`, `!=`, `<`, `<=`, `>`, `>=`, `BETWEEN`, `IN`

### Strict Governance Policy
1. **No Silent Expansion**: When a concept like `disability`, `gender`, or `land_holding` is encountered, it is **never** silently injected into the approved taxonomy.
2. **Proposal Generation**: A `TaxonomyProposal` record is automatically created in `pending_approval` status.
3. **Administrative Approval**:
   - Only when an administrator calls `PATCH /api/taxonomy/proposals/:id` with `status: "approved"` is the concept added to the approved runtime registry.
   - If rejected (`status: "rejected"`), the concept remains excluded.

---

## 13. REST API Endpoints & Documentation

### Schemes
- `POST /api/schemes/extract` - Extract, structure, validate, and persist scheme data.
- `GET /api/schemes` - List all processed schemes (supports `status`, `search`, `limit`, `skip`).
- `GET /api/schemes/:id` - Get scheme details including benefits, eligibility, and reviews.

### Benefits
- `GET /api/benefits` - Query structured benefit records (supports `schemeId`, `category`, `frequency`).

### Eligibility
- `GET /api/eligibility` - Query extracted eligibility records (supports `schemeId`).

### Reviews
- `GET /api/review` - List review records (supports `status=pending|approved|rejected`).
- `PATCH /api/review/:id` - Approve or reject a review record with comments and corrections.

### Taxonomy
- `GET /api/taxonomy` - Retrieve current approved taxonomy and pending proposals.
- `POST /api/taxonomy/proposals` - Submit a new concept proposal.
- `PATCH /api/taxonomy/proposals/:id` - Approve or reject a taxonomy proposal.

### System & Samples
- `GET /api/health` - Health check.
- `GET /api/samples` - Retrieve the 16 realistic messy sample scheme dataset.

---

## 14. Sample Requests & Responses

### 1. Extract Scheme (`POST /api/schemes/extract`)

#### Request:
```bash
curl -X POST http://localhost:5000/api/schemes/extract \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Post-Matric Scholarship Scheme",
    "benefitText": "Six thousand rupees annually toward tuition and living support.",
    "eligibilityText": "SC/ST families with annual income under ₹2.5 lakh and age between 18 and 35 years."
  }'
```

#### Response (201 Created):
```json
{
  "success": true,
  "message": "Scheme extraction processed successfully",
  "data": {
    "scheme": {
      "_id": "6722894b98c3f21184a29a10",
      "name": "Post-Matric Scholarship Scheme",
      "originalBenefitText": "Six thousand rupees annually toward tuition and living support.",
      "originalEligibilityText": "SC/ST families with annual income under ₹2.5 lakh and age between 18 and 35 years.",
      "extractionStatus": "completed"
    },
    "benefit": {
      "category": "education",
      "type": "scholarship",
      "amount": 6000,
      "currency": "INR",
      "frequency": "yearly",
      "instalments": null,
      "extractionMethod": "rule_based",
      "confidence": 0.95
    },
    "eligibility": {
      "conditions": [
        {
          "concept": "social_category",
          "operator": "IN",
          "value": ["SC", "ST"],
          "evidence": "SC/ST",
          "isApprovedConcept": true
        },
        {
          "concept": "income",
          "operator": "<",
          "value": 250000,
          "evidence": "annual income under ₹2.5 lakh",
          "isApprovedConcept": true
        },
        {
          "concept": "age",
          "operator": "BETWEEN",
          "value": [18, 35],
          "evidence": "between 18 and 35 years",
          "isApprovedConcept": true
        }
      ],
      "logicalExpression": {
        "operator": "AND",
        "conditions": [ ... ]
      },
      "extractionMethod": "rule_based",
      "confidence": 0.95
    },
    "reviews": [],
    "taxonomyProposals": []
  }
}
```

---

### 2. Contradictory Eligibility Handling

#### Request:
```bash
curl -X POST http://localhost:5000/api/schemes/extract \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Youth Pension Scheme",
    "benefitText": "Monthly pension of ₹3,000.",
    "eligibilityText": "Applicant must be aged above 60 years and under 25 years with annual income under ₹1 lakh."
  }'
```

#### Response Status:
The scheme is saved with `extractionStatus: "needs_review"`, and a review item is automatically queued:
```json
{
  "field": "eligibility.contradiction",
  "reason": "Contradictory age criteria: Requires age > 60 and < 25, which cannot be satisfied simultaneously.",
  "status": "pending"
}
```

---

### 3. Unknown Concept Governance

#### Request:
```bash
curl -X POST http://localhost:5000/api/schemes/extract \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Divyangjan Assistive Device",
    "benefitText": "INR 8000 grant",
    "eligibilityText": "Applicants with disabilities in Gujarat."
  }'
```

#### Behavior:
- `disability` is detected.
- `TaxonomyProposal` is created with status `pending_approval`.
- A `Review` record is created for administrative verification.
- The approved taxonomy is **not** silently expanded.

---

### 4. Approve Taxonomy Proposal (`PATCH /api/taxonomy/proposals/:id`)

#### Request:
```bash
curl -X PATCH http://localhost:5000/api/taxonomy/proposals/6722894b98c3f21184a29a15 \
  -H "Content-Type: application/json" \
  -d '{ "status": "approved" }'
```

#### Response:
```json
{
  "success": true,
  "message": "Taxonomy proposal has been approved",
  "data": {
    "taxonomyUpdated": true,
    "currentTaxonomy": {
      "concepts": ["age", "income", "social_category", "state", "disability"]
    }
  }
}
```

---

## 15. Running Unit & Integration Tests

The test suite runs on [Vitest](https://vitest.dev/):

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage Highlights (85 Tests Passing):
1. **`tests/benefit.test.js`**
   - Currency formats (`INR`, `Rs.`, `₹`, `rupees`).
   - Indian number formats (`2,00,000`, `25,000`, `2,000/-`).
   - Lakh conversion (`2.5 lakh` → `250000`, `3 lakhs` → `300000`).
   - Frequencies (`monthly`, `yearly`, `quarterly`, `one-time`).
   - Instalment counts (`numeric` and `words`).
   - Missing amount and missing frequency handling.
   - Zod validation and Markdown JSON parsing.

2. **`tests/eligibility.test.js`**
   - Relational operator distinctions (`under` `<` vs. `not exceeding` `<=`).
   - Relational operator distinctions (`above` `>` vs. `at least` `>=`).
   - Age ranges (`BETWEEN [18, 35]`).
   - Social category sets (`SC/ST`, `OBC`, `SC, ST or OBC`).
   - State normalization (`Maharashtra`, `Jharkhand or Odisha`).
   - Nested boolean logic trees without flattening.
   - Detection of unknown concepts (`disability`, `gender`, `residence_years`, `economic_status`).
   - Contradiction detection (`age > 60` and `age < 25`).

3. **`tests/review.test.js`**
   - Review record lifecycle and validation.
   - Taxonomy proposal lifecycle and dynamic governance.
   - Prevention of silent taxonomy expansion.

4. **`tests/extractionPipeline.test.js`**
   - End-to-end verification of all **16 sample dataset government schemes**.

5. **`tests/geminiAndApi.test.js`**
   - Mocked `@google/genai` API calls and fallback logic.
   - REST API endpoints (`/api/health`, `/api/samples`, `/api/taxonomy`, `/api/schemes/extract`, `/api/review`).

---

## 16. Known Limitations

1. **Multi-Currency Conversions**: The system specializes in Indian currency (`INR`, `Rs.`, `₹`). Foreign currencies (e.g. `USD`, `EUR`) will trigger review records if present.
2. **OCR Noise**: The system assumes clean UTF-8 text. If scanned PDF OCR generates broken characters (e.g. `1 O lakh` instead of `10 lakh`), rule-based matching may defer to Gemini AI.
3. **Complex Mathematical Eligibility**: Non-linear criteria (e.g. "ratio of income to land acreage must be below 0.5") will be captured as unapproved concepts and flagged for human review.
4. **Dynamic Taxonomy Persistence**: Dynamically approved taxonomy concepts are registered in memory and tracked in the `taxonomyproposals` collection. In multi-instance clustering, a distributed store or Redis cache is recommended to synchronize dynamic taxonomy changes across instances.
