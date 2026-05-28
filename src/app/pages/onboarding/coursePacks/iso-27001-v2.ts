/**
 * ISO 27001 Security Awareness — v2 (audit-grade).
 *
 * 10 modules, ~30 questions (~45 min). Warmer "colleague at CloudAnzen"
 * tone. Each question carries a rationale shown inline to the learner.
 *
 * BE answer keys live in cloudanzen-backend
 * `src/modules/onboarding/training-answer-keys.ts` keyed
 * `iso-27001-security-awareness@v2`. Keep both in lockstep.
 */
import type { CoursePack } from './types';

export const ISO_27001_V2: CoursePack = {
  slug: 'iso-27001-security-awareness',
  version: 2,
  passThresholdPct: 80,
  estimatedMinutes: 45,
  modules: [
    {
      id: 'm1-why-isms',
      title: 'Why we run an ISMS',
      summary: 'How ISO 27001 connects to your day-to-day work.',
      body:
        'An ISMS (Information Security Management System) is the framework we use to keep customer data, source code, and our own internal records safe. ISO 27001 is the international standard that an external auditor reviews us against. We are not running an ISMS to please auditors — we run one because losing customer trust is the fastest way to lose customers.\n\n' +
        'In practice the ISMS shows up as policies in CloudAnzen, evidence we collect during normal work, and short reviews we do every quarter. Your part is recognising that the controls you follow (Slack approval requests, ticket discipline, change reviews) are what the ISMS actually IS.\n\n' +
        "When an auditor visits, they sample real evidence: a Jira ticket, a Slack thread, a screenshot. The ISMS doesn't have a separate filing cabinet — your everyday work is the cabinet.",
      bullets: [
        'The ISMS is the controls you already follow during normal work.',
        'Auditors sample real artefacts — tickets, Slack threads, screenshots.',
        'Reporting concerns early is faster than backfilling evidence later.',
        'Every team contributes to evidence quality, not just the security team.',
        'When in doubt, ask in #security — silence costs more than questions.',
      ],
      questions: [
        {
          id: 'm1-q1',
          kind: 'single_choice',
          prompt:
            'When an external ISO 27001 auditor visits, what do they look at most?',
          rationale:
            'Auditors pull samples of real evidence (tickets, Slack messages, change reviews). Polished narrative documents help frame the program, but the audit verdict turns on whether real day-to-day artefacts back up what the policy says.',
          choices: [
            {
              id: 'a',
              label: 'Marketing decks describing our security program.',
              isCorrect: false,
              feedback:
                'Decks set context; auditors want operational evidence.',
            },
            {
              id: 'b',
              label:
                'Real, dated evidence from our normal workflows (tickets, Slack, change reviews).',
              isCorrect: true,
              feedback:
                'Exactly — the ISMS is judged on whether the controls actually operated.',
            },
            {
              id: 'c',
              label:
                'A separate "audit binder" the compliance team prepares the week before.',
              isCorrect: false,
              feedback:
                'Backfilled binders are the #1 reason orgs fail audits. Continuous evidence is the point.',
            },
            {
              id: 'd',
              label: 'Conversations with executives only.',
              isCorrect: false,
              feedback:
                'Auditors talk to executives but rely primarily on sampled evidence.',
            },
          ],
        },
        {
          id: 'm1-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are part of "the ISMS" in practice? (pick all that apply)',
          rationale:
            'The ISMS is everywhere day-to-day work happens. Slack approvals, ticket trails, change reviews, and access requests are all components — the policy document on its own is not the ISMS.',
          choices: [
            {
              id: 'a',
              label:
                'The change-management ticket where a deploy was approved.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'A Slack request asking your manager for access.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Our quarterly access review spreadsheet.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'The policy PDF sitting unread in a Drive folder.',
              isCorrect: false,
              feedback:
                'A policy is needed but inert on its own — the operating evidence beneath it is what makes the ISMS real.',
            },
          ],
        },
        {
          id: 'm1-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            "You spot a teammate sharing a customer screenshot in a public #demo channel. It has a customer name + a redacted email. You're not sure if it crosses a line.",
          prompt: 'What is the best first move?',
          rationale:
            'Reporting early in #security is always cheaper than discovering the issue at audit time. A low-stakes question gets clarified; a real issue gets caught early. Either outcome is better than staying quiet.',
          choices: [
            {
              id: 'a',
              label:
                'Stay quiet — the email is redacted, so it is probably fine.',
              isCorrect: false,
              feedback:
                'Customer names are still customer data. Better to ask.',
            },
            {
              id: 'b',
              label:
                'Flag it in #security with the link so the team can confirm whether it is in policy.',
              isCorrect: true,
              feedback:
                'Fast, low-friction, and creates the evidence trail an auditor would want anyway.',
            },
            {
              id: 'c',
              label:
                'DM the teammate to delete it; mention nothing to security.',
              isCorrect: false,
              feedback:
                'Deleting evidence without raising the question is worse — we lose the audit trail and the learning moment.',
            },
            {
              id: 'd',
              label:
                'Take a screenshot and post it in a separate channel for later discussion.',
              isCorrect: false,
              feedback:
                'Spreading the screenshot further is the opposite of what we want.',
            },
          ],
        },
      ],
    },

    {
      id: 'm2-access-identity',
      title: 'Access + identity',
      summary: 'MFA, password manager, least privilege, access reviews.',
      body:
        'Most security incidents start with credentials. A teammate\'s password ends up in a breach corpus, an attacker logs in, and from there they\'re a "valid user" — which is the hardest kind of attacker to detect.\n\n' +
        'We push hard on three habits: every account behind a password manager + MFA, least-privilege access (you have what your role needs, nothing more), and quarterly access reviews to catch creeping permissions. These three habits prevent more breaches than any fancy tooling.\n\n' +
        "When you change role or leave a project, your access should change too. If you notice a teammate still in a Slack channel or repo they no longer need, that's a real audit finding waiting to happen. Flag it in #access-management.",
      bullets: [
        'Every login goes through the password manager — never reuse passwords.',
        'MFA on every account, every time. If a prompt surprises you, deny + report.',
        'Ask for least privilege — narrower scope is faster to get approved and easier to defend.',
        'Quarterly access reviews are real — answer them seriously.',
        'Role change = access change. Flag stale access when you spot it.',
      ],
      questions: [
        {
          id: 'm2-q1',
          kind: 'multi_choice',
          prompt:
            'Which of these signals point at credential compromise? (pick all that apply)',
          rationale:
            "Unexpected MFA prompts, sudden access from new geo or device, and a known breach corpus hit are the most common credential-compromise signals. None of them prove a breach alone, but together they're the standard triage list.",
          choices: [
            {
              id: 'a',
              label: 'You get an MFA prompt you did not trigger.',
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'A login alert says you signed in from a country you have never visited.',
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'A password manager warning that one of your saved logins appeared in a breach.',
              isCorrect: true,
            },
            {
              id: 'd',
              label:
                'Slack told you your status was set to "active" this morning.',
              isCorrect: false,
            },
          ],
        },
        {
          id: 'm2-q2',
          kind: 'single_choice',
          prompt:
            'A teammate asks for production database read access "just in case they need to debug something next sprint". What is the right response?',
          rationale:
            'Standing prod access is exactly what least-privilege is designed to avoid. Just-in-time or scoped access (e.g. read-only via a specific tool, expiring after the sprint) gives the same outcome with much less blast radius.',
          choices: [
            {
              id: 'a',
              label: 'Grant standing read access — it is only read.',
              isCorrect: false,
              feedback:
                'Standing access drifts; read access leaks data the moment a credential leaks.',
            },
            {
              id: 'b',
              label: 'Decline outright; debugging is not their job.',
              isCorrect: false,
              feedback: 'Too strict; they probably do have a real need.',
            },
            {
              id: 'c',
              label:
                'Offer just-in-time scoped access for the sprint, with auto-expiry and a request trail.',
              isCorrect: true,
              feedback:
                'Right balance — the access exists when needed, disappears when not.',
            },
            {
              id: 'd',
              label:
                'Share your own credentials so they can debug under your account.',
              isCorrect: false,
              feedback:
                'Credential sharing breaks every audit trail we have. Never do this.',
            },
          ],
        },
        {
          id: 'm2-q3',
          kind: 'scenario',
          selectionMode: 'multi',
          weight: 2,
          scenario:
            'It is 11pm and your phone buzzes with an MFA approval prompt to log in to Okta. You did not start a login. The prompt has the right name and the right look.',
          prompt: 'What should you do? (pick all that apply)',
          rationale:
            'An unprompted MFA is the textbook MFA-fatigue attack. Always deny the prompt, never approve it "just to make it stop", and report it so the security team can correlate with login attempts. Changing your password is a sensible follow-up if you confirm an attempt occurred.',
          choices: [
            {
              id: 'a',
              label: 'Deny the MFA prompt.',
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'Report the unexpected prompt in #security (or page the on-call).',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Approve it once just to clear the notification.',
              isCorrect: false,
              feedback:
                'MFA fatigue attacks rely on this exact behaviour. Never approve an unprompted MFA.',
            },
            {
              id: 'd',
              label: 'Rotate your password through the password manager.',
              isCorrect: true,
            },
          ],
        },
      ],
    },

    {
      id: 'm3-device-hygiene',
      title: 'Device hygiene',
      summary: 'Managed laptops, screen lock, BYOD limits, lost device.',
      body:
        'Your laptop is a customer-data device. The MDM (mobile device management) enrolment that you went through during onboarding gives the security team the ability to push patches, lock a lost device, and confirm disk encryption is on. It is not surveillance — it is the seatbelt.\n\n' +
        'Three habits matter most: lock the screen every time you step away (Cmd+Ctrl+Q on macOS, Win+L on Windows), keep the OS + browser updated within a week of release, and report a lost or stolen device within the hour. The faster we lock and wipe, the smaller the blast radius.\n\n' +
        'BYOD (personal devices) and managed devices have different rules. If you can avoid touching customer data from a personal device, do — we have managed devices for a reason.',
      bullets: [
        'Lock the screen every single time you step away.',
        'Take OS + browser updates within a week of release.',
        'Lost or stolen device → #security within the hour.',
        'Customer data stays on managed devices when possible.',
        'Never disable the MDM agent or disk encryption.',
      ],
      questions: [
        {
          id: 'm3-q1',
          kind: 'single_choice',
          prompt:
            'You realise on the train home that your work laptop is no longer in your bag. What is the right first action?',
          rationale:
            "The remote-lock + remote-wipe capability of MDM is most valuable in the first hour. Reporting fast is the single thing that compresses the incident's blast radius. Going home to think about it is the textbook wrong move.",
          choices: [
            {
              id: 'a',
              label: 'Wait until morning to see if it turns up.',
              isCorrect: false,
              feedback: 'Each hour matters. Report now.',
            },
            {
              id: 'b',
              label: 'Contact #security / on-call now so MDM can lock + wipe.',
              isCorrect: true,
              feedback:
                'Yes — fast reporting is the most effective control we have.',
            },
            {
              id: 'c',
              label: 'Buy a new laptop and restore from your personal iCloud.',
              isCorrect: false,
              feedback: 'That sidesteps every control we have.',
            },
            {
              id: 'd',
              label: 'DM your manager only.',
              isCorrect: false,
              feedback:
                'Tell your manager too, but security needs to be in the loop now.',
            },
          ],
        },
        {
          id: 'm3-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are acceptable on your CloudAnzen managed laptop? (pick all that apply)',
          rationale:
            'Browser extensions go through the same approval workflow as any third-party SaaS — they read your tabs. Personal cloud storage signed into a managed laptop is the most common cause of accidental customer-data leaks. App Store / approved-software installs are fine because the platform vets them.',
          choices: [
            {
              id: 'a',
              label:
                'Installing a productivity app from the company-approved software catalog.',
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'Signing into your personal Dropbox / personal Google Drive on the device.',
              isCorrect: false,
              feedback:
                'Personal cloud sync is the #1 source of accidental customer-data leaks.',
            },
            {
              id: 'c',
              label:
                'Installing a browser extension you found on a Reddit thread.',
              isCorrect: false,
              feedback:
                'Extensions read tabs. Treat them like any other SaaS — go through #it for approval.',
            },
            {
              id: 'd',
              label: 'Using the password manager + MFA app the company set up.',
              isCorrect: true,
            },
          ],
        },
        {
          id: 'm3-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A teammate complains that the MDM agent on their laptop is slowing things down and asks if they can disable it for a few days while they finish a launch.',
          prompt: 'What do you tell them?',
          rationale:
            'Disabling MDM removes the controls auditors expect to be on. If performance is the issue, the right fix is to debug the agent (open a ticket with IT) — not to disable the seatbelt.',
          choices: [
            {
              id: 'a',
              label: 'Sure, just turn it back on after the launch.',
              isCorrect: false,
              feedback:
                'Even short windows without MDM are real audit findings.',
            },
            {
              id: 'b',
              label:
                'Tell them to open an IT ticket so the agent can be tuned, and keep MDM on.',
              isCorrect: true,
              feedback:
                'Right — keep the controls on, fix the underlying issue.',
            },
            {
              id: 'c',
              label: 'Show them the shortcut to uninstall the agent.',
              isCorrect: false,
              feedback:
                'Never disable security controls without explicit sign-off.',
            },
            {
              id: 'd',
              label: 'Ignore the question.',
              isCorrect: false,
              feedback: 'Engage — silence is not a control.',
            },
          ],
        },
      ],
    },

    {
      id: 'm4-data-classification',
      title: 'Data classification + handling',
      summary: 'Internal, confidential, customer — and how each is handled.',
      body:
        'Everything we touch falls into a sensitivity bucket: Public (marketing), Internal (most Notion pages, design docs), Confidential (security plans, internal financials, customer lists), and Customer Data (anything our customers gave us).\n\n' +
        'The bucket determines who can see it, where it can be stored, how it can be shared, and how long we keep it. Customer Data is the strictest — it stays in our approved customer systems (the product, the data warehouse with row-level access) and never gets pasted into chats, AI tools, or personal drives.\n\n' +
        'If you are about to share something and you cannot quickly say which bucket it lives in, pause and ask. The pause is cheaper than a leak.',
      bullets: [
        'Customer Data → approved systems only, never in chat, AI, or personal drive.',
        'Confidential → internal channels with documented audience.',
        'Internal → default for most company work.',
        'Public → marketing or trust-center material that already cleared review.',
        'Cannot place the bucket? Pause and ask in #security.',
      ],
      questions: [
        {
          id: 'm4-q1',
          kind: 'single_choice',
          prompt:
            "A customer success teammate asks you to paste a customer's support transcript into ChatGPT to summarise. The transcript has the customer's name and a vendor name. What is the right answer?",
          rationale:
            'Public ChatGPT (without a BAA / vendor review) is an unapproved processor for Customer Data. Use an approved AI tool or redact aggressively before sharing. Pasting customer transcripts into public LLMs is one of the most-cited examples of accidental data leakage.',
          choices: [
            {
              id: 'a',
              label: 'Paste it in — summarisation is harmless.',
              isCorrect: false,
              feedback:
                'Once the data is in a public LLM, we have no way to retract it.',
            },
            {
              id: 'b',
              label:
                'Use the company-approved AI workflow or aggressively redact first.',
              isCorrect: true,
              feedback:
                'Right — keep Customer Data inside approved processors.',
            },
            {
              id: 'c',
              label: 'Redact only the customer name; leave the rest.',
              isCorrect: false,
              feedback:
                'Partial redaction often still identifies the customer through other tells.',
            },
            {
              id: 'd',
              label: 'Refuse to help.',
              isCorrect: false,
              feedback:
                'Help — just route the request through an approved processor.',
            },
          ],
        },
        {
          id: 'm4-q2',
          kind: 'ranking',
          prompt:
            'Rank these places to share a Confidential incident postmortem from MOST to LEAST appropriate.',
          rationale:
            'Documented internal channels with controlled membership are best. Wider DMs lose audit trail. Public channels and personal drives are explicit policy violations.',
          choices: [
            {
              id: 'a',
              label:
                'A #security-incidents Slack channel with documented membership.',
              rankOrder: 1,
            },
            {
              id: 'b',
              label: 'A DM with the on-call engineer for context only.',
              rankOrder: 2,
            },
            {
              id: 'c',
              label: 'The company-wide #general Slack channel.',
              rankOrder: 3,
            },
            {
              id: 'd',
              label: 'Your personal Google Drive for safekeeping.',
              rankOrder: 4,
            },
          ],
        },
        {
          id: 'm4-q3',
          kind: 'multi_choice',
          prompt:
            'Which of these count as Customer Data under our classification policy? (pick all that apply)',
          rationale:
            'Anything we receive from or generate about a specific customer counts. Customer Data is intentionally broad — names, emails, support transcripts, audit findings against their org, even their integration secrets. Public testimonials they have already published do not.',
          choices: [
            {
              id: 'a',
              label:
                "A support ticket transcript including the customer's admin email.",
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'An OAuth token the customer issued for our Slack integration.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'A G2 testimonial the customer already published.',
              isCorrect: false,
              feedback:
                'Public material the customer published themselves is Public.',
            },
            {
              id: 'd',
              label: "An auditor's finding against the customer's ISMS.",
              isCorrect: true,
            },
          ],
        },
      ],
    },

    {
      id: 'm5-phishing',
      title: 'Phishing + social engineering',
      summary: 'Spot it, report it, do not engage.',
      body:
        'Phishing is the most common way attackers get into companies our size. Modern phishing is competent: clean grammar, real logos, and the email even references a real coworker. The tells are subtle — domain typosquats, urgency, money or credentials, and "do not tell anyone yet" framing.\n\n' +
        'Our standing policy is simple: forward suspicious messages to #security or use the "Report Phishing" button in our mail client. You never get in trouble for reporting something that turns out to be legitimate. You can get in trouble for clicking and not reporting.\n\n' +
        'Social engineering also happens by phone, Slack DM, and even in person ("I forgot my badge"). Apply the same instinct everywhere: an unusual urgent ask + a request to skip a normal control = report.',
      bullets: [
        '"Report Phishing" button is your default — speed beats certainty.',
        'Urgency + money/credentials + secrecy = textbook phishing.',
        'Verify out-of-band before you act on any urgent ask from an exec.',
        'Vendor "support" emails asking for credentials are almost always fake.',
        'Walk-in tailgating is social engineering too — challenge politely.',
      ],
      questions: [
        {
          id: 'm5-q1',
          kind: 'scenario',
          selectionMode: 'single',
          weight: 2,
          scenario:
            "Your CEO emails you at 11pm: \"I'm in a board dinner — need you to wire $4,800 to a new vendor for tomorrow. Don't loop in finance, they're slow. I'll explain in the morning.\"",
          prompt: 'What is the right first move?',
          rationale:
            'This is a textbook business-email-compromise. The "urgent + bypass normal control + after hours + cannot verify out of band" pattern is the giveaway. Verifying through a separate channel and reporting takes minutes — sending money you cannot get back is irreversible.',
          choices: [
            {
              id: 'a',
              label: 'Wire the money — the CEO said it is urgent.',
              isCorrect: false,
            },
            {
              id: 'b',
              label: 'Reply to the email asking for verification.',
              isCorrect: false,
              feedback:
                'Replying gives the attacker a thread to keep social-engineering through.',
            },
            {
              id: 'c',
              label:
                'Call/Slack the CEO on a known number, AND forward the email to #security.',
              isCorrect: true,
              feedback:
                'Verify out-of-band, report — both steps. This is the textbook fix.',
            },
            {
              id: 'd',
              label: 'Loop in finance privately and wait.',
              isCorrect: false,
              feedback:
                'Looping finance is fine but the email itself must be reported now.',
            },
          ],
        },
        {
          id: 'm5-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are phishing red flags? (pick all that apply)',
          rationale:
            'Each of these — domain typosquats, urgency, secrecy, and unfamiliar payment changes — is a standard phishing pattern. A friendly tone alone proves nothing; modern phishing is friendly on purpose.',
          choices: [
            {
              id: 'a',
              label:
                'The sender domain is "cloudanzen-support.com" instead of "cloudanzen.com".',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'The message demands action in the next hour.',
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'The sender asks you to keep the request between just the two of you.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'The email has correct grammar and a friendly tone.',
              isCorrect: false,
              feedback:
                'Polished phishing is the norm now — good grammar alone is not a signal.',
            },
          ],
        },
        {
          id: 'm5-q3',
          kind: 'single_choice',
          prompt:
            'You accidentally clicked a link in a suspicious email. What do you do?',
          rationale:
            'Reporting fast is the highest-impact action. The security team can correlate, check whether credentials leaked, and lock accounts if needed. Pretending it did not happen is the worst option.',
          choices: [
            {
              id: 'a',
              label: 'Nothing — you did not enter credentials.',
              isCorrect: false,
              feedback:
                'Some phishing pages drop malware or session tokens just from a click.',
            },
            {
              id: 'b',
              label:
                'Report it in #security immediately with the email + URL details.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Wait a week to see if anything goes wrong.',
              isCorrect: false,
            },
            {
              id: 'd',
              label: 'Forward the link to a teammate to ask if it is safe.',
              isCorrect: false,
              feedback: 'You are now potentially phishing them too.',
            },
          ],
        },
      ],
    },

    {
      id: 'm6-secure-dev',
      title: 'Secure development hygiene',
      summary: 'Secrets, code review, dep updates, SSDLC.',
      body:
        'If you ship code that touches customer data, your habits ARE the security control. The big four that move the needle: never commit secrets, every change goes through review, keep dependencies fresh, and write meaningful tests around security-sensitive logic.\n\n' +
        'We block secret commits in pre-commit hooks and CI, but pre-commit hooks fail occasionally and CI checks lag the push. If you commit a secret, rotate it (do not just remove the commit) and tell #security.\n\n' +
        'Code review is not just a quality gate — it is a control. Two pairs of eyes catch the "is this query rate-limited?" or "is this endpoint authenticated?" questions that nobody can catch alone at 6pm.',
      bullets: [
        'Never commit secrets — even in branches that "no one will see".',
        'If a secret hits a repo, rotate it AND notify #security.',
        'Every change goes through review with a thoughtful description.',
        'Keep dependencies fresh; pay attention to Snyk / Dependabot PRs.',
        'Write tests around auth + data-access boundaries.',
      ],
      questions: [
        {
          id: 'm6-q1',
          kind: 'single_choice',
          prompt:
            'You realise you committed an API key in a feature branch yesterday. The branch is not merged. What do you do?',
          rationale:
            'Once a secret is in git history, the secret is leaked — even if the commit is rewritten, mirrors, forks, and CI logs may have captured it. Rotation is non-negotiable. Reporting is non-negotiable. Force-push alone is not a remediation.',
          choices: [
            {
              id: 'a',
              label:
                'Force-push to rewrite the commit and pretend it never happened.',
              isCorrect: false,
              feedback:
                'Force-push does not retroactively secure a secret that is already in git.',
            },
            {
              id: 'b',
              label: 'Rotate the key immediately AND report it in #security.',
              isCorrect: true,
              feedback:
                'Both steps. Rotation makes the secret useless; reporting lets us check exposure.',
            },
            {
              id: 'c',
              label: 'Delete the branch — that removes the commit from GitHub.',
              isCorrect: false,
              feedback:
                'Deleted branches can still be reachable via the reflog and via forks.',
            },
            {
              id: 'd',
              label: 'Add the secret to .gitignore and re-commit.',
              isCorrect: false,
              feedback: '.gitignore does not affect already-committed files.',
            },
          ],
        },
        {
          id: 'm6-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these belong in a security-sensitive code review? (pick all that apply)',
          rationale:
            'Authentication, authorization, input validation, and rate-limiting are the four most-missed angles in code reviews. Asking explicitly about each turns code review into a real control rather than a rubber-stamp.',
          choices: [
            {
              id: 'a',
              label:
                'Is this endpoint authenticated AND authorized for the right role?',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'Are inputs validated against the documented schema?',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Is there a sensible rate limit on the endpoint?',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Did the author use tabs or spaces?',
              isCorrect: false,
              feedback:
                'Lint catches that; humans should focus on security + correctness.',
            },
          ],
        },
        {
          id: 'm6-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A Dependabot PR opens for `acorn 8.9.0 → 8.11.3` flagged as a security update. The CI is green. Your sprint is full and you almost merge without reading anything.',
          prompt: 'What is the right move?',
          rationale:
            'Quick triage matters even on green-CI dependency PRs. Reading the advisory + skimming the changelog rarely takes more than a few minutes and catches the rare "this update changes behaviour you depend on" surprise. Auto-merging is fine ONLY when it is paired with attention to the resulting Slack notification.',
          choices: [
            {
              id: 'a',
              label:
                'Merge without reading — CI is green, Dependabot would not lie.',
              isCorrect: false,
              feedback:
                'CI catches breakage; it does not catch a behaviour change that flips a security default.',
            },
            {
              id: 'b',
              label:
                'Read the linked advisory + changelog, then merge if it looks safe.',
              isCorrect: true,
              feedback:
                'Right — a 2-minute read is much cheaper than a regression.',
            },
            {
              id: 'c',
              label: 'Close the PR — you have no time.',
              isCorrect: false,
              feedback:
                'Closing security-update PRs accumulates risk and shows up at audit.',
            },
            {
              id: 'd',
              label: 'Reassign to the security team.',
              isCorrect: false,
              feedback:
                'Code owners maintain their own dependencies — sec team helps with policy, not every PR.',
            },
          ],
        },
      ],
    },

    {
      id: 'm7-vendor-cloud',
      title: 'Vendor + cloud risk',
      summary: 'New SaaS, OAuth approvals, DPA basics.',
      body:
        'Every new SaaS we sign up for is a small extension of our security perimeter. A free trial of a productivity tool — innocent on the surface — can grant OAuth scopes that read your inbox or your customer documents. The vendor-onboarding workflow exists so we can evaluate that risk before the data starts flowing.\n\n' +
        'The shape is: open a #vendor-intake ticket with the use case, the data classes touched, and any contract URL. Security / legal review the DPA, sub-processors, and any AI training-data clauses. We approve, conditionally approve, or decline, and the result lives in the vendor inventory for the next review cycle.\n\n' +
        'OAuth approval prompts inside SaaS are a hidden vendor onboarding — same rules apply. If the prompt asks for "read all your Drive files" or "send mail on your behalf", do not click Accept without checking.',
      bullets: [
        'New vendor / new SaaS → open a #vendor-intake ticket first.',
        'OAuth prompt requesting broad scopes is a vendor onboarding event.',
        'Sub-processor changes from existing vendors require fresh review.',
        'No DPA, no Customer Data. No exceptions.',
        'Vendor risk reviews happen on a cadence — not just at intake.',
      ],
      questions: [
        {
          id: 'm7-q1',
          kind: 'single_choice',
          prompt:
            'You want to start using a new AI meeting-notes tool. Free trial. It needs a Google Calendar OAuth that reads all events for the next year. What do you do first?',
          rationale:
            'An OAuth scope that broad — reading every calendar event — is full vendor onboarding. The right path is the intake workflow so security can confirm the DPA, AI training clauses, and sub-processor list before any customer-related calendar entry is shared.',
          choices: [
            {
              id: 'a',
              label: 'Approve the OAuth — it is free, low-risk.',
              isCorrect: false,
              feedback: '"Free" tools fund themselves by training on data.',
            },
            {
              id: 'b',
              label:
                'Open a #vendor-intake ticket with the use case and the OAuth scopes.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Use a personal Gmail to avoid the company exposure.',
              isCorrect: false,
              feedback:
                'Now the company calendar is in a personal account too. Worse.',
            },
            {
              id: 'd',
              label: 'Wait and ask security if anyone else has used it.',
              isCorrect: false,
              feedback:
                'Pre-approved vendors live in the vendor inventory — open intake either way.',
            },
          ],
        },
        {
          id: 'm7-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are real vendor-risk events that need review? (pick all that apply)',
          rationale:
            'All of these. Even when the vendor itself does not change, who they share data with (sub-processors) and where the data sits (region / AI training) materially changes the risk profile.',
          choices: [
            {
              id: 'a',
              label: 'A vendor adds a new sub-processor.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'A vendor moves their hosting to a different region.',
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'A vendor announces they will train AI on customer data unless we opt out.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'A vendor sends us a Christmas card.',
              isCorrect: false,
            },
          ],
        },
        {
          id: 'm7-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'Sales pushes hard: "This customer wants us to integrate with their Snowflake. I already signed the DPA — can you turn it on by Friday?"',
          prompt: 'What is the right move?',
          rationale:
            'An integration that touches customer data needs the standard onboarding workflow regardless of how the conversation started. Backing into a signed DPA without security or legal in the loop is one of the more common audit findings on the integration side.',
          choices: [
            {
              id: 'a',
              label: 'Turn it on — sales already signed.',
              isCorrect: false,
              feedback:
                'A DPA is necessary, not sufficient. The integration also needs security review.',
            },
            {
              id: 'b',
              label:
                'Open the standard #vendor-intake / integration review with the DPA + scope, even if it slows Friday.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Push back hard and refuse.',
              isCorrect: false,
              feedback:
                'Help — just route through review. Outright refusal damages the partnership without buying you safety.',
            },
            {
              id: 'd',
              label: 'Ask the customer to do the security review.',
              isCorrect: false,
              feedback: "The risk is ours, not the customer's.",
            },
          ],
        },
      ],
    },

    {
      id: 'm8-incidents',
      title: 'Incidents + escalation',
      summary: 'Recognise, escalate, preserve evidence.',
      body:
        'An incident is anything that breaks — or could have broken — our security commitments. Not just attacks: a misrouted customer email, a leaked Slack invite, a deploy that exposed an unprotected endpoint, a vendor breach that touched our data. ISO 27001 Annex A.5.24 / A.5.26 / A.5.27 set the expectation that we handle these consistently.\n\n' +
        'Two things matter at first contact: speed and evidence. We have an on-call rotation; page it. Do not delete tickets, Slack threads, or screenshots — even if they are embarrassing. Evidence is what makes the postmortem meaningful and what protects us from claims later.\n\n' +
        'Postmortems are blameless. The point is the system fix, not the person. If you contributed to an incident, your most valuable action is being the most accurate witness in the postmortem.',
      bullets: [
        'When in doubt, declare an incident — under-declaration is worse than over-declaration.',
        'Preserve evidence: no deleting tickets, threads, screenshots.',
        'Page the on-call rotation, do not just DM your manager.',
        'Blameless postmortems — the system is the target, not the person.',
        'A near-miss is still worth a writeup.',
      ],
      questions: [
        {
          id: 'm8-q1',
          kind: 'ranking',
          weight: 2,
          prompt:
            'Rank these actions when you first suspect a real incident, from FIRST to LAST.',
          rationale:
            'Page on-call → preserve evidence → write what you observed → wait for instructions before remediating. Acting before the on-call has context often makes the incident worse (e.g. wiping a compromised host before it can be forensically imaged).',
          choices: [
            {
              id: 'a',
              label: 'Page the on-call security rotation.',
              rankOrder: 1,
            },
            {
              id: 'b',
              label:
                'Preserve evidence: no deleting tickets, threads, or screenshots.',
              rankOrder: 2,
            },
            {
              id: 'c',
              label: 'Write a short timeline of what you saw and when.',
              rankOrder: 3,
            },
            {
              id: 'd',
              label: 'Wait for instructions before taking remediation actions.',
              rankOrder: 4,
            },
          ],
        },
        {
          id: 'm8-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these count as security incidents we should declare? (pick all that apply)',
          rationale:
            "All of these are real incidents under our definition. A customer's data going to the wrong recipient is the most common incident class in SaaS. A laptop loss is an incident even before we know whether data was accessed.",
          choices: [
            {
              id: 'a',
              label:
                "A customer report that received another customer's data in an export.",
              isCorrect: true,
            },
            {
              id: 'b',
              label: "A teammate's managed laptop is stolen.",
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'An accidental Slack thread sharing a partial customer email externally.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'CI failed for an hour because of a transient AWS issue.',
              isCorrect: false,
              feedback:
                'Operational outage, not a security incident — different runbook.',
            },
          ],
        },
        {
          id: 'm8-q3',
          kind: 'single_choice',
          prompt:
            'After an incident, the postmortem identifies a process gap. The teammate involved feels personally responsible. What does the postmortem do with that?',
          rationale:
            "Blameless postmortems target the system, not the person. The teammate's value at this point is being the most accurate witness — they are the one who can describe exactly what went wrong. Punishment destroys the next person's willingness to report early.",
          choices: [
            {
              id: 'a',
              label:
                'Cite the teammate in the writeup so others learn from the mistake.',
              isCorrect: false,
              feedback:
                'Citing individuals discourages future reporting and misses the system fix.',
            },
            {
              id: 'b',
              label:
                'Document the system fix; thank the teammate for accurate reporting.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Skip the postmortem to avoid awkwardness.',
              isCorrect: false,
              feedback:
                'No postmortem = no system fix = same incident next quarter.',
            },
            {
              id: 'd',
              label: 'Punish the teammate quietly.',
              isCorrect: false,
              feedback: 'Direct opposite of a blameless culture.',
            },
          ],
        },
      ],
    },

    {
      id: 'm9-business-continuity',
      title: 'Business continuity awareness',
      summary: 'Backups, runbooks, the bus-factor question.',
      body:
        'ISO 27001 Annex A.5.29 / A.5.30 covers what happens when something breaks — a database, a region, a vendor. The work is mostly done by infra and product engineering, but everyone contributes: keep runbooks current, document what you are the only one who knows, and treat tabletop exercises like real fire drills.\n\n' +
        'Backups are tested. Untested backups are a folk story. If you own a system, you own the periodic restore test that proves the backup actually works.\n\n' +
        'The hardest part of continuity is human, not technical. If only one teammate knows how the X service recovers, that is a single point of failure we should fix on a normal Tuesday — not at 3am when X is down.',
      bullets: [
        'Runbooks for what YOU own; keep them current; test them.',
        'Backups are tested or they do not count.',
        'Document the things only you know — that is the bus-factor risk.',
        'Tabletop exercises matter; engage as if it were real.',
        'Recovery is a team sport — keep the runbook simple enough that the on-call who has never seen it can run it.',
      ],
      questions: [
        {
          id: 'm9-q1',
          kind: 'single_choice',
          prompt:
            "Your team's most critical database backs up nightly. The backup job is green for six months. Is the backup good?",
          rationale:
            'Green backup jobs are necessary but not sufficient. Until you have done a real restore (full or partial, on a side instance), you do not actually know whether the backup is restorable. Many incidents have died on the line "the backup was green but the restore failed".',
          choices: [
            {
              id: 'a',
              label: 'Yes — green for six months means it works.',
              isCorrect: false,
            },
            {
              id: 'b',
              label: 'Only if a recent restore actually succeeded.',
              isCorrect: true,
              feedback:
                'Right — green job + successful restore. Both, not either.',
            },
            {
              id: 'c',
              label: 'Yes — the backup tool is from a reputable vendor.',
              isCorrect: false,
            },
            {
              id: 'd',
              label: 'No — backups never work; we should use replicas instead.',
              isCorrect: false,
              feedback: 'Replicas are not backups (corruption replicates too).',
            },
          ],
        },
        {
          id: 'm9-q2',
          kind: 'multi_choice',
          prompt:
            'You are the only person who knows how a critical service recovers. Which of these reduce the bus-factor risk? (pick all that apply)',
          rationale:
            'Documenting the runbook, walking a teammate through it, and rehearsing under realistic conditions all genuinely reduce risk. "I will write it down later" is the most-cited unkept promise in tech ops.',
          choices: [
            {
              id: 'a',
              label: 'Write a runbook with the exact commands + screenshots.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'Walk a teammate through the runbook live.',
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'Run a tabletop exercise where the teammate executes from the runbook alone.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Plan to do it after the launch — there is no time now.',
              isCorrect: false,
              feedback: '"Later" is the bus-factor incident waiting to happen.',
            },
          ],
        },
        {
          id: 'm9-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A 2am tabletop exercise is announced for tomorrow. You think it is a low-priority exercise compared to real work.',
          prompt: 'What is the right attitude?',
          rationale:
            'Tabletop exercises are the cheapest place to find runbook gaps. Treating them as theatre means we discover the gaps at 2am during a real incident instead. Engage as if it were real and you will save your future self the headache.',
          choices: [
            {
              id: 'a',
              label: 'Skip — focus on real work.',
              isCorrect: false,
            },
            {
              id: 'b',
              label:
                'Show up, engage as if real, file the gaps you find afterwards.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Show up but minimise effort.',
              isCorrect: false,
            },
            {
              id: 'd',
              label:
                'Pretend the tabletop is happening but do not actually run it.',
              isCorrect: false,
            },
          ],
        },
      ],
    },

    {
      id: 'm10-audit-your-role',
      title: 'Audit + your role',
      summary: 'What auditors ask, evidence habits, A.6.3 attestation.',
      body:
        'ISO 27001 Annex A.6.3 says everyone with access to information assets gets relevant security awareness training. This course is one piece of that — your completion lands in our records as evidence the program is operating. Same idea applies to ISO 42001, SOC 2, HIPAA, NIST CSF: training records are real audit evidence.\n\n' +
        'When an auditor interviews you (it happens — they sample staff), the right move is to be honest, concise, and specific. Do not invent. "I do not know but I know who to ask" is a perfectly acceptable answer. Auditors prefer specificity over polish: "I report phishing using the button in our mail client" beats "we have a comprehensive phishing program".\n\n' +
        'Evidence is built every day, not the week before an audit. If you keep your tickets descriptive, your Slack threads searchable, and your access requests routed properly, the audit becomes a low-effort confirmation rather than an emergency reconstruction.',
      bullets: [
        'Your completed training is the A.6.3 evidence for you, personally.',
        '"I do not know but I know who to ask" is fine.',
        'Specific examples beat generic platitudes in an interview.',
        'Evidence is built daily — not the week before the audit.',
        'If you spot a gap during your normal work, file it — that IS the program.',
      ],
      questions: [
        {
          id: 'm10-q1',
          kind: 'single_choice',
          prompt:
            'An auditor asks: "How do you report a suspicious email?" What is the best answer?',
          rationale:
            'Specific, concrete, and reflects the actual control: the auditor will follow up by asking to see the button or a sample reported email. "We follow a comprehensive program" tells them nothing.',
          choices: [
            {
              id: 'a',
              label: 'We have a comprehensive phishing program.',
              isCorrect: false,
            },
            {
              id: 'b',
              label:
                'I use the "Report Phishing" button in our mail client, and I have done so a few times this quarter.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'I escalate via a centralised reporting workflow.',
              isCorrect: false,
              feedback:
                'Buzzwords without specifics — auditors push past them.',
            },
            {
              id: 'd',
              label: 'I would not know how.',
              isCorrect: false,
              feedback:
                'If this is genuinely the case, raise it in #security — the training is supposed to make sure you know.',
            },
          ],
        },
        {
          id: 'm10-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are healthy evidence habits during normal work? (pick all that apply)',
          rationale:
            'Each one materially raises the evidence quality without adding much effort. Descriptive tickets are searchable. Approval-in-thread leaves an audit trail. Linking access requests to the role explains the why for future reviewers.',
          choices: [
            {
              id: 'a',
              label: 'Write descriptive Jira ticket titles, not "fix bug".',
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'Capture approvals in the same Slack thread they were requested.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Link access requests to the role / project they are for.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Delete Slack threads after a sprint to keep things tidy.',
              isCorrect: false,
              feedback: 'You just deleted the audit trail.',
            },
          ],
        },
        {
          id: 'm10-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'An auditor asks you a question you genuinely do not know the answer to.',
          prompt: 'What is the right response?',
          rationale:
            '"I do not know" with a referral is professional, honest, and matches how auditors expect interviews to go. Inventing answers undermines the entire program when the auditor follows up and the fabrication surfaces.',
          choices: [
            {
              id: 'a',
              label: 'Make up a plausible answer.',
              isCorrect: false,
            },
            {
              id: 'b',
              label:
                'Say "I do not know — that is owned by X / I would check with them".',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Refuse to answer.',
              isCorrect: false,
              feedback: 'Refusal looks like you are hiding something.',
            },
            {
              id: 'd',
              label: 'Defer to your manager only.',
              isCorrect: false,
              feedback:
                'Referring to the actual owner is more useful than referring up.',
            },
          ],
        },
      ],
    },
  ],
};
