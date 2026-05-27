// ── Academy Helper Lines ──────────────────────────────────────────────────────

export const MASCOT_LINES = {
  // Intro
  welcome:
    'Welcome to CloudAnzen Academy. This course walks through practical security scenarios every team member should understand.',
  startPrompt: "Ready? This takes about 10-15 minutes. Let's get started.",

  // Correct / best-practice feedback
  correctGeneric: "Good instinct. That's the right call.",
  bestPracticeGeneric: "Excellent choice. That's the best-practice approach.",
  reportBonus: "Reporting it too — that's exactly what we need.",

  // Incorrect feedback
  incorrectGeneric: "Not quite. Let's look at why.",
  highRiskGeneric: "That would have been risky. Here's what to watch for.",

  // Module intros
  module1Intro:
    'Security is a shared operating responsibility, not a background IT task.',
  module2Intro:
    "Your accounts are the front door. Let's make sure they're properly locked.",
  module3Intro:
    "Passwords alone aren't enough. Let's add another layer of protection.",
  module4Intro:
    "Attackers count on people acting fast without thinking. Let's slow down and look closer.",
  module5Intro:
    "Your devices carry company data everywhere. Let's keep them secure.",

  // Module outros
  module1Outro: "First badge earned. You're part of the security perimeter.",
  module2Outro: 'Nice work. Your accounts are looking a lot stronger now.',
  module3Outro: 'MFA is one of the best defenses you have. Well done.',
  module4Outro: "You've got a sharp eye for threats. Keep that instinct.",
  module5Outro: "Devices and data — both secured. That's a strong finish.",

  // Final challenge
  finalChallengeIntro:
    'One last test. A busy workday with several situations hitting at once. Stay sharp.',
  finalChallengeOutro: "The workday is over. Let's see how you did.",

  // Summary
  summaryChampion: 'Outstanding. You handled that like a seasoned pro.',
  summaryStrong:
    "Solid performance. A few areas to sharpen, but you're in good shape.",
  summaryReinforcement:
    "You've got the basics, but some topics need another look.",
  summaryRetake:
    "It's worth going through this again. These habits take practice.",
} as const;

// ── Section Descriptions ──────────────────────────────────────────────────────

export const MODULE_DESCRIPTIONS = {
  'module-1': 'Why security matters and your role in protecting the team.',
  'module-2': 'Passwords, passphrases, and why password managers matter.',
  'module-3': 'Multi-factor authentication and stronger login protection.',
  'module-4': 'Spotting phishing, social engineering, and malware.',
  'module-5': 'Device security, software safety, and sensitive data handling.',
  'final-challenge':
    "A busy workday simulation testing everything you've learned.",
} as const;
