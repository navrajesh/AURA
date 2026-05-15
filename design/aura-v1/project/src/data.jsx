/* global */
// Mock data for AURA — Patient Reactivation OS

const CLIENTS = [
  { id: 'glow-lv', name: 'Glow Aesthetics Las Vegas', short: 'GA', tier: 'Pro · Active', provider: 'Dr. Sarah', tz: 'America/Los_Angeles' },
  { id: 'lumen-mia', name: 'Lumen Med Spa Miami', short: 'LM', tier: 'Pro · Active', provider: 'Dr. Reyes', tz: 'America/New_York' },
  { id: 'verde-aus', name: 'Verde Beauty Austin', short: 'VB', tier: 'Starter', provider: 'Dr. Patel', tz: 'America/Chicago' },
  { id: 'crescent-bk', name: 'Crescent Aesthetics Brooklyn', short: 'CA', tier: 'Pro · Trial', provider: 'Dr. Kim', tz: 'America/New_York' },
];

const SETTINGS = {
  spa_name: 'Glow Aesthetics Las Vegas',
  provider_name: 'Dr. Sarah',
  booking_link: 'https://glowlv.janeapp.com',
  reactivation_offer: '15% off your next Botox session',
  offer_expiry_date: 'May 31, 2026',
  spa_phone: '+17025550100',
  business_hours_start: '09:00',
  business_hours_end: '18:00',
  send_days: 'Tue,Wed,Thu',
  timezone: 'America/Los_Angeles',
  twilio_from_number: '+17025559999',
  mailchimp_list_id: 'abc123def456',
  escalation_phone: '+17025550101',
  escalation_email: 'owner@glowlv.com',
};

const FIRST_NAMES = ['Maya', 'Jordan', 'Priya', 'Camila', 'Aiden', 'Sofia', 'Liam', 'Olivia', 'Noah', 'Emma', 'Zara', 'Kai', 'Nina', 'Theo', 'Riley', 'Ava', 'Lila', 'Owen', 'Ines', 'Mateo', 'Naomi', 'Reese', 'Arman', 'Hana', 'Beth', 'Cora', 'Drew', 'Eve', 'Finn', 'Gigi', 'Holly', 'Iris', 'Jules', 'Kara', 'Lena', 'Mira', 'Nora', 'Pia', 'Quinn', 'Ruby'];
const LAST_NAMES = ['Patel', 'Romero', 'Chen', 'Anderson', 'Nguyen', 'Khan', 'Brooks', 'Rivera', 'Cohen', 'Wallace', 'Ito', 'Park', 'Vasquez', 'Sato', 'Marin', 'Park', 'Bauer', 'Holm', 'Singh', 'Murray', 'Lopez', 'Yang', 'Kelly', 'Diaz', 'Frey', 'Gomez', 'Hayes', 'Imani', 'Joiner', 'Klein', 'Lim', 'Moss', 'Novak', 'Ortiz', 'Pham', 'Quinn', 'Reyes', 'Solis', 'Tran', 'Vega'];
const SERVICES = ['Botox', 'Hydrafacial', 'Dermal Filler', 'Microneedling', 'Chemical Peel', 'CoolSculpting', 'Laser Hair Removal', 'IPL Photofacial', 'Lip Filler', 'Morpheus8'];

function pad(n) { return String(n).padStart(2, '0'); }
function dateMinus(days) {
  const d = new Date('2026-05-10');
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function relTime(days, hours = 0, mins = 0) {
  if (days === 0 && hours === 0) return `${mins}m ago`;
  if (days === 0) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days/7)}w ago`;
  return `${Math.floor(days/30)}mo ago`;
}

function genPatients() {
  // Seeded pseudo-random
  let s = 42;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  const statuses = [
    { v: 'enrolled', w: 38 },
    { v: 'replied', w: 9 },
    { v: 'converted', w: 6 },
    { v: 'opted_out', w: 4 },
    { v: 'no_response', w: 12 },
    { v: 'sequence_complete', w: 8 },
  ];
  const totalW = statuses.reduce((a,b) => a+b.w, 0);

  const out = [];
  for (let i = 0; i < 48; i++) {
    let r = rand() * totalW, status = 'enrolled';
    for (const s of statuses) { if ((r -= s.w) <= 0) { status = s.v; break; } }
    const lapse = 60 + Math.floor(rand() * 61); // 60-120
    const track = lapse < 75 ? '60_day' : lapse < 100 ? '90_day' : '120_day';
    const enrolled = Math.min(28, Math.floor(rand() * 32));
    const msgNum = Math.min(7, Math.max(1, [1,1,2,3,3,4,5,6,7][Math.min(8, Math.floor(enrolled / 4))]));
    const fn = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const phoneEnd = Math.floor(rand() * 9000000 + 1000000);
    const revenue = status === 'converted' ? Math.floor(rand() * 6 + 3) * 100 : 0;
    out.push({
      id: `P-${1000 + i}`,
      first_name: fn,
      last_name: ln,
      phone: `+1702${phoneEnd}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@gmail.com`,
      last_visit_date: dateMinus(lapse),
      last_service: SERVICES[Math.floor(rand() * SERVICES.length)],
      enrollment_date: dateMinus(enrolled),
      sequence_track: track,
      status: status,
      last_contacted_date: dateMinus(Math.max(0, enrolled - 3)),
      last_message_number: msgNum,
      channel_last_used: msgNum % 2 === 1 ? 'sms' : 'email',
      replied: status === 'replied' || status === 'converted',
      booking_link_clicked: rand() > 0.7,
      opted_out: status === 'opted_out',
      converted: status === 'converted',
      estimated_revenue: revenue,
      lapse_days: lapse,
      enrolled_days: enrolled,
    });
  }
  return out;
}

const PATIENTS = genPatients();

// Replies / inbox conversations
const REPLIES = [
  {
    patientId: 'P-1003', temperature: 'hot', unread: true, time: '12m ago',
    preview: "Yes! Can I book Tuesday at 3pm? Also do you have availability for fillers that day?",
    thread: [
      { dir: 'out', t: 'May 7, 10:02', text: "Hi Maya, this is Dr. Sarah from Glow Aesthetics! We've missed you. Reply YES and I'll send you something special. Reply STOP to opt out." },
      { dir: 'out', t: 'May 9, 11:14', text: "Hi Maya, just wanted to extend this for returning patients: 15% off your next Botox session — expires May 31. Book here: glowlv.janeapp.com" },
      { dir: 'in', t: 'May 9, 14:38', text: "Yes! Can I book Tuesday at 3pm? Also do you have availability for fillers that day?" },
      { dir: 'out', t: 'May 9, 14:39', text: "Thanks Maya! We will be in touch shortly to get you booked. In the meantime grab a spot here: glowlv.janeapp.com" },
    ],
  },
  {
    patientId: 'P-1011', temperature: 'hot', unread: true, time: '34m ago',
    preview: "How much is the touch-up if I'm a returning patient? Interested if it's reasonable.",
    thread: [
      { dir: 'out', t: 'May 8, 11:00', text: "Hi Jordan, this is Dr. Sarah from Glow Aesthetics! We've missed you and wanted to personally check in." },
      { dir: 'in', t: 'May 9, 14:16', text: "How much is the touch-up if I'm a returning patient? Interested if it's reasonable." },
    ],
  },
  {
    patientId: 'P-1007', temperature: 'warm', unread: true, time: '1h ago',
    preview: "Hi! I might be moving soon, but thanks for reaching out.",
    thread: [
      { dir: 'out', t: 'May 7, 10:05', text: "Hi Priya, this is Dr. Sarah from Glow Aesthetics! It's been a little while since your last visit and we'd love to have you back." },
      { dir: 'in', t: 'May 9, 13:55', text: "Hi! I might be moving soon, but thanks for reaching out." },
      { dir: 'out', t: 'May 9, 13:56', text: "Thanks for reaching out Priya! We will get back to you shortly. — Glow Aesthetics" },
    ],
  },
  {
    patientId: 'P-1019', temperature: 'warm', unread: false, time: '3h ago',
    preview: "Maybe in June? Will think about it!",
    thread: [
      { dir: 'out', t: 'May 8, 10:31', text: "Hi Camila, this is Dr. Sarah from Glow Aesthetics! Reply YES and I'll send you something special." },
      { dir: 'in', t: 'May 9, 11:48', text: "Maybe in June? Will think about it!" },
    ],
  },
  {
    patientId: 'P-1024', temperature: 'opted_out', unread: false, time: '5h ago',
    preview: "STOP",
    thread: [
      { dir: 'out', t: 'May 8, 10:31', text: "Hi Aiden, this is Dr. Sarah from Glow Aesthetics! We've missed you." },
      { dir: 'in', t: 'May 9, 09:12', text: "STOP" },
      { dir: 'out', t: 'May 9, 09:12', text: "You have been unsubscribed. Reply START to resubscribe." },
    ],
  },
  {
    patientId: 'P-1031', temperature: 'hot', unread: false, time: '8h ago',
    preview: "What times do you have this week? Available Wednesday or Thursday.",
    thread: [
      { dir: 'out', t: 'May 6, 10:14', text: "Hi Sofia, this is Dr. Sarah from Glow Aesthetics! We've missed you." },
      { dir: 'in', t: 'May 9, 06:32', text: "What times do you have this week? Available Wednesday or Thursday." },
      { dir: 'out', t: 'May 9, 06:33', text: "Thanks Sofia! We will be in touch shortly to get you booked." },
    ],
  },
  {
    patientId: 'P-1038', temperature: 'warm', unread: false, time: '1d ago',
    preview: "Thanks! Following up next month.",
    thread: [
      { dir: 'out', t: 'May 5, 11:00', text: "Hi Liam, this is Dr. Sarah from Glow Aesthetics!" },
      { dir: 'in', t: 'May 8, 16:22', text: "Thanks! Following up next month." },
    ],
  },
];

// Templates
const SMS_TEMPLATES = [
  { day: 1, channel: 'sms', purpose: 'Warm re-introduction', body: "Hi {first_name}, this is {provider_name} from {spa_name}! We've missed you and wanted to personally check in. It's been a little while since your last visit and we'd love to have you back. Reply YES and I'll send you something special. Reply STOP to opt out." },
  { day: 3, channel: 'email', purpose: 'Value reminder', body: "Reminder of the results you were working toward — no offer yet, just a check-in.", subject: "We've been thinking about you, {first_name}" },
  { day: 7, channel: 'sms', purpose: 'The offer', body: "Hi {first_name}, {provider_name} here from {spa_name}. I wanted to extend this just for returning patients: {reactivation_offer} - expires {offer_expiry_date}. Book here: {booking_link} Reply STOP to opt out." },
  { day: 12, channel: 'email', purpose: 'Social proof + soft urgency', body: "Testimonials and a reminder that the offer expires soon.", subject: "{first_name}, see what others are saying" },
  { day: 18, channel: 'sms', purpose: 'Personal check-in', body: "Hey {first_name} - just checking in from {spa_name}. Did you get a chance to see the offer I sent over? We only have a few spots this month. Happy to answer any questions. - {provider_name} Reply STOP to opt out." },
  { day: 23, channel: 'email', purpose: 'Last chance', body: "Final reminder: offer expires {offer_expiry_date}.", subject: "Last chance — {reactivation_offer} expires {offer_expiry_date}" },
  { day: 28, channel: 'sms', purpose: 'Final touchpoint', body: "Hi {first_name}, this is the last time I'll reach out. Your spot and {reactivation_offer} expire {offer_expiry_date}. Would love to see you back. {booking_link} Reply STOP anytime. - {spa_name}" },
];

// Activity log
const ACTIVITY = [
  { t: '14:38:21', lvl: 'success', msg: 'sms.send P-1003 msg=3 sid=SM4f2a... twilio=delivered', meta: 'wf2' },
  { t: '14:38:18', lvl: 'info', msg: 'patient.update P-1003 last_message_number=3 channel=sms', meta: 'wf2' },
  { t: '14:38:17', lvl: 'info', msg: 'send_window.check ok hours=10:00-14:00 day=Tue', meta: 'wf2' },
  { t: '14:36:02', lvl: 'success', msg: 'reply.received P-1003 keywords_match=[book,tuesday] temp=hot', meta: 'wf3' },
  { t: '14:36:02', lvl: 'success', msg: 'escalation.alert.sent owner_phone=+17025550101 owner_email=owner@glowlv.com', meta: 'wf3' },
  { t: '14:36:01', lvl: 'success', msg: 'autoreply.sent P-1003 template=hot_lead_ack', meta: 'wf3' },
  { t: '14:18:14', lvl: 'warn', msg: 'sms.send P-1015 msg=1 twilio_error=21211 marked invalid_number', meta: 'wf2' },
  { t: '14:18:13', lvl: 'info', msg: 'sms.send.attempt P-1015 phone=+1702550xxxx', meta: 'wf2' },
  { t: '14:12:00', lvl: 'success', msg: 'opt_out.processed P-1024 status=opted_out confirmation_sent', meta: 'wf3' },
  { t: '13:55:42', lvl: 'info', msg: 'reply.received P-1007 temp=warm queued_for_digest', meta: 'wf3' },
  { t: '11:48:02', lvl: 'info', msg: 'reply.received P-1019 temp=warm queued_for_digest', meta: 'wf3' },
  { t: '11:14:31', lvl: 'success', msg: 'sms.send P-1011 msg=1 twilio=delivered', meta: 'wf2' },
  { t: '10:02:11', lvl: 'success', msg: 'wf1.complete enrolled=14 skipped=3 dedup=2 invalid=1 elapsed=8.3s', meta: 'wf1' },
  { t: '10:02:09', lvl: 'info', msg: 'patient.enroll P-1047 track=60_day enrollment_date=2026-05-10', meta: 'wf1' },
  { t: '10:02:08', lvl: 'info', msg: 'patient.enroll P-1046 track=90_day enrollment_date=2026-05-10', meta: 'wf1' },
  { t: '10:02:07', lvl: 'info', msg: 'patient.skip P-1042 reason=already_enrolled status=enrolled', meta: 'wf1' },
  { t: '10:02:07', lvl: 'info', msg: 'patient.skip P-1041 reason=opted_out_persistent', meta: 'wf1' },
  { t: '10:02:05', lvl: 'info', msg: 'crm.boulevard.fetch records=128 lapsed=22 elapsed=4.1s', meta: 'wf1' },
  { t: '10:02:01', lvl: 'info', msg: 'wf1.start trigger=schedule cron=0 6 * * *', meta: 'wf1' },
  { t: '08:30:02', lvl: 'success', msg: 'wf4.weekly_summary.sent recipient=owner@glowlv.com', meta: 'wf4' },
  { t: '08:00:01', lvl: 'success', msg: 'wf4.daily_digest.sent hot=2 warm=3 recipient=owner@glowlv.com', meta: 'wf4' },
];

// Funnel data (current week)
const FUNNEL = [
  { stage: 'Enrolled', count: 287, color: 'var(--info)' },
  { stage: 'Contacted', count: 264, color: 'var(--text)' },
  { stage: 'Opened/Clicked', count: 92, color: 'var(--accent)' },
  { stage: 'Replied', count: 41, color: 'var(--accent-strong)' },
  { stage: 'Hot leads', count: 18, color: 'var(--warning)' },
  { stage: 'Converted', count: 11, color: 'var(--success)' },
];

// Sparklines (12-point trends)
const TRENDS = {
  enrolled: [12, 18, 14, 22, 19, 24, 21, 28, 24, 31, 27, 34],
  replies: [3, 5, 4, 7, 6, 8, 7, 9, 8, 11, 10, 13],
  conversions: [1, 1, 2, 1, 3, 2, 3, 4, 3, 5, 4, 6],
  revenue: [400, 600, 500, 1200, 900, 1300, 1100, 1700, 1400, 2100, 1900, 2700],
};

Object.assign(window, {
  CLIENTS, SETTINGS, PATIENTS, REPLIES, SMS_TEMPLATES, ACTIVITY, FUNNEL, TRENDS,
  pad, dateMinus, relTime
});
