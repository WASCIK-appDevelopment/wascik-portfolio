"use client";

import { useMemo, useState } from "react";
import styles from "./ai-funnel.module.css";

const useCases = [
  {
    id: "service",
    label: "Service Business",
    title: "Turn website visitors into qualified leads.",
    reply: "I can explain services, answer common questions, collect project details, and guide serious prospects toward a consultation.",
  },
  {
    id: "retail",
    label: "Retail / Affiliate",
    title: "Help shoppers find the right product faster.",
    reply: "I can compare products, explain features, point visitors toward the right category, and keep affiliate disclosures visible while they shop.",
  },
  {
    id: "church",
    label: "Church / Organization",
    title: "Give every visitor a welcoming first response.",
    reply: "I can answer questions about services, ministries, events, donations, directions, and connect someone with a real person when needed.",
  },
  {
    id: "custom",
    label: "Custom Business",
    title: "Train a representative around your exact business.",
    reply: "WASCIK can shape the assistant around your approved knowledge, brand voice, lead flow, and the actions you want visitors to take.",
  },
] as const;

const goals = [
  { id: "leads", label: "Capture better leads", reply: "Great. I would qualify visitors before they reach your team so you know what they need and how serious they are." },
  { id: "sales", label: "Increase sales", reply: "I can guide shoppers toward the right product or service, answer objections, and move them toward the next purchase step." },
  { id: "support", label: "Answer questions", reply: "I can handle repeat questions instantly while keeping answers tied to information your business approves." },
  { id: "booking", label: "Book appointments", reply: "I can identify the right service, collect the details needed for scheduling, and eventually connect directly to booking tools." },
] as const;

const looks = [
  { id: "professional", label: "Professional", detail: "Polished business representative" },
  { id: "friendly", label: "Friendly", detail: "Warm, approachable greeter" },
  { id: "specialist", label: "Specialist", detail: "Industry-specific expert" },
  { id: "custom", label: "Custom likeness", detail: "Owner or employee, with consent" },
] as const;

type UseCaseId = (typeof useCases)[number]["id"];
type GoalId = (typeof goals)[number]["id"];
type LookId = (typeof looks)[number]["id"];

export default function FunnelExperience() {
  const [selected, setSelected] = useState<UseCaseId>("service");
  const [selectedGoal, setSelectedGoal] = useState<GoalId | null>(null);
  const [selectedLook, setSelectedLook] = useState<LookId>("professional");
  const [demoOpen, setDemoOpen] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [visitorName, setVisitorName] = useState("");
  const [businessName, setBusinessName] = useState("");

  const current = useMemo(() => useCases.find((item) => item.id === selected) ?? useCases[0], [selected]);
  const currentGoal = useMemo(() => goals.find((item) => item.id === selectedGoal), [selectedGoal]);
  const currentLook = useMemo(() => looks.find((item) => item.id === selectedLook) ?? looks[0], [selectedLook]);

  const openDemo = () => {
    setDemoOpen(true);
    setStep((value) => (value === 0 ? 1 : value));
  };

  const resetDemo = () => {
    setStep(1);
    setSelectedGoal(null);
    setVisitorName("");
    setBusinessName("");
  };

  const representativeMessage = (() => {
    if (!demoOpen || step === 0) {
      return {
        title: "Hi. I'm your website representative.",
        body: "I can greet visitors, understand what they need, and guide them toward the right next step without feeling like another chatbot box.",
      };
    }
    if (step === 1) {
      return {
        title: current.title,
        body: `${current.reply} What would you want me to help improve first?`,
      };
    }
    if (step === 2 && currentGoal) {
      return {
        title: `That is a strong job for a digital representative.`,
        body: `${currentGoal.reply} Now tell me a little about the business I would represent.`,
      };
    }
    return {
      title: businessName ? `I can already picture the experience for ${businessName}.` : "Your representative concept is taking shape.",
      body: `${visitorName ? `${visitorName}, ` : ""}WASCIK could build this around your brand, your approved knowledge, and the customer actions that matter most to you.`,
    };
  })();

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>WASCIK AI DIGITAL REPRESENTATIVES</p>
          <h1>Don&apos;t add another chatbot. Put a representative on your website.</h1>
          <p className={styles.lead}>
            WASCIK is developing interactive AI representatives that greet visitors, answer questions, guide customers, qualify leads, and feel like part of the business instead of another box in the corner.
          </p>
          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryButton} onClick={openDemo}>Meet the Representative</button>
            <a className={styles.secondaryButton} href="#fit">See What It Can Do</a>
          </div>
          <div className={styles.proofStrip}>
            <span>24/7 first response</span><span>Business-trained knowledge</span><span>Lead qualification</span><span>Human handoff ready</span>
          </div>
        </div>

        <div className={`${styles.stageWrap} ${demoOpen ? styles.stageActive : ""}`} aria-label="Interactive AI representative demo">
          <div className={styles.glow} />
          <div className={styles.stageStatus}><i /> LIVE CONCEPT EXPERIENCE</div>

          <div className={styles.speechBubble} aria-live="polite">
            <span className={styles.speechLabel}>WASCIK DIGITAL REPRESENTATIVE</span>
            <strong>{representativeMessage.title}</strong>
            <p>{representativeMessage.body}</p>

            {step === 1 && (
              <div className={styles.quickReplies}>
                {goals.map((goal) => (
                  <button key={goal.id} type="button" onClick={() => { setSelectedGoal(goal.id); setStep(2); }}>
                    {goal.label}
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className={styles.qualifyForm}>
                <input value={visitorName} onChange={(event) => setVisitorName(event.target.value)} placeholder="Your name" aria-label="Your name" />
                <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Business name" aria-label="Business name" />
                <button type="button" disabled={!businessName.trim()} onClick={() => setStep(3)}>Build My Concept →</button>
              </div>
            )}

            {step === 3 && (
              <div className={styles.conceptSummary}>
                <span>{current.label}</span>
                <span>{currentGoal?.label ?? "Custom goal"}</span>
                <span>{currentLook.label} avatar</span>
                <a href="/start-project?service=ai-representative">Continue to WASCIK →</a>
                <button type="button" onClick={resetDemo}>Restart demo</button>
              </div>
            )}

            {!demoOpen && (
              <button type="button" className={styles.inlineStart} onClick={openDemo}>Start the conversation →</button>
            )}
          </div>

          <div className={styles.avatarArea} aria-hidden="true">
            <div className={styles.avatarShadow} />
            <div className={`${styles.avatar} ${styles[`avatar_${selectedLook}`]}`}>
              <div className={styles.hair} />
              <div className={styles.avatarHead}>
                <span className={styles.browLeft} /><span className={styles.browRight} />
                <span className={styles.eyeLeft} /><span className={styles.eyeRight} />
                <span className={styles.nose} /><span className={styles.smile} />
              </div>
              <div className={styles.neck} />
              <div className={styles.avatarBody}>
                <span className={styles.lapelLeft} /><span className={styles.lapelRight} />
                <span className={styles.badge}>W</span>
              </div>
              <span className={styles.armLeft} /><span className={styles.armRight} />
            </div>
          </div>

          <div className={styles.lookPicker}>
            <span>Representative style</span>
            <div>
              {looks.map((look) => (
                <button key={look.id} type="button" title={look.detail} className={selectedLook === look.id ? styles.lookActive : ""} onClick={() => setSelectedLook(look.id)}>
                  {look.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="fit">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>MAKE IT FIT THE BUSINESS</p>
          <h2>Choose what kind of visitor you want your representative to help.</h2>
          <p>The assistant should not give every company the same canned conversation. The funnel starts by identifying the business and the job the representative needs to do.</p>
        </div>
        <div className={styles.selectorGrid}>
          {useCases.map((item) => (
            <button key={item.id} type="button" className={`${styles.selectorCard} ${selected === item.id ? styles.selectorCardActive : ""}`} onClick={() => { setSelected(item.id); setDemoOpen(true); setStep(1); setSelectedGoal(null); }}>
              <span>{item.label}</span><strong>{item.title}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.workflowSection}>
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>THE VISITOR JOURNEY</p><h2>From curiosity to conversation to customer.</h2></div>
        <div className={styles.workflowGrid}>
          <article><span>01</span><h3>Welcome</h3><p>The representative appears as part of the site and starts with a useful, branded greeting.</p></article>
          <article><span>02</span><h3>Understand</h3><p>It identifies what the visitor needs and answers from approved company information.</p></article>
          <article><span>03</span><h3>Qualify</h3><p>It gathers the details the business actually needs instead of collecting random contact information.</p></article>
          <article><span>04</span><h3>Convert</h3><p>It routes the visitor toward booking, buying, contacting the team, or another defined next action.</p></article>
        </div>
      </section>

      <section className={styles.futureSection}>
        <div><p className={styles.eyebrow}>BUILT TO GROW</p><h2>Start with an AI representative. Grow into a digital employee.</h2></div>
        <div className={styles.futureGrid}>
          <span>Selectable avatar library</span><span>Custom branded characters</span><span>Owner or employee likeness with consent</span><span>Voice interaction</span><span>Appointment and lead integrations</span><span>Analytics and conversation insights</span>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <p className={styles.eyebrow}>WASCIK AI ASSISTANT — EARLY ACCESS</p>
        <h2>What would your digital representative need to do?</h2>
        <p>Tell WASCIK about your business and the customer journey you want to improve.</p>
        <a className={styles.primaryButton} href="/start-project?service=ai-representative">Start My AI Representative</a>
        <small>Stage 2 is an interactive qualification prototype. Live AI responses, persistent lead storage, production avatar rendering, and customer onboarding remain for later stages.</small>
      </section>
    </main>
  );
}
