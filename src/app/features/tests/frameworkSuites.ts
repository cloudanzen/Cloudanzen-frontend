export interface FrameworkSuiteOption {
  id: string;
  key: string;
  framework: string;
  name: string;
  description: string;
}

export const FRAMEWORK_SUITE_OPTIONS: FrameworkSuiteOption[] = [
  {
    id: 'soc2-access-reviews',
    key: 'soc2AccessReviews',
    framework: 'SOC 2',
    name: 'SOC 2 Access Review Suite',
    description:
      'Quarterly access reviews, privileged access checks, and evidence attestation.',
  },
  {
    id: 'iso-cloud-hardening',
    key: 'isoCloudHardening',
    framework: 'ISO 27001',
    name: 'ISO Cloud Hardening Suite',
    description:
      'Automated cloud posture checks for encryption, exposure, and perimeter hardening.',
  },
  {
    id: 'nist-sdlc',
    key: 'nistSdlc',
    framework: 'NIST',
    name: 'NIST Secure SDLC Suite',
    description:
      'Engineering controls for release quality, vulnerability response, and CI guardrails.',
  },
  {
    id: 'hipaa-data-retention',
    key: 'hipaaDataRetention',
    framework: 'HIPAA',
    name: 'HIPAA Data Retention Suite',
    description:
      'Evidence-driven checks for retention, encryption, and data ownership workflows.',
  },
];
