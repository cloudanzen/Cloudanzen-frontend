import type { CoursePack } from './types';
import { ISO_27001_V2 } from './iso-27001-v2';
import { ISO_42001_V2 } from './iso-42001-v2';
import { SOC_2_V2 } from './soc-2-v2';
import { HIPAA_V2 } from './hipaa-v2';
import { NIST_CSF_V2 } from './nist-csf-v2';

export const COURSE_PACKS: Record<string, CoursePack> = {
  'iso-27001-security-awareness': ISO_27001_V2,
  'iso-42001-ai-governance-awareness': ISO_42001_V2,
  'soc-2-trust-awareness': SOC_2_V2,
  'hipaa-security-awareness': HIPAA_V2,
  'nist-csf-cyber-awareness': NIST_CSF_V2,
};

export function getCoursePack(slug: string): CoursePack | undefined {
  return COURSE_PACKS[slug];
}
