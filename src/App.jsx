import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Download,
  Eye,
  EyeOff,
  Info,
  Lightbulb,
  RefreshCcw,
  Scale,
  Sparkles,
  Undo2,
  Users,
} from "lucide-react";

const VERSION = "2.3.7";
const RECEIPT_VERSION = "1.2";
const DEFAULT_EXPIRY = 30;
const SCHOOL_START = 8;
const SCHOOL_END = 16;
const QUEUE_NOTE = "Estimates are ranges, not guarantees.";

const routeMeta = {
  now: {
    label: "Notify a counsellor now",
    detail: "Expected callback: 10-20 min",
    queue: { label: "high demand", wait: "25-40 min" },
    chip: "Notify now",
  },
  later: {
    label: "Notify later",
    detail: "You decide the time window",
    queue: { label: "moderate", wait: "15-25 min" },
    chip: "Notify later",
  },
  anon: {
    label: "Anonymous screening only",
    detail: "No one is notified unless you change this",
    queue: { label: "separate", wait: "5-10 min" },
    chip: "Anonymous",
  },
};

const annotationSets = {
  consent: [
    {
      stakeholder: "Stakeholder -> Student / Counsellor",
      hci: "HCI: Negotiability",
      tension: "Tension: choice pacing vs drop-off risk",
    },
    {
      stakeholder: "Stakeholder -> Parents",
      hci: "HCI: Privacy-by-default",
      tension: "Tension: safety claims vs autonomy",
    },
    {
      stakeholder: "Stakeholder -> Admin / Policy",
      hci: "HCI: Defaults-as-governance",
      tension: "Tension: who sets expiry rules controls reporting",
    },
  ],
  results: [
    {
      stakeholder: "Stakeholder -> Model / Scale authors",
      hci: "HCI: Explainability & legibility",
      tension: "Tension: metric != meaning; avoid false certainty",
    },
    {
      stakeholder: "Stakeholder -> Student",
      hci: "HCI: Transparency fallacy",
      tension: "Tension: more info != more trust; tone matters",
    },
    {
      stakeholder: "Stakeholder -> Service ops",
      hci: "HCI: Load-aware routing & fairness",
      tension: "Tension: who is delayed vs who benefits",
    },
  ],
  referral: [
    {
      stakeholder: "Stakeholder -> Admin / Policy",
      hci: "HCI: Agency & revocability",
      tension: "Tension: one-way reporting vs reversible consent",
    },
    {
      stakeholder: "Stakeholder -> Parents",
      hci: "HCI: Value trade-offs",
      tension: "Tension: who defines 'safe enough'?",
    },
    {
      stakeholder: "Stakeholder -> Service metrics",
      hci: "HCI: Feedback loops",
      tension: "Tension: withdrawals recycle queue -- impacts KPIs",
    },
  ],
};

const a2Cues = [
  "Participants paused at \"who will be told\"; repeated scanning around consent step.",
  "SUS ~ 67; UTAUT-2 ~ 4.1-4.25/5 (acceptable usability, yet a trust gap remains).",
  "Red 'risk' visuals increased anxiety -> replaced with neutral bands.",
];

const evidenceBlocks = [
  { title: "Item clusters", detail: "sleep, appetite" },
  { title: "Self-report", detail: '"hard to focus mornings" (3/5)' },
  { title: "Time factor", detail: "increased over 2 weeks" },
];

const contactOptions = [
  { key: "counsellor", label: "Counsellor" },
  { key: "parent", label: "Parent / Guardian" },
  { key: "lead", label: "Year level lead" },
];

const notifyTimings = [
  { key: "now", label: "Now" },
  { key: "end", label: "End of day" },
  { key: "custom", label: "Choose time" },
];

const stepItems = ["Who", "When", "Confirm"];

const annotationVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1 },
};

const shimmerVariants = {
  initial: { backgroundPosition: "-200% 0" },
  animate: {
    backgroundPosition: "200% 0",
    transition: { duration: 1.2, repeat: Infinity, ease: "linear" },
  },
};

const formatStampDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const formatTimer = (seconds) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}s`;
};

const isOutsideSchoolHours = (value) => {
  if (!value) return false;
  const candidate = new Date(value);
  if (Number.isNaN(candidate.getTime())) return false;
  const hour = candidate.getHours();
  return hour < SCHOOL_START || hour >= SCHOOL_END;
};

const formatNotifyLabel = (key, customWindow) => {
  if (key === "end") return "end-of-day";
  if (key === "custom") {
    if (!customWindow) return "window pending";
    const date = new Date(customWindow);
    if (Number.isNaN(date.getTime())) return "window pending";
    return date.toLocaleString("en-AU", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return "immediate";
};

const formatNotifiedLine = (map) =>
  contactOptions
    .map(({ key, label }) => `${label} (${map[key] ? "\u2713" : "\u00d7"})`)
    .join(" ");

const formatReceipt = ({
  route,
  expiryDays,
  selectedContacts,
  notifyTiming,
  customWindow,
  acknowledged,
  withdrawn,
  withdrawalStamp,
}) => {
  const routeLabel = route;
  const whenLabel = formatNotifyLabel(notifyTiming, customWindow);
  const notifiedLine = formatNotifiedLine(selectedContacts);
  const ack = acknowledged ? "(\u2713)" : "(\u00d7)";
  const receiptId = `CL-CR-${String(Math.floor(Math.random() * 90000) + 10000)}`;
  const status = withdrawn
    ? `Withdrawn (${withdrawalStamp})`
    : `Active (${withdrawalStamp})`;

  return `CONSENT RECEIPT — CareLink Schools
Receipt ID: ${receiptId} · Version: ${RECEIPT_VERSION} · Expires: ${expiryDays} days
Route: ${routeLabel} | When: ${whenLabel}
Notified: ${notifiedLine}
Acknowledged: screening != diagnosis ${ack}
Status: ${status}`;
};

function AnnotationBlock({ items, visible, reduceMotion }) {
  return (
    <motion.div
      className="annotation-block"
      data-visible={visible}
      aria-hidden={!visible}
      initial={false}
      animate={
        visible
          ? { opacity: 1, scale: 1, height: "auto", marginTop: 16 }
          : {
              opacity: 0,
              scale: reduceMotion ? 1 : 0.97,
              height: 0,
              marginTop: 0,
            }
      }
      transition={{ duration: reduceMotion ? 0 : 0.25 }}
      style={{ overflow: "hidden" }}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
        In-world annotation
      </p>
      <motion.div
        initial="hidden"
        animate={visible ? "visible" : "hidden"}
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: reduceMotion ? 0 : 0.07 },
          },
        }}
      >
        {items.map((item) => (
          <motion.div key={item.hci} variants={annotationVariants} className="space-y-0.5">
            <p className="font-medium text-slate-800">{item.stakeholder}</p>
            <p>{item.hci}</p>
            <p className="text-slate-500">{item.tension}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function StepBar({ currentIndex }) {
  return (
    <div className="mb-4 flex items-center gap-3" aria-label="Referral steps">
      {stepItems.map((item, index) => {
        const isActive = index <= currentIndex;
        return (
          <div key={item} className="flex items-center gap-2 text-sm font-medium">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                isActive
                  ? "border-indigoAccent-500 text-indigoAccent-600"
                  : "border-slate-300 text-slate-500"
              }`}
            >
              {index + 1}
            </span>
            <span className={isActive ? "text-slate-900" : "text-slate-500"}>{item}</span>
            {index < stepItems.length - 1 && <span className="text-slate-400">→</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const shouldReduceMotion = useReducedMotion();
  const commitRef = import.meta.env.VITE_COMMIT;
  const stamp = useMemo(() => {
    const now = new Date();
    const dateLabel = formatStampDate(now);
    const sha = commitRef
      ? commitRef.slice(0, 7)
      : `local-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
          now.getDate(),
        ).padStart(2, "0")}`;
    return { dateLabel, sha };
  }, [commitRef]);

  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showFieldNotes, setShowFieldNotes] = useState(false);
  const [route, setRoute] = useState("later");
  const [displayedRoute, setDisplayedRoute] = useState("later");
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [expiryDays, setExpiryDays] = useState(DEFAULT_EXPIRY);
  const [isEditingExpiry, setIsEditingExpiry] = useState(false);
  const [expiryDraft, setExpiryDraft] = useState(String(DEFAULT_EXPIRY));
  const [acknowledged, setAcknowledged] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState({
    counsellor: true,
    parent: false,
    lead: false,
  });
  const [notifyTiming, setNotifyTiming] = useState("end");
  const [customWindow, setCustomWindow] = useState("");
  const [consentWithdrawn, setConsentWithdrawn] = useState(false);
  const [withdrawFeedback, setWithdrawFeedback] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLowRisk, setIsLowRisk] = useState(false);
  const [lastQueueUpdate, setLastQueueUpdate] = useState(Date.now());
  const [queueTimer, setQueueTimer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueueTimer(Math.floor((Date.now() - lastQueueUpdate) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastQueueUpdate]);

  useEffect(() => {
    setIsQueueLoading(true);
    const delay = shouldReduceMotion ? 0 : 400 + Math.random() * 200;
    const timeout = setTimeout(() => {
      setDisplayedRoute(route);
      setIsQueueLoading(false);
      setLastQueueUpdate(Date.now());
      setQueueTimer(0);
    }, delay);
    return () => clearTimeout(timeout);
  }, [route, shouldReduceMotion]);

  useEffect(() => {
    if (!withdrawFeedback) return undefined;
    const timeout = setTimeout(() => setWithdrawFeedback(""), 2000);
    return () => clearTimeout(timeout);
  }, [withdrawFeedback]);

  useEffect(() => {
    const handler = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = event.target.tagName?.toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) return;
      const key = event.key?.toLowerCase();
      if (key === "a") {
        event.preventDefault();
        setShowAnnotations((prev) => !prev);
      }
      if (key === "r") {
        event.preventDefault();
        setShowFieldNotes((prev) => !prev);
      }
      if (key === "p") {
        event.preventDefault();
        window.print();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const queueStatus = routeMeta[displayedRoute].queue;
  const outsideHours = notifyTiming === "custom" && isOutsideSchoolHours(customWindow);
  const bandLabel = isLowRisk ? "Reflective" : "Attention needed";
  const primaryRouteActions = {
    now: isLowRisk ? "Self-care tips" : "Talk now",
    later: "Book later",
    anon: "Ask anonymously",
  };
  const withdrawalStamp = new Date().toISOString();

  const handleReceiptDownload = () => {
    const payload = {
      route,
      expiryDays,
      selectedContacts,
      notifyTiming,
      customWindow,
      acknowledged,
      withdrawn: consentWithdrawn,
      withdrawalStamp,
    };
    const content = formatReceipt(payload);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "consent_receipt.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage("Consent receipt downloaded for your records.");
  };

  const toggleContact = (key) => {
    setSelectedContacts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleWithdrawToggle = () => {
    setConsentWithdrawn((prev) => !prev);
    setWithdrawFeedback(
      consentWithdrawn
        ? "Consent restored — notifications resume per your routes."
        : "Consent withdrawn — alerts cleared and queue slot recycled.",
    );
  };

  const currentStep = notifyTiming === "custom" ? 1 : acknowledged ? 2 : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
        <header className="flex flex-col gap-4 rounded-soft border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">CareLink Schools</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                Design Fiction · Human–Technology System Futures
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Share control, not just data. Defaults configure power; consent here is revocable, time-bounded and
                legible.
              </p>
            </div>
            <div className="text-right text-xs font-semibold text-slate-600">
              <p>Build {VERSION}</p>
              <p>{stamp.dateLabel}</p>
              <p>SHA {stamp.sha}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-end">
            <button
              type="button"
              role="switch"
              aria-checked={showAnnotations}
              onClick={() => setShowAnnotations((prev) => !prev)}
              className="screen-only inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigoAccent-300 focus-ring"
            >
              {showAnnotations ? (
                <Eye className="h-4 w-4 text-indigoAccent-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-slate-500" />
              )}
              Show annotations
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {showAnnotations ? "On" : "Off"}
              </span>
            </button>
            <button
              type="button"
              aria-pressed={showFieldNotes}
              onClick={() => setShowFieldNotes((prev) => !prev)}
              className="screen-only inline-flex items-center gap-2 rounded-full border border-indigoAccent-200 bg-indigoAccent-50 px-4 py-2 text-sm font-semibold text-indigoAccent-700 transition hover:border-indigoAccent-300 focus-ring"
            >
              <Lightbulb className="h-4 w-4" /> Field notes (A2)
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAnnotations(false);
                setShowFieldNotes(false);
                setRoute("later");
                setDisplayedRoute("later");
                setExpiryDays(DEFAULT_EXPIRY);
                setExpiryDraft(String(DEFAULT_EXPIRY));
                setIsEditingExpiry(false);
                setAcknowledged(false);
                setIsLowRisk(false);
                setSelectedContacts({ counsellor: true, parent: false, lead: false });
                setNotifyTiming("end");
                setCustomWindow("");
                setConsentWithdrawn(false);
                setWithdrawFeedback("");
                setStatusMessage("State reset to default governance choices.");
              }}
              className="screen-only inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus-ring"
            >
              <RefreshCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </header>

        <section className="rounded-soft border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">Hero</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 leading-tight">
                Who sets the defaults, holds the power?
              </h2>
            </div>
            <motion.button
              whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
              type="button"
              onClick={() => setIsLowRisk((prev) => !prev)}
              className="screen-only inline-flex items-center gap-2 rounded-full border border-indigoAccent-200 bg-indigoAccent-50 px-4 py-2 text-sm font-semibold text-indigoAccent-700 focus-ring"
            >
              {isLowRisk ? "Showing low-risk" : "Low-risk demo"}
            </motion.button>
          </div>
          <p className="mt-4 text-lg leading-relaxed text-slate-700">
            This near-future school wellbeing triage flow treats consent as a living process -- revocable, time-bounded,
            and legible. It surfaces how governance-by-default nudges young people, how transparency does not
            automatically equal trust, and how system load, fairness, safety and agency tug against one another.
          </p>
        </section>

        <section className="rounded-soft border border-indigoAccent-100 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          Policy X: Student Wellness Data Standard (2029, rev. B). Reporting rules apply unless emergency criteria.
        </section>

        <main className="main-grid grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <motion.section
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
            animate={{ opacity: 1, y: 0, transition: { duration: shouldReduceMotion ? 0 : 0.3 } }}
            className="space-y-6"
          >
            {/* Screen 1 */}
            <article className="screen-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">Screen 1</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Consent on your terms</h3>
                </div>
                <div className="flex flex-col items-end gap-2 text-xs text-slate-600">
                  <span className="rounded-full border border-slate-200 px-3 py-1">
                    Default: {routeMeta[route].chip}
                  </span>
                  <span className="rounded-full border border-slate-200 px-3 py-1">
                    Consent expires: {expiryDays}d
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingExpiry(true);
                        setExpiryDraft(String(expiryDays));
                      }}
                      className="ml-2 text-indigoAccent-600 underline-offset-2 hover:underline focus-ring screen-only"
                    >
                      Edit
                    </button>
                  </span>
                </div>
              </div>

              <fieldset className="mt-4 space-y-3">
                <legend className="text-sm font-semibold text-slate-700">Choose how alerts are routed</legend>
                {Object.entries(routeMeta).map(([key, meta]) => (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-start gap-3 rounded-soft border px-4 py-3 transition focus-within:ring-2 focus-within:ring-indigoAccent-500 ${
                      route === key ? "border-indigoAccent-500 bg-indigoAccent-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="route"
                      className="mt-1"
                      checked={route === key}
                      onChange={() => setRoute(key)}
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{meta.label}</p>
                      <p className="text-sm text-slate-600">{meta.detail}</p>
                    </div>
                  </label>
                ))}
              </fieldset>

              {isEditingExpiry && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <label className="sr-only" htmlFor="expiry-input">
                    Set expiry (days)
                  </label>
                  <input
                    id="expiry-input"
                    type="number"
                    min={1}
                    max={364}
                    value={expiryDraft}
                    onChange={(event) => setExpiryDraft(event.target.value)}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1 focus-ring"
                  />
                  <button
                    type="button"
                    className="screen-only rounded-md border border-indigoAccent-500 bg-indigoAccent-500 px-3 py-1 text-xs font-semibold text-white"
                    onClick={() => {
                      const parsed = Number(expiryDraft);
                      if (Number.isNaN(parsed)) return;
                      const safeValue = Math.min(364, Math.max(1, parsed));
                      setExpiryDays(safeValue);
                      setIsEditingExpiry(false);
                      setStatusMessage(`Consent expiry updated to ${safeValue} days.`);
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="screen-only rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600"
                    onClick={() => setIsEditingExpiry(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}

              <label className="mt-4 flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                />
                <span>
                  I understand <strong>screening != diagnosis</strong>
                </span>
              </label>

              <div className="mt-5 flex flex-wrap gap-3">
                <motion.button
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                  type="button"
                  onClick={() => setStatusMessage("Local session saved -- you remain on this step.")}
                  className="screen-only inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 focus-ring"
                >
                  Save & exit
                </motion.button>
                <motion.button
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                  type="button"
                  disabled={!acknowledged}
                  className={`screen-only inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold focus-ring ${
                    acknowledged ? "bg-indigoAccent-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>

              <AnnotationBlock
                items={annotationSets.consent}
                visible={showAnnotations}
                reduceMotion={shouldReduceMotion}
              />
            </article>

            {/* Screen 2 */}
            <article className="screen-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">Screen 2</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Results + "Why this score?"</h3>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                  Transparency != trust
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <p className="font-medium uppercase tracking-[0.2em] text-slate-500">Band overview</p>
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs">
                    Index 0.62 · Range 0.55-0.70
                  </span>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div
                      key={index}
                      className={`h-3 rounded-full ${index < (isLowRisk ? 4 : 7) ? "bg-slate-500" : "bg-slate-200"}`}
                    />
                  ))}
                </div>
                <p className="text-lg font-semibold text-slate-900">{bandLabel}</p>
              </div>

              <motion.button
                whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                type="button"
                aria-expanded={whyOpen}
                aria-controls="why-panel"
                onClick={() => setWhyOpen((prev) => !prev)}
                className="screen-only mt-4 inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 focus-ring"
              >
                <Info className="h-4 w-4" /> Why this score?
              </motion.button>

              <AnimatePresence initial={false}>
                {whyOpen && (
                  <motion.div
                    id="why-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                    className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    {evidenceBlocks.map((item) => (
                      <div key={item.title}>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {item.title}
                        </p>
                        <p className="text-sm text-slate-700">{item.detail}</p>
                      </div>
                    ))}
                    <motion.button
                      whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                      type="button"
                      onClick={handleReceiptDownload}
                      className="screen-only inline-flex items-center gap-2 rounded-full bg-indigoAccent-600 px-4 py-2 text-sm font-semibold text-white focus-ring"
                    >
                      <Download className="h-4 w-4" /> Download consent receipt
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4" aria-live="polite">
                {isQueueLoading ? (
                  <motion.div
                    className="h-20 rounded-xl border border-slate-200 bg-slate-100 skeleton-shimmer"
                    variants={shimmerVariants}
                    initial="initial"
                    animate={shouldReduceMotion ? undefined : "animate"}
                  />
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Queue status</p>
                        <p className="text-sm font-medium text-slate-800">
                          {queueStatus.label} · wait {queueStatus.wait}
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
                        Route: {routeMeta[displayedRoute].queue.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Last updated {formatTimer(queueTimer)}</p>
                  </div>
                )}
                <div className="text-xs text-slate-500">{QUEUE_NOTE}</div>
                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(routeMeta).map(([key, meta]) => (
                    <motion.button
                      key={key}
                      type="button"
                      whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                      onClick={() => setRoute(key)}
                      className={`screen-only flex flex-col gap-1 rounded-xl border px-3 py-2 text-left text-sm font-semibold focus-ring ${
                        route === key
                          ? "border-indigoAccent-500 bg-indigoAccent-50 text-indigoAccent-700"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {primaryRouteActions[key]}
                      <span className="text-xs font-normal text-slate-500">
                        {meta.queue.label} · {meta.queue.wait}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <AnnotationBlock
                items={annotationSets.results}
                visible={showAnnotations}
                reduceMotion={shouldReduceMotion}
              />
            </article>

            {/* Screen 3 */}
            <article className="screen-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">Screen 3</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Referral / Withdraw consent</h3>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                  Consent is revocable
                </span>
              </div>

              <StepBar currentIndex={currentStep} />

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-700">Who is notified?</legend>
                {contactOptions.map((option) => (
                  <label
                    key={option.key}
                    className="flex items-center gap-3 rounded-soft border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedContacts[option.key]}
                      onChange={() => toggleContact(option.key)}
                    />
                    {option.label}
                  </label>
                ))}
              </fieldset>

              <fieldset className="mt-4 space-y-3">
                <legend className="text-sm font-semibold text-slate-700">When?</legend>
                {notifyTimings.map((option) => (
                  <label
                    key={option.key}
                    className={`flex items-center gap-3 rounded-soft border px-3 py-2 text-sm ${
                      notifyTiming === option.key ? "border-indigoAccent-500 bg-indigoAccent-50" : "border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="timing"
                      className="h-4 w-4"
                      checked={notifyTiming === option.key}
                      onChange={() => setNotifyTiming(option.key)}
                    />
                    {option.label}
                  </label>
                ))}
                {notifyTiming === "custom" && (
                  <div className="flex flex-col gap-2 rounded-soft border border-dashed border-indigoAccent-300 bg-indigoAccent-50/50 p-3">
                    <label
                      htmlFor="custom-window"
                      className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600"
                    >
                      Choose time window
                    </label>
                    <input
                      id="custom-window"
                      type="datetime-local"
                      value={customWindow}
                      onChange={(event) => setCustomWindow(event.target.value)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm focus-ring"
                    />
                    {outsideHours && (
                      <p className="text-xs text-slate-600">Outside school hours — response may be delayed.</p>
                    )}
                  </div>
                )}
              </fieldset>

              <div className="mt-5 flex flex-wrap gap-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                  onClick={handleWithdrawToggle}
                  className="screen-only inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 focus-ring"
                >
                  <Undo2 className="h-4 w-4" /> View / Withdraw consent
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                  onClick={() => setStatusMessage("Referral snapshot recorded.")}
                  className="screen-only inline-flex items-center gap-2 rounded-full bg-indigoAccent-600 px-4 py-2 text-sm font-semibold text-white focus-ring"
                >
                  Confirm <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>

              {(consentWithdrawn || withdrawFeedback) && (
                <div
                  className="mt-4 rounded-xl border border-dashed border-slate-400 bg-slate-100 px-4 py-3 text-sm text-slate-700"
                  aria-live="polite"
                >
                  {withdrawFeedback || "Consent withdrawn — alerts cleared and queue slot recycled."}
                </div>
              )}

              <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Policy note: Selecting Parent follows school policy X; your choice remains respected unless emergency
                criteria. Emergency criteria override consent per Policy X §4 (harm/immediate risk).
              </p>

              <AnnotationBlock
                items={annotationSets.referral}
                visible={showAnnotations}
                reduceMotion={shouldReduceMotion}
              />
            </article>
          </motion.section>

          <aside className="annotations-sidebar lg:sticky lg:top-6">
            <section className="rounded-soft border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigoAccent-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Annotations</p>
                  <p className="text-xs text-slate-500">Toggle to reveal "Stakeholder / HCI / Tension".</p>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>
                  Each screen carries stakeholder tensions. Use the switch to surface how defaults and routing encode
                  governance choices.
                </p>
                <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Legend</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="legend-dot h-6 w-6">
                      <Users className="h-3.5 w-3.5" />
                    </span>
                    Stakeholder
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="legend-dot h-6 w-6">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    HCI principle
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="legend-dot h-6 w-6">
                      <Scale className="h-3.5 w-3.5" />
                    </span>
                    Tension
                  </div>
                </div>
              </div>
            </section>

            <AnimatePresence initial={false}>
              {showFieldNotes && (
                <motion.section
                  key="field-notes"
                  data-panel="a2"
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                  className="rounded-soft border border-indigoAccent-200 bg-indigoAccent-50 p-5 text-sm text-indigoAccent-900 shadow-sm"
                >
                  <div className="flex items-center gap-2 text-indigoAccent-700">
                    <Lightbulb className="h-5 w-5" />
                    <p className="text-sm font-semibold">Field notes (A2)</p>
                  </div>
                  <ul className="mt-3 list-disc space-y-2 pl-5">
                    {a2Cues.map((cue) => (
                      <li key={cue}>{cue}</li>
                    ))}
                  </ul>
                  <a
                    href="/Explanatory%20Memorandum.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-xs font-semibold text-indigoAccent-700 underline"
                  >
                    See evidence pack
                  </a>
                </motion.section>
              )}
            </AnimatePresence>
          </aside>
        </main>

        <footer className="rounded-soft border border-slate-200 bg-white p-6 text-sm text-slate-600 space-y-1">
          <p>
            This is an in-world design fiction. Speculation, not prediction. No medical or legal advice.
          </p>
          <p className="text-xs text-slate-500">
            © 2025 Rongyang Jian · Course Code: DECO 6500. All rights reserved.
          </p>
        </footer>
        <div aria-live="polite" className="sr-only">
          {statusMessage}
        </div>
      </div>
    </div>
  );
}
