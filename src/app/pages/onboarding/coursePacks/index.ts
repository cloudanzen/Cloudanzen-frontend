import type { CoursePack } from './types';
import { ISO_27001_V2 } from './iso-27001-v2';
import { ISO_42001_V2 } from './iso-42001-v2';

function module(
  id: string,
  title: string,
  summary: string,
  body: string,
  bullets: string[],
  question: string,
  correct: string,
  incorrect: string,
): CoursePack['modules'][number] {
  return {
    id,
    title,
    summary,
    body,
    bullets,
    question,
    choices: [
      {
        id: `${id}-correct`,
        label: correct,
        isCorrect: true,
        feedback: 'Correct. This is the expected operating behaviour.',
      },
      {
        id: `${id}-incorrect`,
        label: incorrect,
        isCorrect: false,
        feedback:
          'Not quite. Review the module guidance before continuing with the course.',
      },
    ],
  };
}

export const COURSE_PACKS: Record<string, CoursePack> = {
  'iso-27001-security-awareness': ISO_27001_V2,
  'iso-42001-ai-governance-awareness': ISO_42001_V2,
  'soc-2-trust-awareness': {
    slug: 'soc-2-trust-awareness',
    version: 1,
    passThresholdPct: 80,
    estimatedMinutes: 15,
    modules: [
      module(
        'trust-services',
        'Trust Services Commitments',
        'SOC 2 turns operating commitments into audit evidence.',
        'SOC 2 awareness helps teams understand that security, availability, confidentiality, privacy, and processing integrity are reflected in everyday workflows.',
        [
          'Follow the controls that support customer commitments.',
          'Keep evidence current instead of recreating it during audit season.',
          'Escalate gaps before they become exceptions.',
        ],
        'What makes SOC 2 evidence useful?',
        'It shows the control operated during the review period.',
        'It is created at the end of the audit from memory.',
      ),
      module(
        'customer-trust',
        'Customer Trust Requests',
        'Security questionnaires and trust center requests need consistent answers.',
        'SOC 2 evidence often supports customer reviews. Teams should avoid ad hoc promises and route customer security questions through approved trust workflows.',
        [
          'Use approved questionnaire answers.',
          'Share only approved trust documents.',
          'Route unusual commitments for review.',
        ],
        'How should a new customer security commitment be handled?',
        'Route it for review before promising it to the customer.',
        'Promise it first and ask compliance later.',
      ),
    ],
  },
  'hipaa-security-awareness': {
    slug: 'hipaa-security-awareness',
    version: 1,
    passThresholdPct: 80,
    estimatedMinutes: 16,
    modules: [
      module(
        'ephi-basics',
        'ePHI Handling',
        'HIPAA security awareness focuses on protecting electronic PHI.',
        'Health data can carry legal, contractual, and patient trust obligations. Workforce members need to understand minimum necessary access, secure storage, and incident reporting.',
        [
          'Use approved systems for ePHI.',
          'Apply minimum necessary access.',
          'Report suspected PHI exposure immediately.',
        ],
        'What is the safest way to handle ePHI?',
        'Use approved systems and limit access to the minimum necessary.',
        'Download it locally if that makes analysis easier.',
      ),
      module(
        'hipaa-incidents',
        'HIPAA Incident Signals',
        'Potential ePHI incidents need fast escalation.',
        'Misaddressed emails, lost devices, exposed records, unusual access, and unapproved sharing can all become HIPAA incidents. Early reporting protects patients and the organization.',
        [
          'Report suspected exposure even if details are incomplete.',
          'Do not delete or alter evidence.',
          'Follow the incident communication process.',
        ],
        'What should you do after sending ePHI to the wrong recipient?',
        'Report it immediately through the incident process.',
        'Ask the recipient to delete it and move on.',
      ),
    ],
  },
  'nist-csf-cyber-awareness': {
    slug: 'nist-csf-cyber-awareness',
    version: 1,
    passThresholdPct: 80,
    estimatedMinutes: 15,
    modules: [
      module(
        'identify-protect',
        'Identify and Protect',
        'Good cybersecurity starts with knowing assets and reducing exposure.',
        'NIST CSF awareness connects individual behaviour to asset visibility, identity protection, data protection, and resilient operations.',
        [
          'Use approved assets and report unknown systems.',
          'Protect credentials and sensitive information.',
          'Follow change and access procedures.',
        ],
        'Which action best supports Identify and Protect?',
        'Use approved systems and report untracked assets or access.',
        'Create a personal workaround when a system is slow.',
      ),
      module(
        'detect-respond-recover',
        'Detect, Respond, Recover',
        'Fast detection and clear reporting reduce impact.',
        'People are part of detection. Suspicious emails, unusual access prompts, unexpected data movement, and degraded service should be reported through the right channel.',
        [
          'Report unusual activity promptly.',
          'Preserve evidence and avoid speculation.',
          'Follow recovery instructions from the response team.',
        ],
        'What should you do when you see suspicious account activity?',
        'Report it through the security channel and preserve details.',
        'Wait to see whether it happens again.',
      ),
    ],
  },
};

export function getCoursePack(slug: string): CoursePack | undefined {
  return COURSE_PACKS[slug];
}
