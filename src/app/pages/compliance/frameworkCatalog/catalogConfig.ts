export interface FrameworkCatalogEntry {
  slug: string;
  tagline: string;
  overview: string;
  domains: string[];
  industries: string[];
  scope: string[];
  benefits: string[];
  controlDomains: Array<{ label: string; count: number }>;
  certifyingBody: string;
  auditFrequency: string;
}

export const FRAMEWORK_CATALOG: Record<string, FrameworkCatalogEntry> = {
  'iso-27001': {
    slug: 'iso-27001',
    domains: ['Security'],
    tagline: 'The global benchmark for information security management',
    overview:
      'ISO/IEC 27001:2022 defines the requirements for an information security management system. Annex A groups 93 controls across organizational, people, physical, and technological themes.',
    industries: [
      'Technology',
      'Finance',
      'Healthcare',
      'Manufacturing',
      'Government',
      'Professional Services',
    ],
    scope: [
      'Information assets inside the ISMS boundary',
      'Statement of Applicability and Annex A control selection',
    ],
    benefits: [
      'Widely recognized certification',
      'Disciplined risk management program',
      'Strong foundation for SOC 2, HIPAA, and other mapped frameworks',
    ],
    controlDomains: [
      { label: 'Organizational Controls', count: 37 },
      { label: 'People Controls', count: 8 },
      { label: 'Physical Controls', count: 14 },
      { label: 'Technological Controls', count: 34 },
    ],
    certifyingBody: 'Accredited ISO certification body',
    auditFrequency: 'Annual surveillance audits with 3-year recertification',
  },
  'soc-2': {
    slug: 'soc-2',
    domains: ['Security', 'Data protection'],
    tagline: 'The US standard for SaaS security and trust',
    overview:
      'SOC 2 evaluates controls against the Trust Services Criteria. Type II reports cover the design and operating effectiveness of controls over a review period.',
    industries: [
      'SaaS / Cloud',
      'Technology',
      'Finance',
      'Healthcare IT',
      'Managed Service Providers',
    ],
    scope: [
      'Systems storing or processing customer data',
      'Applicable Trust Services Criteria',
      '6-12 month observation period for Type II',
    ],
    benefits: [
      'Common procurement requirement for enterprise deals',
      'Reduces security questionnaire burden',
      'Signals operational maturity to customers and investors',
    ],
    controlDomains: [
      { label: 'CC — Common Criteria', count: 9 },
      { label: 'A — Availability', count: 3 },
      { label: 'PI — Processing Integrity', count: 5 },
      { label: 'C — Confidentiality', count: 2 },
      { label: 'P — Privacy', count: 8 },
    ],
    certifyingBody: 'AICPA-licensed CPA firm',
    auditFrequency: 'Annual Type II audit with 6-12 month review period',
  },
  'nist-csf': {
    slug: 'nist-csf',
    domains: ['Security'],
    tagline: 'The US government playbook for cybersecurity risk',
    overview:
      'NIST CSF 2.0 organizes cybersecurity outcomes into Govern, Identify, Protect, Detect, Respond, and Recover. It is designed to be flexible and outcome-driven.',
    industries: [
      'Government',
      'Defense',
      'Critical Infrastructure',
      'Finance',
      'Healthcare',
      'Energy',
    ],
    scope: [
      'Cybersecurity risk management processes',
      'Supply chain and third-party risk',
    ],
    benefits: [
      'Strong alignment with US public-sector expectations',
      'Flexible outcome-based model',
      'Maps cleanly to ISO 27001 and SOC 2',
    ],
    controlDomains: [
      { label: 'GV — Govern', count: 6 },
      { label: 'ID — Identify', count: 5 },
      { label: 'PR — Protect', count: 5 },
      { label: 'DE — Detect', count: 3 },
      { label: 'RS — Respond', count: 4 },
      { label: 'RC — Recover', count: 3 },
    ],
    certifyingBody: 'No formal certification body',
    auditFrequency: 'Typically annual self-assessment or third-party review',
  },
  hipaa: {
    slug: 'hipaa',
    domains: ['Security', 'Data protection'],
    tagline: 'Federal requirements for protecting health information',
    overview:
      'The HIPAA Security Rule sets national standards for protecting electronic protected health information through administrative, physical, and technical safeguards.',
    industries: [
      'Healthcare',
      'Health IT / Digital Health',
      'Health Insurance',
      'Medical Devices',
      'Telehealth',
    ],
    scope: [
      'All ePHI created, received, maintained, or transmitted',
      'Covered entities and business associates with PHI access',
    ],
    benefits: [
      'Required for handling US patient health data',
      'Supports Business Associate Agreements',
      'Reduces OCR enforcement and breach risk',
    ],
    controlDomains: [
      { label: 'Administrative Safeguards', count: 9 },
      { label: 'Physical Safeguards', count: 4 },
      { label: 'Technical Safeguards', count: 5 },
      { label: 'Organizational Requirements', count: 2 },
    ],
    certifyingBody: 'US HHS / Office for Civil Rights',
    auditFrequency: 'No fixed audit cycle; OCR reviews are event-driven',
  },
  'iso-42001': {
    slug: 'iso-42001',
    domains: ['AI governance', 'Risk management'],
    tagline: 'The international management-system standard for responsible AI',
    overview:
      'ISO/IEC 42001:2023 defines the requirements for an AI management system covering AI governance, risk and impact assessment, the AI life cycle, data, transparency, human oversight, and third-party AI. Annex A organizes 38 reference controls across nine areas.',
    industries: [
      'AI-native SaaS',
      'Technology',
      'Finance',
      'Healthcare AI',
      'Public sector',
      'Professional services using AI',
    ],
    scope: [
      'AI systems developed, provided, or used by the organization',
      'Data, models, prompts, and outputs across the AI life cycle',
      'Third-party AI providers and foundation-model use',
    ],
    benefits: [
      'First international AIMS standard auditors recognize',
      'Demonstrates responsible-AI posture to enterprise procurement',
      'Maps cleanly onto an existing ISO 27001 ISMS',
    ],
    controlDomains: [
      { label: 'AI policies', count: 3 },
      { label: 'Internal organization', count: 2 },
      { label: 'Resources for AI', count: 5 },
      { label: 'Impact assessment', count: 4 },
      { label: 'AI life cycle', count: 9 },
      { label: 'Data for AI', count: 5 },
      { label: 'Information for interested parties', count: 4 },
      { label: 'Use of AI', count: 3 },
      { label: 'Third-party and customer relationships', count: 3 },
    ],
    certifyingBody: 'Accredited ISO certification body',
    auditFrequency: 'Annual surveillance audits with 3-year recertification',
  },
};
