import type { BadgeDefinition } from '../lib/types';

export const BADGES: BadgeDefinition[] = [
  {
    id: 'pack-protector',
    name: 'Policy Champion',
    description: "Recognized that security is everyone's responsibility.",
    icon: 'shield-check',
    moduleId: 'module-1',
  },
  {
    id: 'password-hound',
    name: 'Credential Steward',
    description: 'Mastered strong passphrases and password manager awareness.',
    icon: 'key-round',
    moduleId: 'module-2',
  },
  {
    id: 'mfa-guard',
    name: 'MFA Guard',
    description: 'Understands multi-factor authentication and its importance.',
    icon: 'lock-keyhole',
    moduleId: 'module-3',
  },
  {
    id: 'threat-sniffer',
    name: 'Threat Sniffer',
    description:
      'Can identify phishing, social engineering, and malware risks.',
    icon: 'search',
    moduleId: 'module-4',
  },
  {
    id: 'device-defender',
    name: 'Device Defender',
    description: 'Knows how to keep devices secure and updated.',
    icon: 'monitor-smartphone',
    moduleId: 'module-5',
  },
  {
    id: 'data-guardian',
    name: 'Data Guardian',
    description:
      'Handles sensitive data with care and follows sharing policies.',
    icon: 'file-lock-2',
    moduleId: 'module-5',
  },
  {
    id: 'top-watchdog',
    name: 'Security Lead',
    description:
      'Completed the final challenge and proved real-world readiness.',
    icon: 'award',
    moduleId: 'final-challenge',
  },
];

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGES.find((b) => b.id === id);
}

export function getBadgesForModule(moduleId: string): BadgeDefinition[] {
  return BADGES.filter((b) => b.moduleId === moduleId);
}
