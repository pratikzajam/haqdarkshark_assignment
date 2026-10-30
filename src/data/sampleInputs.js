/**
 * Sample dataset containing 16 realistic messy government scheme inputs
 * Includes clean, messy, incomplete, ambiguous, and contradictory examples.
 */

export const SAMPLE_SCHEMES = [
  {
    id: 'SCHEME-001',
    name: 'PM-Kisan Samman Nidhi Yojana',
    benefitText: 'Financial assistance of ₹6,000 a year in three instalments payable directly to bank accounts.',
    eligibilityText: 'Small and marginal farmers holding cultivable land up to 2 hectares in any state of India.',
    description: 'Clean yearly payment with 3 instalments and known operators.'
  },
  {
    id: 'SCHEME-002',
    name: 'Indira Gandhi National Old Age Pension Scheme',
    benefitText: 'Rs. 2,000/- per month paid directly through DBT.',
    eligibilityText: 'Applicants aged at least 60 years whose family income does not exceed Rs. 1.2 lakhs per year.',
    description: 'Monthly benefit with Rs. notation and at least/not exceeding operators.'
  },
  {
    id: 'SCHEME-003',
    name: 'National Start-Up Seed Grant',
    benefitText: 'INR 15000 as a one-time grant for initial capital expenditure.',
    eligibilityText: 'Applicants aged between 18 and 35 years residing in Maharashtra.',
    description: 'One-time grant with INR prefix and BETWEEN age operator.'
  },
  {
    id: 'SCHEME-004',
    name: 'Post-Matric Scholarship Scheme',
    benefitText: 'Six thousand rupees annually toward tuition and living support.',
    eligibilityText: 'SC/ST families with annual income under ₹2.5 lakh.',
    description: 'Written number amount (Six thousand rupees) and SC/ST social category.'
  },
  {
    id: 'SCHEME-005',
    name: 'Handloom Weaver Quarterly Support',
    benefitText: '₹5000 quarterly subsidy deposited every 3 months.',
    eligibilityText: 'OBC applicants whose family income does not exceed Rs. 3 lakhs.',
    description: 'Quarterly frequency and OBC social category with <= operator.'
  },
  {
    id: 'SCHEME-006',
    name: 'Kanya Samriddhi Mahila Sahayata',
    benefitText: 'One-time transfer of ₹25,000 upon completion of higher secondary education.',
    eligibilityText: 'Women above 21 years who are permanent residents of Uttar Pradesh.',
    description: 'Contains unknown concept (gender: Women) and state qualification.'
  },
  {
    id: 'SCHEME-007',
    name: 'State Domicile Artisans Welfare Fund',
    benefitText: 'Financial assistance of Rs 10000 per annum in two equal instalments.',
    eligibilityText: 'Residents of Maharashtra for at least five years with annual income < 200000.',
    description: 'Contains unknown concept (residence_duration: 5 years) alongside state.'
  },
  {
    id: 'SCHEME-008',
    name: 'Chief Minister EWS Housing Assistance',
    benefitText: 'Subsidy of ₹1.5 lakh disbursed in four quarterly instalments for house construction.',
    eligibilityText: 'Economically weaker families having household income under ₹1.8 lakh per annum.',
    description: 'Lakh conversion with instalments and unknown concept (economic_status/EWS).'
  },
  {
    id: 'SCHEME-009',
    name: 'Divyangjan Mobility and Assistive Device Scheme',
    benefitText: 'Financial support of INR 8,000 for purchasing assistive mobility devices.',
    eligibilityText: 'Applicants with disabilities aged above 18 years in Gujarat.',
    description: 'Contains unknown concept (disability) that must generate a taxonomy proposal.'
  },
  {
    id: 'SCHEME-010',
    name: 'State Backward Classes Higher Education Fellowship',
    benefitText: 'Monthly stipend of Rs. 4,500/- for twenty-four months.',
    eligibilityText: 'SC, ST or OBC candidates whose annual family income is below ₹2,00,000 and age is between 20 and 28 years.',
    description: 'Mixed social categories (SC, ST, OBC), monthly frequency, and compound eligibility.'
  },
  {
    id: 'SCHEME-011',
    name: 'Tribal Solar Pump Subsidy Scheme',
    benefitText: 'Capital subsidy of 90 percent or maximum ₹45,000 one-time benefit.',
    eligibilityText: 'ST candidates residing in Jharkhand or Odisha with annual family income not exceeding 1.5 lakhs.',
    description: 'Nested state OR conditions (Jharkhand OR Odisha) with ST social category.'
  },
  {
    id: 'SCHEME-012',
    name: 'Discretionary Emergency Medical Grant (Ambiguous)',
    benefitText: 'Substantial financial assistance will be provided to eligible patients periodically as decided by the state medical board.',
    eligibilityText: 'BPL card holders with severe illness as certified by a civil surgeon.',
    description: 'Ambiguous benefit (no specific amount or frequency stated) and BPL unknown concept.'
  },
  {
    id: 'SCHEME-013',
    name: 'Youth Pension Scheme (Contradictory Age Rule)',
    benefitText: 'Monthly pension of ₹3,000.',
    eligibilityText: 'Applicant must be aged above 60 years and under 25 years with annual income under ₹1 lakh.',
    description: 'Contradictory condition (age > 60 AND age < 25) which is mathematically impossible.'
  },
  {
    id: 'SCHEME-014',
    name: 'Farmers Drought Compensation (Contradictory Income Rule)',
    benefitText: 'Annual relief fund of Rs. 12,000.',
    eligibilityText: 'Family income must exceed ₹5,00,000 while total family income does not exceed Rs. 2,00,000.',
    description: 'Contradictory income condition (income > 5L AND income <= 2L).'
  },
  {
    id: 'SCHEME-015',
    name: 'Vocational Apprenticeship Allowance (Incomplete)',
    benefitText: 'Stipend provided for training period.',
    eligibilityText: 'Candidates who have passed 10th grade.',
    description: 'Incomplete benefit and incomplete eligibility with missing amount/frequency.'
  },
  {
    id: 'SCHEME-016',
    name: 'State Integrated Welfare Initiative (Complex Nested Logic)',
    benefitText: '₹12,000 a year paid in 4 quarterly instalments.',
    eligibilityText: 'Residents of Karnataka who are either (SC/ST with income under ₹2.5 lakh) OR (OBC with income under ₹1.5 lakh) and aged between 21 and 45 years.',
    description: 'Complex nested boolean logic: State AND ((SC/ST AND income < 2.5L) OR (OBC AND income < 1.5L)) AND age.'
  }
];
