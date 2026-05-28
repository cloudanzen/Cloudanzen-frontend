/**
 * ISO 42001 AI Governance Awareness — v2 (audit-grade).
 *
 * 10 modules, ~30 questions (~45 min). Warmer "colleague at CloudAnzen"
 * tone. Each question carries a rationale shown inline to the learner.
 *
 * BE answer keys live in cloudanzen-backend
 * `src/modules/onboarding/training-answer-keys.ts` keyed
 * `iso-42001-ai-governance-awareness@v2`. Keep both in lockstep.
 */
import type { CoursePack } from './types';

export const ISO_42001_V2: CoursePack = {
  slug: 'iso-42001-ai-governance-awareness',
  version: 2,
  passThresholdPct: 80,
  estimatedMinutes: 45,
  modules: [
    {
      id: 'm1-ai-policy',
      title: 'What our AI policy means in practice',
      summary: 'Why ISO 42001 exists and how it touches your daily work.',
      body:
        'ISO 42001 is the new international standard for an AI Management System (AIMS). It is the AI counterpart to ISO 27001 — instead of asking "are you managing information securely?", it asks "are you managing your AI use responsibly?". For CloudAnzen, an AI-native product, getting this right is not optional: our customers, regulators, and auditors all want to know we are not shipping AI features by guess.\n\n' +
        'In practice, the AIMS shows up the same way the ISMS does — as policies, evidence we collect during normal work, and short reviews each quarter. The headline rules in our AI policy (A.2.2 objectives, A.2.3 resources, A.2.4 roles) translate to: we know what each AI feature is for, we have approved budget + tooling for it, and there is a named human owner.\n\n' +
        'You will not be asked to memorise the standard. You will be asked to recognise when an AI use is in-policy, when it is borderline, and when to pause and ask. That is the entire point of awareness training.',
      bullets: [
        'AI policy is the AIMS — controls, evidence, owners, reviews.',
        'Every AI feature or workflow has a named human owner.',
        'When in doubt about an AI use, ask in #ai-governance — silence is not a control.',
        'Auditors sample real artefacts: prompts, model cards, approvals.',
        'AI risk reviews happen before launch, not after an incident.',
      ],
      questions: [
        {
          id: 'm1-q1',
          kind: 'single_choice',
          prompt:
            'Which of these best describes what the ISO 42001 AIMS is in practice at CloudAnzen?',
          rationale:
            'The AIMS is the operating system around how we build and ship AI — owners, approvals, prompts, model cards, and reviews. It is not a single document, and it is not a one-off project. Auditors look for continuous evidence the same way they do for the ISMS.',
          choices: [
            {
              id: 'a',
              label: 'A one-time questionnaire that legal fills out.',
              isCorrect: false,
              feedback:
                'A questionnaire is a snapshot; the AIMS is the continuous operation behind it.',
            },
            {
              id: 'b',
              label:
                'The continuous operation around how we build, ship, and review AI — owners, approvals, prompts, model cards, reviews.',
              isCorrect: true,
              feedback: 'Exactly — the AIMS is the everyday discipline.',
            },
            {
              id: 'c',
              label: 'A switch we flip when we add an AI feature.',
              isCorrect: false,
              feedback:
                'AI risk does not turn on and off — it is present from the first design discussion.',
            },
            {
              id: 'd',
              label: 'Only relevant to the data science team.',
              isCorrect: false,
              feedback: 'Every team that uses or buys AI is part of the AIMS.',
            },
          ],
        },
        {
          id: 'm1-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are part of "the AIMS" in practice at CloudAnzen? (pick all that apply)',
          rationale:
            'The AIMS lives in the everyday artefacts of AI work — model cards, approval tickets, prompt-test logs, and named owners. The standard document itself is the reference, not the AIMS.',
          choices: [
            {
              id: 'a',
              label: 'The model card we publish for each shipped AI feature.',
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'The Jira ticket where an AI feature got pre-launch risk-review approval.',
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'The named human owner listed against each AI workflow in our AI inventory.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'The ISO 42001 standard PDF sitting in a Drive folder.',
              isCorrect: false,
              feedback:
                'The standard is the reference; the AIMS is the operating evidence behind it.',
            },
          ],
        },
        {
          id: 'm1-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A PM proposes adding a new "AI summarisation" feature next sprint. They say it is small enough that they will skip the AI risk review and just ship it.',
          prompt: 'What is the right response?',
          rationale:
            'Every AI feature, however small, goes through pre-launch risk review under our AIMS. The review is fast for low-risk features — the point is the evidence trail, not the gate. Skipping the review is the kind of finding that loses an audit.',
          choices: [
            {
              id: 'a',
              label: 'Agree — small features do not need review.',
              isCorrect: false,
              feedback:
                '"Small" is relative; the review decides risk, not the PM.',
            },
            {
              id: 'b',
              label:
                'Encourage them to file the AI risk review; it is fast for low-risk and creates the evidence we need.',
              isCorrect: true,
              feedback:
                'Yes — fast for low-risk, mandatory for higher-risk, audit-friendly either way.',
            },
            {
              id: 'c',
              label: 'Refuse to help on the sprint.',
              isCorrect: false,
              feedback: 'Help — just route through the review.',
            },
            {
              id: 'd',
              label: 'Wait until launch and review afterwards.',
              isCorrect: false,
              feedback:
                'Reviews are pre-launch. Post-launch reviews are firefighting, not governance.',
            },
          ],
        },
      ],
    },

    {
      id: 'm2-approved-tools',
      title: 'Approved AI tools + acceptable use',
      summary: 'Which AI tools are in-policy, and what counts as "use".',
      body:
        'Our approved AI stack is documented in #ai-governance and in the AI Tool Register in Notion. The register lists which models, vendors, and SaaS AI features are allowed for which purposes, with the data classifications they are cleared for. If a tool is not on the register, treat it as not approved.\n\n' +
        'Acceptable use is shaped by three axes: the tool, the data sensitivity, and the task. A tool cleared for Internal data is not automatically cleared for Customer Data; an approved tool for code review is not automatically cleared for HR decisions. Our policy clauses A.9.2 (acceptable use) and A.9.4 (intended use) cover this — read them once.\n\n' +
        'Personal accounts, free tiers without a DPA, and "I just tried this new tool" all sit outside the AIMS. They are not banned outright, but they cannot be used for company work without going through the approval flow first.',
      bullets: [
        'Approved tools live in the AI Tool Register — check it before using a new tool.',
        'Approval is per-tool AND per-data-classification AND per-task.',
        'Personal accounts and free tiers without DPAs are not approved.',
        'New tool to try? Open a request in #ai-governance — turnaround is days, not weeks.',
        'Acceptable use is governed by A.9.2 / A.9.4 — read them once a year.',
      ],
      questions: [
        {
          id: 'm2-q1',
          kind: 'single_choice',
          prompt:
            'Your friend at another company recommends a hot new code-review AI you have not heard of. You want to try it on a CloudAnzen pull request. What is the right move?',
          rationale:
            'Unregistered AI tools have no DPA, no privacy review, and no clearance against our data classes. Even a "code-only" tool reads source that may contain customer references or secrets. The approval flow is fast — use it.',
          choices: [
            {
              id: 'a',
              label: 'Try it once on a small PR; one test is fine.',
              isCorrect: false,
              feedback:
                'One paste exfiltrates code outside our data perimeter.',
            },
            {
              id: 'b',
              label:
                'File a request in #ai-governance to add it to the AI Tool Register before using it on company code.',
              isCorrect: true,
              feedback:
                'Right — quick request, audit trail, future-you can use it for real.',
            },
            {
              id: 'c',
              label:
                'Use it from your personal account so it does not "count".',
              isCorrect: false,
              feedback:
                'Personal accounts touching company code are policy violations.',
            },
            {
              id: 'd',
              label: 'Use it on test data only with no review.',
              isCorrect: false,
              feedback:
                '"Test data" still routes through an unvetted vendor — no.',
            },
          ],
        },
        {
          id: 'm2-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are governed by A.9.2 acceptable use? (pick all that apply)',
          rationale:
            'A.9.2 covers any use that consumes the AI service — including pasting data into it, asking it to act on company systems, or building it into a customer feature. Whether you pay or it is a free tier does not change the policy footprint; the data and the action do.',
          choices: [
            {
              id: 'a',
              label:
                'Pasting a sample customer support transcript into an approved LLM to draft a reply.',
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'Asking an AI agent in the IDE to refactor a service that touches PII.',
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'Building an AI feature into the product that classifies customer findings.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Reading an article on an LLM blog at lunch.',
              isCorrect: false,
              feedback:
                'Reading public content does not invoke the policy. Consuming the AI service does.',
            },
          ],
        },
        {
          id: 'm2-q3',
          kind: 'scenario',
          selectionMode: 'multi',
          weight: 2,
          scenario:
            'A teammate suggests using a popular free LLM chatbot to brainstorm wording for a customer-facing security trust-page. They want to paste a draft we have not published yet.',
          prompt: 'Which actions are appropriate? (pick all that apply)',
          rationale:
            'A draft not-yet-public trust page is Confidential — pasting it into a free-tier LLM with no DPA and no enterprise data controls leaks the draft into the vendor logs. Switch to an approved enterprise tier, or paste only the parts that are already public. Asking #ai-governance is always a safe step.',
          choices: [
            {
              id: 'a',
              label:
                'Use our approved enterprise LLM tier instead of the free one.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'Paste only sections of the page that are already public.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Ask #ai-governance whether the use is in-policy.',
              isCorrect: true,
            },
            {
              id: 'd',
              label:
                'Paste the full draft into the free LLM since it is "just wording".',
              isCorrect: false,
              feedback:
                'Confidential drafts cannot go through unapproved vendors regardless of intent.',
            },
          ],
        },
      ],
    },

    {
      id: 'm3-sensitive-data',
      title: 'Sensitive data in AI',
      summary: 'What NEVER to paste, when to redact, when to escalate.',
      body:
        'The fastest way to fail an audit and lose customers is to leak sensitive data into an AI model. AI vendors retain prompts and outputs for varying durations; some use them for training; some are subpoena-reachable. Treat every prompt as if it could appear in a regulator letter next year.\n\n' +
        'The hard rules: never paste raw Customer Data, credentials, secrets, or ePHI into any LLM — approved or otherwise — unless the workflow is explicitly cleared for it on the AI Tool Register. Redaction patterns help (placeholders for names, tokens, IDs) but they are a second line, not a license.\n\n' +
        'When you do need AI help on sensitive material, the answer is usually "use the approved enterprise tier with zero-retention contract terms, and redact aggressively". If you cannot remember the rules, the question to ask in #ai-governance is always faster than the cleanup after a leak.',
      bullets: [
        'Never paste raw secrets, tokens, or credentials into any AI tool.',
        'Customer Data goes only into AI workflows cleared for that classification.',
        'Redaction is a second line, not a license — start with "should this be in any AI at all?".',
        'Zero-retention enterprise tiers are the right tool for sensitive AI work.',
        'Vendor logs are subpoena-reachable for years. Plan accordingly.',
      ],
      questions: [
        {
          id: 'm3-q1',
          kind: 'single_choice',
          prompt:
            'You have a stack trace from a customer bug report that includes the customer email + a partial API token. You want to ask an LLM to explain the error. What is the right approach?',
          rationale:
            'Both the email and the token need to come out before the LLM sees the prompt. Tokens in particular should be treated as live credentials even if they look truncated — rotate the token, redact the email, then ask. Pasting tokens into any LLM is a credential leak.',
          choices: [
            {
              id: 'a',
              label: 'Paste the full stack trace as-is.',
              isCorrect: false,
              feedback:
                'Pasting tokens to any LLM is a credential exposure regardless of vendor.',
            },
            {
              id: 'b',
              label:
                'Redact the email AND the token (rotate the token if production), then ask in an approved tier.',
              isCorrect: true,
              feedback:
                'Right — minimum-necessary data, approved tier, token rotated.',
            },
            {
              id: 'c',
              label:
                'Redact only the email; tokens are short enough to be safe.',
              isCorrect: false,
              feedback:
                'A "short" token is still a credential. Treat every token as live.',
            },
            {
              id: 'd',
              label: 'Forward the whole report to a teammate to paste for you.',
              isCorrect: false,
              feedback: 'Same data, different keyboard — still a leak.',
            },
          ],
        },
        {
          id: 'm3-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these belong in the "never paste into an LLM without explicit clearance" bucket? (pick all that apply)',
          rationale:
            'Production secrets, ePHI, raw customer PII, and unreleased financial figures are the textbook never-paste list. Sample dummy data and public marketing copy are fine — but the bar is "is it real, is it sensitive, and could it appear in a vendor log a year later?".',
          choices: [
            {
              id: 'a',
              label: 'A production database connection string.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'ePHI from a healthcare customer integration.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'Unreleased quarterly revenue figures.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'A made-up dummy dataset with no real customer mapping.',
              isCorrect: false,
              feedback:
                'Synthetic data is fine in approved tiers. The bar is real-and-sensitive.',
            },
          ],
        },
        {
          id: 'm3-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'Sales wants to "spice up" a customer renewal email. They ask you to paste the customer\'s account-spend report and last three support tickets into a public LLM to generate "personalised" copy.',
          prompt: 'What do you do?',
          rationale:
            'Account spend + support history is Customer Data and Confidential. Public LLMs are not cleared. Either use the approved enterprise tier with proper redaction, or write the email without LLM help. Politely-pushing-back is the in-policy answer — not silence, not compliance.',
          choices: [
            {
              id: 'a',
              label:
                'Paste it for them — it is internal-only and the email is going to the customer anyway.',
              isCorrect: false,
              feedback:
                'The customer never agreed to have their spend data routed through a third-party LLM vendor.',
            },
            {
              id: 'b',
              label:
                'Decline politely, point them at the approved enterprise tier + redaction guidelines, and offer to help.',
              isCorrect: true,
              feedback: 'Right — block the leak, offer the supported path.',
            },
            {
              id: 'c',
              label: 'Stay quiet — sales handles renewals.',
              isCorrect: false,
              feedback:
                'Silence is not a control. Engage and route to the approved path.',
            },
            {
              id: 'd',
              label: 'Forward the request to the CEO.',
              isCorrect: false,
              feedback:
                'Engage at the level you can — escalate only if push-back fails.',
            },
          ],
        },
      ],
    },

    {
      id: 'm4-ai-risk-impact',
      title: 'AI risk + impact awareness',
      summary: 'When a use needs the AI risk reviewer (and when it does not).',
      body:
        "Not every AI use is high-risk. A teammate using an approved LLM to draft a Notion page is fine; the same teammate building an AI feature that auto-decides whether to alert a customer's on-call is not. ISO 42001 expects us to recognise the difference.\n\n" +
        'Our impact framework looks at three things: who the AI affects (just you? a teammate? a customer? a regulator?), how reversible the AI decision is (a draft you read = reversible; an auto-sent message = irreversible), and how visible the AI is to the affected party (could they tell AI was in the loop?).\n\n' +
        'Use cases that touch customers, are hard to reverse, or are invisible to the affected party MUST go through the AI risk reviewer before they ship. Use cases that are internal, reversible, and clearly AI-assisted can usually proceed under standard approved-tool guidance.',
      bullets: [
        'Three axes: who is affected, how reversible, how visible.',
        'Customer-facing + irreversible + invisible = mandatory risk review.',
        'Internal-only + reversible + visible = standard approved-tool path.',
        '"Auto-decide" without a human in the loop is always high-risk.',
        'When uncertain, the AI risk reviewer is a Slack ping away.',
      ],
      questions: [
        {
          id: 'm4-q1',
          kind: 'single_choice',
          prompt:
            'Which of these AI use cases is most likely to need a formal AI risk review before shipping?',
          rationale:
            'Auto-deciding which customers to email + how + when, with no human in the loop, hits all three of the high-risk axes: customer-facing, irreversible (the email is sent), and invisible (the customer cannot tell AI chose them). The other examples are either internal, clearly assisted, or already reviewed.',
          choices: [
            {
              id: 'a',
              label:
                'You use an approved LLM to draft a Notion page about a feature spec.',
              isCorrect: false,
              feedback: 'Internal, reversible, AI is clearly assisting you.',
            },
            {
              id: 'b',
              label:
                'A new feature that auto-decides which customers to email a renewal nudge to, and sends it without human review.',
              isCorrect: true,
              feedback:
                'Customer-facing + irreversible + invisible — the textbook trigger.',
            },
            {
              id: 'c',
              label:
                'An AI code-review tool that suggests changes a human reviewer approves before merge.',
              isCorrect: false,
              feedback:
                'Reviewer in the loop = lower risk; still document in the AI register.',
            },
            {
              id: 'd',
              label:
                'A team experiment using an LLM to summarise public-blog data.',
              isCorrect: false,
              feedback:
                'Public data, internal use — standard approved-tool path.',
            },
          ],
        },
        {
          id: 'm4-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these characteristics PUSH an AI use case toward "high-risk"? (pick all that apply)',
          rationale:
            'Customer-facing decisions, irreversibility, invisibility, and high-stakes domains (security, finance, healthcare, employment) all push toward high-risk. Internal-only assisted drafting does not.',
          choices: [
            {
              id: 'a',
              label:
                'The AI output directly affects a customer outside the company.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'Once the AI acts, it is hard or impossible to reverse.',
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'The affected party cannot tell that AI was used in the decision.',
              isCorrect: true,
            },
            {
              id: 'd',
              label:
                'You use AI to summarise internal meeting notes you wrote yourself.',
              isCorrect: false,
              feedback:
                'Internal + reversible + visible-to-you — low risk under our framework.',
            },
          ],
        },
        {
          id: 'm4-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'An engineer prototypes an AI feature that auto-classifies a customer security finding as "low" or "high" severity and routes accordingly. They want to A/B test it on real production data, with no human override path.',
          prompt: 'What is the right next step?',
          rationale:
            'Auto-classification on real production findings with no human override is high-risk on every axis — customer-facing, hard to reverse (escalation triage), invisible to the affected customer. Production A/B tests on this without an AI risk review and a human override path are not in-policy.',
          choices: [
            {
              id: 'a',
              label: 'Run the A/B test — A/B testing is how we learn.',
              isCorrect: false,
              feedback:
                'High-risk AI decisions need risk review + override path BEFORE the experiment.',
            },
            {
              id: 'b',
              label:
                'Pause the rollout, file the AI risk review, and add a human override path before any production test.',
              isCorrect: true,
              feedback:
                'Right — review first, override path second, experiment third.',
            },
            {
              id: 'c',
              label: 'Run the test internally only.',
              isCorrect: false,
              feedback:
                '"Real production data" is not internal-only — customers are affected.',
            },
            {
              id: 'd',
              label: 'Wait until launch and review afterwards.',
              isCorrect: false,
              feedback: 'Post-launch reviews are not governance.',
            },
          ],
        },
      ],
    },

    {
      id: 'm5-training-data',
      title: 'Training + evaluation data',
      summary: 'Provenance, licensing, bias screening — the everyone-version.',
      body:
        'Most CloudAnzen teammates will never fine-tune a foundation model, but every team that builds AI features touches training or evaluation data in some form — prompt examples, eval sets, system-prompt seed data. Our AIMS expects each of those datasets to have a known provenance, a clear license to use, and a basic bias screening pass.\n\n' +
        'Provenance means "where did this data come from?". Public dataset? Internal synthetic data? Customer data with a contractual basis to use? Each has different downstream rules. Mixing them without recording which is which is the most common audit finding in this area.\n\n' +
        'Bias screening, even for small eval sets, is straightforward: look for class imbalance (one customer dominates the data), demographic imbalance (one language / region dominates), and outcome imbalance (the dataset only has "easy" cases). You do not need a PhD — you need a checklist and a teammate to spot-check.',
      bullets: [
        'Every eval / prompt / training dataset gets a provenance note.',
        'Customer data in training only with a documented contractual basis.',
        'Bias screening = class balance + demographic balance + outcome balance.',
        'License + retention rules differ by data source — record them.',
        'Synthetic data is fine but mark it as synthetic.',
      ],
      questions: [
        {
          id: 'm5-q1',
          kind: 'single_choice',
          prompt:
            'You are putting together a 200-row eval set for a new AI feature. What is the first thing to record?',
          rationale:
            'Provenance is the first column of any eval set under our AIMS — "where did each row come from?". Without it, you cannot answer downstream questions about license, retention, or bias screening. Skipping provenance is the single most common finding in this area.',
          choices: [
            {
              id: 'a',
              label: 'The accuracy your model reaches on the set.',
              isCorrect: false,
              feedback:
                'Accuracy without provenance is meaningless — provenance comes first.',
            },
            {
              id: 'b',
              label:
                'The provenance of each row — where it came from, license, sensitivity class.',
              isCorrect: true,
              feedback: 'Right — provenance first; the rest follows.',
            },
            {
              id: 'c',
              label: 'Your gut on whether the data feels representative.',
              isCorrect: false,
              feedback:
                '"Feels representative" is not a control. Record provenance and do bias screening.',
            },
            {
              id: 'd',
              label: 'Nothing — it is just an eval set.',
              isCorrect: false,
              feedback: 'Eval sets are part of the AIMS too.',
            },
          ],
        },
        {
          id: 'm5-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are basic bias-screening checks for an eval set? (pick all that apply)',
          rationale:
            'Class, demographic, and outcome imbalances are the three you can check fast and the three auditors most often ask about. "Total row count" is not a bias check — it is a power check.',
          choices: [
            {
              id: 'a',
              label: 'Does one customer or one source dominate the rows?',
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'Does one language, region, or demographic dominate the rows?',
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'Are all the rows "easy" cases where the right answer is obvious?',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Are there at least 1,000 rows?',
              isCorrect: false,
              feedback:
                'Volume is not the same as balance. A 1,000-row monoculture is still biased.',
            },
          ],
        },
        {
          id: 'm5-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A teammate proposes pulling 500 random support tickets from a single customer to use as training examples for a new auto-reply AI, "since we already have them".',
          prompt: 'What is the right response?',
          rationale:
            '"We already have them" is not a contractual basis to train. Customer data needs an explicit contractual basis to be used as training data — the customer support clause does not automatically grant that. Pull the legal basis first, then talk about whether one customer is even representative.',
          choices: [
            {
              id: 'a',
              label: 'Approve — we already have access to the tickets.',
              isCorrect: false,
              feedback:
                'Access is not a license to train. Contractual basis is required.',
            },
            {
              id: 'b',
              label:
                "Pause; confirm the contractual basis to train on this customer's data, then check representativeness.",
              isCorrect: true,
              feedback: 'Right — contractual basis first, bias screen second.',
            },
            {
              id: 'c',
              label: 'Pull the tickets but anonymise the customer name.',
              isCorrect: false,
              feedback:
                'Anonymisation does not create a contractual right to train on the data.',
            },
            {
              id: 'd',
              label: 'Refuse outright — training data is data-science-only.',
              isCorrect: false,
              feedback:
                'Refusing without offering a path is unhelpful; the in-policy path is to confirm the legal basis.',
            },
          ],
        },
      ],
    },

    {
      id: 'm6-human-oversight',
      title: 'Human oversight for high-risk AI',
      summary:
        'Override paths, escalation, and when "human in the loop" really means it.',
      body:
        '"Human in the loop" is one of the most-misused phrases in AI. A human glancing at a list of AI-generated decisions before clicking "approve all" is not human oversight — it is rubber-stamping. ISO 42001 expects us to design real oversight: the human can actually inspect, override, and escalate.\n\n' +
        'For every high-risk AI feature, the design should answer three questions: how does a reviewer see what the AI decided, how do they reverse a single decision (not just stop the system), and how does a customer or affected party reach a human to dispute the AI outcome? If any of those answers is "they can\'t", the feature is not ready.\n\n' +
        'Override paths must actually work in production. A "kill switch" that has not been tested in six months is not a control — it is a hope. Drills are part of the AIMS.',
      bullets: [
        'Real oversight = can inspect, can override one decision, can escalate.',
        'Rubber-stamping is not oversight — measure reviewer time and disagreement rate.',
        'Customers and affected parties need a human escalation path.',
        'Kill switches and override paths must be drilled.',
        '"AI did it" is not a defence in an incident review.',
      ],
      questions: [
        {
          id: 'm6-q1',
          kind: 'single_choice',
          prompt:
            'Which of these counts as meaningful human oversight under our AIMS?',
          rationale:
            'Inspect + override + escalate are the three components of real oversight. A glance and a bulk-approve, or simply pausing the whole system, are not oversight on the individual-decision level our policy expects.',
          choices: [
            {
              id: 'a',
              label:
                'A reviewer who can see each AI decision, override any one of them, and escalate disputed ones.',
              isCorrect: true,
              feedback:
                'Right — the three components together are meaningful oversight.',
            },
            {
              id: 'b',
              label:
                'A reviewer who sees the daily volume of AI decisions and clicks "approve all" once a day.',
              isCorrect: false,
              feedback: 'That is rubber-stamping, not oversight.',
            },
            {
              id: 'c',
              label:
                'A kill switch that turns the entire AI feature off if something goes wrong.',
              isCorrect: false,
              feedback:
                'A kill switch is a stop, not an oversight — you need per-decision controls too.',
            },
            {
              id: 'd',
              label: 'An audit log no one reads.',
              isCorrect: false,
              feedback: 'Logs need eyes; eyes that act are the control.',
            },
          ],
        },
        {
          id: 'm6-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are signals that "human oversight" has degraded into rubber-stamping? (pick all that apply)',
          rationale:
            'Sub-second review time, zero override rate, batch-approve UIs, and reviewers who never raise concerns are all classic rubber-stamping signals. The opposite — measurable disagreement, real time spent, occasional overrides — is healthy.',
          choices: [
            {
              id: 'a',
              label: 'Reviewers spend less than a second per AI decision.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'The override rate has been zero for months.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'The reviewer UI only offers a "batch approve" button.',
              isCorrect: true,
            },
            {
              id: 'd',
              label:
                'Reviewers occasionally override AI decisions and write notes.',
              isCorrect: false,
              feedback: 'That is healthy oversight, not rubber-stamping.',
            },
          ],
        },
        {
          id: 'm6-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A customer disputes an AI-generated outcome on their account. The reviewer dashboard shows the decision, but there is no button to reverse just this one — only a "pause the whole feature" toggle.',
          prompt: 'What does this tell you about the feature?',
          rationale:
            'Lacking a per-decision override is a real AIMS finding. Pausing the whole feature affects every other customer — that is collateral damage, not oversight. The fix is to add per-decision reversal, then fix the disputed case.',
          choices: [
            {
              id: 'a',
              label: 'Nothing — the kill switch is enough oversight.',
              isCorrect: false,
              feedback:
                'Kill switch ≠ per-decision oversight under our framework.',
            },
            {
              id: 'b',
              label:
                'The feature is missing required per-decision override; raise an AI risk review finding and add the control before the next release.',
              isCorrect: true,
              feedback: 'Right — per-decision reversal is the missing control.',
            },
            {
              id: 'c',
              label: 'Tell the customer the AI made a final decision.',
              isCorrect: false,
              feedback: '"AI made it" is not a defence in our policy.',
            },
            {
              id: 'd',
              label: 'Pause the whole feature indefinitely.',
              isCorrect: false,
              feedback:
                'That impacts every other customer — collateral damage.',
            },
          ],
        },
      ],
    },

    {
      id: 'm7-vendor-foundation',
      title: 'Vendor + foundation-model risk',
      summary: 'DPAs, sub-processors, model lineage, version drift.',
      body:
        'Almost every AI feature we ship rides on top of a foundation model from a vendor (OpenAI, Anthropic, Google, etc.). Each one is a sub-processor in our customer contracts, and each one has its own DPA, retention terms, and model-versioning policies. Pretending the vendor risk does not exist is the most common shortcut in AI shops our size.\n\n' +
        'For every AI vendor, three things matter: an active DPA, a documented data-flow (what data goes to them, with what retention), and a model-lineage record (which model version are we on, when did it change, what changed). The data-flow is more important than people expect — auditors ask about it constantly.\n\n' +
        'Model version drift is silent. A vendor can swap the underlying model under a stable name; behaviour changes; your eval results from last quarter no longer hold. Pinned versions, dated eval snapshots, and change-log monitoring are part of the AIMS.',
      bullets: [
        'Every AI vendor needs a DPA on file before production use.',
        'Document the data flow: what goes to the vendor, retention, deletion path.',
        'Pin model versions; do not chase the "latest" silently.',
        'Re-run evals when a model version changes.',
        'Update customer-facing sub-processor lists when AI vendors change.',
      ],
      questions: [
        {
          id: 'm7-q1',
          kind: 'single_choice',
          prompt:
            'You are about to use a new foundation-model API in a production AI feature. Which of these MUST be in place first?',
          rationale:
            'A signed DPA is the floor — without it, the vendor cannot legally process customer data on our behalf. The data-flow doc, eval baseline, and sub-processor disclosure are also expected but DPA is the non-negotiable first item.',
          choices: [
            {
              id: 'a',
              label: 'A signed DPA on file.',
              isCorrect: true,
              feedback:
                'Right — without a DPA, the vendor cannot legally process our customer data.',
            },
            {
              id: 'b',
              label: 'Approval from the head of marketing.',
              isCorrect: false,
              feedback:
                'Marketing is not the gate; legal/security review with DPA is.',
            },
            {
              id: 'c',
              label: 'A blog post explaining the feature.',
              isCorrect: false,
              feedback: 'Customer disclosure comes after legal + risk review.',
            },
            {
              id: 'd',
              label: 'A handshake with the vendor.',
              isCorrect: false,
              feedback:
                'Handshakes are not paper. Paper is the audit evidence.',
            },
          ],
        },
        {
          id: 'm7-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are documented expectations for any AI vendor we use in production? (pick all that apply)',
          rationale:
            'DPA, data-flow doc, retention terms, and pinned model version with eval-on-version-change are all standard AIMS expectations. "Customer testimonials" are not — they are marketing.',
          choices: [
            {
              id: 'a',
              label: 'Signed DPA on file.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'Documented data flow + retention terms.',
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'Pinned model version + eval snapshot on each version change.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'Customer testimonials about the vendor.',
              isCorrect: false,
              feedback: 'Marketing material is not a control.',
            },
          ],
        },
        {
          id: 'm7-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A vendor announces a "transparent" silent upgrade of their flagship model — same API name, "improved" behaviour. Your AI feature has been running on this model in production for months.',
          prompt: 'What is the right reaction?',
          rationale:
            'Silent model upgrades break eval baselines and can introduce regressions that affect customers. The in-policy response is to pin the previous version (if available), re-run evals on the new version, and update the model-card / change-log before continuing in production.',
          choices: [
            {
              id: 'a',
              label: 'Nothing — silent upgrades are usually improvements.',
              isCorrect: false,
              feedback:
                '"Usually" is not a control. Re-evaluate before continuing.',
            },
            {
              id: 'b',
              label:
                'Pin the previous version if available, re-run evals, update the model card, then decide.',
              isCorrect: true,
              feedback: 'Right — pin, re-evaluate, document, then move.',
            },
            {
              id: 'c',
              label: 'Disable the feature permanently.',
              isCorrect: false,
              feedback:
                'Disabling without a reason is overreach. Re-evaluate first.',
            },
            {
              id: 'd',
              label: 'Tell customers the model is now smarter.',
              isCorrect: false,
              feedback: 'No claim until we have evaluated.',
            },
          ],
        },
      ],
    },

    {
      id: 'm8-ai-incidents',
      title: 'AI incidents + reporting',
      summary: 'Hallucination, biased output, prompt-injection in the wild.',
      body:
        'AI incidents come in flavours that look different from classic security incidents: a model says something confidently wrong (hallucination), a model treats one demographic worse (bias), a model gets tricked by a hidden prompt in a customer file (prompt injection), or a model leaks data it should not have access to (extraction). All of these are reportable under our AIMS.\n\n' +
        'The reporting bar is the same as for security incidents: when in doubt, report. Use #ai-governance for non-urgent, page the on-call for live customer impact. Include the model + version, the prompt or input that triggered it (sanitised), and what happened. The AI-incident log is the artefact auditors review.\n\n' +
        'Reporting fast matters most when there is customer impact: an AI feature that emails the wrong customer, classifies a finding incorrectly, or exposes data is a real incident. "It is just an AI hiccup" is not a defensible response.',
      bullets: [
        'Hallucination + bias + prompt injection + data extraction are all AI incidents.',
        'Customer impact = page the on-call; non-urgent = #ai-governance.',
        'Sanitise any data in the report before pasting.',
        'AI incident log is real audit evidence — fill it out properly.',
        'When in doubt: report. Same rule as security.',
      ],
      questions: [
        {
          id: 'm8-q1',
          kind: 'ranking',
          weight: 2,
          prompt:
            'You discover an AI feature in production is occasionally emailing the wrong customer their own data. Rank these actions from FIRST to LAST.',
          rationale:
            'Page the on-call to stop the bleeding first, then file the AI incident report, then communicate to the affected customers, then schedule the postmortem. Cleanup comes before paperwork; postmortem comes after the customer-visible piece.',
          choices: [
            {
              id: 'a',
              label: 'Page the on-call to disable the affected feature path.',
              rankOrder: 1,
            },
            {
              id: 'b',
              label:
                'File the AI incident report with model + version + sanitised inputs.',
              rankOrder: 2,
            },
            {
              id: 'c',
              label: 'Notify affected customers per the incident comms plan.',
              rankOrder: 3,
            },
            {
              id: 'd',
              label: 'Schedule the postmortem and queue the fix.',
              rankOrder: 4,
            },
          ],
        },
        {
          id: 'm8-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these count as AI incidents under our AIMS? (pick all that apply)',
          rationale:
            'Hallucinations with customer impact, biased outputs, prompt injection, and data extraction all count. A teammate joking that the model is "dumb today" with no customer impact and no demonstrated harm is not a reportable AI incident.',
          choices: [
            {
              id: 'a',
              label: 'A confidently-wrong AI answer that a customer acted on.',
              isCorrect: true,
            },
            {
              id: 'b',
              label:
                'An AI feature that returns systematically worse results for one demographic.',
              isCorrect: true,
            },
            {
              id: 'c',
              label:
                'A customer-uploaded document that contained a hidden prompt and changed the AI behaviour.',
              isCorrect: true,
            },
            {
              id: 'd',
              label:
                'A teammate complaining the model is "dumb today" with no customer impact.',
              isCorrect: false,
              feedback:
                'Annoyance without impact is not an incident — log a quality issue if it recurs.',
            },
          ],
        },
        {
          id: 'm8-q3',
          kind: 'single_choice',
          prompt:
            'You suspect prompt injection — an AI feature is reading text from customer files and the output suggests it executed instructions embedded in a file. What is the right first step?',
          rationale:
            'Prompt injection is a live security event when it lets the AI take actions on customer systems or expose data. Report immediately to #security and #ai-governance so the affected feature can be paused and the injection vector investigated; do not try to "test" further in production yourself.',
          choices: [
            {
              id: 'a',
              label: 'Test it on more customer files yourself to confirm.',
              isCorrect: false,
              feedback: 'Each additional test risks more customer exposure.',
            },
            {
              id: 'b',
              label:
                'Report immediately to #security and #ai-governance; pause the feature path while it is investigated.',
              isCorrect: true,
              feedback: 'Right — report and pause; investigate in isolation.',
            },
            {
              id: 'c',
              label: 'Ignore — prompt injection is just a theoretical risk.',
              isCorrect: false,
              feedback: 'Prompt injection is real and frequently exploited.',
            },
            {
              id: 'd',
              label:
                'Post the suspicious file content in #general for discussion.',
              isCorrect: false,
              feedback: 'Customer file content does not belong in #general.',
            },
          ],
        },
      ],
    },

    {
      id: 'm9-transparency',
      title: 'Transparency + customer disclosure',
      summary: 'When to tell the customer AI is in the loop.',
      body:
        'Customers increasingly expect to know when AI is involved in a decision that affects them. ISO 42001 frames this as a transparency obligation — and several jurisdictions (EU AI Act, NYC Local Law 144, others) are turning that expectation into law. Our policy is to be transparent by default.\n\n' +
        'Three rules cover most cases: tell the customer when AI directly affects their account (auto-decisions, generated content sent to them), include AI vendors in our public sub-processor list, and give customers a path to ask a human about an AI outcome. Those three together cover the bulk of regulatory and audit expectations.\n\n' +
        'Internal AI use (drafting, summarising, code-review) does not always need customer-level disclosure but should be disclosed in our trust-center under "how we use AI". The bar is "could the customer reasonably want to know?".',
      bullets: [
        'AI that directly affects a customer outcome = disclose to the customer.',
        'AI vendors that touch customer data = public sub-processor list.',
        'Customers can always reach a human about an AI outcome.',
        'Internal AI use goes in the trust-center "how we use AI" section.',
        'When uncertain, disclose. Transparency is a feature, not a tax.',
      ],
      questions: [
        {
          id: 'm9-q1',
          kind: 'single_choice',
          prompt:
            'A new AI feature auto-suggests an answer in a customer-facing chat widget. The customer can accept, edit, or ignore the suggestion. Does the customer need to know AI is involved?',
          rationale:
            'Yes — even with the human-in-the-loop control, the AI is generating content the customer will receive. A simple "Suggested by AI, edited by a human" tag (or similar) is the standard disclosure pattern. Hiding the AI involvement undermines trust if it surfaces later.',
          choices: [
            {
              id: 'a',
              label: 'No — a human edits it before sending.',
              isCorrect: false,
              feedback:
                'The AI is still contributing to what the customer sees. Disclose.',
            },
            {
              id: 'b',
              label:
                'Yes — disclose with a label or pattern (e.g. "AI-drafted, human-reviewed").',
              isCorrect: true,
              feedback: 'Right — disclose by default; pattern is fine.',
            },
            {
              id: 'c',
              label: 'Only if the customer asks.',
              isCorrect: false,
              feedback:
                '"Ask first" is opt-in disclosure — our default is opt-out.',
            },
            {
              id: 'd',
              label: 'Only if the law in their jurisdiction requires it.',
              isCorrect: false,
              feedback:
                'Our standard is global; we do not chase the lowest jurisdiction.',
            },
          ],
        },
        {
          id: 'm9-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these are standard transparency artefacts at CloudAnzen? (pick all that apply)',
          rationale:
            'Sub-processor list, trust-center "how we use AI" page, in-product AI labelling, and a human-escalation path are all standard. A secret internal Notion page is not a transparency artefact — by definition.',
          choices: [
            {
              id: 'a',
              label:
                'The public sub-processor list updated when AI vendors change.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'The "how we use AI" page in the trust-center.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'In-product labelling that flags AI-generated content.',
              isCorrect: true,
            },
            {
              id: 'd',
              label:
                'A secret internal Notion page about which features use AI.',
              isCorrect: false,
              feedback: 'Secret is the opposite of transparent.',
            },
          ],
        },
        {
          id: 'm9-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'A customer support agent sends a customer an AI-drafted reply without labelling it. The customer later discovers it was AI-generated and complains they were "talking to a bot".',
          prompt: 'What is the lesson for the AIMS?',
          rationale:
            'The cleanup is: apologise to the customer, add the AI-drafted label going forward, and update the training / playbook so the next agent does not repeat the omission. The lesson is that disclosure is cheap up front; cleanup is expensive later.',
          choices: [
            {
              id: 'a',
              label: 'Customers should not assume any reply is human-written.',
              isCorrect: false,
              feedback: 'Placing the burden on the customer is not our policy.',
            },
            {
              id: 'b',
              label:
                'Disclosure is cheap up front; cleanup is expensive after the fact. Add labelling + update the playbook.',
              isCorrect: true,
              feedback: 'Right — disclose by default; fix the process.',
            },
            {
              id: 'c',
              label: 'Tell the customer "all of our replies are AI now".',
              isCorrect: false,
              feedback: 'Overclaiming in either direction is not transparency.',
            },
            {
              id: 'd',
              label: 'Block the customer for complaining.',
              isCorrect: false,
              feedback: 'Customer complaints are signal.',
            },
          ],
        },
      ],
    },

    {
      id: 'm10-model-card',
      title: 'Model card + records discipline',
      summary: 'What we keep, where, why auditors love it.',
      body:
        'A model card is a one-page (or few-page) record of what an AI feature is, what it is for, what it is NOT for, who owns it, which model version it uses, when it was last evaluated, and how it can be turned off. Every AI feature we ship to customers has one. Every internal AI workflow that touches Confidential or Customer Data has one.\n\n' +
        'Auditors love model cards because they answer the questions they would otherwise have to ask in long meetings: what does this thing do, who decided it should exist, how do we know it works, who is accountable. A current model card is worth ten paragraphs of "trust us".\n\n' +
        'Records discipline means the model cards do not rot. Quarterly review (or on every material change — new model version, new dataset, new failure mode) keeps them honest. A model card that has not been touched in 18 months is a finding.',
      bullets: [
        'Every customer-facing or sensitive AI feature has a current model card.',
        'Model card answers: what, who, version, eval, off-switch.',
        'Quarterly review or on material change — whichever comes first.',
        'Out-of-date cards are findings, not "minor housekeeping".',
        'Model cards are public-friendly: most of them go in the trust-center.',
      ],
      questions: [
        {
          id: 'm10-q1',
          kind: 'single_choice',
          prompt: 'Which of these belongs on a model card?',
          rationale:
            'Owner + intended use + non-uses + model version + eval baseline + off-switch are the standard fields. "Marketing tagline" is not — model cards are operational, not promotional.',
          choices: [
            {
              id: 'a',
              label: 'A marketing tagline.',
              isCorrect: false,
              feedback:
                'Marketing copy lives elsewhere; the card is operational.',
            },
            {
              id: 'b',
              label:
                'Named owner, intended use, non-uses, model version, last eval, off-switch.',
              isCorrect: true,
              feedback: 'Right — the operational core of the card.',
            },
            {
              id: 'c',
              label: "The engineer's favourite quote.",
              isCorrect: false,
              feedback: 'Save the quotes for Slack bios.',
            },
            {
              id: 'd',
              label: 'A cost spreadsheet only.',
              isCorrect: false,
              feedback: 'Cost is fine to include but not the substance.',
            },
          ],
        },
        {
          id: 'm10-q2',
          kind: 'multi_choice',
          prompt:
            'Which of these trigger a model-card review? (pick all that apply)',
          rationale:
            'New model version, new training data, new failure mode in production, and the quarterly review cadence all trigger an update. A teammate going on holiday does not — that is an ownership rotation question, not a model-card one.',
          choices: [
            {
              id: 'a',
              label: 'A new model version from the vendor.',
              isCorrect: true,
            },
            {
              id: 'b',
              label: 'A new dataset added to training or evaluation.',
              isCorrect: true,
            },
            {
              id: 'c',
              label: 'A new failure mode observed in production.',
              isCorrect: true,
            },
            {
              id: 'd',
              label: 'The named owner is on holiday for a week.',
              isCorrect: false,
              feedback:
                'Cover the ownership during the holiday; the card itself is not the issue.',
            },
          ],
        },
        {
          id: 'm10-q3',
          kind: 'scenario',
          selectionMode: 'single',
          scenario:
            'An auditor asks you in a walkthrough: "show me the model card for your AI risk-classifier and tell me when it was last reviewed". You open the card and it was last touched 14 months ago.',
          prompt: 'What is the right move in the moment AND afterwards?',
          rationale:
            'Be honest: the card is stale, that is a finding, here is the plan. Trying to spin a 14-month-old model card as current is the kind of move that turns a minor finding into a major one. Acknowledge, commit to remediation, follow up in writing — that is the AIMS posture.',
          choices: [
            {
              id: 'a',
              label:
                'Tell the auditor the card "is being updated as we speak".',
              isCorrect: false,
              feedback:
                'Audit-fibbing is the most common way a finding goes from minor to major.',
            },
            {
              id: 'b',
              label:
                'Acknowledge the staleness as a finding, commit to a remediation date, follow up in writing.',
              isCorrect: true,
              feedback:
                'Right — honesty + remediation date is the AIMS posture.',
            },
            {
              id: 'c',
              label: 'Refuse to show the card.',
              isCorrect: false,
              feedback: 'Refusing is worse than a finding.',
            },
            {
              id: 'd',
              label: 'Edit the model card in front of the auditor.',
              isCorrect: false,
              feedback:
                'Backfilling in-meeting is exactly what auditors are watching for.',
            },
          ],
        },
      ],
    },
  ],
};
