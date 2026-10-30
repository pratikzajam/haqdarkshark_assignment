import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ShadingType
} from 'docx';
import fs from 'fs';
import path from 'path';

async function createDocx() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
            color: '2D3748'
          }
        }
      }
    },
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'Government Scheme Extraction & Structuring System',
            heading: HeadingLevel.TITLE,
            spacing: { after: 120 },
            alignment: AlignmentType.CENTER,
            run: {
              bold: true,
              size: 36,
              color: '1A365D'
            }
          }),
          new Paragraph({
            text: 'System Architecture, Application Flow, & Problem Solving Methodology',
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
            alignment: AlignmentType.CENTER,
            run: {
              italics: true,
              size: 24,
              color: '2B6CB0'
            }
          }),
          new Paragraph({
            text: 'Technology Stack: Node.js (ES Modules) | Express.js | MongoDB Atlas | Mongoose ODM | Google Gemini (@google/genai) | Zod | Vitest',
            spacing: { after: 300 },
            alignment: AlignmentType.CENTER,
            run: {
              size: 18,
              color: '718096'
            }
          }),

          // 1. EXECUTIVE SUMMARY
          new Paragraph({
            text: '1. Executive Summary & Problem Overview',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 140 },
            run: { bold: true, size: 28, color: '1A365D' }
          }),
          new Paragraph({
            children: [
              new TextRun('Government scheme notifications in India and worldwide are notoriously messy, featuring colloquial phrasing, non-standard financial notations, regional numbering units, complex nested eligibility requirements, and contradictory administrative guidelines. Developing an enterprise-grade backend to ingest this data and produce machine-readable, audit-ready structured data requires solving several formidable challenges:')
            ],
            spacing: { after: 140 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Non-Standard Currency & Numbering: ', bold: true }),
              new TextRun('Text mixes Indian symbols and abbreviations (₹, Rs., Rs, INR, rupees) with regional units like "lakh" (100,000) and "crore" (10,000,000), such as "₹2.5 lakh", "Rs. 3 lakhs", and "2,00,000/-", alongside written numbers ("Six thousand rupees").')
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Strict Legal Operator Distinctions: ', bold: true }),
              new TextRun('Distinguishing strict inequalities ("under ₹2.5 lakh" → < 250000) from inclusive inequalities ("does not exceed Rs. 3 lakhs" → <= 300000), and lower bounds ("above 21 years" → > 21 vs. "at least 60 years" → >= 60).')
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Non-Flattened Nested Boolean Logic: ', bold: true }),
              new TextRun('Complex criteria combining AND and OR clauses (e.g., State AND ((SC/ST AND income < 2.5L) OR (OBC AND income < 1.5L)) AND age) must retain their exact nested tree structure without being flattened.')
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Incomplete, Ambiguous, and Contradictory Criteria: ', bold: true }),
              new TextRun('Administrative texts frequently omit crucial amounts or specify mathematically impossible rules (e.g., "aged above 60 years and under 25 years").')
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Taxonomy Pollution: ', bold: true }),
              new TextRun('Unchecked AI extraction hallucinating arbitrary concepts into the database. A strict governance mechanism is mandatory.')
            ],
            spacing: { after: 200 }
          }),

          // 2. THE HYBRID SOLUTION
          new Paragraph({
            text: '2. The Solution: Deterministic-First, AI-Enriched Hybrid Architecture',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 140 },
            run: { bold: true, size: 28, color: '1A365D' }
          }),
          new Paragraph({
            children: [
              new TextRun('To address these challenges reliably, our architecture rejects both pure LLM extraction and pure regex parsing. Instead, we implement a Hybrid Intelligence Pattern:')
            ],
            spacing: { after: 140 }
          }),

          // TABLE: Comparison
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'EBF8FF', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Processing Domain', bold: true, color: '2B6CB0' })] })]
                  }),
                  new TableCell({
                    shading: { fill: 'EBF8FF', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Handled By', bold: true, color: '2B6CB0' })] })]
                  }),
                  new TableCell({
                    shading: { fill: 'EBF8FF', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Rationale & Engineering Advantage', bold: true, color: '2B6CB0' })] })]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Currency & Number Parsing')] }),
                  new TableCell({ children: [new Paragraph('Deterministic Rules (numberParser.js)')] }),
                  new TableCell({ children: [new Paragraph('Exact mathematical precision for lakhs, crores, and commas. Zero hallucination risk.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Operator Mapping (<, <=, >, >=)')] }),
                  new TableCell({ children: [new Paragraph('Deterministic Rules (eligibilityExtractor.js)')] }),
                  new TableCell({ children: [new Paragraph('Strict legal discrimination between strict (<) and inclusive (<=) inequalities.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Instalment Distinction')] }),
                  new TableCell({ children: [new Paragraph('Deterministic Rules (benefitExtractor.js)')] }),
                  new TableCell({ children: [new Paragraph('Distinguishes overall annual benefit from per-instalment counts accurately.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Semantic Categorization')] }),
                  new TableCell({ children: [new Paragraph('Google Gemini AI (@google/genai)')] }),
                  new TableCell({ children: [new Paragraph('Semantic classification into approved categories (education, healthcare, housing, etc.).')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Taxonomy Protection')] }),
                  new TableCell({ children: [new Paragraph('Core Taxonomy Engine (taxonomy.js)')] }),
                  new TableCell({ children: [new Paragraph('Zero silent expansion. Unknown concepts trigger proposals requiring manual approval.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Contradiction Detection')] }),
                  new TableCell({ children: [new Paragraph('Deterministic Sanity Engine')] }),
                  new TableCell({ children: [new Paragraph('Mathematical inequality checks detect impossible criteria (minAge > maxAge).')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Validation Gate')] }),
                  new TableCell({ children: [new Paragraph('Zod Schemas (schemas.js)')] }),
                  new TableCell({ children: [new Paragraph('Strict schema validation ensures malformed LLM outputs are caught and discarded.')] })
                ]
              })
            ]
          }),

          // 3. APPLICATION FLOW
          new Paragraph({
            text: '3. End-to-End Application Flow (8 Phases)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 140 },
            run: { bold: true, size: 28, color: '1A365D' }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Phase 1: Ingestion & Normalization\n', bold: true }),
              new TextRun('The API receives { name, benefitText, eligibilityText, sourceDocument } via POST /api/schemes/extract. The payload is validated with Zod, and text is sanitized (whitespace, line breaks, unicode quotes normalized).')
            ],
            spacing: { after: 120 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Phase 2: Scheme Document Initialization\n', bold: true }),
              new TextRun('A Scheme record is saved immediately in MongoDB with extractionStatus set to "processing". This ensures auditability even if downstream network or hardware interruptions occur.')
            ],
            spacing: { after: 120 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Phase 3: Dual-Track Deterministic Extraction\n', bold: true }),
              new TextRun('• Benefit Engine (benefitExtractor.js): Extracts amount, currency, frequency, instalments, and preliminary category.\n• Eligibility Engine (eligibilityExtractor.js): Extracts age, income, social category, and state conditions; identifies unapproved concepts; constructs logical trees; and flags mathematical contradictions.')
            ],
            spacing: { after: 120 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Phase 4: Contextual Gemini AI Enrichment\n', bold: true }),
              new TextRun('If the benefit category is ambiguous or complex eligibility phrasing cannot be parsed deterministically, Google Gemini is invoked using @google/genai with responseMimeType: "application/json". Strict Zod parsing validates the model output.')
            ],
            spacing: { after: 120 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Phase 5: Hybrid Fusion & Validation Gate\n', bold: true }),
              new TextRun('Deterministic extractions always take authoritative precedence over model estimations for numeric values and relational operators. Gemini enriches semantic categories and nuanced interpretations.')
            ],
            spacing: { after: 120 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Phase 6: Taxonomy Verification & Proposal Queue\n', bold: true }),
              new TextRun('Extracted concepts are validated against approved taxonomy (age, income, social_category, state). If an unapproved concept is found (e.g., disability, gender, residence_years), the system generates a TaxonomyProposal in "pending_approval" status and queues a Review record. The core taxonomy is never silently expanded.')
            ],
            spacing: { after: 120 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Phase 7: Contradiction & Ambiguity Check\n', bold: true }),
              new TextRun('If criteria contradict (e.g., age > 60 AND age < 25) or benefit amounts are missing in natural language, Review records are created with explicit reason strings and proposed values.')
            ],
            spacing: { after: 120 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Phase 8: Atomic Clean-Up, Persistence, and Status Derivation\n', bold: true }),
              new TextRun('To prevent duplicate records upon re-extraction, previous Benefit and Eligibility documents for this scheme are deleted. New structured records are saved. The Scheme extraction status is finalized: "completed" (if clean), "needs_review" (if reviews/proposals were generated), "partially_completed" (if one section was empty), or "failed".')
            ],
            spacing: { after: 200 }
          }),

          // 4. ALGORITHMIC MECHANICS
          new Paragraph({
            text: '4. Algorithmic Mechanics & Implementation Details',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 140 },
            run: { bold: true, size: 28, color: '1A365D' }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '4.1 Indian Numbering & Lakh Conversion Algorithm\n', bold: true }),
              new TextRun('In numberParser.js, regex patterns detect decimal lakhs, plural lakhs, and thousands:\n'),
              new TextRun('• "₹2.5 lakh" → base 2.5 * 100,000 = 250,000 INR.\n'),
              new TextRun('• "Rs. 3 lakhs" → base 3 * 100,000 = 300,000 INR.\n'),
              new TextRun('• "Six thousand rupees" → wordsToNumber("six thousand") = 6,000 INR.')
            ],
            spacing: { after: 140 }
          }),

          // TABLE: Operators
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: 'EBF8FF', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Source Phrasing', bold: true })] })] }),
                  new TableCell({ shading: { fill: 'EBF8FF', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Operator', bold: true })] })] }),
                  new TableCell({ shading: { fill: 'EBF8FF', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Concept', bold: true })] })] }),
                  new TableCell({ shading: { fill: 'EBF8FF', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Structured Condition', bold: true })] })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('"under ₹2.5 lakh"')] }),
                  new TableCell({ children: [new Paragraph('<')] }),
                  new TableCell({ children: [new Paragraph('income')] }),
                  new TableCell({ children: [new Paragraph('{ concept: "income", operator: "<", value: 250000 }')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('"does not exceed Rs. 3 lakhs"')] }),
                  new TableCell({ children: [new Paragraph('<=')] }),
                  new TableCell({ children: [new Paragraph('income')] }),
                  new TableCell({ children: [new Paragraph('{ concept: "income", operator: "<=", value: 300000 }')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('"above 21 years"')] }),
                  new TableCell({ children: [new Paragraph('>')] }),
                  new TableCell({ children: [new Paragraph('age')] }),
                  new TableCell({ children: [new Paragraph('{ concept: "age", operator: ">", value: 21 }')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('"at least 60 years"')] }),
                  new TableCell({ children: [new Paragraph('>=')] }),
                  new TableCell({ children: [new Paragraph('age')] }),
                  new TableCell({ children: [new Paragraph('{ concept: "age", operator: ">=", value: 60 }')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('"between 18 and 35 years"')] }),
                  new TableCell({ children: [new Paragraph('BETWEEN')] }),
                  new TableCell({ children: [new Paragraph('age')] }),
                  new TableCell({ children: [new Paragraph('{ concept: "age", operator: "BETWEEN", value: [18, 35] }')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('"SC/ST families"')] }),
                  new TableCell({ children: [new Paragraph('IN')] }),
                  new TableCell({ children: [new Paragraph('social_category')] }),
                  new TableCell({ children: [new Paragraph('{ concept: "social_category", operator: "IN", value: ["SC", "ST"] }')] })
                ]
              })
            ]
          }),

          // 5. REST API
          new Paragraph({
            text: '5. Complete REST API Specification',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 140 },
            run: { bold: true, size: 28, color: '1A365D' }
          }),

          // TABLE: APIs
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: 'EBF8FF', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Method', bold: true })] })] }),
                  new TableCell({ shading: { fill: 'EBF8FF', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Endpoint', bold: true })] })] }),
                  new TableCell({ shading: { fill: 'EBF8FF', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Description', bold: true })] })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('POST')] }),
                  new TableCell({ children: [new Paragraph('/api/schemes/extract')] }),
                  new TableCell({ children: [new Paragraph('Ingests scheme text, extracts benefit and eligibility, persists all data.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('GET')] }),
                  new TableCell({ children: [new Paragraph('/api/schemes')] }),
                  new TableCell({ children: [new Paragraph('Lists all schemes with status and search filtering.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('GET')] }),
                  new TableCell({ children: [new Paragraph('/api/schemes/:id')] }),
                  new TableCell({ children: [new Paragraph('Returns a scheme along with its benefits, eligibility, and review records.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('GET')] }),
                  new TableCell({ children: [new Paragraph('/api/benefits')] }),
                  new TableCell({ children: [new Paragraph('Queries structured benefit records by category or schemeId.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('GET')] }),
                  new TableCell({ children: [new Paragraph('/api/eligibility')] }),
                  new TableCell({ children: [new Paragraph('Queries structured eligibility condition records.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('GET')] }),
                  new TableCell({ children: [new Paragraph('/api/review')] }),
                  new TableCell({ children: [new Paragraph('Returns pending review records requiring human intervention.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('PATCH')] }),
                  new TableCell({ children: [new Paragraph('/api/review/:id')] }),
                  new TableCell({ children: [new Paragraph('Approves or rejects a review record, applying reviewer comments & corrections.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('GET')] }),
                  new TableCell({ children: [new Paragraph('/api/taxonomy')] }),
                  new TableCell({ children: [new Paragraph('Returns approved concepts, categories, operators, and pending proposals.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('POST')] }),
                  new TableCell({ children: [new Paragraph('/api/taxonomy/proposals')] }),
                  new TableCell({ children: [new Paragraph('Submits a concept proposal for administrative review.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('PATCH')] }),
                  new TableCell({ children: [new Paragraph('/api/taxonomy/proposals/:id')] }),
                  new TableCell({ children: [new Paragraph('Approves or rejects a taxonomy proposal. Approved concepts update core taxonomy.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('GET')] }),
                  new TableCell({ children: [new Paragraph('/api/health')] }),
                  new TableCell({ children: [new Paragraph('Health check probe verifying server status.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('GET')] }),
                  new TableCell({ children: [new Paragraph('/api/samples')] }),
                  new TableCell({ children: [new Paragraph('Retrieves the complete 16-item benchmark dataset of messy government schemes.')] })
                ]
              })
            ]
          }),

          // 6. TESTING
          new Paragraph({
            text: '6. Quality Assurance & Test Benchmark',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 140 },
            run: { bold: true, size: 28, color: '1A365D' }
          }),
          new Paragraph({
            children: [
              new TextRun('The system features an automated test suite implemented in Vitest 3.x with 85 unit and integration tests passing in 1.67 seconds:\n'),
              new TextRun('• tests/benefit.test.js (27 tests): Currencies, comma numbers, lakh conversions, quarterly/yearly/monthly frequencies, instalments.\n'),
              new TextRun('• tests/eligibility.test.js (21 tests): Operator distinctions (< vs <=, > vs >=), age ranges, SC/ST and OBC categories, nested logic, unknown concepts, contradiction checks.\n'),
              new TextRun('• tests/review.test.js (10 tests): Review queue validation, taxonomy governance, dynamic concept addition.\n'),
              new TextRun('• tests/extractionPipeline.test.js (16 tests): Complete end-to-end extraction verifying all 16 sample government schemes.\n'),
              new TextRun('• tests/geminiAndApi.test.js (11 tests): Gemini SDK mocking, rate limit handling, REST endpoint validation.')
            ],
            spacing: { after: 200 }
          }),

          // 7. CONCLUSION
          new Paragraph({
            text: '7. Conclusion',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 140 },
            run: { bold: true, size: 28, color: '1A365D' }
          }),
          new Paragraph({
            children: [
              new TextRun('By pairing deterministic JavaScript rules for numeric precision and relational operators with Google Gemini AI for contextual classification and semantic interpretation, the Government Scheme Extraction & Structuring System establishes an auditable, robust, and zero-hallucination benchmark for converting public sector administrative documents into machine-readable data.')
            ],
            spacing: { after: 200 }
          })
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.resolve('APPLICATION_FLOW.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`[Success] Word DOCX generated at: ${outputPath} (${buffer.length} bytes)`);
}

createDocx().catch((err) => {
  console.error('[Error generating DOCX]:', err);
  process.exit(1);
});
