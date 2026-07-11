import { useState, useMemo, useEffect, useRef } from "react";
import {
  BarChart3, Users, Zap, Building2, ArrowRight,
  ChevronRight, ChevronLeft, TrendingUp, TrendingDown, Minus,
  CheckCircle2, AlertTriangle, XCircle, Star, Mail, ExternalLink, Target,
} from "lucide-react";
import { saveAssessment, getAssessment } from "@/lib/assessmentService";

// ─── Types ────────────────────────────────────────────────────────────────────

type Option = { value: number; letter: string; text: string };
type Question = { id: string; title: string; prompt: string; options: Option[] };
type Dimension = { id: string; title: string; questions: Question[] };
type Pillar = { id: string; number: string; title: string; subtitle: string; description: string; icon: any; color: string; dimensions: Dimension[] };
type Answers = Record<string, number>;
type View = "landing" | "intro" | "assessment" | "results";

// ─── Data ────────────────────────────────────────────────────────────────────

const ROW_LABELS = ["Goal", "Structure", "Management"];

function opts(a: string, b: string, c: string, d: string, e: string): Option[] {
  return [
    { value: 1, letter: "A", text: a },
    { value: 2, letter: "B", text: b },
    { value: 3, letter: "C", text: c },
    { value: 4, letter: "D", text: d },
    { value: 5, letter: "E", text: e },
  ];
}

const PILLARS: Pillar[] = [
  {
    id: "organization",
    number: "01",
    title: "Organization",
    subtitle: "Goal, structure & management of the organization itself",
    description: "Examines the organization as an entity — whether it pursues the right goals, is configured to achieve them, and is led with the coherence required to turn intent into sustained performance.",
    icon: Building2,
    color: "#5B9A6F",
    dimensions: [
      {
        id: "org-goal",
        title: "Goal",
        questions: [
          {
            id: "O1", title: "Strategic Direction",
            prompt: "Select the statement that best reflects the organisation's strategic direction.",
            options: opts("Direction is unclear.", "Direction exists but is interpreted differently.", "Direction is defined but applied inconsistently.", "Direction is clear and guides decisions.", "Direction is sharp, shared, and refreshed with evidence."),
          },
          {
            id: "O2", title: "Mission-to-Priority Alignment",
            prompt: "Select the statement that best reflects alignment between mission and priorities.",
            options: opts("Priorities do not reflect mission.", "Some priorities reflect mission.", "Mission and priorities are broadly aligned.", "Priorities are clearly derived from mission.", "Mission and priorities are tightly aligned."),
          },
          {
            id: "O3", title: "Strategic Prioritisation",
            prompt: "Select the statement that best reflects how the organisation prioritises.",
            options: opts("Too many priorities compete.", "Priority areas exist but shift often.", "A defined set exists but sequencing is weak.", "Priorities are focused and sequenced.", "Priorities are managed as a portfolio."),
          },
          {
            id: "O4", title: "Goal Cascading",
            prompt: "Select the statement that best reflects how goals are cascaded.",
            options: opts("Goals rarely translate to teams.", "Some units translate goals.", "Goals are cascaded with variation.", "Goals are systematically translated.", "Goals cascade clearly to team level."),
          },
        ],
      },
      {
        id: "org-structure",
        title: "Structure",
        questions: [
          {
            id: "O5", title: "Structural Fitness",
            prompt: "Select the statement that best reflects the fit of the current structure.",
            options: opts("Structure does not support delivery.", "Some parts support delivery.", "Structure is workable but needs redesign.", "Structure generally supports delivery.", "Structure is intentionally designed for delivery."),
          },
          {
            id: "O6", title: "Governance Clarity",
            prompt: "Select the statement that best reflects governance clarity.",
            options: opts("Roles and escalation paths are unclear.", "Governance exists but is not well understood.", "Structures are defined but adherence varies.", "Governance supports accountability.", "Governance is well understood and disciplined."),
          },
          {
            id: "O7", title: "Accountability Clarity",
            prompt: "Select the statement that best reflects accountability clarity.",
            options: opts("Ownership is unclear.", "Accountability overlaps create confusion.", "Most roles are defined.", "Accountability is generally clear.", "Accountability is sharply defined."),
          },
          {
            id: "O8", title: "Cross-Functional Coordination",
            prompt: "Select the statement that best reflects cross-functional coordination.",
            options: opts("Functions work independently.", "Coordination is reactive.", "Coordination exists but varies.", "Coordination is structured.", "Coordination is embedded and shared."),
          },
        ],
      },
      {
        id: "org-management",
        title: "Management",
        questions: [
          {
            id: "O9", title: "Executive Decision Discipline",
            prompt: "Select the statement that best reflects executive decision discipline.",
            options: opts("Decisions are delayed.", "Decisions are made but inconsistent.", "Decisions are made and acted on unevenly.", "Decisions are timely and followed through.", "Decision-making is disciplined and transparent."),
          },
          {
            id: "O10", title: "Performance Governance",
            prompt: "Select the statement that best reflects performance governance.",
            options: opts("No structured review process.", "Review mechanisms exist but are weak.", "Performance governance is in place.", "Regular reviews use clear metrics.", "Performance governance is embedded."),
          },
          {
            id: "O11", title: "Management Information Quality",
            prompt: "Select the statement that best reflects management information quality.",
            options: opts("Information is fragmented or delayed.", "Useful information exists but is incomplete.", "Information is available for key issues.", "Leaders receive timely useful information.", "Information is robust, trusted, and integrated."),
          },
          {
            id: "O12", title: "Execution Tracking",
            prompt: "Select the statement that best reflects execution tracking.",
            options: opts("Little structured tracking.", "Follow-up occurs but not systematically.", "Tracking exists but discipline varies.", "Actions are routinely tracked.", "Execution tracking is highly disciplined."),
          },
        ],
      },
    ],
  },
  {
    id: "process",
    number: "02",
    title: "Process",
    subtitle: "Goal, structure & management of how work gets done",
    description: "Assesses whether the organisation's processes are purposefully designed, well-structured, and actively managed — or whether they have grown organically in ways that now limit rather than enable performance.",
    icon: Zap,
    color: "#C9A84C",
    dimensions: [
      {
        id: "proc-goal",
        title: "Goal",
        questions: [
          {
            id: "P1", title: "Process Purpose Clarity",
            prompt: "Select the statement that best reflects process purpose clarity.",
            options: opts("Processes lack purpose.", "Purpose is recognised but not consistent.", "Purposes are generally defined.", "Key processes have clear objectives.", "Processes are designed around outcomes."),
          },
          {
            id: "P2", title: "Process-to-Strategy Alignment",
            prompt: "Select the statement that best reflects process-to-strategy alignment.",
            options: opts("Processes are not connected to strategy.", "Some processes support strategy.", "Major processes are reasonably aligned.", "Core processes are aligned to priorities.", "Design and improvement are strategy-driven."),
          },
          {
            id: "P3", title: "Service Standards",
            prompt: "Select the statement that best reflects service standards.",
            options: opts("No clear standards.", "Some informal expectations.", "Standards exist in some areas.", "Clear standards are defined.", "Standards are embedded and monitored."),
          },
          {
            id: "P4", title: "Critical Process Prioritisation",
            prompt: "Select the statement that best reflects prioritisation of critical processes.",
            options: opts("Critical processes are not identified.", "Some critical processes are recognised.", "Critical processes are known in most areas.", "Critical processes get focused attention.", "Critical processes are protected and managed."),
          },
        ],
      },
      {
        id: "proc-structure",
        title: "Structure",
        questions: [
          {
            id: "P5", title: "Process Documentation",
            prompt: "Select the statement that best reflects process documentation.",
            options: opts("Processes depend on memory.", "Some processes are documented.", "Many processes are documented.", "Major processes are documented and accessible.", "Documentation is current and actively maintained."),
          },
          {
            id: "P6", title: "Standardisation",
            prompt: "Select the statement that best reflects standardisation.",
            options: opts("Work is done differently without reason.", "Some standardisation exists.", "Standard methods are defined.", "Execution is largely standardised.", "Standardisation is strong and intentional."),
          },
          {
            id: "P7", title: "Process Ownership",
            prompt: "Select the statement that best reflects process ownership.",
            options: opts("Ownership is unclear.", "Ownership exists in some areas.", "Owners are identified in many areas.", "Key processes have clear ownership.", "Ownership is explicit and respected."),
          },
          {
            id: "P8", title: "Workflow and Handoffs",
            prompt: "Select the statement that best reflects workflow and handoffs.",
            options: opts("Work breaks at handoffs.", "Handoffs are person-dependent.", "Workflow is understood but bottlenecks remain.", "Workflows support efficient delivery.", "Workflow is streamlined and managed."),
          },
        ],
      },
      {
        id: "proc-management",
        title: "Management",
        questions: [
          {
            id: "P9", title: "Process KPI Tracking",
            prompt: "Select the statement that best reflects process KPI tracking.",
            options: opts("Metrics are rarely measured.", "Some metrics exist but are limited.", "KPI tracking exists for major processes.", "KPIs are tracked regularly.", "Metrics drive redesign and improvement."),
          },
          {
            id: "P10", title: "Monitoring Routine",
            prompt: "Select the statement that best reflects monitoring routines.",
            options: opts("Reviews occur only when problems arise.", "Some review routines exist.", "Processes are reviewed periodically.", "Regular monitoring supports action.", "Monitoring is predictive and disciplined."),
          },
          {
            id: "P11", title: "Exception Handling",
            prompt: "Select the statement that best reflects exception handling.",
            options: opts("Handled case by case.", "Recurring issues are recognised.", "Exceptions are tracked in many cases.", "Structured approaches exist.", "Exception handling strengthens controls."),
          },
          {
            id: "P12", title: "Continuous Improvement",
            prompt: "Select the statement that best reflects continuous improvement.",
            options: opts("Changes happen only after serious problems.", "Improvement is occasional.", "Improvement is recognised but uneven.", "Processes are regularly improved.", "Continuous improvement is embedded."),
          },
        ],
      },
    ],
  },
  {
    id: "people",
    number: "03",
    title: "People",
    subtitle: "Goal, structure & management of the human dimension",
    description: "Measures whether people understand what they are working toward, are organised to succeed, and are managed in ways that sustain motivation, accountability, and growth over time.",
    icon: Users,
    color: "#2D9B87",
    dimensions: [
      {
        id: "people-goal",
        title: "Goal",
        questions: [
          {
            id: "Pe1", title: "Workforce Understanding of Strategy",
            prompt: "Select the statement that best reflects workforce understanding of strategy.",
            options: opts("Most staff know tasks, not direction.", "Awareness exists but varies widely.", "Staff broadly understand priorities.", "Employees understand priorities and relevance.", "Strategic understanding is strong across the workforce."),
          },
          {
            id: "Pe2", title: "Role-to-Goal Alignment",
            prompt: "Select the statement that best reflects role-to-goal alignment.",
            options: opts("Roles are not linked to outcomes.", "Some staff can link work to goals.", "Role-to-goal alignment exists in principle.", "Most roles are clearly linked.", "Contribution is explicit and reinforced."),
          },
          {
            id: "Pe3", title: "Capability Prioritisation",
            prompt: "Select the statement that best reflects capability prioritisation.",
            options: opts("Critical capabilities are not identified.", "Some gaps are known but not structured.", "Capability needs are defined in some areas.", "The organisation has a clear view of needed capabilities.", "Capability priorities guide investment."),
          },
          {
            id: "Pe4", title: "Change Readiness",
            prompt: "Select the statement that best reflects change readiness.",
            options: opts("Change creates confusion.", "Adaptation is uneven.", "The workforce is moderately receptive.", "Staff are prepared for change.", "Change readiness is strong."),
          },
        ],
      },
      {
        id: "people-structure",
        title: "Structure",
        questions: [
          {
            id: "Pe5", title: "Role Design Clarity",
            prompt: "Select the statement that best reflects role design clarity.",
            options: opts("Many roles no longer fit needs.", "Some roles are clear.", "Most roles are defined.", "Role design is generally clear.", "Roles are intentionally designed and refreshed."),
          },
          {
            id: "Pe6", title: "Reporting and Supervision Logic",
            prompt: "Select the statement that best reflects reporting and supervision logic.",
            options: opts("Reporting lines do not support oversight.", "Supervision works in some areas.", "Reporting structures are generally functional.", "Reporting and supervision are well structured.", "Structures are deliberately configured for clarity."),
          },
          {
            id: "Pe7", title: "Talent Deployment Fit",
            prompt: "Select the statement that best reflects talent deployment fit.",
            options: opts("People are assigned mainly by availability.", "There are attempts to match roles.", "Talent deployment is broadly reasonable.", "People are generally deployed well.", "Deployment is highly intentional."),
          },
          {
            id: "Pe8", title: "Succession and Pipeline Strength",
            prompt: "Select the statement that best reflects succession and pipeline strength.",
            options: opts("Critical roles depend on incumbents.", "Potential successors are known informally.", "Succession thinking exists in some areas.", "A structured pipeline exists.", "Succession management is deliberate and integrated."),
          },
        ],
      },
      {
        id: "people-management",
        title: "Management",
        questions: [
          {
            id: "Pe9", title: "Performance Management Quality",
            prompt: "Select the statement that best reflects performance management quality.",
            options: opts("Performance conversations are informal.", "A process exists but is not consistent.", "Performance management is established.", "The system supports accountability and development.", "It is robust, trusted, and used actively."),
          },
          {
            id: "Pe10", title: "Supervision and Coaching",
            prompt: "Select the statement that best reflects supervision and coaching.",
            options: opts("Supervision varies widely.", "Some managers provide useful support.", "Support is broadly present.", "Managers provide structured support.", "Coaching is a strong institutional practice."),
          },
          {
            id: "Pe11", title: "Learning and Development",
            prompt: "Select the statement that best reflects learning and development.",
            options: opts("Training is ad hoc.", "Learning exists but is weakly linked.", "Development is somewhat structured.", "Learning is linked to workforce priorities.", "Capability-building is strategic and continuous."),
          },
          {
            id: "Pe12", title: "Culture and Behaviour Reinforcement",
            prompt: "Select the statement that best reflects culture and behaviour reinforcement.",
            options: opts("Behaviours do not reflect values.", "Positive behaviours are encouraged inconsistently.", "Culture is recognisable but uneven.", "Desired behaviours are generally reinforced.", "Culture is actively shaped and visible."),
          },
        ],
      },
    ],
  },
];

const TOTAL_QUESTIONS = PILLARS.reduce(
  (a, p) => a + p.dimensions.reduce((b, d) => b + d.questions.length, 0), 0
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const qId = (pIdx: number, dIdx: number, qIdx: number) => `p${pIdx}_d${dIdx}_q${qIdx}`;

function getScoreColor(score: number) {
  if (score >= 4.0) return "#5B9A6F";
  if (score >= 3.0) return "#2D9B87";
  if (score >= 2.0) return "#C9A84C";
  return "#C0392B";
}

function getScoreLabel(score: number) {
  if (score >= 4.0) return "Exemplary";
  if (score >= 3.0) return "Established";
  if (score >= 2.0) return "Developing";
  return "At Risk";
}

function getScoreIcon(score: number) {
  if (score >= 4.0) return Star;
  if (score >= 3.0) return CheckCircle2;
  if (score >= 2.0) return AlertTriangle;
  return XCircle;
}

function generateAnalysis(
  orgName: string,
  overallScore: number,
  scores: Array<{ pillar: string; score: number; color: string; dimensions: Array<{ title: string; score: number }> }>
) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  const allDims = scores.flatMap((s, pIdx) =>
    s.dimensions.map((d) => ({ ...d, pillar: PILLARS[pIdx].title }))
  );
  const topDims = [...allDims].sort((a, b) => b.score - a.score).slice(0, 2);
  const bottomDims = [...allDims].sort((a, b) => a.score - b.score).slice(0, 3);

  const overallContext =
    overallScore >= 4.0
      ? "is performing at a high level across most assessed dimensions"
      : overallScore >= 3.0
      ? "demonstrates a functional organisational foundation with meaningful room for growth"
      : overallScore >= 2.0
      ? "is navigating significant organisational challenges that require leadership attention"
      : "is experiencing critical gaps that require urgent, coordinated intervention";

  const summary = `${orgName} ${overallContext}. The diagnostic places the organisation at an overall maturity of ${getScoreLabel(overallScore).toLowerCase()}, with its strongest performance in ${strongest.pillar} and its most pronounced gaps in ${weakest.pillar}.`;

  const strengths = topDims.map(
    (d) => `${d.title} within ${d.pillar} reflects a meaningful organisational capability — protect, codify, and build upon this as the organisation evolves.`
  );

  const priorities = bottomDims.map(
    (d) => `${d.title} (${d.pillar}): ${
      d.score < 2
        ? "requires immediate leadership intervention — the current state creates active organisational risk."
        : d.score < 3
        ? "presents a significant opportunity. Targeted investment here will yield broad organisational improvement."
        : "shows potential but inconsistency. Standardising what works will accelerate performance across the board."
    }`
  );

  const closing =
    overallScore >= 4.0
      ? "The organisation is well-positioned for sustained growth. The recommended focus is codifying current strengths into repeatable systems while addressing the few remaining gaps before they compound."
      : overallScore >= 3.0
      ? "The foundation is in place. The critical next step is converting inconsistent practices into reliable, organisation-wide standards — particularly in the priority areas identified above."
      : overallScore >= 2.0
      ? "The path forward requires a structured improvement agenda with clear ownership, timeline, and executive accountability. Attempting to address everything simultaneously risks diluting impact."
      : "The organisation requires a focused recovery plan. Leadership alignment around the most critical gaps — and visible, consistent action — is essential to restore confidence and momentum.";

  return { summary, strengths, priorities, closing };
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [currentPillar, setCurrentPillar] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [orgName, setOrgName] = useState("");
  const [respondentName, setRespondentName] = useState("");
  const [email, setEmail] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState("");
  const savedRef = useRef(false);

  const setAnswer = (pIdx: number, dIdx: number, qi: number, val: number) =>
    setAnswers((prev) => ({ ...prev, [qId(pIdx, dIdx, qi)]: val }));

  const pillarAnswered = (pIdx: number) =>
    PILLARS[pIdx].dimensions.every((dim, dIdx) =>
      dim.questions.every((_, qi) => answers[qId(pIdx, dIdx, qi)] !== undefined)
    );

  const scores = useMemo(
    () =>
      PILLARS.map((pillar, pIdx) => ({
        pillar: pillar.title,
        color: pillar.color,
        score:
          pillar.dimensions.reduce(
            (acc, dim, dIdx) =>
              acc + dim.questions.reduce((a, _, qi) => a + (answers[qId(pIdx, dIdx, qi)] || 0), 0) / dim.questions.length,
            0
          ) / pillar.dimensions.length,
        dimensions: pillar.dimensions.map((dim, dIdx) => ({
          title: dim.title,
          score: dim.questions.reduce((a, _, qi) => a + (answers[qId(pIdx, dIdx, qi)] || 0), 0) / dim.questions.length,
        })),
      })),
    [answers]
  );

  const overallScore = scores.reduce((a, b) => a + b.score, 0) / scores.length;

  const totalAnswered = PILLARS.reduce(
    (acc, _, pIdx) =>
      acc + PILLARS[pIdx].dimensions.reduce(
        (a, dim, dIdx) => a + dim.questions.filter((_, qi) => answers[qId(pIdx, dIdx, qi)] !== undefined).length,
        0
      ),
    0
  );

  const resetAll = () => { setAnswers({}); setOrgName(""); setRespondentName(""); setEmail(""); setSavedId(null); setLoadError(null); savedRef.current = false; setView("landing"); };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      getAssessment(id).then((record) => {
        if (record) {
          setOrgName(record.organization_name);
          setRespondentName(record.respondent_name);
          setEmail(record.respondent_email);
          setAnswers(record.answers);
          setSavedId(record.id);
          setView("results");
        } else {
          setLoadError("Assessment not found. The link may be invalid.");
        }
      });
    }
  }, []);

  useEffect(() => {
    if (view !== "results" || savedRef.current) return;
    savedRef.current = true;
    const analysis = generateAnalysis(orgName, overallScore, scores);
    setSaving(true);
    saveAssessment({
      respondent_name: respondentName,
      respondent_email: email,
      organization_name: orgName,
      answers,
      scores,
      analysis,
    })
      .then((id) => setSavedId(id))
      .catch(() => {})
      .finally(() => setSaving(false));
  }, [view]);

  if (view === "landing") return (
    <LandingPage
      onStart={() => setView("intro")}
      loadError={loadError}
      loadingId={loadingId}
      onLoadIdChange={setLoadingId}
      onLoadSubmit={async () => {
        setLoadError(null);
        const record = await getAssessment(loadingId);
        if (record) {
          setOrgName(record.organization_name);
          setRespondentName(record.respondent_name);
          setEmail(record.respondent_email);
          setAnswers(record.answers);
          setSavedId(record.id);
          setView("results");
        } else {
          setLoadError("Assessment not found. Check the ID and try again.");
        }
      }}
    />
  );

  // ── Setup ──────────────────────────────────────────────────────────────────
  if (view === "intro") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full">
          <button onClick={() => setView("landing")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-10">
            <ChevronLeft size={14} /> Back to overview
          </button>
          <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase block mb-5">Diagnostic Setup</span>
          <h1 className="font-serif text-3xl text-foreground mb-3">Before we begin</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
            You will be asked to evaluate 36 statements across 9 intersections of organisational dimension.
            For each, select the option that most honestly reflects your organisation today — not where you aspire to be.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-10">
            {PILLARS.map((p) => {
              const PIcon = p.icon;
              return (
                <div key={p.id} className="rounded-sm border p-3 text-center" style={{ borderColor: `${p.color}30`, backgroundColor: `${p.color}08` }}>
                  <PIcon size={14} style={{ color: p.color }} className="mx-auto mb-1.5" />
                  <p className="font-mono text-xs text-muted-foreground mb-0.5">{p.number}</p>
                  <p className="text-xs text-foreground/80 leading-tight">{p.title}</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-4 mb-10">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-widest">Organisation Name</label>
              <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Meridian Group"
                className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/60 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-widest">Your Name & Role</label>
              <input type="text" value={respondentName} onChange={(e) => setRespondentName(e.target.value)} placeholder="e.g. Sarah Okafor, Chief People Officer"
                className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/60 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-widest">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. sarah@meridiangroup.com"
                className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/60 text-sm" />
            </div>
          </div>

          <button
            onClick={() => { setCurrentPillar(0); setView("assessment"); }}
            disabled={!orgName.trim() || !respondentName.trim() || !email.trim()}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
          >
            Begin Assessment <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Assessment ─────────────────────────────────────────────────────────────
  if (view === "assessment") {
    const pillar = PILLARS[currentPillar];
    const PIcon = pillar.icon;
    const progressPct = (totalAnswered / TOTAL_QUESTIONS) * 100;

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${pillar.color}20` }}>
                <PIcon size={14} style={{ color: pillar.color }} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted-foreground">Column {pillar.number} of 03</p>
                <p className="text-sm font-medium text-foreground leading-none mt-0.5 truncate">{pillar.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="font-mono text-xs text-muted-foreground">{totalAnswered}/{TOTAL_QUESTIONS}</span>
              <div className="w-28 h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%`, backgroundColor: pillar.color }} />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 pt-10 pb-20">
          <div className="mb-10 pb-8 border-b border-border">
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">{pillar.description}</p>
          </div>

          <div className="space-y-8">
            {pillar.dimensions.map((dim, dIdx) => (
              <div key={dim.id} className="bg-card border border-border rounded-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-3" style={{ borderLeftWidth: 3, borderLeftColor: pillar.color }}>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-sm flex-shrink-0" style={{ color: pillar.color, backgroundColor: `${pillar.color}18` }}>
                    {ROW_LABELS[dIdx]}
                  </span>
                  <h3 className="font-medium text-foreground text-sm">{pillar.title} — {dim.title}</h3>
                </div>

                <div className="divide-y divide-border">
                  {dim.questions.map((question, qi) => {
                    const selected = answers[qId(currentPillar, dIdx, qi)];
                    return (
                      <div key={question.id} className="px-6 py-6">
                        <div className="flex items-start gap-3 mb-1">
                          <span className="font-mono text-xs text-muted-foreground flex-shrink-0 mt-0.5">{question.id}</span>
                          <p className="text-sm font-medium text-foreground">{question.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-5 pl-7">{question.prompt}</p>
                        <div className="space-y-2">
                          {question.options.map((opt) => {
                            const isSelected = selected === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => setAnswer(currentPillar, dIdx, qi, opt.value)}
                                className="w-full text-left rounded-sm border px-4 py-3 flex items-start gap-4 transition-all duration-150"
                                style={{
                                  backgroundColor: isSelected ? `${pillar.color}12` : "transparent",
                                  borderColor: isSelected ? `${pillar.color}60` : "rgba(28,43,33,0.10)",
                                }}
                              >
                                <div
                                  className="w-5 h-5 rounded-sm border flex-shrink-0 flex items-center justify-center transition-all"
                                  style={{
                                    borderColor: isSelected ? pillar.color : "rgba(28,43,33,0.20)",
                                    backgroundColor: isSelected ? pillar.color : "transparent",
                                  }}
                                >
                                  <span className="font-mono text-xs font-bold" style={{ color: isSelected ? "#FFFFFF" : "rgba(28,43,33,0.35)" }}>
                                    {opt.letter}
                                  </span>
                                </div>
                                <p className="text-sm leading-snug transition-colors" style={{ color: isSelected ? "#1C2B21" : "#6B7D72" }}>
                                  {opt.text}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-10 pt-8 border-t border-border">
            <button
              onClick={() => currentPillar === 0 ? setView("intro") : setCurrentPillar((p) => p - 1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ChevronLeft size={15} />
              {currentPillar === 0 ? "Back to Setup" : PILLARS[currentPillar - 1].title}
            </button>

            {currentPillar < 2 ? (
              <button
                onClick={() => setCurrentPillar((p) => p + 1)}
                disabled={!pillarAnswered(currentPillar)}
                className="flex items-center gap-2 px-7 py-3 rounded-sm font-medium text-sm transition-opacity disabled:opacity-35 disabled:cursor-not-allowed"
                style={{ backgroundColor: pillar.color, color: "rgba(0,0,0,0.80)" }}
              >
                {PILLARS[currentPillar + 1].title} <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={() => setView("results")}
                disabled={!pillarAnswered(2)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3 rounded-sm font-medium text-sm hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed transition-opacity"
              >
                View Results <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (view === "results") {
    const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const analysis = generateAnalysis(orgName, overallScore, scores);

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="border-b border-border">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-sm bg-primary/20 flex items-center justify-center">
                <BarChart3 size={14} className="text-primary" />
              </div>
              <span className="font-serif text-base">OrgDiagnostic</span>
            </div>
            <button onClick={resetAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors">New Diagnostic</button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12">
          {/* Report header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-border">
            <div>
              <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-3">Organisational Diagnostic Report · {reportDate}</p>
              <h1 className="font-serif text-4xl text-foreground mb-1">{orgName}</h1>
              <p className="text-muted-foreground text-sm">{respondentName}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-muted-foreground mb-1 uppercase tracking-widest">Overall Maturity</p>
              <p className="text-3xl font-serif font-bold" style={{ color: getScoreColor(overallScore) }}>{getScoreLabel(overallScore)}</p>
              <p className="font-mono text-xs text-muted-foreground mt-0.5">{overallScore.toFixed(2)} / 5.00</p>
            </div>
          </div>

          {/* Save indicator */}
          {saving && (
            <div className="mb-8 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
              Saving your results...
            </div>
          )}
          {savedId && (
            <div className="mb-8 bg-card border border-border rounded-sm p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Results saved — use this link to view later:</p>
                <p className="font-mono text-xs text-foreground/80 truncate select-all">
                  {window.location.origin}{window.location.pathname}?id={savedId}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}${window.location.pathname}?id=${savedId}`
                  )
                }}
                className="flex-shrink-0 text-xs text-primary hover:opacity-80 transition-opacity font-medium"
              >
                Copy Link
              </button>
            </div>
          )}

          {/* Executive Summary */}
          <div className="mb-12">
            <h2 className="font-serif text-xl text-foreground mb-5">Executive Summary</h2>
            <div className="bg-card border border-border rounded-sm p-7">
              <p className="text-foreground/90 leading-relaxed mb-6 text-sm">{analysis.summary}</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} style={{ color: "#5B9A6F" }} />
                    <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Organisational Strengths</p>
                  </div>
                  <div className="space-y-3">
                    {analysis.strengths.map((s, i) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed pl-4 border-l-2" style={{ borderColor: "#5B9A6F40" }}>{s}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown size={14} style={{ color: "#C9A84C" }} />
                    <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Priority Focus Areas</p>
                  </div>
                  <div className="space-y-3">
                    {analysis.priorities.map((p, i) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed pl-4 border-l-2" style={{ borderColor: "#C9A84C40" }}>{p}</p>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-5 border-t border-border flex items-start gap-3">
                <Minus size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed italic">{analysis.closing}</p>
              </div>
            </div>
          </div>

          {/* 3×3 Matrix */}
          <div className="mb-12">
            <h2 className="font-serif text-xl text-foreground mb-5">Diagnostic Matrix</h2>
            <div className="border border-border rounded-sm overflow-hidden">
              {/* Column headers — Goal / Structure / Management */}
              <div className="grid grid-cols-[110px_1fr_1fr_1fr] border-b border-border">
                <div className="bg-background" />
                {ROW_LABELS.map((label, dIdx) => {
                  const colColor = ["#5B9A6F", "#C9A84C", "#2D9B87"][dIdx];
                  return (
                    <div key={label} className="border-l border-border flex items-center justify-center px-3 py-4" style={{ backgroundColor: colColor }}>
                      <p className="font-mono text-xs font-semibold text-center" style={{ color: "rgba(0,0,0,0.75)", letterSpacing: "0.1em" }}>{label.toUpperCase()}</p>
                    </div>
                  );
                })}
              </div>

              {/* Data rows — Organization / Process / People */}
              {PILLARS.map((pillar, pIdx) => {
                const ps = scores[pIdx];
                const RIcon = getScoreIcon(ps.score);
                return (
                  <div key={pillar.id} className="grid grid-cols-[110px_1fr_1fr_1fr] border-b border-border last:border-b-0 items-stretch">
                    <div className="flex flex-col items-center justify-center gap-2 border-r border-border px-5 py-5" style={{ backgroundColor: pillar.color }}>
                      {(() => { const PIcon = pillar.icon; return <PIcon size={13} style={{ color: "rgba(0,0,0,0.60)" }} />; })()}
                      <p className="font-mono text-xs font-semibold text-center leading-tight" style={{ color: "rgba(0,0,0,0.80)", letterSpacing: "0.06em" }}>{pillar.title.toUpperCase()}</p>
                      <div className="flex items-center gap-1">
                        <RIcon size={9} style={{ color: "rgba(0,0,0,0.50)" }} />
                        <span className="font-mono" style={{ fontSize: "9px", color: "rgba(0,0,0,0.50)" }}>{getScoreLabel(ps.score)}</span>
                      </div>
                    </div>

                    {ps.dimensions.map((dim, dIdx) => {
                      const DIcon = getScoreIcon(dim.score);
                      return (
                        <div key={dIdx} className="px-5 py-4 bg-card border-l border-border flex flex-col justify-center gap-2">
                          <p className="text-xs text-muted-foreground leading-tight">{PILLARS[pIdx].dimensions[dIdx].title}</p>
                          <div className="flex items-center gap-1.5">
                            <DIcon size={12} style={{ color: getScoreColor(dim.score) }} />
                            <p className="text-xs font-medium" style={{ color: getScoreColor(dim.score) }}>{getScoreLabel(dim.score)}</p>
                          </div>
                          <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(dim.score / 5) * 100}%`, backgroundColor: getScoreColor(dim.score) }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column breakdown */}
          <div className="mb-12">
            <h2 className="font-serif text-xl text-foreground mb-5">Column Breakdown</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {PILLARS.map((pillar, pIdx) => {
                const PIcon = pillar.icon;
                const ps = scores[pIdx];
                const lowest = ps.dimensions.reduce((a, b) => (a.score < b.score ? a : b));
                const highest = ps.dimensions.reduce((a, b) => (a.score > b.score ? a : b));
                return (
                  <div key={pillar.id} className="bg-card border border-border rounded-sm p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${pillar.color}18` }}>
                        <PIcon size={15} style={{ color: pillar.color }} />
                      </div>
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">{pillar.number}</p>
                        <p className="text-sm font-medium text-foreground leading-none mt-0.5">{pillar.title}</p>
                      </div>
                    </div>
                    <div className="space-y-3 mb-5">
                      {ps.dimensions.map((dim, dIdx) => {
                        const DIc = getScoreIcon(dim.score);
                        return (
                          <div key={dim.title} className="flex items-center justify-between gap-3">
                            <span className="font-mono text-xs flex-shrink-0 px-1.5 py-0.5 rounded-sm" style={{ color: pillar.color, backgroundColor: `${pillar.color}15` }}>
                              {ROW_LABELS[dIdx]}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="w-14 h-1 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${(dim.score / 5) * 100}%`, backgroundColor: getScoreColor(dim.score) }} />
                              </div>
                              <DIc size={11} style={{ color: getScoreColor(dim.score) }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-4 border-t border-border space-y-1.5">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        <span style={{ color: "#5B9A6F" }}>↑ Leverage:</span>{" "}
                        <span className="text-foreground/70">{highest.title}</span>
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        <span style={{ color: "#C9A84C" }}>↓ Priority:</span>{" "}
                        <span className="text-foreground/70">{lowest.title}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-6 pt-6 border-t border-border mb-12">
            {[
              { label: "Exemplary", color: "#5B9A6F", Icon: Star },
              { label: "Established", color: "#2D9B87", Icon: CheckCircle2 },
              { label: "Developing", color: "#C9A84C", Icon: AlertTriangle },
              { label: "At Risk", color: "#C0392B", Icon: XCircle },
            ].map(({ label, color, Icon }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={12} style={{ color }} />
                <span className="text-xs font-medium" style={{ color }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Performance Analysis */}
          <div className="mb-12">
            <h2 className="font-serif text-xl text-foreground mb-5">Performance Analysis</h2>
            <div className="space-y-4">
              {PILLARS.map((pillar, pIdx) => {
                const PIcon = pillar.icon;
                const ps = scores[pIdx];
                const dimAnalysis = ps.dimensions.map((dim, dIdx) => {
                  const label = getScoreLabel(dim.score);
                  const name = ROW_LABELS[dIdx];
                  const commentMap: Record<string, Record<string, string>> = {
                    "Goal": {
                      "At Risk": `${pillar.title} goals are unclear or poorly understood. Without defined direction, decisions lack coherence and effort is misaligned.`,
                      "Developing": `${pillar.title} goal-setting is taking shape but inconsistency remains — some parts of the organisation are aligned while others operate without clear direction.`,
                      "Established": `${pillar.title} goals are well-defined and broadly applied. Priorities are understood and generally guide decisions across the organisation.`,
                      "Exemplary": `${pillar.title} demonstrates exemplary goal clarity. Strategic intent is shared, refreshed, and consistently cascaded throughout the organisation.`,
                    },
                    "Structure": {
                      "At Risk": `The structural foundations of ${pillar.title} are fragile. Roles, responsibilities, and coordination mechanisms are insufficient to support reliable delivery.`,
                      "Developing": `${pillar.title} structures are partially in place. Progress has been made but accountability gaps and coordination weaknesses limit effectiveness.`,
                      "Established": `${pillar.title} is structurally sound. Governance, accountability, and coordination mechanisms are well-defined and generally respected.`,
                      "Exemplary": `${pillar.title} structural design is deliberate and strong. Ownership is unambiguous, coordination is embedded, and the structure actively enables delivery.`,
                    },
                    "Management": {
                      "At Risk": `Management of ${pillar.title} is reactive or absent. Without disciplined oversight, gaps go unaddressed and execution drifts from intent.`,
                      "Developing": `${pillar.title} management practices are emerging but not yet consistent. Some review and accountability mechanisms exist but are applied unevenly.`,
                      "Established": `${pillar.title} is managed with discipline. Performance is tracked, decisions are timely, and leadership maintains active oversight across key areas.`,
                      "Exemplary": `${pillar.title} management is a distinctive strength. Information is trusted, governance is embedded, and continuous improvement is actively practised.`,
                    },
                  };
                  return { name, label, score: dim.score, comment: commentMap[name]?.[label] ?? `${name} maturity for ${pillar.title} is rated ${label} (${dim.score.toFixed(2)}/5).` };
                });
                return (
                  <div key={pillar.id} className="bg-card border border-border rounded-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-border" style={{ backgroundColor: `${pillar.color}10` }}>
                      <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${pillar.color}22` }}>
                        <PIcon size={13} style={{ color: pillar.color }} />
                      </div>
                      <p className="font-mono text-xs font-semibold tracking-wider" style={{ color: pillar.color }}>{pillar.title.toUpperCase()}</p>
                      <div className="ml-auto flex items-center gap-2">
                        {(() => { const SI = getScoreIcon(ps.score); return <SI size={12} style={{ color: getScoreColor(ps.score) }} />; })()}
                        <span className="font-mono text-xs" style={{ color: getScoreColor(ps.score) }}>{getScoreLabel(ps.score)} · {ps.score.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="divide-y divide-border">
                      {dimAnalysis.map((dim) => (
                        <div key={dim.name} className="px-6 py-4 flex gap-5 items-start">
                          <div className="flex-shrink-0 w-24">
                            <span className="font-mono text-xs px-2 py-0.5 rounded-sm" style={{ color: pillar.color, backgroundColor: `${pillar.color}15` }}>{dim.name}</span>
                            <div className="mt-2 flex items-center gap-1">
                              {(() => { const DI = getScoreIcon(dim.score); return <DI size={10} style={{ color: getScoreColor(dim.score) }} />; })()}
                              <span className="font-mono text-xs" style={{ color: getScoreColor(dim.score) }}>{dim.label}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{dim.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact PCL */}
          <div className="mb-12 rounded-sm overflow-hidden border border-border" style={{ background: "linear-gradient(135deg, #1C2B21 0%, #243628 100%)" }}>
            <div className="px-8 py-10">
              <div className="flex items-start justify-between gap-8 flex-wrap">
                <div className="flex-1 min-w-64">
                  <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-4">Powered by PCL</p>
                  <h2 className="font-serif text-2xl text-foreground mb-3">Ready to act on your results?</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    PCL works with senior leaders and executive teams to turn diagnostic insight into structured change. Whether you need
                    a facilitated debrief, a targeted improvement programme, or ongoing advisory support — our team brings
                    deep expertise in organisational performance.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a href="mailto:info@pcl.com" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-sm text-sm font-medium hover:opacity-90 transition-opacity">
                      <Mail size={14} /> Get in Touch
                    </a>
                    <a href="https://www.pcl.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-border text-foreground/80 hover:text-foreground px-5 py-2.5 rounded-sm text-sm font-medium transition-colors">
                      Visit PCL.com <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
                <div className="space-y-4 min-w-52">
                  {[
                    { icon: Target, label: "Diagnostic Debrief", desc: "Facilitated leadership session to unpack results and set priorities." },
                    { icon: TrendingUp, label: "Improvement Programmes", desc: "Structured engagements to close maturity gaps across the 3×3 framework." },
                    { icon: Users, label: "Executive Advisory", desc: "Ongoing support to sustain organisational performance over time." },
                  ].map(({ icon: IIcon, label, desc }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-sm flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: "#C9A84C18" }}>
                        <IIcon size={13} style={{ color: "#C9A84C" }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground/90 leading-none mb-1">{label}</p>
                        <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button onClick={() => { setCurrentPillar(0); setView("assessment"); }} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ChevronLeft size={14} /> Revise Responses
            </button>
            <button onClick={resetAll} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-sm font-medium text-sm hover:opacity-90 transition-opacity">
              Start New Diagnostic
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

function LandingPage({ onStart, loadError, loadingId, onLoadIdChange, onLoadSubmit }: {
  onStart: () => void;
  loadError: string | null;
  loadingId: string;
  onLoadIdChange: (v: string) => void;
  onLoadSubmit: () => void;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center">
              <BarChart3 size={15} className="text-primary-foreground" />
            </div>
            <span className="font-serif text-lg tracking-tight">OrgDiagnostic</span>
          </div>
          <div className="flex items-center gap-4">
            <details className="relative group">
              <summary className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors list-none">
                View Saved Results
              </summary>
              <div className="absolute right-0 top-8 w-80 bg-card border border-border rounded-sm p-4 shadow-lg z-50">
                <p className="text-xs text-muted-foreground mb-2">Enter your assessment ID:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={loadingId}
                    onChange={(e) => onLoadIdChange(e.target.value)}
                    placeholder="Paste assessment ID..."
                    className="flex-1 bg-background border border-border rounded-sm px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/60"
                    onKeyDown={(e) => e.key === "Enter" && onLoadSubmit()}
                  />
                  <button
                    onClick={onLoadSubmit}
                    disabled={!loadingId.trim()}
                    className="bg-primary text-primary-foreground px-3 py-2 rounded-sm text-xs font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
                  >
                    Load
                  </button>
                </div>
                {loadError && <p className="text-xs text-red-500 mt-2">{loadError}</p>}
              </div>
            </details>
            <button onClick={onStart} className="bg-primary text-primary-foreground px-5 py-2 rounded-sm text-sm font-medium hover:opacity-90 transition-opacity">
              Begin Assessment
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 pt-20 pb-16">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-8">3×3 Organisational Diagnostic System</p>
        <div className="mb-12">
          <div className="grid md:grid-cols-2 gap-12 items-end mb-10">
            <div>
              <h1 className="font-serif text-5xl md:text-6xl leading-tight text-foreground mb-6">See your organisation as it truly is</h1>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Built around three organisational columns and three diagnostic rows, this tool gives senior leaders an honest, structured picture of where their organisation stands — and where it most needs attention.
              </p>
              <div className="flex flex-wrap items-center gap-5">
                <button onClick={onStart} className="bg-primary text-primary-foreground px-8 py-4 rounded-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-3">
                  Start the Diagnostic <ArrowRight size={17} />
                </button>
                <p className="text-sm text-muted-foreground">36 questions · 20–30 minutes</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {PILLARS.map((pillar) => {
                const PIcon = pillar.icon;
                return (
                  <div key={pillar.id} className="rounded-sm p-4 border" style={{ borderColor: `${pillar.color}30`, backgroundColor: `${pillar.color}08` }}>
                    <PIcon size={16} style={{ color: pillar.color }} className="mb-2" />
                    <p className="font-mono text-xs font-semibold" style={{ color: pillar.color }}>{pillar.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{pillar.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full 3×3 preview matrix */}
          <div className="border border-border rounded-sm overflow-hidden shadow-sm">
            {/* Column headers */}
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] border-b border-border">
              <div className="bg-background px-5 py-4 flex items-end">
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Framework</p>
              </div>
              {ROW_LABELS.map((label, dIdx) => {
                const colColor = ["#5B9A6F", "#C9A84C", "#2D9B87"][dIdx];
                const colDesc = ["Strategic intent and goal clarity", "Configuration and accountability", "Oversight, review, and improvement"][dIdx];
                return (
                  <div key={label} className="border-l border-border px-5 py-4 flex flex-col justify-between gap-2" style={{ backgroundColor: colColor }}>
                    <p className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.75)" }}>{label}</p>
                    <p className="text-xs leading-snug" style={{ color: "rgba(0,0,0,0.50)" }}>{colDesc}</p>
                  </div>
                );
              })}
            </div>

            {/* Data rows */}
            {PILLARS.map((pillar) => {
              const PIcon = pillar.icon;
              return (
                <div key={pillar.id} className="grid grid-cols-[140px_1fr_1fr_1fr] border-b border-border last:border-b-0 items-stretch">
                  {/* Row header */}
                  <div className="flex flex-col justify-between gap-3 border-r border-border px-5 py-5" style={{ backgroundColor: pillar.color }}>
                    <div>
                      <PIcon size={16} style={{ color: "rgba(0,0,0,0.65)" }} />
                    </div>
                    <div>
                      <p className="font-mono text-xs font-bold leading-tight uppercase tracking-wider" style={{ color: "rgba(0,0,0,0.80)" }}>{pillar.title}</p>
                      <p className="font-mono text-xs mt-1" style={{ color: "rgba(0,0,0,0.45)" }}>{pillar.number}</p>
                    </div>
                  </div>

                  {/* Dimension cells */}
                  {pillar.dimensions.map((dim, dIdx) => (
                    <div key={dim.id} className="px-5 py-4 bg-card border-l border-border flex flex-col gap-3">
                      <div>
                        <p className="text-xs font-medium text-foreground/80 mb-1">{dim.title}</p>
                        <p className="font-mono text-xs text-muted-foreground">{pillar.number}.{dIdx + 1} · {dim.questions.length} questions</p>
                      </div>
                      <div className="space-y-1.5">
                        {dim.questions.map((q) => (
                          <div key={q.id} className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: `${pillar.color}60` }} />
                            <span className="text-xs text-muted-foreground leading-tight">{q.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What you will discover */}
      <section className="border-t border-border bg-card px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-10">What You Will Discover</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Building2, color: "#5B9A6F", title: "Organisation", body: "Whether the organisation has clear goals, is structured to achieve them, and is led with the coherence and consistency needed to translate intent into sustained results." },
              { icon: Zap, color: "#C9A84C", title: "Process", body: "Whether your processes are purposefully designed with clear outcomes, well-structured with defined ownership, and actively managed to improve over time." },
              { icon: Users, color: "#2D9B87", title: "People", body: "Whether people understand what they are working toward, are organised into structures that enable them to succeed, and are managed in ways that sustain motivation and accountability." },
            ].map((item) => {
              const IIcon = item.icon;
              return (
                <div key={item.title} className="border border-border rounded-sm p-6 bg-background">
                  <div className="w-10 h-10 rounded-sm flex items-center justify-center mb-5" style={{ backgroundColor: `${item.color}18` }}>
                    <IIcon size={18} style={{ color: item.color }} />
                  </div>
                  <h3 className="font-serif text-lg text-foreground mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[
              { label: "Goal", desc: "Are objectives clear, measurable, and genuinely understood — and are they the right objectives to be pursuing?" },
              { label: "Structure", desc: "Is the organisation configured — in roles, teams, and processes — to actually achieve what it says it wants to achieve?" },
              { label: "Management", desc: "Are things actively monitored, guided, and improved? Is there real accountability for performance across all three columns?" },
            ].map((item) => (
              <div key={item.label} className="border border-border rounded-sm p-5" style={{ borderLeftWidth: 2, borderLeftColor: "rgba(237,232,220,0.15)" }}>
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">{item.label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it is for */}
      <section className="border-t border-border px-8 py-20 max-w-6xl mx-auto">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-10">Designed For</p>
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-muted-foreground leading-relaxed mb-5">
              The 3×3 Diagnostic is built for senior leaders — CEOs, C-suite executives, board members, and organisational consultants —
              who need more than intuition. It is a disciplined instrument for naming what is working and what is not,
              so leadership energy can be applied where it matters most.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              It is equally valuable at moments of transition: a new leadership mandate, a strategic reset, a merger or restructure,
              or simply the discipline of an annual organisational health review.
            </p>
          </div>
          <div className="space-y-3">
            {[
              "CEOs and executive leadership teams seeking objective organisational clarity",
              "Board members conducting governance or performance reviews",
              "HR and People leaders evaluating culture and capability maturity",
              "Management consultants running organisational diagnostics with clients",
              "Founders preparing their organisation for a period of significant growth",
            ].map((use, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 size={14} style={{ color: "#2D9B87" }} className="mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{use}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-10">How It Works</p>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: "01", title: "Complete the Assessment", body: "For each of 36 statements — across all nine intersections of the 3×3 matrix — select the option that most accurately reflects your organisation today. Options are descriptive, not numeric, to encourage honest reflection." },
              { step: "02", title: "Receive Your Diagnostic Report", body: "Immediately see your organisation's maturity across all 9 matrix intersections. The full 3×3 grid shows results by column (Organisation, Process, People) and by row (Goal, Structure, Management)." },
              { step: "03", title: "Act on the Analysis", body: "An executive summary translates your scores into a narrative — naming strengths, identifying priority focus areas, and providing a strategic recommendation tailored to your organisation's current maturity level." },
            ].map((item) => (
              <div key={item.step}>
                <p className="font-mono text-4xl font-bold text-border mb-5">{item.step}</p>
                <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Maturity framework */}
      <section className="border-t border-border px-8 py-20 max-w-6xl mx-auto">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-10">Maturity Framework</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Exemplary", color: "#5B9A6F", Icon: Star, desc: "A genuine organisational strength. Consistent, high-quality execution that sets a standard others can learn from." },
            { label: "Established", color: "#2D9B87", Icon: CheckCircle2, desc: "Functional and generally reliable, but with room for greater consistency and sophistication." },
            { label: "Developing", color: "#C9A84C", Icon: AlertTriangle, desc: "Recognised as important, but execution is inconsistent. Meaningful gaps exist between intention and practice." },
            { label: "At Risk", color: "#C0392B", Icon: XCircle, desc: "A critical weakness. Absent or highly inconsistent. Without intervention, this creates organisational vulnerability." },
          ].map(({ label, color, Icon, desc }) => (
            <div key={label} className="bg-card border border-border rounded-sm p-5" style={{ borderTopWidth: 2, borderTopColor: color }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={14} style={{ color }} />
                <p className="font-medium text-sm" style={{ color }}>{label}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-8 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-4xl text-foreground mb-4">Begin your organisational diagnostic</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
            No account required. Results are generated instantly and remain entirely in your browser.
            Complete it alone or use it to structure a leadership team conversation.
          </p>
          <button onClick={onStart} className="bg-primary text-primary-foreground px-10 py-4 rounded-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-3">
            Start the Diagnostic <ArrowRight size={17} />
          </button>
          <p className="text-xs text-muted-foreground mt-4">36 questions · 20–30 minutes · No signup required</p>
        </div>
      </section>

      <footer className="border-t border-border px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-sm bg-primary/20 flex items-center justify-center">
              <BarChart3 size={10} className="text-primary" />
            </div>
            <span className="font-serif text-sm text-muted-foreground">OrgDiagnostic</span>
          </div>
          <p className="text-xs text-muted-foreground">3×3 Organisational Diagnostic System</p>
        </div>
      </footer>
    </div>
  );
}
