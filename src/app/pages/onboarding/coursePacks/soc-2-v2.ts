/**
 * SOC 2 Trust Awareness — v2 (audit-grade).
 *
 * 8 modules, ~24 questions (~35 min). Warmer "colleague at CloudAnzen"
 * tone. Each question carries a rationale shown inline to the learner.
 *
 * BE answer keys live in cloudanzen-backend
 * `src/modules/onboarding/training-answer-keys.ts` keyed
 * `soc-2-trust-awareness@v2`. Keep both in lockstep.
 */
import type { CoursePack } from './types';

export const SOC_2_V2: CoursePack = {
  slug: 'soc-2-trust-awareness',
  version: 2,
  passThresholdPct: 80,
  estimatedMinutes: 35,
  modules: [
    {
      id: 'm1-trust-services',
      title: 'Customer trust at CloudAnzen',
      summary: "What SOC 2 is, from a builder's perspective.",
      body:
        'SOC 2 is the audit report enterprise buyers ask for when they want independent confirmation that we operate the way we say we do. It is organised around five Trust Services Criteria (TSC): Security (mandatory), Availability, Confidentiality, Processing Integrity, and Privacy. CloudAnzen reports against Security, Availability, and Confidentiality today; Privacy and Processing Integrity are on the roadmap.\n\n' +
        'Unlike ISO 27001 (which certifies the management system), a SOC 2 audit is the auditor sampling your controls over a window (a "Type 1" is point-in-time; a "Type 2" is over 3–12 months). The auditor reads our control descriptions, then pulls real samples to confirm each one actually operated. Your day-to-day work is the evidence pool.\n\n' +
        'The mental model: every commitment we make to a customer in a contract or trust-center page eventually becomes a control in our SOC 2 description. The auditor checks the control. So the controls you follow on Monday morning are the report the customer reads next year.',
      bullets: [
        'SOC 2 covers Security (always) + selected Availability / Confidentiality / Processing Integrity / Privacy.',
        'Type 1 = point in time; Type 2 = a window. We aim for Type 2.',
        'Auditors sample controls — your real work is the sample pool.',
        'Customer commitments → controls → audit evidence; all one chain.',
        'No "audit binder" — continuous evidence is the entire game.',
      ],
      questions: [
        {
          id: 'm1-q1',
          kind: 'single_choice',
          prompt:
            'Which best describes the relationship between SOC 2 and your daily work at CloudAnzen?',
          rationale:
            'Your daily work IS the audit sample pool. The auditor reads the control description, then pulls real tickets, Slack threads, and dashboards to confirm the control operated. Polished narratives in the report mean nothing without operational evidence behind them.',
          choices: [
            {
              id: 'a',
              label:
                'SOC 2 is a separate compliance project the security team owns.',
              isCorrect: false,
              feedback:
                "Security coordinates, but every team's day-to-day work is the evidence pool.",
            },
            {
              id: 'b',
              label:
                'Your everyday tickets, approvals, and reviews become the audit evidence the auditor samples.',
              isCorrect: true,
              feedback: 'Exactly — daily discipline IS the audit.',
            },
            {
              id: 'c',
              label:
                'SOC 2 evidence is produced retroactively the week before the audit.',
              isCorrect: false,
              feedback:
                'Backfilled evidence is the most common reason audits fail. Continuous is the only working model.',
            },
            {
              id: 'd',
              label:
                'SOC 2 is for sales decks; engineering does not need to think about it.',
              isCorrect: false,
              feedback:
                'Engineering controls (change management, access reviews, monitoring) are the heart of the report.',
            },
          ],
        },
        {
          id: 'm1-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are Trust Services Criteria covered by SOC 2? (pick all that apply)',
          rationale:
            'Security, Availability, Confidentiality, Processing Integrity, and Privacy are the five TSC. Security is the only one always in scope; the other four are elective. "Profitability" and "Marketing performance" are not.',
          choices: [
            { id: 'a', label: 'Security', isCorrect: true },
            { id: 'b', label: 'Availability', isCorrect: true },
            { id: 'c', label: 'Confidentiality', isCorrect: true },
            {
              id: 'd',
              label: 'Profitability',
              isCorrect: false,
              feedback: 'Financial reporting is SOX territory, not SOC 2.',
            },
          ],
        },
        {
          id: 'm1-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'Sales asks if we can "throw together" a SOC 2 Type 2 report for a deal closing in two weeks.',
          prompt: 'What do you tell them?',
          rationale:
            'A SOC 2 Type 2 requires the controls to have operated over a window (typically 3–12 months). You cannot manufacture that window. The honest answer is to share interim artefacts (our Type 1, security questionnaire, pen-test summary) under NDA while the Type 2 audit completes its real cycle.',
          choices: [
            {
              id: 'a',
              label: 'Promise the Type 2 — close the deal first, audit later.',
              isCorrect: false,
              feedback:
                'Misrepresenting audit status to a prospect is exactly the wrong move.',
            },
            {
              id: 'b',
              label:
                'Explain the audit window requirement; offer interim evidence under NDA (Type 1, questionnaire, pen-test summary) and a target date for Type 2.',
              isCorrect: true,
              feedback:
                'Right — honest about timeline, helpful with interim evidence.',
            },
            {
              id: 'c',
              label: 'Refuse to engage with sales.',
              isCorrect: false,
              feedback: 'Engage and route to the honest path.',
            },
            {
              id: 'd',
              label: 'Tell sales to "make something up".',
              isCorrect: false,
              feedback: 'Never.',
            },
          ],
        },
      ],
    },

    {
      id: 'm2-confidentiality',
      title: 'Confidentiality + customer data',
      summary: 'How we keep customer data out of places it should not be.',
      body:
        'The Confidentiality TSC is mostly about three things: who can see customer data, where customer data can live, and how it gets disposed of. Most SOC 2 audit findings in this area are not exotic — they are "a former contractor still had access" or "a prod export ended up in a personal Drive".\n\n' +
        'Our hard rules: customer data lives only in approved systems (the product database, the data warehouse with row-level access, S3 buckets with encryption + access logs). It never lives in someone\'s personal cloud, in a screenshot in a public Slack channel, or in a CSV downloaded "just to check something".\n\n' +
        'When a teammate leaves, the de-provisioning checklist is the single most important control. Auditors will pull samples of leaver tickets and confirm every system was revoked within SLA. A missed revocation is a finding; a pattern of missed revocations is a qualification.',
      bullets: [
        'Customer data lives only in approved systems — never personal drives.',
        'Downloads / exports of customer data are themselves auditable events.',
        'Leaver de-provisioning is the most-sampled control in this area.',
        'Public Slack channels are not "internal" — they leak.',
        'Encryption at rest + in transit is table stakes, not the whole answer.',
      ],
      questions: [
        {
          id: 'm2-q1',
          kind: 'single_choice',
          prompt:
            'Which of these is the most common SOC 2 confidentiality finding for companies our size?',
          rationale:
            'Missed leaver de-provisioning is the single most common confidentiality finding. The control is simple, but it depends on every system being on the checklist and the checklist being followed every time. Auditors love to sample leaver tickets because the bar is so unambiguous.',
          choices: [
            {
              id: 'a',
              label: 'Encryption keys being too short.',
              isCorrect: false,
              feedback:
                'Real risk, but rarely the finding for companies our size.',
            },
            {
              id: 'b',
              label:
                'A former employee or contractor whose access was not fully revoked within SLA.',
              isCorrect: true,
              feedback:
                'Right — the most-sampled, most-failed control in this area.',
            },
            {
              id: 'c',
              label: "A customer's data being too encrypted.",
              isCorrect: false,
              feedback: 'Not a thing.',
            },
            {
              id: 'd',
              label: 'A misconfigured DNS record.',
              isCorrect: false,
              feedback: 'Operational risk, but not a SOC 2 finding directly.',
            },
          ],
        },
        {
          id: 'm2-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these handlings are in-policy for customer data? (pick all that apply)',
          rationale:
            'Approved systems with logged access, read-only ephemeral access for debugging, and exports through the approved data-warehouse path are all in-policy. Personal cloud storage and ad-hoc CSV downloads to a laptop desktop are not.',
          choices: [
            {
              id: 'a',
              label:
                'Querying the approved data warehouse with row-level access controls.',
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'Read-only ephemeral access via the approved tool for a 1-hour debug session.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Exporting a customer CSV to your personal Google Drive.',
              isCorrect: false,
              feedback: 'Personal cloud = unapproved processor. Hard no.',
            },
            {
              id: 'd',
              label:
                'Sharing a logged, audited export with a teammate through the approved channel.',
              isCorrect: true,
            },
          ],
        },
        {
          id: 'm2-q3',
          kind: 'scenario',
          selectionMode: 'single',
          weight: 2,
          scenario:
            'A teammate gives notice. Their last day is Friday. They ask you on Thursday afternoon whether they can "keep their GitHub access for a few days after to wrap things up".',
          prompt: 'What is the right answer?',
          rationale:
            'Leaver access ends on the last day, full stop. Any "wrap up" work happens before the cutoff or with explicit transition arrangements documented in the leaver ticket. Granting unlogged access for "a few days after" is exactly the kind of informal exception auditors look for in samples.',
          choices: [
            {
              id: 'a',
              label: 'Sure, a few days is fine.',
              isCorrect: false,
              feedback:
                'Informal post-leave access is the textbook confidentiality finding.',
            },
            {
              id: 'b',
              label:
                'No — access ends on the last day. Any wrap-up needs to happen before or through documented arrangements.',
              isCorrect: true,
              feedback: 'Right — no informal post-leave access.',
            },
            {
              id: 'c',
              label:
                'Let them keep access but ask them not to commit anything.',
              isCorrect: false,
              feedback: 'Honour-system controls do not satisfy SOC 2.',
            },
            {
              id: 'd',
              label: 'Stay silent and let it sort itself out.',
              isCorrect: false,
              feedback: 'Silence here is the failure mode.',
            },
          ],
        },
      ],
    },

    {
      id: 'm3-availability',
      title: 'Availability + incident discipline',
      summary: 'What "uptime" really means in a SOC 2 report.',
      body:
        'Availability covers our commitment that the product is reachable when customers need it. It is not the same as a 100% uptime promise — it is about whether we have the right controls (monitoring, on-call, capacity planning, runbooks, postmortems) to detect and recover from outages within our stated SLOs.\n\n' +
        'For SOC 2, auditors sample three things: incident records (do we open one when something breaks, is it timely, does it have severity + impact + actions?), monitoring evidence (did the alert fire, did someone acknowledge it, did the page reach the right person?), and recovery / DR drills (do we actually test backups and failover?).\n\n' +
        'The dangerous habit to avoid is the "no incident" incident — when the system is degraded but nobody opens a ticket because "it was just a blip". If it was customer-visible, it is an incident; not opening the ticket is a finding.',
      bullets: [
        'Availability ≠ 100% uptime; it is controls + SLO compliance.',
        'Customer-visible degradation = open the incident, every time.',
        'Monitoring evidence (alert fired, ack, page chain) is sampled.',
        'DR / backup drills are not optional — they must actually run.',
        '"Just a blip" is the most common audit gap in availability.',
      ],
      questions: [
        {
          id: 'm3-q1',
          kind: 'single_choice',
          prompt:
            'Mid-afternoon: a 12-minute partial degradation affects ~5% of customers. The on-call resolves it without opening an incident "because it was so short". What is the SOC 2 implication?',
          rationale:
            'Customer-visible degradation requires an incident record under our policy, regardless of duration. The missing record means we cannot show the auditor we detected, responded, and learned. Re-opening the incident retroactively is fine — quietly skipping it is the finding.',
          choices: [
            {
              id: 'a',
              label:
                'No implication — incidents under 15 minutes do not count.',
              isCorrect: false,
              feedback: 'No such threshold in our policy.',
            },
            {
              id: 'b',
              label:
                'A finding — customer-visible degradation requires an incident record regardless of duration. Open it retroactively with timeline.',
              isCorrect: true,
              feedback:
                'Right — record exists, finding avoided, learning captured.',
            },
            {
              id: 'c',
              label: 'Only a finding if the SLO was breached.',
              isCorrect: false,
              feedback:
                'SLO breach makes it worse; an incident is still required without one.',
            },
            {
              id: 'd',
              label: 'Send the on-call home and forget about it.',
              isCorrect: false,
              feedback: 'No.',
            },
          ],
        },
        {
          id: 'm3-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are sampled by SOC 2 auditors under the Availability TSC? (pick all that apply)',
          rationale:
            'Incident records, monitoring/alert chains, postmortems, and DR/backup drill evidence are all standard samples. "Marketing dashboard screenshots" are not relevant artefacts here.',
          choices: [
            {
              id: 'a',
              label: 'Incident records with severity, impact, and timeline.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'Monitoring + alert acknowledgement evidence.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Postmortem documents with action items.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Marketing analytics dashboard screenshots.',
              isCorrect: false,
              feedback: 'Not relevant to Availability evidence.',
            },
          ],
        },
        {
          id: 'm3-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A DR backup-restore drill is scheduled for next Tuesday but the team is slammed with a launch. Someone suggests skipping the drill this quarter and "running two next quarter".',
          prompt: 'What is the right move?',
          rationale:
            'Skipping a scheduled drill is a finding even if you promise to make it up. The scheduled cadence IS the control. Defer the drill formally with a documented exception + new date, or run a shorter scoped version of it on Tuesday. Silently skipping is the audit problem.',
          choices: [
            {
              id: 'a',
              label: 'Skip it; nobody will know.',
              isCorrect: false,
              feedback: 'Auditors will know. Skipping is a finding.',
            },
            {
              id: 'b',
              label:
                'Either run a scoped version on Tuesday OR formally defer with a documented exception + new date.',
              isCorrect: true,
              feedback: 'Right — drill the control or document the exception.',
            },
            {
              id: 'c',
              label: 'Move the drill to next year.',
              isCorrect: false,
              feedback: 'Cadence breach with no exception = finding.',
            },
            {
              id: 'd',
              label: 'Cancel all future drills.',
              isCorrect: false,
              feedback: 'Disaster recovery is not optional.',
            },
          ],
        },
      ],
    },

    {
      id: 'm4-processing-integrity',
      title: 'Processing integrity + change discipline',
      summary: 'Changes go through review, every time.',
      body:
        'Processing Integrity is our commitment that the system processes data the way it is supposed to — completely, accurately, on time, and authorised. In a SaaS context, the practical translation is "every change to production goes through a documented review with the right approver, and we can prove it".\n\n' +
        'For SOC 2, the auditor will pull a sample of recent changes (PRs, infra changes, schema migrations) and check: was there a ticket, was there a review by someone other than the author, was there evidence the change was tested, was the deploy logged. The control is simple; the failures are usually around emergency / hotfix paths where the discipline gets skipped.\n\n' +
        'The hotfix / emergency path needs its own paper trail. "We had to ship fast" is not an excuse to skip review forever — the hotfix policy should have a documented after-the-fact review + signoff so the change still gets a second pair of eyes, even if late.',
      bullets: [
        'Every production change has a ticket, a reviewer, and a deploy log.',
        'Self-review does not satisfy "review by someone other than the author".',
        'Hotfix path has its own documented after-the-fact review.',
        'Schema migrations are changes too — same controls apply.',
        '"Move fast" + "break the control" = audit finding.',
      ],
      questions: [
        {
          id: 'm4-q1',
          kind: 'single_choice',
          prompt:
            'Which of these counts as evidence of a properly-reviewed production change?',
          rationale:
            'The PR + linked ticket + review by a non-author + deploy log together are the standard evidence chain. A green CI run alone is not "review"; a self-merge breaks the second-pair-of-eyes principle.',
          choices: [
            {
              id: 'a',
              label: 'A self-merged PR with a green CI run.',
              isCorrect: false,
              feedback:
                'Self-merge = no second pair of eyes. Not in-policy for non-emergency changes.',
            },
            {
              id: 'b',
              label:
                'A PR linked to a ticket, reviewed and approved by a non-author, with a deploy log entry.',
              isCorrect: true,
              feedback:
                'Right — ticket + non-author review + deploy log is the chain.',
            },
            {
              id: 'c',
              label: 'A Slack message saying "looks good".',
              isCorrect: false,
              feedback: 'Slack-only approvals do not survive a sample request.',
            },
            {
              id: 'd',
              label: 'A change with no ticket but a long commit message.',
              isCorrect: false,
              feedback:
                'No ticket means no record. Commit message ≠ control evidence.',
            },
          ],
        },
        {
          id: 'm4-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are considered "changes" under our processing-integrity controls? (pick all that apply)',
          rationale:
            'Code changes, Terraform / infra changes, database schema migrations, and feature-flag flips that affect customer behaviour are all changes that need the same review chain. Editing your own profile picture is not a system change.',
          choices: [
            {
              id: 'a',
              label: 'A code PR that ships behaviour changes.',
              isCorrect: true,
            },
            { id: 'b', label: 'A Terraform / infra change.', isCorrect: true },
            {
              id: 'c',
              label:
                'A feature-flag flip that changes behaviour for real customers.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Updating your profile picture in the internal directory.',
              isCorrect: false,
              feedback:
                'Profile changes are personal admin, not system changes.',
            },
          ],
        },
        {
          id: 'm4-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A live outage forces a same-minute hotfix. The on-call self-merges and ships it without a reviewer. The customer impact is fixed in 4 minutes.',
          prompt: 'What is the right follow-up for SOC 2 evidence?',
          rationale:
            'The hotfix path is in-policy in an emergency, but it requires a documented after-the-fact review + signoff within the SLA defined in the policy (typically 24–48h). Without that, the change has no second pair of eyes and shows up as a finding. The follow-up review IS the control.',
          choices: [
            {
              id: 'a',
              label:
                'Nothing — emergency hotfix is exempt from review forever.',
              isCorrect: false,
              feedback:
                'Hotfix is not exempt; the review is just delayed and documented.',
            },
            {
              id: 'b',
              label:
                'Open the hotfix ticket + after-the-fact review + signoff within the defined SLA so the change has a documented second reviewer.',
              isCorrect: true,
              feedback: 'Right — late review is still review.',
            },
            {
              id: 'c',
              label: 'Quietly close the deploy log entry.',
              isCorrect: false,
              feedback: 'Quiet closure is the audit antipattern.',
            },
            {
              id: 'd',
              label: 'Punish the on-call for skipping review.',
              isCorrect: false,
              feedback:
                'Hotfix-without-review is the policy in an emergency; the documented follow-up is the missing piece.',
            },
          ],
        },
      ],
    },

    {
      id: 'm5-evidence-habits',
      title: 'Evidence habits',
      summary:
        'Tickets, approvals, dashboards — make them audit-friendly by default.',
      body:
        'The single biggest difference between companies that pass SOC 2 in one go and companies that get qualified findings is the quality of their everyday evidence trail. The fix is not "produce more evidence at audit time" — it is "make the evidence we already produce more useful".\n\n' +
        'Three habits matter most: every state-changing action gets a ticket (not a DM, not a verbal nod); every approval is given in writing on the artefact itself (the PR, the ticket, the change request), not in a side channel; and the dashboards we use to monitor the system live in a known place and are referenced from the runbook.\n\n' +
        'A teammate-to-future-teammate test is useful: if you left tomorrow, could the next person reconstruct what happened from the artefacts alone? If the answer is "only if they DM the right person", the evidence trail is not audit-ready.',
      bullets: [
        'State-changing action → ticket. Not a DM.',
        'Approvals on the artefact (PR, ticket, change request), not in DM.',
        'Dashboards live in known places, linked from runbooks.',
        '"Future teammate" test: can someone reconstruct without DMs?',
        'Audit evidence quality compounds — invest weekly, not yearly.',
      ],
      questions: [
        {
          id: 'm5-q1',
          kind: 'single_choice',
          prompt:
            'Your manager DMs "approved" for a change request. What is the right next step for SOC 2 evidence?',
          rationale:
            'DM approvals do not survive a sample request — they are invisible to the auditor and easy to lose. The fix is to ask the manager to post the approval on the artefact itself (the change ticket / PR). Most managers will do this happily once asked.',
          choices: [
            {
              id: 'a',
              label: 'Screenshot the DM for the audit file.',
              isCorrect: false,
              feedback:
                'Screenshots are weak evidence and detached from the artefact.',
            },
            {
              id: 'b',
              label:
                'Ask the manager to post the approval on the ticket or PR itself, so it is on the artefact.',
              isCorrect: true,
              feedback:
                'Right — approval on the artefact is the durable evidence.',
            },
            {
              id: 'c',
              label: 'Accept the DM and move on.',
              isCorrect: false,
              feedback: 'Move on without the artefact = audit gap later.',
            },
            {
              id: 'd',
              label: 'Forward the DM to the whole company.',
              isCorrect: false,
              feedback:
                'Wide distribution does not turn it into proper evidence.',
            },
          ],
        },
        {
          id: 'm5-q2',
          kind: 'ranking',
          weight: 2,
          prompt:
            'Rank these evidence forms for an approval from STRONGEST to WEAKEST.',
          rationale:
            'In-artefact written approval (PR / ticket comment) is strongest because it is timestamped, attributable, and survives forever. A Slack message in a documented channel is mid-strength. A DM is weak (private, easy to lose). A verbal "go" is unrecorded and the weakest of all.',
          choices: [
            {
              id: 'a',
              label:
                'A written approval comment on the PR or change ticket itself.',
              rankOrder: 1,
            },
            {
              id: 'b',
              label:
                'A Slack message in a documented channel referencing the change.',
              rankOrder: 2,
            },
            {
              id: 'c',
              label: 'A direct message between two people.',
              rankOrder: 3,
            },
            {
              id: 'd',
              label: 'A verbal "go for it" in a hallway conversation.',
              rankOrder: 4,
            },
          ],
        },
        {
          id: 'm5-q3',
          kind: 'multi_choice',
          prompt:
            'Which of these patterns help future-you survive an audit sample? (pick all that apply)',
          rationale:
            'Linking PRs to tickets, referencing dashboards in runbooks, writing approvals on artefacts, and capturing decisions in durable docs all help. Keeping everything in DMs does not — it is the antipattern.',
          choices: [
            {
              id: 'a',
              label: 'Linking every PR to a ticket.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'Referencing the runbook in incident records.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Writing decisions down in a durable doc, not just Slack.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Keeping all approvals in 1:1 DMs only.',
              isCorrect: false,
              feedback: 'DMs are the audit-evidence antipattern.',
            },
          ],
        },
      ],
    },

    {
      id: 'm6-monitoring-oncall',
      title: 'Monitoring + on-call',
      summary: 'What alerts mean, how escalation actually works.',
      body:
        'Monitoring + on-call is where Availability and Incident Response controls meet reality. SOC 2 expects we have monitoring that fires on the things we said we would monitor (per our control description), that pages reach the right person, that acknowledgements happen within stated SLAs, and that escalation chains kick in when nobody acknowledges.\n\n' +
        'The most common audit gaps in this area are not technical — they are about discipline. Stale on-call rotations (someone left, nobody updated the rotation), alerts that page nobody (false-positives muted permanently, the muting forgotten), and SLA breaches with no record of why nobody answered.\n\n' +
        'Your part: if you are on-call, acknowledge promptly even if you cannot fix immediately. If you receive a page that should not have routed to you, escalate before you sleep on it. The page-chain evidence is what auditors sample.',
      bullets: [
        'Page → ack within SLA, even if fix is later.',
        'Stale rotations are the most common on-call audit gap.',
        'Muting alerts is fine — undocumented muting is a finding.',
        'Escalation chain must actually fire when ack is missed.',
        'If a page mis-routed, escalate to fix the routing, do not just absorb it.',
      ],
      questions: [
        {
          id: 'm6-q1',
          kind: 'single_choice',
          prompt:
            'You ack a page at 2am but cannot start fixing it until your shift partner wakes up. What does SOC 2 expect?',
          rationale:
            'Ack within the page-ack SLA is the control; the fix-time SLO is a separate metric. Acking and clearly handing off (or escalating) is the in-policy behaviour. Going back to sleep without ack or handoff is the gap.',
          choices: [
            {
              id: 'a',
              label: 'Ignore the page until morning.',
              isCorrect: false,
              feedback: 'Missed ack with no escalation = SLA breach.',
            },
            {
              id: 'b',
              label:
                'Ack within SLA, then either start the fix or escalate to your partner / next-in-rotation with handoff notes.',
              isCorrect: true,
              feedback: 'Right — ack + handoff is the policy-compliant path.',
            },
            {
              id: 'c',
              label: 'Mute the alert and go back to bed.',
              isCorrect: false,
              feedback:
                'Undocumented muting hides real signals — never on a live page.',
            },
            {
              id: 'd',
              label: 'Disable monitoring on the affected service.',
              isCorrect: false,
              feedback:
                'Disabling monitoring during an incident is the worst possible move.',
            },
          ],
        },
        {
          id: 'm6-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these on-call patterns produce audit findings? (pick all that apply)',
          rationale:
            'Stale rotations, permanently-muted "noisy" alerts that nobody documented, missed acks with no escalation, and unrecorded handoffs all produce findings. Healthy rotations with documented handovers and periodic alert-tuning reviews are exactly what auditors want to see.',
          choices: [
            {
              id: 'a',
              label:
                'On-call rotation still lists a teammate who left 3 months ago.',
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'An alert was muted last sprint with no ticket or rationale.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Three pages went unacked last quarter with no follow-up.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Weekly on-call handover with documented hot-spots.',
              isCorrect: false,
              feedback: 'That is the good pattern.',
            },
          ],
        },
        {
          id: 'm6-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'You inherit on-call from a teammate who left. The Pagerduty schedule still lists them. You get paged at 3am for something irrelevant to you.',
          prompt: 'What is the right first action?',
          rationale:
            'Ack the page (the SLA does not care that the routing was wrong), then fix the rotation the next business day with a documented change. Do not just absorb mis-routed pages — the stale rotation is itself an audit finding.',
          choices: [
            {
              id: 'a',
              label: 'Ignore the page; it was not really for you.',
              isCorrect: false,
              feedback: 'Missed ack is an SLA breach regardless of why.',
            },
            {
              id: 'b',
              label:
                'Ack the page, route it to the correct on-call if there is impact, then fix the rotation the next business day with a documented change.',
              isCorrect: true,
              feedback: 'Right — ack first, then fix the underlying gap.',
            },
            {
              id: 'c',
              label: "Forward to the leaver's personal email.",
              isCorrect: false,
              feedback: 'Leavers do not have access; that is the whole point.',
            },
            {
              id: 'd',
              label: 'Disable the page entirely.',
              isCorrect: false,
              feedback: 'Disabling without documented rationale is a finding.',
            },
          ],
        },
      ],
    },

    {
      id: 'm7-vendor-subprocessor',
      title: 'Vendor + sub-processor awareness',
      summary: "Our vendors are our customers' vendors too.",
      body:
        'Every SaaS we use that touches customer data is a sub-processor under our customer contracts. Customers expect to see those sub-processors on our public sub-processor list, with DPAs on file, and they expect to be notified before we add new ones. SOC 2 expects the same controls plus evidence we vet vendors before onboarding and review them periodically.\n\n' +
        'The right path for adding a new vendor: file a request in the vendor-onboarding queue with the data the vendor will touch, the data classification, and the use case. Security + legal review, DPA signed, sub-processor list updated, customer notification sent if required. Trying to "just try" a vendor before review is the most common audit gap here.\n\n' +
        'Existing vendors get periodic re-review (typically annual) on three axes: is the SOC 2 / ISO report current, has the data flow changed, has the vendor had any reported incidents. A stale vendor review for a critical vendor is a finding.',
      bullets: [
        'Every vendor touching customer data is a sub-processor — public list.',
        'New vendor → onboarding request → DPA → list update → customer notify.',
        'No "just trying" a vendor with real customer data.',
        'Annual review: SOC 2 / ISO current, data flow, vendor incidents.',
        'Vendor offboarding has the same discipline as leaver offboarding.',
      ],
      questions: [
        {
          id: 'm7-q1',
          kind: 'single_choice',
          prompt:
            'Marketing wants to try a new email-sending vendor with our customer list for a quick campaign. What is the right path?',
          rationale:
            'The customer list is customer data; the email vendor is a new sub-processor. The in-policy path is to file vendor onboarding (DPA, SOC 2 / ISO check), update the sub-processor list, notify customers if required, then send. The shortcut is the audit gap.',
          choices: [
            {
              id: 'a',
              label: 'Run the campaign first, paper the vendor later.',
              isCorrect: false,
              feedback: 'That is the textbook audit shortcut — never.',
            },
            {
              id: 'b',
              label:
                'File vendor onboarding (DPA, SOC 2 / ISO check), update sub-processor list, notify customers per policy, then send.',
              isCorrect: true,
              feedback: 'Right — the in-policy path.',
            },
            {
              id: 'c',
              label: 'Use the new vendor with a small subset to test.',
              isCorrect: false,
              feedback:
                '"Test" with real customer data is still data exposure to an un-vetted vendor.',
            },
            {
              id: 'd',
              label: 'Manually export the list and paste into the vendor UI.',
              isCorrect: false,
              feedback:
                'Manual route still routes customer data to an un-vetted vendor.',
            },
          ],
        },
        {
          id: 'm7-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these belong on the public sub-processor list? (pick all that apply)',
          rationale:
            'Any vendor that processes customer data on our behalf — analytics that ingest user behaviour, infra that hosts the product, customer-comms tools — belongs on the public sub-processor list. An internal-only HR tool that never touches customer data does not.',
          choices: [
            {
              id: 'a',
              label: 'The cloud provider hosting the product database.',
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'The product-analytics vendor ingesting customer interactions.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'The customer-support platform handling tickets.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'The internal HR system used only by CloudAnzen staff.',
              isCorrect: false,
              feedback: 'Internal-only with no customer data ≠ sub-processor.',
            },
          ],
        },
        {
          id: 'm7-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A vendor we depend on for a critical feature announces they were breached, with potential exposure of customer data we sent them.',
          prompt: 'What is the right first move under SOC 2 + our contracts?',
          rationale:
            'Open an incident, assess what customer data was exposed, notify affected customers within the contractually-required window, update the sub-processor risk record, and decide on continued use. Waiting for the vendor to tell you what to do is not the right cadence — you act for your customers.',
          choices: [
            {
              id: 'a',
              label: 'Wait for the vendor to send us a full report.',
              isCorrect: false,
              feedback:
                'Customer notification clocks may start independently of vendor timelines.',
            },
            {
              id: 'b',
              label:
                'Open an incident, assess customer data exposure, notify affected customers within the contractual window, update the vendor risk record.',
              isCorrect: true,
              feedback: 'Right — protect customers first, document everything.',
            },
            {
              id: 'c',
              label: 'Do nothing publicly; tell only the head of sales.',
              isCorrect: false,
              feedback:
                'Quiet handling of a sub-processor breach is the worst possible response.',
            },
            {
              id: 'd',
              label: 'Switch vendors immediately without telling anyone.',
              isCorrect: false,
              feedback:
                'Switching alone does not satisfy notification obligations.',
            },
          ],
        },
      ],
    },

    {
      id: 'm8-auditor-walkthrough',
      title: 'Auditor walkthrough — your part',
      summary: 'What to expect when an auditor asks you for evidence.',
      body:
        'When the SOC 2 auditor is on-site (virtually or otherwise), they will ask owners of sampled controls to walk through how the control operates. This is normal, healthy, and your part is to be calm and accurate. Your job is not to "convince" the auditor — your job is to show how the control actually works.\n\n' +
        'The shape of a walkthrough: the auditor asks "show me how X works", you open the system, you do the thing, you show the resulting evidence (ticket, log line, dashboard). If there is a gap, name it — gaps caught and disclosed are smaller findings than gaps the auditor finds themselves.\n\n' +
        '"I don\'t know" is a fine answer if it\'s followed with "let me find the right owner". Making things up to look helpful is the single most damaging thing you can do in a walkthrough — auditors recognise improvisation immediately.',
      bullets: [
        'Walkthroughs are demonstrations, not interrogations.',
        '"I don\'t know — let me get the right owner" is always acceptable.',
        'Never improvise or guess; that turns minor findings into major ones.',
        'Self-disclosed gaps are smaller findings than auditor-discovered ones.',
        'Pre-audit dry-runs save weeks of post-audit pain.',
      ],
      questions: [
        {
          id: 'm8-q1',
          kind: 'single_choice',
          prompt:
            'An auditor asks to see evidence of a control and you genuinely do not know where it is. What is the right response?',
          rationale:
            'Honest "I do not know — let me get the right owner" is always the right answer. Improvising or guessing produces inconsistent walkthroughs across owners, which is itself a red flag. Auditors expect owners not to know everything; they expect the org to know who does.',
          choices: [
            {
              id: 'a',
              label: 'Make up a plausible answer to look helpful.',
              isCorrect: false,
              feedback: 'Improvising turns minor findings into qualifications.',
            },
            {
              id: 'b',
              label:
                'Say "I do not know the specifics — let me get the owner who does" and follow up promptly.',
              isCorrect: true,
              feedback: 'Right — honest, helpful, in-policy.',
            },
            {
              id: 'c',
              label: 'Refuse to answer.',
              isCorrect: false,
              feedback: 'Refusing is worse than not knowing.',
            },
            {
              id: 'd',
              label: 'Send the auditor away.',
              isCorrect: false,
              feedback: 'No.',
            },
          ],
        },
        {
          id: 'm8-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these reduce audit pain and follow-up findings? (pick all that apply)',
          rationale:
            'Pre-audit dry-runs, self-disclosed gaps with a remediation plan, consistent owner answers across walkthroughs, and durable evidence on the artefact all reduce findings. Improvising on the spot is the opposite.',
          choices: [
            {
              id: 'a',
              label: 'Running a pre-audit dry-run of likely walkthroughs.',
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'Self-disclosing known gaps with a remediation plan attached.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Keeping evidence on the artefact, not in DMs.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Improvising on the spot if asked something unfamiliar.',
              isCorrect: false,
              feedback: 'Improvisation is the single biggest audit risk.',
            },
          ],
        },
        {
          id: 'm8-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'During a walkthrough you realise the control description in our SOC 2 report does not quite match what we actually do — the documented frequency says monthly but we actually do it weekly.',
          prompt: 'What is the right move?',
          rationale:
            'Disclose the mismatch in the walkthrough — "we do it more often than described, here is the evidence". Doing the control more often than described is rarely a problem; what kills you is doing it less often. Hiding the mismatch when you know about it is the audit problem.',
          choices: [
            {
              id: 'a',
              label: 'Hide it and hope the auditor does not notice.',
              isCorrect: false,
              feedback:
                'Hiding known mismatches is the textbook way to escalate findings.',
            },
            {
              id: 'b',
              label:
                'Disclose the mismatch with the evidence; agree to update the report description after the audit.',
              isCorrect: true,
              feedback: 'Right — honest mismatch + remediation plan.',
            },
            {
              id: 'c',
              label: 'Change the control to match the description on the spot.',
              isCorrect: false,
              feedback:
                'Changing operating frequency mid-audit is itself a change-management failure.',
            },
            {
              id: 'd',
              label: 'Stop doing the control entirely.',
              isCorrect: false,
              feedback: 'No.',
            },
          ],
        },
      ],
    },
  ],
};
