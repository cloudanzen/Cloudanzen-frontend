import type { CoursePack } from './types';
import { ISO_27001_V2 } from './iso-27001-v2';
import { ISO_42001_V2 } from './iso-42001-v2';
import { SOC_2_V2 } from './soc-2-v2';
import { HIPAA_V2 } from './hipaa-v2';

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
  'soc-2-trust-awareness': SOC_2_V2,
  'hipaa-security-awareness': HIPAA_V2,
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
