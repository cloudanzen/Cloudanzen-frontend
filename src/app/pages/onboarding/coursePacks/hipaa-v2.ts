/**
 * HIPAA Security Awareness — v2 (audit-grade).
 *
 * 8 modules, ~24 questions (~35 min). Warmer "colleague at CloudAnzen"
 * tone. Each question carries a rationale shown inline to the learner.
 *
 * BE answer keys live in cloudanzen-backend
 * `src/modules/onboarding/training-answer-keys.ts` keyed
 * `hipaa-security-awareness@v2`. Keep both in lockstep.
 */
import type { CoursePack } from './types';

export const HIPAA_V2: CoursePack = {
  slug: 'hipaa-security-awareness',
  version: 2,
  passThresholdPct: 80,
  estimatedMinutes: 35,
  modules: [
    {
      id: 'm1-phi-ephi',
      title: 'PHI + ePHI — what counts',
      summary:
        'What counts as protected health information, and what does not.',
      body:
        "PHI (Protected Health Information) is any information about a person's health, healthcare, or healthcare payment that can be linked back to them. ePHI is the same thing but stored or transmitted electronically. Almost everything we touch in a healthcare-customer integration is ePHI.\n\n" +
        'The HIPAA "18 identifiers" rule is worth knowing roughly: names, addresses below state level, dates more granular than year, phone, email, SSN, MRN, account numbers, IP addresses, biometric IDs, photos, and so on. Combine ANY of those with health info and you have PHI.\n\n' +
        'The trap most newcomers fall into: thinking "I removed the name, so it is not PHI". De-identification is a specific process with strict rules. A zip code + birthdate + diagnosis is still identifiable (literally 87% of US residents can be uniquely identified by that triplet). When in doubt, treat it as PHI.',
      bullets: [
        'PHI = health info that can be linked back to a person.',
        'ePHI = the same but stored or transmitted electronically.',
        'There are 18 identifiers — combinations make it identifiable too.',
        '"I removed the name" is not the same as de-identified.',
        'When in doubt, treat as PHI.',
      ],
      questions: [
        {
          id: 'm1-q1',
          kind: 'single_choice',
          prompt: 'Which of these is PHI?',
          rationale:
            "A note tying a person to a medical condition is the textbook PHI example. Marketing email addresses for general newsletters are not PHI on their own (no health link). Anonymous aggregate counts are de-identified. A teammate's personal calendar item is personal data but not PHI.",
          choices: [
            {
              id: 'a',
              label: 'A general marketing newsletter subscriber email list.',
              isCorrect: false,
              feedback: 'Health link missing — that is just marketing data.',
            },
            {
              id: 'b',
              label:
                'A note in a customer support ticket saying "patient John D. was admitted for cardiac care on 2026-03-15".',
              isCorrect: true,
              feedback: 'Name + condition + date = textbook PHI.',
            },
            {
              id: 'c',
              label:
                'A count of "1,243 patients used the feature this month" with no identifiers.',
              isCorrect: false,
              feedback:
                'Aggregate counts with no identifiers are de-identified.',
            },
            {
              id: 'd',
              label: "Your teammate's personal yoga-class calendar invite.",
              isCorrect: false,
              feedback: 'Personal data, not PHI.',
            },
          ],
        },
        {
          id: 'm1-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these can re-identify a person even after the obvious name is removed? (pick all that apply)',
          rationale:
            'Zip code + birthdate + sex re-identifies most US residents. Full-resolution photos, voiceprints, and free-text notes that quote the patient verbatim also do. "Truncated patient initials" alone usually does not.',
          choices: [
            {
              id: 'a',
              label: 'Zip code + date of birth + sex.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'A high-resolution face photo.',
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'A free-text clinical note that quotes the patient verbatim.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Truncated patient initials with no other context.',
              isCorrect: false,
              feedback: 'Initials alone are usually too weak to re-identify.',
            },
          ],
        },
        {
          id: 'm1-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A teammate wants to use customer ePHI in a demo. They say they\'ll "remove the names" first.',
          prompt: 'Is this in-policy?',
          rationale:
            'Removing names is not the same as de-identification under HIPAA. Either use the Safe Harbor method (all 18 identifiers removed) or use the Expert Determination method. Or — easier — use synthetic data for demos.',
          choices: [
            {
              id: 'a',
              label: 'Yes — removing names is sufficient.',
              isCorrect: false,
              feedback: 'Name removal alone does not de-identify.',
            },
            {
              id: 'b',
              label:
                'No — use the Safe Harbor method (remove all 18 identifiers), Expert Determination, or synthetic data.',
              isCorrect: true,
              feedback: 'Right — formal de-identification or synthetic data.',
            },
            {
              id: 'c',
              label: 'Yes, if the demo is internal-only.',
              isCorrect: false,
              feedback: 'Internal-only does not change HIPAA status.',
            },
            {
              id: 'd',
              label: 'Yes, if it is just for screenshots.',
              isCorrect: false,
              feedback: 'Screenshots of PHI are PHI.',
            },
          ],
        },
      ],
    },

    {
      id: 'm2-minimum-necessary',
      title: 'Minimum necessary access',
      summary: 'Touch only the PHI you actually need to do your job.',
      body:
        "The HIPAA Privacy Rule's minimum-necessary standard says: when you use, disclose, or request PHI, limit it to the minimum amount needed to do the task. For us this translates to: do not query whole patient datasets when you only need one row, do not export when reading on-screen is enough, and do not keep PHI longer than you need.\n\n" +
        'Our access model implements this with row-level access in the warehouse, scoped query templates, and time-bound debugging access. Standing broad access to PHI is exactly what HIPAA expects us not to have — and what auditors look for.\n\n' +
        'When you debug a customer issue, the right question to ask before opening the data is "what is the smallest subset I need to confirm or fix this?". The answer is almost always smaller than "the whole table".',
      bullets: [
        'Touch the smallest PHI subset needed for the task.',
        'No standing broad-access roles for PHI.',
        'Time-bound debugging access > permanent grants.',
        'Reading on-screen > exporting; exporting > downloading.',
        'Delete debug copies of PHI when done.',
      ],
      questions: [
        {
          id: 'm2-q1',
          kind: 'single_choice',
          prompt:
            'You\'re debugging a single customer\'s issue. The warehouse offers two views: "all patients in their org" and "just the affected patient". Which do you use?',
          rationale:
            'Minimum necessary is the rule — query only the row(s) you need. The "all patients" view is broader than the task requires, which is itself a HIPAA violation under the Privacy Rule even if you never look at the other rows.',
          choices: [
            {
              id: 'a',
              label:
                '"All patients in their org" — just in case I need context.',
              isCorrect: false,
              feedback:
                'That is broader than necessary; HIPAA forbids the access regardless of whether you read it.',
            },
            {
              id: 'b',
              label: '"Just the affected patient" — minimum necessary.',
              isCorrect: true,
              feedback: 'Right — query only the row you need.',
            },
            {
              id: 'c',
              label: 'Whichever is faster to load.',
              isCorrect: false,
              feedback: 'Speed is not a HIPAA justification.',
            },
            {
              id: 'd',
              label: 'Download the entire dataset to a local file.',
              isCorrect: false,
              feedback: 'Maximum violation. Do not.',
            },
          ],
        },
        {
          id: 'm2-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are in-policy ways to give a teammate temporary PHI access for debugging? (pick all that apply)',
          rationale:
            "Time-bound JIT grants via the access tool, scoped read-only views, and supervised pair-debugging on the existing access-holder's session are all in-policy. Sharing your own credentials is a HIPAA + everything-else violation.",
          choices: [
            {
              id: 'a',
              label: 'Time-bound JIT grant via the access management tool.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'Scoped read-only view limited to the affected patient.',
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'Pair-debugging on your existing session with full audit log.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Sharing your own login credentials.',
              isCorrect: false,
              feedback: 'Credential sharing breaks every control — never.',
            },
          ],
        },
        {
          id: 'm2-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A teammate asks for permanent read access to all customer PHI "so I do not have to keep asking for grants every time I debug something".',
          prompt: 'What is the right response?',
          rationale:
            'Standing broad PHI access is the exact opposite of minimum-necessary. The right path is to set up a streamlined JIT-grant flow (one-click, audit-logged) so the friction of doing the right thing drops to near-zero. Permanent broad access is never the answer.',
          choices: [
            {
              id: 'a',
              label: 'Grant the permanent access.',
              isCorrect: false,
              feedback: 'Standing broad access is the textbook HIPAA finding.',
            },
            {
              id: 'b',
              label:
                'Decline; offer to improve the JIT-grant flow so debugging is fast without permanent access.',
              isCorrect: true,
              feedback:
                'Right — fix the friction without breaking the control.',
            },
            {
              id: 'c',
              label: 'Ignore the request.',
              isCorrect: false,
              feedback: 'Engage; route to the supported path.',
            },
            {
              id: 'd',
              label: 'Grant for "just one quarter".',
              isCorrect: false,
              feedback:
                'Time-boxed but unbounded scope is still broader than necessary.',
            },
          ],
        },
      ],
    },

    {
      id: 'm3-secure-comm',
      title: 'Secure communication',
      summary: 'Email, Slack, ticketing, screen-share — where PHI is OK.',
      body:
        'Communication tools are where ePHI most commonly leaks accidentally. The HIPAA Security Rule expects us to encrypt ePHI in transit, control which tools handle it, and audit access. In practice that means: PHI goes only through tools we have a BAA with, never through DM-tier personal apps, and screen-sharing on PHI is treated like a recording event.\n\n' +
        'Our approved comms stack for PHI: the support platform (BAA on file), encrypted email with the healthcare label, and the patient-context channels in the support tool. Slack DMs, regular email, screenshots in #general, and personal SMS are all out of scope.\n\n' +
        'Screen-sharing during demos or pair-debugging is the most-forgotten leak vector. Before you share your screen, close PHI tabs, blur or mask the patient ID column, and announce "I am sharing — anything sensitive on screen?" before clicking share.',
      bullets: [
        'PHI only through BAA-covered tools.',
        'Slack DMs / regular email / personal SMS = not approved for PHI.',
        'Screen-share = recording event — close PHI tabs first.',
        'Screenshots of PHI follow the same rules as the original.',
        'When you must send PHI, use the approved encrypted path.',
      ],
      questions: [
        {
          id: 'm3-q1',
          kind: 'single_choice',
          prompt:
            'A customer support agent needs to share patient details with engineering to debug a bug. Which channel is in-policy?',
          rationale:
            'The patient-context channels inside the support platform (BAA on file) are the in-policy path. Slack DMs and #general are not BAA-covered. Email-without-encryption-label is not in-policy. Personal SMS is way out of scope.',
          choices: [
            {
              id: 'a',
              label: 'Slack DM the engineer with a quick screenshot.',
              isCorrect: false,
              feedback: 'Slack DMs are not BAA-covered for PHI.',
            },
            {
              id: 'b',
              label:
                'The patient-context channel in the support platform (BAA on file).',
              isCorrect: true,
              feedback: 'Right — BAA-covered, audited, scoped.',
            },
            {
              id: 'c',
              label: 'Personal SMS to the engineer.',
              isCorrect: false,
              feedback: 'Not even close.',
            },
            {
              id: 'd',
              label: 'Email without the healthcare-encrypted label.',
              isCorrect: false,
              feedback: 'Unencrypted email is not in-policy for PHI.',
            },
          ],
        },
        {
          id: 'm3-q2',
          kind: 'multi_choice',
          prompt:
            "You're about to share your screen in a demo. Which checks should you do first? (pick all that apply)",
          rationale:
            'Closing PHI tabs, masking patient ID columns, hiding notifications, and announcing "anything sensitive on screen?" all reduce leak risk. "Sharing the entire desktop without checking" is the antipattern.',
          choices: [
            { id: 'a', label: 'Close any tabs showing PHI.', isCorrect: true },
            {
              id: 'b',
              label: 'Mask or blur patient identifier columns.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Disable Slack / email notifications during the share.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Share the whole desktop without checking what is open.',
              isCorrect: false,
              feedback: 'Maximum risk surface — the exact antipattern.',
            },
          ],
        },
        {
          id: 'm3-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            "You realise mid-screen-share that a tab with a patient's name and diagnosis is visible. Three customer prospects are on the call.",
          prompt: 'What do you do?',
          rationale:
            'Stop sharing immediately, acknowledge the exposure, and report it as a HIPAA-adjacent incident so the org can assess the disclosure. Pretending it did not happen is the worst response; the prospects already saw it and the audit trail is what protects you.',
          choices: [
            {
              id: 'a',
              label: 'Keep going and hope nobody noticed.',
              isCorrect: false,
              feedback: 'Hope is not a control.',
            },
            {
              id: 'b',
              label:
                'Stop sharing immediately, acknowledge it, report as a HIPAA-adjacent incident with the timeline.',
              isCorrect: true,
              feedback: 'Right — stop, disclose, document.',
            },
            {
              id: 'c',
              label: 'Quickly close the tab without saying anything.',
              isCorrect: false,
              feedback: 'Silent closure does not undo the disclosure.',
            },
            {
              id: 'd',
              label: 'Ask the prospects to forget what they saw.',
              isCorrect: false,
              feedback: 'Not how this works.',
            },
          ],
        },
      ],
    },

    {
      id: 'm4-workstation',
      title: 'Workstation + device safeguards',
      summary: 'The laptop that touches PHI has stricter rules.',
      body:
        'The HIPAA Security Rule has a whole section on workstation security. Any device that touches ePHI needs disk encryption, screen-lock, MDM, and tightly-managed software. Personal devices touching PHI are a category we avoid entirely — the policy bias is that PHI work happens on managed laptops only.\n\n' +
        'Three habits matter most on a PHI-touching laptop: screen-lock every time you step away (yes, even in your home office), keep ePHI out of local downloads / desktop / personal cloud sync, and report a lost or stolen device within the hour so MDM can remote-wipe.\n\n' +
        'BYOD with PHI is essentially never approved. Even temporary BYOD for an emergency requires explicit security signoff and a documented exception. The audit consequence of an unmanaged device touching PHI is severe.',
      bullets: [
        'PHI work happens on managed laptops only.',
        'Screen-lock every single time — even at home.',
        'No local downloads / desktop / personal cloud sync of PHI.',
        'Lost / stolen device with PHI = page #security within the hour.',
        'BYOD with PHI is essentially never approved.',
      ],
      questions: [
        {
          id: 'm4-q1',
          kind: 'single_choice',
          prompt:
            'You have to debug a PHI issue urgently and your work laptop is at the office. Your personal laptop is right here. What is the right move?',
          rationale:
            'BYOD for PHI is essentially never approved. The in-policy options are: wait until you can use the managed laptop, get a teammate with a managed laptop to help, or — only if the urgency truly requires it — get explicit security signoff for a documented one-time exception.',
          choices: [
            {
              id: 'a',
              label: 'Use the personal laptop "just this once".',
              isCorrect: false,
              feedback:
                'Unauthorised BYOD on PHI is a HIPAA-significant finding.',
            },
            {
              id: 'b',
              label:
                'Wait, hand off to a teammate with a managed laptop, OR get explicit security signoff for a documented exception.',
              isCorrect: true,
              feedback: 'Right — the in-policy options, in order.',
            },
            {
              id: 'c',
              label: 'Forward the PHI to your personal email.',
              isCorrect: false,
              feedback: 'Multiple violations in one move.',
            },
            {
              id: 'd',
              label: "Use your phone's personal browser.",
              isCorrect: false,
              feedback: 'Same BYOD problem.',
            },
          ],
        },
        {
          id: 'm4-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are required workstation safeguards on a PHI-touching laptop? (pick all that apply)',
          rationale:
            'Disk encryption, screen-lock-on-step-away, MDM, and patched OS / browser are all required. "Cool wallpaper" is not.',
          choices: [
            {
              id: 'a',
              label: 'Full-disk encryption enabled.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'Screen lock that auto-engages quickly when idle.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'MDM enrolled with remote-wipe capability.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Custom wallpaper.',
              isCorrect: false,
              feedback: 'Aesthetics are not a HIPAA control.',
            },
          ],
        },
        {
          id: 'm4-q3',
          kind: 'scenario',
          selectionMode: 'single',
          weight: 2,
          scenario:
            'You realise on the train that your work laptop — which has had PHI on it this morning — is no longer in your bag.',
          prompt: 'What is the right first action?',
          rationale:
            'A lost device with PHI starts a HIPAA breach-notification timer the moment you realise. The right move is to page #security right now so MDM can remote-lock + wipe, and so the incident can be opened with timeline. Every minute matters here.',
          choices: [
            {
              id: 'a',
              label: 'Wait until you get home to look properly.',
              isCorrect: false,
              feedback:
                'Each minute delays the remote-wipe + the breach timer.',
            },
            {
              id: 'b',
              label:
                'Page #security right now so MDM can remote-lock + wipe and open the incident.',
              isCorrect: true,
              feedback: 'Right — fastest meaningful action.',
            },
            {
              id: 'c',
              label: 'Tell your manager only.',
              isCorrect: false,
              feedback: 'Manager too, but security must be in the loop now.',
            },
            {
              id: 'd',
              label: 'Buy a new laptop.',
              isCorrect: false,
              feedback: 'Sidesteps every control.',
            },
          ],
        },
      ],
    },

    {
      id: 'm5-baa',
      title: 'BAA awareness',
      summary: 'When our customers are covered entities, and what changes.',
      body:
        'A Business Associate Agreement (BAA) is the contract that makes us a "Business Associate" under HIPAA when a customer is a Covered Entity (typically a healthcare provider, health plan, or clearinghouse). Without a BAA, we cannot legally process their PHI; with one, we take on direct HIPAA obligations including breach notification.\n\n' +
        'For you in day-to-day work: check whether a customer is BAA-covered before you treat their data as PHI. If yes, every interaction with their data follows the PHI rules in this course. If no but health-adjacent, escalate to legal — the answer is rarely "we can paste it anywhere".\n\n' +
        'Our sub-processors (cloud providers, support tools, analytics) that touch PHI must each have BAAs with us. When a new AI vendor or SaaS is proposed for healthcare data, "do they have a BAA?" is one of the first three questions. If they cannot offer one, the path is closed.',
      bullets: [
        'BAA = the contract that puts us under HIPAA as a Business Associate.',
        'Check customer BAA status before treating their data as PHI.',
        'Sub-processors touching PHI need BAAs too.',
        '"No BAA" from a vendor = path closed for healthcare workloads.',
        'When in doubt about BAA scope, legal owns the question.',
      ],
      questions: [
        {
          id: 'm5-q1',
          kind: 'single_choice',
          prompt:
            "A new healthcare customer onboards. Engineering is asked to build a custom integration with the customer's EMR.",
          rationale:
            'Confirm the BAA is signed before any production data flows. Building the integration without the BAA in place — even in a staging environment that uses real PHI for testing — is a HIPAA violation. The BAA gates the work.',
          choices: [
            {
              id: 'a',
              label: 'Start coding immediately; BAA can come later.',
              isCorrect: false,
              feedback:
                'Building with real PHI before the BAA is a HIPAA violation.',
            },
            {
              id: 'b',
              label:
                'Confirm the BAA is signed before any production / real-PHI work begins; use synthetic data until then.',
              isCorrect: true,
              feedback:
                'Right — BAA gates production work; synthetic data unblocks the build.',
            },
            {
              id: 'c',
              label: 'Use real PHI in staging "to be realistic".',
              isCorrect: false,
              feedback:
                'Same violation as production; staging is in scope too.',
            },
            {
              id: 'd',
              label: 'Refuse to engage until legal sends a memo.',
              isCorrect: false,
              feedback:
                'Synthetic data lets the work start; do not block the customer.',
            },
          ],
        },
        {
          id: 'm5-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are HIPAA-relevant questions to ask before onboarding a new vendor for a healthcare workload? (pick all that apply)',
          rationale:
            'BAA availability, security controls (encryption, audit logs, access management), HIPAA-adjacent certifications (HITRUST, SOC 2 with HIPAA mapping), and breach-notification commitments are all standard. "Office snacks" are not.',
          choices: [
            { id: 'a', label: 'Will they sign a BAA?', isCorrect: true },
            {
              id: 'b',
              label: 'Encryption at rest + in transit + audit logging?',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'HITRUST / SOC 2 + HIPAA mapping?',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'What kind of snacks does their office serve?',
              isCorrect: false,
              feedback: 'Not relevant.',
            },
          ],
        },
        {
          id: 'm5-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A teammate proposes using a popular AI vendor for a new healthcare feature. The vendor explicitly states they will NOT offer BAAs.',
          prompt: 'What is the right path?',
          rationale:
            'No BAA = no PHI processing. The path is closed for that vendor on healthcare workloads. Either find a different vendor that will BAA, or design the feature so it does not touch PHI at all. There is no shortcut around BAA on a covered workload.',
          choices: [
            {
              id: 'a',
              label: 'Use the vendor anyway with "anonymised" PHI.',
              isCorrect: false,
              feedback: 'Re-identification risk plus no BAA = violation.',
            },
            {
              id: 'b',
              label:
                'Find a different BAA-willing vendor OR redesign the feature so it never touches PHI.',
              isCorrect: true,
              feedback: 'Right — no shortcut around BAA on a covered workload.',
            },
            {
              id: 'c',
              label: 'Use the vendor and hope they sign a BAA later.',
              isCorrect: false,
              feedback: 'Hope is not a contract.',
            },
            {
              id: 'd',
              label:
                'Use the vendor for non-PHI parts only without segmentation.',
              isCorrect: false,
              feedback: 'Without enforced segmentation, PHI leaks.',
            },
          ],
        },
      ],
    },

    {
      id: 'm6-breach-notification',
      title: 'Breach notification timing + content',
      summary:
        'The clock starts when you discover it, not when you confirm it.',
      body:
        'When PHI is exposed without authorisation, HIPAA requires us (as a Business Associate) to notify the affected Covered Entity within a contractually-defined timeline — typically much faster than the 60-day outer limit in the Breach Notification Rule. Customer contracts often shorten this to 24 or 48 hours.\n\n' +
        'The clock starts on discovery, not on confirmation. Waiting "to be sure it was really a breach" before notifying is a common cause of contractual breach. The right pattern: open the incident as soon as you discover it, notify the customer per the contractual timeline even if facts are still emerging, and then keep updating as you investigate.\n\n' +
        'The notification content must include the nature of the exposure, the data involved, who was affected, what we are doing to mitigate, and what the customer or affected individuals should do. Our incident template covers all of this — fill it out, do not improvise.',
      bullets: [
        'Clock starts on discovery, not on confirmation.',
        'Customer-contract timelines (often 24h) override the 60-day default.',
        'Notify even with incomplete facts; update as you learn more.',
        'Use the incident template — do not improvise the notification.',
        'BA → CE notification triggers CE → individual notification.',
      ],
      questions: [
        {
          id: 'm6-q1',
          kind: 'single_choice',
          prompt:
            'You discover a potential PHI exposure at 4pm Friday. The contractual notification window is 24 hours. When do you notify the customer?',
          rationale:
            'The clock started at 4pm Friday on discovery. Waiting until Monday is a contractual breach even if the eventual investigation shows no real exposure. Notify within 24 hours with the facts you have; update as you learn more.',
          choices: [
            {
              id: 'a',
              label: 'Monday morning when everyone is back.',
              isCorrect: false,
              feedback:
                'Contractual breach. Clock does not pause for weekends.',
            },
            {
              id: 'b',
              label:
                'Within 24 hours of discovery — with the facts you have, updating as you learn more.',
              isCorrect: true,
              feedback:
                'Right — discovery starts the clock; honesty about uncertainty is fine.',
            },
            {
              id: 'c',
              label:
                'After we fully investigate and are 100% sure it was a breach.',
              isCorrect: false,
              feedback:
                '"Wait to be sure" is the textbook contractual-breach pattern.',
            },
            {
              id: 'd',
              label: 'Only if it turns out to be a real breach.',
              isCorrect: false,
              feedback: 'Same problem; the clock has already started.',
            },
          ],
        },
        {
          id: 'm6-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these belong in a BAA breach notification to a customer? (pick all that apply)',
          rationale:
            'Nature of the exposure, data involved, affected individuals (best estimate), mitigation actions, recommended customer steps, and our contact for follow-up are standard. "Apologies in casual tone" is not professional notification content.',
          choices: [
            {
              id: 'a',
              label: 'Nature and extent of the exposure.',
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'Type of PHI involved and number of affected individuals (best estimate).',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Mitigation steps taken and recommended customer actions.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'A casual apology with no specifics.',
              isCorrect: false,
              feedback:
                'Casual tone without specifics is unprofessional and contractually insufficient.',
            },
          ],
        },
        {
          id: 'm6-q3',
          kind: 'scenario',
          selectionMode: 'single',
          weight: 2,
          scenario:
            'You discover a misconfigured S3 bucket may have allowed a small amount of PHI to be world-readable for 6 hours overnight. You have no evidence anyone actually accessed it.',
          prompt: 'Do you have to notify?',
          rationale:
            'Under HIPAA, unauthorised exposure is presumed to be a breach unless you can demonstrate a low probability that the PHI was compromised (the four-factor risk assessment). The default is notify. Documenting the risk-assessment outcome is essential whether or not it results in notification.',
          choices: [
            {
              id: 'a',
              label: 'No — nobody actually accessed it.',
              isCorrect: false,
              feedback:
                'HIPAA presumes breach unless the four-factor risk assessment shows low probability.',
            },
            {
              id: 'b',
              label:
                'Run the four-factor risk assessment and document it; default is to notify unless low-probability of compromise is demonstrated.',
              isCorrect: true,
              feedback: 'Right — risk assessment + documented decision.',
            },
            {
              id: 'c',
              label: 'Delete the logs and pretend it never happened.',
              isCorrect: false,
              feedback: 'Destroying evidence is a separate, worse violation.',
            },
            {
              id: 'd',
              label: 'Wait a year and see if anyone complains.',
              isCorrect: false,
              feedback: 'Not a strategy.',
            },
          ],
        },
      ],
    },

    {
      id: 'm7-retention-logs',
      title: 'Retention + log discipline',
      summary: 'Keep what HIPAA requires; do not keep what it does not.',
      body:
        'HIPAA requires us to retain certain documentation (policies, risk assessments, training records, audit logs) for at least six years. At the same time, we should not keep ePHI itself longer than needed for the purpose it was collected. The two principles work together: hold the audit trail, not the raw data.\n\n' +
        'Audit logs of PHI access are a Security Rule requirement. Every read and modification of PHI in our systems is logged with who, what, when, and from where. Tampering with logs — or building a "logs-off" mode for debugging — is a finding even if you never use it.\n\n' +
        'When a customer asks us to delete PHI (right of access, end of contract), we follow the documented deletion runbook: confirm scope, execute deletion, verify in backups, document completion. "Deleted" must mean deleted everywhere, not just in the primary table.',
      bullets: [
        'Documentation retention: 6+ years for policies, risk assessments, training, logs.',
        'ePHI retention: only as long as needed for the purpose.',
        'Every PHI access is audit-logged — no "logs-off" mode.',
        'Customer deletion request → documented runbook → verify in backups.',
        'Deletion means everywhere, not just primary.',
      ],
      questions: [
        {
          id: 'm7-q1',
          kind: 'single_choice',
          prompt:
            'A teammate suggests adding a "verbose-but-no-PHI-logged" debug mode so engineers can troubleshoot without writing to the audit log.',
          rationale:
            'Audit logs of PHI access are a Security Rule requirement. Building a path that bypasses them is a finding even if used rarely or never. The right approach is to make the logs richer and faster to query so engineers do not need to bypass them.',
          choices: [
            {
              id: 'a',
              label: 'Great idea; engineering speed matters.',
              isCorrect: false,
              feedback: 'Bypassing audit logs is itself a finding.',
            },
            {
              id: 'b',
              label:
                'No — audit logging is a Security Rule requirement; improve the log query experience instead.',
              isCorrect: true,
              feedback: 'Right — never bypass; improve.',
            },
            {
              id: 'c',
              label: 'Maybe just for senior engineers.',
              isCorrect: false,
              feedback: 'Role-based bypass is still bypass.',
            },
            {
              id: 'd',
              label: 'Add it only in staging.',
              isCorrect: false,
              feedback: 'Staging is in scope when it touches real PHI.',
            },
          ],
        },
        {
          id: 'm7-q2',
          kind: 'multi_choice',
          prompt:
            'A customer requests deletion of all PHI we hold about a specific patient (right of access / contract end). Which of these are required? (pick all that apply)',
          rationale:
            'Confirming scope, executing in primary + replicas + backups (or documenting why backups are exempt), verifying deletion, and documenting completion are all standard. "Deleting from the primary table only and calling it done" leaves data in backups and is incomplete.',
          choices: [
            {
              id: 'a',
              label: 'Confirm exact scope of "all PHI" with the customer.',
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'Execute deletion in primary AND replicas AND backups (or document the backup exception).',
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'Verify deletion happened and record completion in the incident / request log.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Delete from primary only; ignore backups.',
              isCorrect: false,
              feedback: 'Incomplete deletion is non-compliance.',
            },
          ],
        },
        {
          id: 'm7-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'An old debug bucket from 2 years ago is found in S3 containing PHI fragments from a debug session that should have been deleted.',
          prompt: 'What is the right response?',
          rationale:
            'Open an incident, assess whether this constitutes a breach (the four-factor assessment), delete the data with documented runbook, and add a control to prevent debug-PHI fragments from being orphaned in the future. Quietly deleting without the incident is the wrong cadence.',
          choices: [
            {
              id: 'a',
              label: 'Quietly delete and move on.',
              isCorrect: false,
              feedback:
                'Quiet handling skips the breach assessment and the control improvement.',
            },
            {
              id: 'b',
              label:
                'Open an incident, run the breach assessment, delete with documented runbook, add control to prevent recurrence.',
              isCorrect: true,
              feedback: 'Right — incident + assessment + delete + prevent.',
            },
            {
              id: 'c',
              label: 'Leave it for the next person.',
              isCorrect: false,
              feedback: 'Inheritance of risk is not a strategy.',
            },
            {
              id: 'd',
              label: 'Add it to your private archive.',
              isCorrect: false,
              feedback: 'Multiple violations.',
            },
          ],
        },
      ],
    },

    {
      id: 'm8-ocr-enforcement',
      title: 'OCR enforcement realities — your role',
      summary: 'Real penalties happen — and the patterns are predictable.',
      body:
        'The HHS Office for Civil Rights (OCR) enforces HIPAA. Their public resolution agreements are the best reading material for understanding which patterns get penalised. The recurring themes: unencrypted laptops with PHI, broad-access roles that ignored minimum-necessary, missed breach-notification timelines, and inadequate risk analysis.\n\n' +
        'Penalties run from $100 per violation (small inadvertent) to $1.9M per violation type per year (wilful neglect, uncorrected). Settlements with multi-million-dollar Resolution Agreements are routine. The penalties are paid by the organisation, not by individuals — but careers end over them.\n\n' +
        'Your role: recognise the pattern in yourself or your team when you see it ("just this once", "we can fix the docs later", "the risk assessment is overdue"), and report it before it becomes the OCR press release. The cleanup cost is always smaller than the enforcement cost.',
      bullets: [
        'OCR resolution agreements show the patterns — predictable, preventable.',
        'Top patterns: unencrypted laptops, broad access, late notification, missing risk analysis.',
        'Penalties paid by org; careers ended over them.',
        '"Just this once" / "fix the docs later" = OCR press release in waiting.',
        'Report the pattern early; cleanup is always cheaper than enforcement.',
      ],
      questions: [
        {
          id: 'm8-q1',
          kind: 'single_choice',
          prompt:
            'Which of these patterns is MOST frequently called out in OCR resolution agreements?',
          rationale:
            'Unencrypted laptops with PHI and broad-access roles are the two patterns OCR cites most often in publicly-resolved enforcement actions. Both are preventable; both are catastrophic when they occur. Audit-log query speed is operational, not enforcement-relevant.',
          choices: [
            {
              id: 'a',
              label: 'The colour of the UI in the EMR.',
              isCorrect: false,
              feedback: 'Irrelevant.',
            },
            {
              id: 'b',
              label: 'Unencrypted laptops with PHI on them, lost or stolen.',
              isCorrect: true,
              feedback:
                'Right — top of the resolution-agreement list for a decade.',
            },
            {
              id: 'c',
              label: 'Slow audit-log query response.',
              isCorrect: false,
              feedback: 'Operational concern, not an OCR finding pattern.',
            },
            {
              id: 'd',
              label: 'Too many monitoring dashboards.',
              isCorrect: false,
              feedback: 'Not a thing.',
            },
          ],
        },
        {
          id: 'm8-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these reduce OCR enforcement risk for us? (pick all that apply)',
          rationale:
            'Encrypted-by-default devices, narrow access scopes, on-time risk analyses, and prompt breach notification all reduce enforcement risk. "Avoiding documentation so there is nothing to find" is the opposite of risk reduction.',
          choices: [
            {
              id: 'a',
              label: 'Encryption-by-default on every PHI-touching device.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'Narrow access scopes + minimum-necessary discipline.',
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'On-time annual risk analysis with documented action items.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Avoiding documentation so there is nothing to discover.',
              isCorrect: false,
              feedback: 'Lack of documentation is itself a finding.',
            },
          ],
        },
        {
          id: 'm8-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A teammate confides that they intentionally skipped the past two quarters of HIPAA risk analysis "because there is nothing new to find".',
          prompt: 'What is the right response?',
          rationale:
            'Skipping documented risk analysis is exactly the "wilful neglect" pattern OCR penalises most heavily. The right move is to encourage them to resume the cadence immediately, document the gap as a known finding, and remediate before any audit cycle. Silence here is complicity.',
          choices: [
            {
              id: 'a',
              label: 'Stay quiet — it is their call.',
              isCorrect: false,
              feedback: 'Silence is complicity here.',
            },
            {
              id: 'b',
              label:
                'Encourage them to resume the cadence now, document the gap as a known finding, remediate before any audit.',
              isCorrect: true,
              feedback: 'Right — resume, document, remediate.',
            },
            {
              id: 'c',
              label: 'Report them to OCR.',
              isCorrect: false,
              feedback:
                'Internal remediation comes first; external reporting is reserved for refusal-to-fix patterns.',
            },
            {
              id: 'd',
              label: 'Skip yours too.',
              isCorrect: false,
              feedback: 'Hard no.',
            },
          ],
        },
      ],
    },
  ],
};
