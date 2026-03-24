export type ContactStatus =
  | 'new'
  | 'tour_scheduled'
  | 'follow_up_sent'
  | 'escalated'
  | 'resolved';

export type Actor =
  | 'Applicant'
  | 'IntakeAgent'
  | 'SchedulingAgent'
  | 'CommunicationAgent'
  | 'EscalationAgent';

export type EventType = 'sms' | 'system';

export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO
  actor: Actor;
  type: EventType;
  message: string;
}

export interface Contact {
  id: string;
  name: string;
  channel: 'SMS' | 'Phone' | 'Web';
  timestamp: string; // ISO — most recent activity
  status: ContactStatus;
  preview: string;
  escalationReason?: string;
  timeline: TimelineEvent[];
}

export interface ClientConfig {
  name: string;
  location: string;
  contacts: Contact[];
}

export const cagConfig: ClientConfig = {
  name: 'CAG Property Management',
  location: 'Philadelphia, PA',
  contacts: [
    // ── 1. Marcus Webb — Tour resolved ──────────────────────────────────────
    {
      id: 'marcus-webb',
      name: 'Marcus Webb',
      channel: 'SMS',
      timestamp: '2026-03-16T20:02:00Z',
      status: 'resolved',
      preview: 'Tour completed — contact resolved',
      timeline: [
        {
          id: 'mw-1',
          timestamp: '2026-03-15T13:47:00Z',
          actor: 'Applicant',
          type: 'sms',
          message:
            "Hi, I saw your listing for 3443 Bowman St on Zillow. Is the 2BR still available?",
        },
        {
          id: 'mw-2',
          timestamp: '2026-03-15T13:47:30Z',
          actor: 'IntakeAgent',
          type: 'system',
          message: 'New SMS inquiry received — contact record created',
        },
        {
          id: 'mw-3',
          timestamp: '2026-03-15T13:48:00Z',
          actor: 'IntakeAgent',
          type: 'sms',
          message:
            "Hi Marcus! Yes, the 2BR at 3443 Bowman St is still available. I'd love to help you schedule a tour — what days and times work best for you this week?",
        },
        {
          id: 'mw-4',
          timestamp: '2026-03-15T14:12:00Z',
          actor: 'Applicant',
          type: 'sms',
          message: "Tomorrow afternoon works, like 2 or 3pm?",
        },
        {
          id: 'mw-5',
          timestamp: '2026-03-15T14:12:45Z',
          actor: 'SchedulingAgent',
          type: 'system',
          message: 'Checking calendar availability for 3443 Bowman St...',
        },
        {
          id: 'mw-6',
          timestamp: '2026-03-15T14:13:00Z',
          actor: 'SchedulingAgent',
          type: 'sms',
          message:
            "I've booked you for a tour at 3443 Bowman St on Monday, March 16 at 2:30 PM. Our leasing consultant will meet you at the front entrance. Reply CONFIRM to lock it in.",
        },
        {
          id: 'mw-7',
          timestamp: '2026-03-15T14:15:00Z',
          actor: 'Applicant',
          type: 'sms',
          message: "CONFIRM",
        },
        {
          id: 'mw-8',
          timestamp: '2026-03-16T17:30:00Z',
          actor: 'CommunicationAgent',
          type: 'sms',
          message:
            "Hi Marcus! Just a reminder that your tour at 3443 Bowman St is today at 2:30 PM. See you soon — text us if anything comes up.",
        },
        {
          id: 'mw-9',
          timestamp: '2026-03-16T20:02:00Z',
          actor: 'CommunicationAgent',
          type: 'system',
          message: 'Tour completed — contact marked resolved',
        },
      ],
    },

    // ── 2. Tanya Okafor — Application, 48hr follow-up sent ─────────────────
    {
      id: 'tanya-okafor',
      name: 'Tanya Okafor',
      channel: 'Web',
      timestamp: '2026-03-22T19:34:00Z',
      status: 'follow_up_sent',
      preview: 'Automated 48hr follow-up sent — awaiting leasing response',
      timeline: [
        {
          id: 'to-1',
          timestamp: '2026-03-20T19:33:00Z',
          actor: 'Applicant',
          type: 'system',
          message:
            'Online application submitted — 1892 Tyson Ave, Unit 2F. Application fee processed ($50).',
        },
        {
          id: 'to-2',
          timestamp: '2026-03-20T19:33:30Z',
          actor: 'IntakeAgent',
          type: 'system',
          message:
            'Application received. Background check queued. Assigned to leasing review queue.',
        },
        {
          id: 'to-3',
          timestamp: '2026-03-20T19:34:00Z',
          actor: 'IntakeAgent',
          type: 'sms',
          message:
            "Hi Tanya! We've received your application for 1892 Tyson Ave, Unit 2F along with your application fee. A leasing agent will be in touch within 1–2 business days.",
        },
        {
          id: 'to-4',
          timestamp: '2026-03-22T19:33:00Z',
          actor: 'CommunicationAgent',
          type: 'system',
          message:
            '48-hour mark reached — no response from leasing team. Sending automated follow-up.',
        },
        {
          id: 'to-5',
          timestamp: '2026-03-22T19:34:00Z',
          actor: 'CommunicationAgent',
          type: 'sms',
          message:
            "Hi Tanya, just checking in on your application for 1892 Tyson Ave. We're still reviewing and appreciate your patience. Do you have any questions in the meantime? We'll be in touch very soon.",
        },
      ],
    },

    // ── 3. DeShawn Briggs — Escalated, no callback ──────────────────────────
    {
      id: 'deshawn-briggs',
      name: 'DeShawn Briggs',
      channel: 'Phone',
      timestamp: '2026-03-23T21:15:00Z',
      status: 'escalated',
      preview: 'Escalated — 2 missed calls, no callback after 5+ hours',
      escalationReason: '2 missed calls with no callback issued after 5+ hours',
      timeline: [
        {
          id: 'db-1',
          timestamp: '2026-03-23T16:14:00Z',
          actor: 'Applicant',
          type: 'system',
          message: 'Inbound call received — no answer, voicemail left by caller.',
        },
        {
          id: 'db-2',
          timestamp: '2026-03-23T16:14:30Z',
          actor: 'IntakeAgent',
          type: 'system',
          message: 'Voicemail logged. Callback task added to leasing queue.',
        },
        {
          id: 'db-3',
          timestamp: '2026-03-23T18:47:00Z',
          actor: 'Applicant',
          type: 'system',
          message: 'Second inbound call received — no answer, second voicemail left.',
        },
        {
          id: 'db-4',
          timestamp: '2026-03-23T18:47:30Z',
          actor: 'IntakeAgent',
          type: 'system',
          message: 'Second missed call noted. Callback urgency elevated to high.',
        },
        {
          id: 'db-5',
          timestamp: '2026-03-23T21:14:00Z',
          actor: 'EscalationAgent',
          type: 'system',
          message:
            'Escalation triggered — 5+ hours elapsed with 2 missed calls and no callback issued.',
        },
        {
          id: 'db-6',
          timestamp: '2026-03-23T21:15:00Z',
          actor: 'EscalationAgent',
          type: 'sms',
          message:
            "Hi DeShawn, we sincerely apologize for the delay. A member of our leasing team will call you back within the next 30 minutes.",
        },
      ],
    },

    // ── 4. Carmen Reyes — Maintenance, resolved ─────────────────────────────
    {
      id: 'carmen-reyes',
      name: 'Carmen Reyes',
      channel: 'Web',
      timestamp: '2026-03-22T19:21:00Z',
      status: 'resolved',
      preview: 'Heating repair confirmed complete',
      timeline: [
        {
          id: 'cr-1',
          timestamp: '2026-03-21T22:08:00Z',
          actor: 'Applicant',
          type: 'system',
          message:
            'Maintenance request submitted: Heating unit not functioning — 7201 Bradford St, Apt 3. No heat since last night.',
        },
        {
          id: 'cr-2',
          timestamp: '2026-03-21T22:08:30Z',
          actor: 'IntakeAgent',
          type: 'system',
          message: 'Request received. Priority: HIGH. Creating work order.',
        },
        {
          id: 'cr-3',
          timestamp: '2026-03-21T22:09:00Z',
          actor: 'IntakeAgent',
          type: 'sms',
          message:
            "Hi Carmen, we've received your heating repair request for 7201 Bradford St and flagged it as urgent. Our maintenance coordinator will be in contact shortly.",
        },
        {
          id: 'cr-4',
          timestamp: '2026-03-21T23:45:00Z',
          actor: 'IntakeAgent',
          type: 'system',
          message:
            'Work order #MT-2847 created and assigned to Mike Donovan (HVAC). Scheduled for tomorrow morning.',
        },
        {
          id: 'cr-5',
          timestamp: '2026-03-21T23:46:00Z',
          actor: 'CommunicationAgent',
          type: 'sms',
          message:
            "Update: Work order #MT-2847 has been assigned to our HVAC technician and is scheduled for tomorrow morning between 8–11 AM. He'll text you 30 minutes before arrival.",
        },
        {
          id: 'cr-6',
          timestamp: '2026-03-22T19:20:00Z',
          actor: 'CommunicationAgent',
          type: 'system',
          message: 'Work order #MT-2847 marked complete by technician.',
        },
        {
          id: 'cr-7',
          timestamp: '2026-03-22T19:21:00Z',
          actor: 'CommunicationAgent',
          type: 'sms',
          message:
            "Hi Carmen, your heating repair at 7201 Bradford St has been completed and the work order is closed. Please don't hesitate to reach out if anything else comes up!",
        },
      ],
    },

    // ── 5. Patricia Osei — Proactive lease renewal ──────────────────────────
    {
      id: 'patricia-osei',
      name: 'Patricia Osei',
      channel: 'SMS',
      timestamp: '2026-03-23T16:01:00Z',
      status: 'follow_up_sent',
      preview: 'Proactive renewal reminder sent — awaiting response',
      timeline: [
        {
          id: 'po-1',
          timestamp: '2026-03-23T16:00:00Z',
          actor: 'CommunicationAgent',
          type: 'system',
          message:
            'Lease renewal scan — 2210 Cheltenham Ave, Unit 4B expires April 22 (30 days). No prior outreach on file.',
        },
        {
          id: 'po-2',
          timestamp: '2026-03-23T16:01:00Z',
          actor: 'CommunicationAgent',
          type: 'sms',
          message:
            "Hi Patricia! Your lease at 2210 Cheltenham Ave is coming up for renewal on April 22. We'd love to have you continue as a resident! Reply RENEW to get started, or call our office at (215) 555-0192 to discuss your options.",
        },
        {
          id: 'po-3',
          timestamp: '2026-03-23T16:01:30Z',
          actor: 'CommunicationAgent',
          type: 'system',
          message: 'Proactive renewal message sent — awaiting tenant response.',
        },
      ],
    },

    // ── 6. Jordan Flint — Tour confirmed ────────────────────────────────────
    {
      id: 'jordan-flint',
      name: 'Jordan Flint',
      channel: 'Web',
      timestamp: '2026-03-23T19:18:00Z',
      status: 'tour_scheduled',
      preview: 'Tour confirmed — Mar 24 at 11:00 AM',
      timeline: [
        {
          id: 'jf-1',
          timestamp: '2026-03-22T17:15:00Z',
          actor: 'Applicant',
          type: 'system',
          message:
            'Tour booking submitted via website — 5118 Rising Sun Ave, Unit 1A. Requested time: March 24 at 11:00 AM.',
        },
        {
          id: 'jf-2',
          timestamp: '2026-03-22T17:15:30Z',
          actor: 'SchedulingAgent',
          type: 'system',
          message: 'Tour booked in scheduling system. Awaiting office confirmation.',
        },
        {
          id: 'jf-3',
          timestamp: '2026-03-23T17:00:00Z',
          actor: 'SchedulingAgent',
          type: 'system',
          message:
            '24-hour pre-tour check: no office confirmation on file. Sending confirmation SMS to applicant.',
        },
        {
          id: 'jf-4',
          timestamp: '2026-03-23T17:01:00Z',
          actor: 'SchedulingAgent',
          type: 'sms',
          message:
            "Hi Jordan! Confirming your tour at 5118 Rising Sun Ave, Unit 1A for tomorrow, Tuesday March 24 at 11:00 AM. Our leasing agent will meet you at the front entrance. Reply YES to confirm your spot.",
        },
        {
          id: 'jf-5',
          timestamp: '2026-03-23T19:18:00Z',
          actor: 'Applicant',
          type: 'sms',
          message: "YES, see you tomorrow!",
        },
        {
          id: 'jf-6',
          timestamp: '2026-03-23T19:18:30Z',
          actor: 'SchedulingAgent',
          type: 'system',
          message: 'Tour confirmed by applicant. Calendar event updated.',
        },
      ],
    },
  ],
};

// ── Simulation flow ───────────────────────────────────────────────────────────

export interface SimStep {
  delayMs: number;
  event?: {
    id: string;
    actor: Actor;
    type: EventType;
    message: string;
  };
  statusUpdate?: ContactStatus;
  previewUpdate?: string;
  /** If defined, set the "thinking" indicator to this value after this step fires. */
  thinking?: boolean;
}

const TOUR_SLOT = 'Thursday, March 26 at 2:00 PM';

export const marcusWebbSimFlow: SimStep[] = [
  {
    delayMs: 0,
    event: {
      id: 'sim-1',
      actor: 'Applicant',
      type: 'sms',
      message:
        'Hi, I saw the 3443 Bowman St listing on Zillow. Is it still available and can I schedule a tour?',
    },
    previewUpdate: 'Hi, I saw the 3443 Bowman St listing on Zillow...',
    thinking: false,
  },
  {
    delayMs: 1500,
    event: {
      id: 'sim-2',
      actor: 'IntakeAgent',
      type: 'system',
      message: 'Message received. Classified as TOUR_REQUEST. Routing to SchedulingAgent.',
    },
    thinking: true,
  },
  {
    delayMs: 3000,
    event: {
      id: 'sim-3',
      actor: 'SchedulingAgent',
      type: 'system',
      message: `Availability check complete. Next available slot: ${TOUR_SLOT}. Preparing confirmation.`,
    },
    thinking: true,
  },
  {
    delayMs: 5000,
    event: {
      id: 'sim-4',
      actor: 'CommunicationAgent',
      type: 'sms',
      message: `Hi Marcus! Thanks for your interest in 3443 Bowman St. We have a tour available ${TOUR_SLOT}. Reply YES to confirm or call us at any time. — CAG Property Management`,
    },
    thinking: false,
    previewUpdate: `Tour available ${TOUR_SLOT} — awaiting confirmation`,
  },
  {
    delayMs: 8000,
    event: {
      id: 'sim-5',
      actor: 'Applicant',
      type: 'sms',
      message: 'YES',
    },
  },
  {
    delayMs: 9500,
    event: {
      id: 'sim-6',
      actor: 'CommunicationAgent',
      type: 'sms',
      message: `You're confirmed! Tour at 3443 Bowman St on ${TOUR_SLOT}. We'll meet you at the front entrance. See you then! — CAG Property Management`,
    },
  },
  {
    delayMs: 11000,
    event: {
      id: 'sim-7',
      actor: 'CommunicationAgent',
      type: 'system',
      message: 'Tour confirmed. Calendar event created. No further action required.',
    },
    statusUpdate: 'tour_scheduled',
    previewUpdate: `Tour confirmed — ${TOUR_SLOT}`,
    thinking: false,
  },
];
