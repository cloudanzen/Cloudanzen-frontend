/**
 * NIST CSF Cyber Awareness — v2 (audit-grade).
 *
 * 8 modules, ~24 questions (~35 min). Warmer "colleague at CloudAnzen"
 * tone. Each question carries a rationale shown inline to the learner.
 *
 * BE answer keys live in cloudanzen-backend
 * `src/modules/onboarding/training-answer-keys.ts` keyed
 * `nist-csf-cyber-awareness@v2`. Keep both in lockstep.
 */
import type { CoursePack } from './types';

export const NIST_CSF_V2: CoursePack = {
  slug: 'nist-csf-cyber-awareness',
  version: 2,
  passThresholdPct: 80,
  estimatedMinutes: 35,
  modules: [
    {
      id: 'm1-govern',
      title: "Govern — your part in the org's posture",
      summary:
        'CSF 2.0 added Govern — and your daily decisions are part of it.',
      body:
        'NIST CSF 2.0 added a sixth function: Govern. It sits across the other five (Identify, Protect, Detect, Respond, Recover) and asks "is cybersecurity actually a managed business outcome here, or just an afterthought?". Govern covers leadership, risk appetite, roles, policies, and oversight — but in practice it lives in how every team operates.\n\n' +
        'You contribute to Govern every time you follow a documented control, escalate a risk, or write a decision down. You also contribute negatively every time you bypass one. Govern is the function auditors and customers most often use to differentiate "mature" from "checkbox" security programs.\n\n' +
        'The mental model: if a customer asked "who owns this risk?" right now, could you answer? If yes, Govern is working. If everyone points at someone else, Govern has a gap.',
      bullets: [
        'CSF 2.0 added Govern — sits across all five other functions.',
        'Govern lives in everyday decisions, not just leadership memos.',
        'Every documented owner, every escalation, every recorded decision = Govern evidence.',
        'Bypassing controls is a Govern signal too — the wrong direction.',
        '"Who owns this?" should have an answer.',
      ],
      questions: [
        {
          id: 'm1-q1',
          kind: 'single_choice',
          prompt: 'Which best describes the Govern function in NIST CSF 2.0?',
          rationale:
            'Govern is the function that ensures cybersecurity is managed as a business outcome — owners, policy, risk appetite, oversight. It cuts across the other five functions; without Govern, the others operate in isolation and audit findings stack up.',
          choices: [
            {
              id: 'a',
              label: 'A new function focused only on firewall rules.',
              isCorrect: false,
              feedback: 'Firewalls are Protect, not Govern.',
            },
            {
              id: 'b',
              label:
                'A cross-cutting function ensuring cybersecurity is managed as a business outcome (owners, policy, risk appetite, oversight).',
              isCorrect: true,
              feedback: 'Right — cross-cutting, business-outcome-oriented.',
            },
            {
              id: 'c',
              label: 'A reporting requirement for the CFO only.',
              isCorrect: false,
              feedback: 'Govern is for everyone, not just finance.',
            },
            {
              id: 'd',
              label: 'A legal compliance checklist that runs once a year.',
              isCorrect: false,
              feedback: 'Checklist-once-a-year is the opposite of Govern.',
            },
          ],
        },
        {
          id: 'm1-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are everyday actions that contribute to Govern? (pick all that apply)',
          rationale:
            'Writing down a decision in a durable doc, escalating a risk through the right channel, naming an owner on a risk, and following the documented control flow all contribute to Govern. "Ignoring a risk because it is not your team" is the antipattern.',
          choices: [
            {
              id: 'a',
              label: 'Writing decisions down in a durable doc, not just Slack.',
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'Escalating a risk through the documented channel even if it is awkward.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Naming an owner on a risk so accountability is clear.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: "Ignoring a risk because it is not your team's problem.",
              isCorrect: false,
              feedback: 'Ignoring risks is the antipattern.',
            },
          ],
        },
        {
          id: 'm1-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A teammate finds a security risk in another team\'s service and is not sure whether to raise it ("not my team").',
          prompt: 'What does Govern expect?',
          rationale:
            'Govern expects every teammate to raise risks they see, route them to the right owner, and ensure they enter the risk register. "Not my team" is exactly the gap Govern was added to close. Raising the risk is the right move.',
          choices: [
            {
              id: 'a',
              label: 'Stay quiet — it is not their team.',
              isCorrect: false,
              feedback: 'That is the Govern antipattern.',
            },
            {
              id: 'b',
              label:
                'Raise the risk, route to the right owner, ensure it enters the risk register.',
              isCorrect: true,
              feedback: 'Right — raise, route, register.',
            },
            {
              id: 'c',
              label: 'Fix the issue themselves without telling anyone.',
              isCorrect: false,
              feedback:
                "Unauthorised fix on another team's service breaks change discipline.",
            },
            {
              id: 'd',
              label: 'Post about it publicly on Twitter.',
              isCorrect: false,
              feedback: 'Internal channels first.',
            },
          ],
        },
      ],
    },

    {
      id: 'm2-identify',
      title: 'Identify — assets + data',
      summary: 'You cannot protect what you do not know about.',
      body:
        'Identify is the function that catalogues what we have — services, data, people, vendors, dependencies — so the other functions know what to protect. The output is the asset inventory, the data inventory, the dependency map, and the vendor list. Without these, every other function flies blind.\n\n' +
        'For builders, the practical translation is: when you spin up a new service, add it to the inventory the same day. When you start handling a new data type, add it to the data inventory and classify it. When you bring on a new vendor that touches our data, add them to the vendor list with a data-flow note.\n\n' +
        'The single biggest source of shadow IT and shadow data is "I will add it to the inventory later". Later rarely comes. Make the registration step part of the spin-up checklist; some teams refuse to point DNS at a service that isn\'t in the asset inventory.',
      bullets: [
        'New service / data / vendor → inventory entry on day one.',
        'Shadow IT starts with "I\'ll add it later".',
        'Data classification + ownership is part of the data inventory.',
        'Dependency maps prevent surprise blast radius.',
        'No service should run without a named owner.',
      ],
      questions: [
        {
          id: 'm2-q1',
          kind: 'single_choice',
          prompt:
            'You spin up a new internal service to host a quick dashboard. When does it go into the asset inventory?',
          rationale:
            'Day-one registration prevents shadow IT. The cost of registering on spin-up is minutes; the cost of registering on day 90 (or never) is incidents and audit findings. Make the inventory entry part of the deploy checklist.',
          choices: [
            {
              id: 'a',
              label: 'Whenever you remember.',
              isCorrect: false,
              feedback: '"Whenever" usually means never.',
            },
            {
              id: 'b',
              label:
                'The same day you spin it up — part of the deploy checklist.',
              isCorrect: true,
              feedback: 'Right — day-one, part of the checklist.',
            },
            {
              id: 'c',
              label: 'Only if it gets popular.',
              isCorrect: false,
              feedback: 'Popularity is not the threshold; existence is.',
            },
            {
              id: 'd',
              label: 'Never — internal services are not in scope.',
              isCorrect: false,
              feedback: 'Internal services are in scope.',
            },
          ],
        },
        {
          id: 'm2-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these belong in the data inventory under Identify? (pick all that apply)',
          rationale:
            'Customer data, employee data, vendor data, and our own internal IP / business data all belong in the data inventory with classification and ownership. "Public marketing copy already on the website" is public-by-definition and does not need an inventory entry beyond the marketing system itself.',
          choices: [
            {
              id: 'a',
              label: 'Customer-facing transactional data.',
              isCorrect: true,
            },
            { id: 'b', label: 'Employee HR records.', isCorrect: true },
            {
              id: 'c',
              label: 'Internal financial / business data.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Marketing copy already published on the public website.',
              isCorrect: false,
              feedback:
                'Public-by-definition data does not need inventory tracking.',
            },
          ],
        },
        {
          id: 'm2-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'You discover a teammate has been running a "personal" Postgres on a spare EC2 box for 6 months, storing test data they thought was synthetic but actually contains real customer email addresses.',
          prompt: 'What happens now?',
          rationale:
            'Open an incident (real customer data in an un-inventoried, unmanaged location is exactly that), bring the data into compliance (move to an approved system or delete), and add the EC2 box to the asset inventory or decommission it. Quietly killing the box without the incident skips the data-handling assessment.',
          choices: [
            {
              id: 'a',
              label:
                'Tell the teammate to delete it; nobody else needs to know.',
              isCorrect: false,
              feedback: 'Quiet handling skips the data-exposure assessment.',
            },
            {
              id: 'b',
              label:
                'Open an incident, assess data exposure, move data to approved system or delete, inventory the box or decommission.',
              isCorrect: true,
              feedback: 'Right — incident + assess + remediate + inventory.',
            },
            {
              id: 'c',
              label:
                'Leave it; it has been running for 6 months without issue.',
              isCorrect: false,
              feedback: 'Six months of unknown is six months of unknown.',
            },
            {
              id: 'd',
              label: 'Add it to the asset inventory without any other action.',
              isCorrect: false,
              feedback:
                'Inventory entry without addressing the data exposure misses the actual issue.',
            },
          ],
        },
      ],
    },

    {
      id: 'm3-protect',
      title: 'Protect — access + awareness + data security',
      summary: 'The function with the most concrete day-to-day actions.',
      body:
        'Protect is where most of our day-to-day controls live: identity (MFA, least privilege), data security (encryption, classification handling), awareness training (this course), platform protections (managed laptops, patched OS), and resilience (backups). It is the busiest function and the one auditors sample most aggressively.\n\n' +
        'The mental model: Protect is "make exploitation hard". Even if Detect and Respond do their jobs perfectly, a weak Protect posture means we get hit more often. Strong Protect compounds: fewer incidents to detect, respond to, and recover from.\n\n' +
        "Your part: follow the controls when they're inconvenient. The MFA prompt at 9am is friction; the MFA prompt at 2am is what prevents the breach. The screen-lock when you grab coffee is a habit you build until it's reflex.",
      bullets: [
        'Protect = make exploitation hard.',
        'MFA + least privilege + classification + patching + backups.',
        'Strong Protect reduces load on every other function.',
        'Follow controls when they are inconvenient — that is when they matter.',
        'Screen-lock + MFA are reflexes, not decisions.',
      ],
      questions: [
        {
          id: 'm3-q1',
          kind: 'single_choice',
          prompt:
            'You get a friction-y MFA prompt while logged into Okta from a known device at 9am. What is the right reaction?',
          rationale:
            'Approve the prompt if you initiated the action. The friction is the control. Disabling or muting MFA prompts is the antipattern; the prompt at 9am from your known device is exactly the same prompt that prevents the 2am attack.',
          choices: [
            {
              id: 'a',
              label: 'Approve the prompt; the friction is the point.',
              isCorrect: true,
              feedback: 'Right — the prompt at 9am is what saves you at 2am.',
            },
            {
              id: 'b',
              label: 'Complain to IT and request MFA be disabled for you.',
              isCorrect: false,
              feedback: 'MFA disable is not on the menu.',
            },
            {
              id: 'c',
              label: 'Approve all prompts always, including unexpected ones.',
              isCorrect: false,
              feedback: '"Approve always" is the MFA-fatigue attack pattern.',
            },
            {
              id: 'd',
              label: 'Ignore the prompt.',
              isCorrect: false,
              feedback: 'Ignoring leaves you in a stuck state.',
            },
          ],
        },
        {
          id: 'm3-q2',
          kind: 'multi_choice',
          prompt: 'Which of these belong under Protect? (pick all that apply)',
          rationale:
            'MFA, least-privilege access, encryption at rest + in transit, patched OS, and the awareness training you are taking right now are all Protect activities. "Reviewing logs to look for attackers" is Detect, not Protect.',
          choices: [
            { id: 'a', label: 'MFA on every account.', isCorrect: true },
            {
              id: 'b',
              label: 'Least-privilege access scopes.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Encryption at rest and in transit.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Reviewing SIEM logs to look for active attackers.',
              isCorrect: false,
              feedback: 'That is Detect, not Protect.',
            },
          ],
        },
        {
          id: 'm3-q3',
          kind: 'scenario',
          selectionMode: 'single',
          weight: 2,
          scenario:
            'A teammate proposes "just for this sprint" disabling MFA on a test account because the rotation is slowing down their work.',
          prompt: 'What is the right response?',
          rationale:
            'Disabling MFA on any account — test or otherwise — is the wrong fix. The right path is to fix the rotation (hardware key, password-manager-integrated TOTP) so the friction drops without removing the control. "Just this sprint" is how MFA stays off for months.',
          choices: [
            {
              id: 'a',
              label: 'Sure, just for the sprint.',
              isCorrect: false,
              feedback: '"Just for the sprint" is how MFA stays off forever.',
            },
            {
              id: 'b',
              label:
                'No — fix the rotation friction (hardware key, integrated TOTP) so the control stays on.',
              isCorrect: true,
              feedback: 'Right — fix friction, keep control.',
            },
            {
              id: 'c',
              label: 'Disable MFA on all accounts to be consistent.',
              isCorrect: false,
              feedback: 'No.',
            },
            {
              id: 'd',
              label: 'Ignore the request.',
              isCorrect: false,
              feedback: 'Engage and offer the supported path.',
            },
          ],
        },
      ],
    },

    {
      id: 'm4-detect',
      title: 'Detect — monitoring + reporting',
      summary: 'People are part of detection too.',
      body:
        'Detect is the function that spots when something is wrong — alerts, anomaly detection, threat intel, and human reports. The tools-and-dashboards side gets the budget; the people-as-sensors side gets the breaches. A teammate noticing a weird DM, a strange MFA prompt, or a file behaving oddly is often the first detection.\n\n' +
        'Our SIEM and monitoring stack are the technical side: they fire alerts that on-call ack and triage. The human side is your job: report anything that smells wrong via the documented channel (Slack #security, "Report Phishing" button, on-call page). False positives are FREE; missed real signals are expensive.\n\n' +
        'The right reporting threshold: lower than you think. "It might just be a misclick" is the exact thing that turns into a 6-month dwelling adversary if it was actually the first probe. Report; let security triage decide.',
      bullets: [
        'Detect = SIEM + alerts + human reports.',
        'People-as-sensors catches what tools miss.',
        'Reporting threshold: lower than you think.',
        'False positives are free; missed signals are expensive.',
        'Triage decides what is real — your job is to report.',
      ],
      questions: [
        {
          id: 'm4-q1',
          kind: 'single_choice',
          prompt:
            'You notice your laptop fan spinning hard for hours overnight with no obvious cause. What is the right action under Detect?',
          rationale:
            'Report it via the security channel for triage. Unexplained CPU usage is one of the classic signs of malware (cryptominer, beacon). It might be nothing; the cost of reporting is small and the cost of missing it is large.',
          choices: [
            {
              id: 'a',
              label: 'Ignore it; laptops do this sometimes.',
              isCorrect: false,
              feedback: 'Unexplained CPU is a classic detection signal.',
            },
            {
              id: 'b',
              label: 'Report it via #security for triage.',
              isCorrect: true,
              feedback: 'Right — report, let triage decide.',
            },
            {
              id: 'c',
              label: 'Run a free antivirus from a Google search.',
              isCorrect: false,
              feedback: 'Random downloads make any malware worse.',
            },
            {
              id: 'd',
              label: 'Reboot and forget about it.',
              isCorrect: false,
              feedback: 'Rebooting masks the signal.',
            },
          ],
        },
        {
          id: 'm4-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are detection signals worth reporting? (pick all that apply)',
          rationale:
            'Unprompted MFA, unexpected admin emails, files behaving oddly, and Slack DMs from your "CEO" asking unusual things are all worth reporting. Your laptop being slow during a Zoom call usually is not.',
          choices: [
            {
              id: 'a',
              label: 'An MFA prompt you did not initiate.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'An email from "admin" asking you to reset a password.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'A Slack DM from "the CEO" asking for something unusual.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Your laptop is slow during a 50-person Zoom call.',
              isCorrect: false,
              feedback: 'Performance during Zoom is usually Zoom.',
            },
          ],
        },
        {
          id: 'm4-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A teammate reports they "might have clicked a phishing link" but they are not sure if the page actually loaded.',
          prompt: 'What is the right Detect / Respond pattern?',
          rationale:
            'Triage the report fast: pull the URL, check the audit logs for credential entry, isolate the device if needed, advise the teammate on next steps. Do not punish the report — that incentivises silence next time, which is the worst outcome for Detect.',
          choices: [
            {
              id: 'a',
              label: 'Punish the teammate for clicking.',
              isCorrect: false,
              feedback: 'Punishing reports kills future reports.',
            },
            {
              id: 'b',
              label:
                'Triage the report fast: check the URL, check credential audit logs, isolate device if needed, advise the teammate.',
              isCorrect: true,
              feedback: 'Right — triage fast, no punishment, useful follow-up.',
            },
            {
              id: 'c',
              label: 'Tell them to forget about it.',
              isCorrect: false,
              feedback: '"Forget about it" misses the actual detection.',
            },
            {
              id: 'd',
              label: 'Wipe their laptop without checking first.',
              isCorrect: false,
              feedback: 'Wipe-first destroys evidence.',
            },
          ],
        },
      ],
    },

    {
      id: 'm5-respond',
      title: 'Respond — runbook + comms',
      summary: 'When something bad happens, the runbook is the difference.',
      body:
        'Respond is what happens after detection — containment, eradication, communication, and decision-making under pressure. The runbook (incident response plan) is the brain you wish you had at 3am: it tells you who to call, what to disable first, what to preserve, and how to communicate.\n\n' +
        'For non-on-call teammates, the most important Respond skill is "do not improvise". If you discover something concerning, page the on-call and let them drive the response. Trying to fix it yourself usually destroys evidence and makes the postmortem harder.\n\n' +
        'Communication discipline matters too. During an incident, status updates go to the incident channel (not DMs), customer comms go through the support / status-page path (not personal channels), and decisions get recorded in the incident doc as they happen — not reconstructed from memory afterwards.',
      bullets: [
        'Runbook is the brain you wish you had at 3am.',
        'Non-on-call: do not improvise; page on-call.',
        'Status updates → incident channel, not DMs.',
        'Customer comms → support / status page, not personal channels.',
        'Decisions recorded as they happen, not reconstructed later.',
      ],
      questions: [
        {
          id: 'm5-q1',
          kind: 'single_choice',
          prompt:
            "You discover a likely active security incident at 11pm. You're not on-call. What is the right first move?",
          rationale:
            'Page the on-call. They have the runbook, the authority, and the access. Trying to fix it yourself, no matter how good your intent, usually destroys forensic evidence and complicates the response. Your job is the page; their job is the response.',
          choices: [
            {
              id: 'a',
              label: 'Try to fix it yourself; you know the code.',
              isCorrect: false,
              feedback:
                'Improvising on a live incident is the most common cause of evidence loss.',
            },
            {
              id: 'b',
              label: 'Page the on-call; they have the runbook and authority.',
              isCorrect: true,
              feedback: 'Right — page, do not improvise.',
            },
            {
              id: 'c',
              label: 'Wait until morning to mention it.',
              isCorrect: false,
              feedback: '11pm + active = page now.',
            },
            {
              id: 'd',
              label: 'Post about it on Twitter to crowdsource.',
              isCorrect: false,
              feedback: 'No.',
            },
          ],
        },
        {
          id: 'm5-q2',
          kind: 'ranking',
          weight: 2,
          prompt:
            'Rank these Respond actions for a live customer-impacting incident from FIRST to LAST.',
          rationale:
            'Page on-call to contain → open the incident channel + record → communicate to customers per status page → postmortem after recovery. Communication and postmortem come after containment; postmortem comes last.',
          choices: [
            {
              id: 'a',
              label: 'Page on-call to contain the impact.',
              rankOrder: 1,
            },
            {
              id: 'b',
              label:
                'Open the incident channel and start recording decisions in the incident doc.',
              rankOrder: 2,
            },
            {
              id: 'c',
              label:
                'Update customers via the status page per the comms playbook.',
              rankOrder: 3,
            },
            {
              id: 'd',
              label: 'Schedule the postmortem after recovery.',
              rankOrder: 4,
            },
          ],
        },
        {
          id: 'm5-q3',
          kind: 'multi_choice',
          prompt:
            'Which of these are in-policy during incident response? (pick all that apply)',
          rationale:
            'Status updates in the incident channel, decisions in the incident doc, customer comms through the status page, and preserving forensic artefacts before remediation are all in-policy. DMing customers from your personal account is the antipattern.',
          choices: [
            {
              id: 'a',
              label: 'Posting status updates in the incident channel.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'Recording decisions in the incident doc as they happen.',
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'Preserving forensic artefacts before remediation when possible.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'DMing affected customers from your personal email.',
              isCorrect: false,
              feedback: 'Customer comms go through the official channel.',
            },
          ],
        },
      ],
    },

    {
      id: 'm6-recover',
      title: 'Recover — backups + lessons learned',
      summary: 'Backups you have never restored are wishes, not backups.',
      body:
        'Recover is the function that gets us back to normal after an incident. The headline activity is backup + restore, but the function also covers reputation recovery, lessons-learned, and process improvements that prevent recurrence. A backup you have never actually restored is a wish, not a backup.\n\n' +
        'Our backup strategy includes periodic restore drills — actually pulling data out of the backup into a staging environment and checking it parses correctly. The drill IS the control; nobody is "too busy" for it. Auditors will ask for evidence of the last drill, who ran it, and what the outcome was.\n\n' +
        'Lessons-learned is the other half of Recover. Every incident generates a postmortem with action items; the action items get tracked to completion. A postmortem without follow-through is paperwork, not Recover.',
      bullets: [
        'A backup never restored is a wish, not a backup.',
        'Restore drills are real controls — schedule, run, document.',
        'Postmortems generate action items; action items get tracked.',
        'Postmortem without follow-through = paperwork.',
        'Recover includes reputation + customer trust, not just systems.',
      ],
      questions: [
        {
          id: 'm6-q1',
          kind: 'single_choice',
          prompt:
            'When is the right time to discover that your backup format is unreadable?',
          rationale:
            'Discover it during a scheduled restore drill. Discovering it during a real incident is the worst possible time — the customers are waiting, the data is gone, and the backup turns out to be useless. The drill is the entire point.',
          choices: [
            {
              id: 'a',
              label: 'During the actual disaster.',
              isCorrect: false,
              feedback: 'The worst possible time.',
            },
            {
              id: 'b',
              label:
                'During a scheduled restore drill — that is what the drill is for.',
              isCorrect: true,
              feedback: 'Right — discover in the drill, not in the incident.',
            },
            {
              id: 'c',
              label: 'Never — it will always work.',
              isCorrect: false,
              feedback: '"It will always work" is famous last words.',
            },
            {
              id: 'd',
              label: 'When the auditor asks.',
              isCorrect: false,
              feedback:
                'The auditor asking is a sign you should have known sooner.',
            },
          ],
        },
        {
          id: 'm6-q2',
          kind: 'multi_choice',
          prompt: 'Which of these are part of Recover? (pick all that apply)',
          rationale:
            'Backup + restore, postmortem with action items, customer-trust comms, and the action-item tracking are all Recover. "Sales kickoff for next quarter" is unrelated to Recover.',
          choices: [
            { id: 'a', label: 'Backup + restore drills.', isCorrect: true },
            {
              id: 'b',
              label: 'Postmortem with tracked action items.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Customer-trust communications after an incident.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Sales kickoff for the next quarter.',
              isCorrect: false,
              feedback: 'Not Recover.',
            },
          ],
        },
        {
          id: 'm6-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A postmortem from 6 months ago has 8 action items, none of which have been completed. The team has had another incident in the same area.',
          prompt: 'What does this tell you?',
          rationale:
            'Postmortem-without-follow-through is the textbook Recover failure. The recurrence is the predictable consequence. The fix: revive the action items, get them into the right backlogs with owners and due dates, and close them. Also: figure out why the org let them rot.',
          choices: [
            {
              id: 'a',
              label: 'Nothing — postmortems are paperwork anyway.',
              isCorrect: false,
              feedback: 'That mindset is exactly the failure.',
            },
            {
              id: 'b',
              label:
                'Recover failed — revive the action items with owners + due dates, and address why the org let them rot.',
              isCorrect: true,
              feedback: 'Right — revive + own + close + investigate the rot.',
            },
            {
              id: 'c',
              label: 'Delete the old postmortem.',
              isCorrect: false,
              feedback: 'Deleting evidence is worse.',
            },
            {
              id: 'd',
              label: 'Write a new postmortem and ignore the old one.',
              isCorrect: false,
              feedback: 'The old action items still need to land.',
            },
          ],
        },
      ],
    },

    {
      id: 'm7-supply-chain',
      title: 'Supply-chain awareness',
      summary: 'Our supply chain is software, vendors, and people.',
      body:
        'Supply-chain risk used to mean container shipping; in software, it means the dependencies, vendors, and contractors in our stack. A compromise of any one of them can cascade to us and our customers. The CSF 2.0 update emphasised supply-chain risk as a category that cuts across Govern, Identify, Protect, and Respond.\n\n' +
        'The risks to be aware of: dependency-confusion attacks (a malicious package masquerades as ours), typosquatted package names, compromised maintainer accounts, and SaaS vendors with weak security that get breached and leak our data. Each requires a different control.\n\n' +
        'Your part: do not pull random dependencies without review, do not paste customer data into un-vetted SaaS, and if a vendor we depend on announces a breach, treat it as a real incident for us — not just news about them.',
      bullets: [
        'Supply chain = dependencies + vendors + contractors.',
        'Dependency-confusion + typosquats + compromised maintainers are real.',
        'Vendor breach = our incident, not just their news.',
        'No random dependencies; everything through vetted package management.',
        'No customer data in un-vetted SaaS.',
      ],
      questions: [
        {
          id: 'm7-q1',
          kind: 'single_choice',
          prompt:
            'You need a new library to parse a niche file format. You find one on a random GitHub with 3 stars. What is the right move?',
          rationale:
            'Random low-trust packages are the textbook supply-chain risk. Review the package (read the source, check maintainer trustworthiness, check for recent maintainer changes), pin a specific version, and run it through dependency scanning. "Just npm install it" is how you get compromised.',
          choices: [
            {
              id: 'a',
              label: 'npm install it and move on.',
              isCorrect: false,
              feedback:
                'Random low-trust packages are how supply-chain attacks land.',
            },
            {
              id: 'b',
              label:
                'Review the source, pin the version, run it through dependency scanning, document the choice.',
              isCorrect: true,
              feedback: 'Right — review, pin, scan, document.',
            },
            {
              id: 'c',
              label: 'Trust the GitHub badge.',
              isCorrect: false,
              feedback: 'Badges are not vetting.',
            },
            {
              id: 'd',
              label: 'Fork and rename it as ours without review.',
              isCorrect: false,
              feedback: 'Forking does not vet the code.',
            },
          ],
        },
        {
          id: 'm7-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these reduce supply-chain risk? (pick all that apply)',
          rationale:
            'Pinned versions + lockfiles, dependency-scanning in CI, vendor reviews, and not pasting customer data into un-vetted SaaS all reduce risk. "Always using the latest version of everything" is the opposite — it maximises exposure to fresh compromises.',
          choices: [
            {
              id: 'a',
              label: 'Pinned versions + lockfiles checked into the repo.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'Dependency-scanning gates in CI.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Vendor onboarding reviews before production use.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Always using "latest" of every dependency.',
              isCorrect: false,
              feedback:
                'Latest-everything maximises exposure to fresh compromises.',
            },
          ],
        },
        {
          id: 'm7-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A SaaS vendor we use to process some customer data announces a breach. Their statement says "no evidence of customer data exfiltration".',
          prompt: 'How do you respond?',
          rationale:
            'Treat it as our incident. Open it, assess what data of ours / our customers\' was potentially exposed, notify affected parties per contract, and update the vendor-risk record. "No evidence of exfiltration" is a vendor claim, not our assessment.',
          choices: [
            {
              id: 'a',
              label: 'Believe the vendor and move on.',
              isCorrect: false,
              feedback: 'Vendor claims are not our assessment.',
            },
            {
              id: 'b',
              label:
                'Open an incident, assess our exposure, notify affected parties per contract, update vendor-risk record.',
              isCorrect: true,
              feedback: 'Right — own the assessment.',
            },
            {
              id: 'c',
              label: 'Switch vendors without telling anyone.',
              isCorrect: false,
              feedback: 'Switching alone does not satisfy notification.',
            },
            {
              id: 'd',
              label: 'Wait for customers to ask.',
              isCorrect: false,
              feedback: 'Proactive comms is the policy.',
            },
          ],
        },
      ],
    },

    {
      id: 'm8-mapping',
      title: 'Mapping CSF to our daily work',
      summary: 'Putting the six functions together with real examples.',
      body:
        'The CSF works when the six functions reinforce each other. Identify gives us an inventory; Protect uses the inventory to know what to harden; Detect monitors the inventory; Respond uses the inventory to scope an incident; Recover restores items in the inventory; Govern ensures the whole loop has owners and oversight.\n\n' +
        'In practice this looks like: a teammate spins up a service (Identify: inventory entry), enables MFA + scoped IAM (Protect), connects it to the SIEM (Detect), documents the runbook (Respond), schedules a restore drill (Recover), and names an owner with a quarterly review (Govern). Six functions, ten minutes of upfront work.\n\n' +
        'The mapping is also useful when you are unsure what to do. "What CSF function does this belong to?" usually surfaces the answer. A missing detail in one function reveals where the program has gaps.',
      bullets: [
        'Six functions reinforce each other — gaps show up at the seams.',
        'Spin-up checklist = Identify + Protect + Detect + Respond + Recover + Govern.',
        '"Which function does this belong to?" is a useful triage question.',
        'A gap in one function exposes the others.',
        'You contribute to multiple functions every working day.',
      ],
      questions: [
        {
          id: 'm8-q1',
          kind: 'single_choice',
          prompt:
            "You add a new SaaS to your team's workflow. Which functions touch it on day one?",
          rationale:
            'A new SaaS triggers all six functions on day one: Identify (inventory + vendor list), Protect (MFA + scoped access), Detect (audit-log shipping), Respond (incident playbook updated), Recover (backup / off-boarding plan), Govern (named owner). The discipline of touching all six is what separates mature programs from checklists.',
          choices: [
            {
              id: 'a',
              label: 'Just Identify — add to the vendor list.',
              isCorrect: false,
              feedback:
                'Inventory alone leaves the other five functions blind.',
            },
            {
              id: 'b',
              label:
                'All six — Identify, Protect, Detect, Respond, Recover, Govern — together.',
              isCorrect: true,
              feedback: 'Right — all six functions on day one.',
            },
            {
              id: 'c',
              label: 'Only Protect — set up MFA.',
              isCorrect: false,
              feedback: 'Protect alone is incomplete.',
            },
            {
              id: 'd',
              label: 'None — SaaS adoption does not need CSF treatment.',
              isCorrect: false,
              feedback: 'New SaaS is exactly when the CSF matters.',
            },
          ],
        },
        {
          id: 'm8-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are signs the CSF is operating well in a team? (pick all that apply)',
          rationale:
            'Named owners on services, current inventories, recent restore drills, fresh postmortem action items, and routine awareness training are all signs of a healthy program. "We have never had an incident" is not — usually it means we have not detected one.',
          choices: [
            {
              id: 'a',
              label: 'Every service has a named owner + an inventory entry.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'Recent restore-drill evidence with a documented outcome.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Postmortem action items tracked to completion.',
              isCorrect: true,
            },
            {
              id: 'd',
              label:
                '"We have never had an incident" with no detection evidence.',
              isCorrect: false,
              feedback: 'Usually a Detect gap, not a Protect win.',
            },
          ],
        },
        {
          id: 'm8-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'You\'re asked to brief a new exec on "how we do security". They have 10 minutes and want concrete.',
          prompt: 'What is a good structure for the brief?',
          rationale:
            'Walk the six CSF functions with one concrete example each from this week. Concrete examples beat abstract program descriptions; the CSF structure shows you have a model, not just stories. Walking through real artefacts is what builds trust.',
          choices: [
            {
              id: 'a',
              label: 'Read out the security policy verbatim.',
              isCorrect: false,
              feedback: 'Policy is for reference; brief should be concrete.',
            },
            {
              id: 'b',
              label:
                'Walk the six CSF functions with one concrete example each from this week.',
              isCorrect: true,
              feedback: 'Right — structure + concrete examples.',
            },
            {
              id: 'c',
              label: 'Show the org chart.',
              isCorrect: false,
              feedback: 'Org chart is not how-we-do-security.',
            },
            {
              id: 'd',
              label: 'Send them the policy PDF and leave.',
              isCorrect: false,
              feedback: 'They asked for a brief.',
            },
          ],
        },
      ],
    },
  ],
};
