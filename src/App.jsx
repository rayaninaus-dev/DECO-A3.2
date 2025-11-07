
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Eye,
  EyeOff,
  RefreshCcw,
  Info,
  Download,
  Users,
  Sparkles,
  Scale,
  Lightbulb,
  ArrowRight,
  Undo2,
} from "lucide-react";

const routeMeta = {
  now: {
    label: "Notify a counsellor now",
    detail: "Expected callback: 10-20 min",
    queue: { label: "high demand", wait: "25-40 min" },
    notifyLabel: "high demand / 25-40 min",
  },
  later: {
    label: "Notify later",
    detail: "You decide the time window",
    queue: { label: "moderate", wait: "15-25 min" },
    notifyLabel: "moderate / 15-25 min",
  },
  anon: {
    label: "Anonymous screening only",
    detail: "No one is notified unless you change this",
    queue: { label: "separate", wait: "5-10 min" },
    notifyLabel: "separate / 5-10 min",
  },
};

const routeActions = {
  now: "Talk now",
  later: "Book later",
  anon: "Ask anonymously",
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

const AnnotationBlock = ({ items, visible }) => (
  <div className="annotation-block" data-visible={visible} aria-live="polite">
    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
      In-world annotation
    </p>
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.hci} className="space-y-0.5">
          <p className="font-medium text-slate-800">{item.stakeholder}</p>
          <p>{item.hci}</p>
          <p className="text-slate-500">{item.tension}</p>
        </div>
      ))}
    </div>
  </div>
);
function App() {
  const shouldReduceMotion = useReducedMotion();
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showA2Panel, setShowA2Panel] = useState(false);
  const [route, setRoute] = useState("later");
  const [expiryDays, setExpiryDays] = useState(30);
  const [isEditingExpiry, setIsEditingExpiry] = useState(false);
  const [expiryDraft, setExpiryDraft] = useState("30");
  const [understandsDisclaimer, setUnderstandsDisclaimer] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [whyOpen, setWhyOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState({
    counsellor: true,
    parent: false,
    lead: false,
  });
  const [notifyTiming, setNotifyTiming] = useState("end");
  const [customWindow, setCustomWindow] = useState("");
  const [consentWithdrawn, setConsentWithdrawn] = useState(false);

  const queueStatus = useMemo(() => routeMeta[route].queue, [route]);

  const baseTransition = {
    duration: shouldReduceMotion ? 0 : 0.28,
    ease: [0.4, 0, 0.2, 1],
  };

  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: { opacity: 1, y: 0 },
  };

  const handleSaveExit = () => {
    setStatusMessage("Local session saved -- you remain on this step.");
  };

  const handleContinue = () => {
    setStatusMessage("Continuing with your chosen consent and routing.");
  };

  const handleReset = () => {
    setShowAnnotations(false);
    setShowA2Panel(false);
    setRoute("later");
    setExpiryDays(30);
    setIsEditingExpiry(false);
    setExpiryDraft("30");
    setUnderstandsDisclaimer(false);
    setStatusMessage("State reset to default governance choices.");
    setWhyOpen(false);
    setSelectedContacts({ counsellor: true, parent: false, lead: false });
    setNotifyTiming("end");
    setCustomWindow("");
    setConsentWithdrawn(false);
  };

  const handleReceiptDownload = () => {
    const receiptState = {
      route,
      expiryDays,
      acknowledged: understandsDisclaimer,
      band: "Attention needed",
      index: "0.62",
      notify: Object.entries(selectedContacts)
        .filter(([, checked]) => checked)
        .map(([key]) => key),
      when:
        notifyTiming === "custom"
          ? customWindow || "window pending"
          : notifyTiming,
      withdrawn: consentWithdrawn,
      generated: new Date().toISOString(),
    };

    const content = `consent_receipt\nroute: ${route}\nexpiry_days: ${expiryDays}\nacknowledged: ${understandsDisclaimer}\nband: ${receiptState.band}\nindex: ${receiptState.index}\nnotify: ${receiptState.notify.join(", ") || "none"}\nwhen: ${receiptState.when}\nwithdrawn: ${receiptState.withdrawn}\nstate: ${JSON.stringify(receiptState, null, 2)}`;

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
    setSelectedContacts((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleConfirmReferral = () => {
    const data = {
      who: Object.entries(selectedContacts)
        .filter(([, checked]) => checked)
        .map(([key]) => key),
      when:
        notifyTiming === "custom"
          ? customWindow || "time pending"
          : notifyTiming,
      withdrawn: consentWithdrawn,
    };
    setStatusMessage("Referral snapshot recorded.");
    window.alert(`Referral / consent bundle\n${JSON.stringify(data, null, 2)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
        <header className="flex flex-col gap-4 rounded-soft border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Design Fiction  /  Pathway 2
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                Design Fiction  /  Human-Technology System Futures
              </h1>
            </div>
            <span className="rounded-full bg-indigoAccent-50 px-3 py-1 text-xs font-medium text-indigoAccent-600">
              Prototype artefact  /  in-world
            </span>
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
              aria-pressed={showA2Panel}
              onClick={() => setShowA2Panel((prev) => !prev)}
              className="screen-only inline-flex items-center gap-2 rounded-full border border-indigoAccent-200 bg-indigoAccent-50 px-4 py-2 text-sm font-semibold text-indigoAccent-700 transition hover:border-indigoAccent-300 focus-ring"
            >
              <Lightbulb className="h-4 w-4" />
              A2 cues
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="screen-only inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus-ring"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </header>

        <section className="rounded-soft border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
            Hero
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900 leading-tight">
            Who sets the defaults, holds the power?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-700">
            This near-future school wellbeing triage flow treats consent as a living process -- revocable, time-bounded, and legible. It surfaces how governance-by-default nudges young people, how transparency does not automatically equal trust, and how system load, fairness, safety and agency tug against one another.
          </p>
        </section>

        <main className="main-grid grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <motion.section
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={baseTransition}
            className="space-y-6"
          >
            <motion.article
              className="screen-card"
              variants={cardVariants}
              transition={{ ...baseTransition, delay: 0.05 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
                    Screen 1
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    Consent on your terms
                  </h3>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                  Defaults = governance
                </span>
              </div>

              <fieldset className="mt-4 space-y-3">
                <legend className="text-sm font-semibold text-slate-700">
                  Choose how alerts are routed
                </legend>
                {Object.entries(routeMeta).map(([key, meta]) => (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-start gap-3 rounded-soft border px-4 py-3 transition focus-within:ring-2 focus-within:ring-indigoAccent-500 ${
                      route === key
                        ? "border-indigoAccent-500 bg-indigoAccent-50"
                        : "border-slate-200 bg-white"
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

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                <p>
                  Consent expires in <span className="font-semibold">{expiryDays} days</span>
                </p>
                <button
                  type="button"
                  className="screen-only inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-indigoAccent-300 focus-ring"
                  onClick={() => {
                    setIsEditingExpiry(true);
                    setExpiryDraft(String(expiryDays));
                  }}
                >
                  Edit
                </button>
                {isEditingExpiry && (
                  <div className="flex items-center gap-2 text-sm">
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
              </div>

              <label className="mt-4 flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={understandsDisclaimer}
                  onChange={(event) => setUnderstandsDisclaimer(event.target.checked)}
                />
                <span>
                  I understand <strong>screening != diagnosis</strong>
                </span>
              </label>

              <div className="mt-5 flex flex-wrap gap-3">
                <motion.button
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                  type="button"
                  onClick={handleSaveExit}
                  className="screen-only inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 focus-ring"
                >
                  Save & exit
                </motion.button>
                <motion.button
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                  type="button"
                  disabled={!understandsDisclaimer}
                  onClick={handleContinue}
                  className={`screen-only inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold focus-ring ${
                    understandsDisclaimer
                      ? "bg-indigoAccent-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>

              <AnnotationBlock items={annotationSets.consent} visible={showAnnotations} />
            </motion.article>
            <motion.article
              className="screen-card"
              variants={cardVariants}
              transition={{ ...baseTransition, delay: 0.08 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
                    Screen 2
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    Results + "Why this score?"
                  </h3>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                  Transparency != trust
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <p className="font-medium uppercase tracking-[0.2em] text-slate-500">
                    Band overview
                  </p>
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs">
                    Index 0.62  /  Range 0.55-0.70
                  </span>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div
                      key={index}
                      className={`h-3 rounded-full ${
                        index < 7 ? "bg-slate-500" : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-lg font-semibold text-slate-900">Attention needed</p>
              </div>

              <motion.button
                whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                type="button"
                onClick={() => setWhyOpen((prev) => !prev)}
                className="screen-only mt-4 inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 focus-ring"
              >
                <Info className="h-4 w-4" />
                Why this score?
              </motion.button>

              <AnimatePresence>
                {whyOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={baseTransition}
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
                      <Download className="h-4 w-4" />
                      Download consent receipt
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      Queue status
                    </p>
                    <p className="text-sm font-medium text-slate-800" aria-live="polite">
                      {queueStatus.label} / wait {queueStatus.wait}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
                    Route: {routeMeta[route].notifyLabel}
                  </span>
                </div>
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
                      {routeActions[key]}
                      <span className="text-xs font-normal text-slate-500">
                        {meta.queue.label} / {meta.queue.wait}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <AnnotationBlock items={annotationSets.results} visible={showAnnotations} />
            </motion.article>
            <motion.article
              className="screen-card"
              variants={cardVariants}
              transition={{ ...baseTransition, delay: 0.11 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
                    Screen 3
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    Referral / Withdraw consent
                  </h3>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                  Consent is revocable
                </span>
              </div>

              <fieldset className="mt-4 space-y-3">
                <legend className="text-sm font-semibold text-slate-700">
                  Who is notified?
                </legend>
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
                <legend className="text-sm font-semibold text-slate-700">
                  When?
                </legend>
                {notifyTimings.map((option) => (
                  <label
                    key={option.key}
                    className={`flex items-center gap-3 rounded-soft border px-3 py-2 text-sm ${
                      notifyTiming === option.key
                        ? "border-indigoAccent-500 bg-indigoAccent-50"
                        : "border-slate-200"
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
                  </div>
                )}
              </fieldset>

              <div className="mt-5 flex flex-wrap gap-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                  onClick={() => {
                    setConsentWithdrawn((prev) => !prev);
                    setStatusMessage("Consent withdrawn -- queue & notifications updated.");
                  }}
                  className="screen-only inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 focus-ring"
                >
                  <Undo2 className="h-4 w-4" />
                  View / Withdraw consent
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                  onClick={handleConfirmReferral}
                  className="screen-only inline-flex items-center gap-2 rounded-full bg-indigoAccent-600 px-4 py-2 text-sm font-semibold text-white focus-ring"
                >
                  Confirm
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>

              {consentWithdrawn && (
                <div
                  className="mt-4 rounded-xl border border-dashed border-slate-400 bg-slate-100 px-4 py-3 text-sm text-slate-700"
                  aria-live="assertive"
                >
                  Consent withdrawn -- queue & notifications updated.
                </div>
              )}

              <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Policy note: Selecting Parent follows school policy X; your choice remains respected unless emergency criteria.
              </p>

              <AnnotationBlock items={annotationSets.referral} visible={showAnnotations} />
            </motion.article>
          </motion.section>
          <aside className="annotations-sidebar lg:sticky lg:top-6">
            <motion.section
              data-panel="annotations"
              className="rounded-soft border border-slate-200 bg-white p-5 shadow-sm"
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigoAccent-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Annotations</p>
                  <p className="text-xs text-slate-500">
                    Toggle to reveal "Stakeholder / HCI / Tension".
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>
                  Each screen carries stakeholder tensions. Use the switch to surface how defaults and routing encode governance choices.
                </p>
                <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Legend
                  </p>
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
            </motion.section>

            <AnimatePresence initial={false}>
              {showA2Panel && (
                <motion.section
                  key="a2-panel"
                  data-panel="a2"
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                  transition={baseTransition}
                  className="rounded-soft border border-indigoAccent-200 bg-indigoAccent-50 p-5 text-sm text-indigoAccent-900 shadow-sm"
                >
                  <div className="flex items-center gap-2 text-indigoAccent-700">
                    <Lightbulb className="h-5 w-5" />
                    <p className="text-sm font-semibold">{'A2 -> A3 cues'}</p>
                  </div>
                  <ul className="mt-3 list-disc space-y-2 pl-5">
                    {a2Cues.map((cue) => (
                      <li key={cue}>{cue}</li>
                    ))}
                  </ul>
                </motion.section>
              )}
            </AnimatePresence>
          </aside>
        </main>

        <footer className="rounded-soft border border-slate-200 bg-white p-6 text-sm text-slate-600">
          <p>
            This is an in-world design fiction for study purposes. Speculation, not prediction. No medical or legal advice. (c) 2025.
          </p>
        </footer>
        <div aria-live="polite" className="sr-only">
          {statusMessage}
        </div>
      </div>
    </div>
  );
}

export default App;
