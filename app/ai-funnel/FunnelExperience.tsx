"use client";

import { useMemo, useState } from "react";
import styles from "./ai-funnel.module.css";

const useCases = [
  {
    id: "service",
    label: "Service Business",
    title: "Turn website visitors into qualified leads.",
    reply:
      "I can explain services, answer common questions, collect project details, and guide serious prospects toward a consultation.",
  },
  {
    id: "retail",
    label: "Retail / Affiliate",
    title: "Help shoppers find the right product faster.",
    reply:
      "I can compare products, explain features, point visitors toward the right category, and keep affiliate disclosures visible while they shop.",
  },
  {
    id: "church",
    label: "Church / Organization",
    title: "Give every visitor a welcoming first response.",
    reply:
      "I can answer questions about services, ministries, events, donations, directions, and connect someone with a real person when needed.",
  },
  {
    id: "custom",
    label: "Custom Business",
    title: "Train a representative around your exact business.",
    reply:
      "WASCIK can shape the assistant around your approved knowledge, brand voice, lead flow, and the actions you want visitors to take.",
  },
] as const;

export default function FunnelExperience() {
  const [selected, setSelected] = useState<(typeof useCases)[number]["id"]>("service");
  const [demoOpen, setDemoOpen] = useState(false);

  const current = useMemo(
    () => useCases.find((item) => item.id === selected) ?? useCases[0],
    [selected]
  );

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>WASCIK AI DIGITAL REPRESENTATIVES</p>
          <h1>Don&apos;t add another chatbot. Put a representative on your website.</h1>
          <p className={styles.lead}>
            WASCIK is developing interactive AI representatives that can greet visitors,
            answer questions, guide customers, capture leads, and feel like part of the
            business instead of another box in the corner.
          </p>
          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryButton} onClick={() => setDemoOpen(true)}>
              Meet the Representative
            </button>
            <a className={styles.secondaryButton} href="#fit">
              See What It Can Do
            </a>
          </div>
          <div className={styles.proofStrip}>
            <span>24/7 first response</span>
            <span>Business-trained knowledge</span>
            <span>Lead qualification</span>
            <span>Human handoff ready</span>
          </div>
        </div>

        <div className={styles.stageWrap} aria-label="AI representative concept demo">
          <div className={styles.glow} />
          <div className={styles.speechBubble}>
            <span className={styles.speechLabel}>WASCIK DIGITAL REPRESENTATIVE</span>
            <strong>{demoOpen ? current.title : "Hi. I&apos;m your website representative."}</strong>
            <p>
              {demoOpen
                ? current.reply
                : "I can help your visitors understand what you offer and guide them toward the right next step."}
            </p>
            <div className={styles.replyField}>
              <span>{demoOpen ? "Ask me about this business..." : "Tap below to start the demo"}</span>
              <button type="button" onClick={() => setDemoOpen(true)} aria-label="Start representative demo">
                →
              </button>
            </div>
          </div>

          <div className={styles.avatar} aria-hidden="true">
            <div className={styles.avatarHead}>
              <span className={styles.eyeLeft} />
              <span className={styles.eyeRight} />
              <span className={styles.smile} />
            </div>
            <div className={styles.avatarBody}>
              <span className={styles.badge}>AI</span>
            </div>
          </div>
          <p className={styles.stageNote}>Stage 1 concept avatar — custom people and branded characters come later.</p>
        </div>
      </section>

      <section className={styles.section} id="fit">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>MAKE IT FIT THE BUSINESS</p>
          <h2>Choose what kind of visitor you want your representative to help.</h2>
          <p>
            The assistant should not give every company the same canned conversation. The funnel starts by identifying the business and the job the representative needs to do.
          </p>
        </div>

        <div className={styles.selectorGrid}>
          {useCases.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.selectorCard} ${selected === item.id ? styles.selectorCardActive : ""}`}
              onClick={() => {
                setSelected(item.id);
                setDemoOpen(true);
              }}
            >
              <span>{item.label}</span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.workflowSection}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>THE VISITOR JOURNEY</p>
          <h2>From curiosity to conversation to customer.</h2>
        </div>
        <div className={styles.workflowGrid}>
          <article><span>01</span><h3>Welcome</h3><p>The representative appears as part of the site and starts with a useful, branded greeting.</p></article>
          <article><span>02</span><h3>Understand</h3><p>It identifies what the visitor needs and answers from approved company information.</p></article>
          <article><span>03</span><h3>Qualify</h3><p>It gathers the details the business actually needs instead of collecting random contact information.</p></article>
          <article><span>04</span><h3>Convert</h3><p>It routes the visitor toward booking, buying, contacting the team, or another defined next action.</p></article>
        </div>
      </section>

      <section className={styles.futureSection}>
        <div>
          <p className={styles.eyebrow}>BUILT TO GROW</p>
          <h2>Start with an AI representative. Grow into a digital employee.</h2>
        </div>
        <div className={styles.futureGrid}>
          <span>Selectable avatar library</span>
          <span>Custom branded characters</span>
          <span>Owner or employee likeness with consent</span>
          <span>Voice interaction</span>
          <span>Appointment and lead integrations</span>
          <span>Analytics and conversation insights</span>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <p className={styles.eyebrow}>WASCIK AI ASSISTANT — EARLY ACCESS</p>
        <h2>What would your digital representative need to do?</h2>
        <p>Tell WASCIK about your business and the customer journey you want to improve.</p>
        <a className={styles.primaryButton} href="/start-project?service=ai-representative">
          Start My AI Representative
        </a>
        <small>Stage 1 is a concept funnel. Live AI, lead storage, avatar selection, and customer onboarding are planned for later stages.</small>
      </section>
    </main>
  );
}
