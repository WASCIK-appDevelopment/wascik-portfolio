import Image from "next/image";
import Link from "next/link";
import styles from "./thank-you.module.css";

export default function ThankYouPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="thank-you-title">
        <Link className={styles.brand} href="/" aria-label="Return to the WASCIK home page">
          <Image
            src="/wascik-logo-v2.png"
            alt="WASCIK — We Are So Cool It's Kool"
            width={460}
            height={126}
            priority
          />
        </Link>

        <div className={styles.content}>
          <div className={styles.portraitFrame}>
            <Image
              className={styles.portrait}
              src="/michael-wascik-full-v2.png"
              alt="Michael Lewis, founder and developer at WASCIK"
              width={420}
              height={520}
              priority
            />
          </div>

          <div className={styles.message}>
            <p className={styles.eyebrow}>You’re all set</p>
            <h1 id="thank-you-title">Thank you for choosing WASCIK.</h1>
            <p className={styles.lead}>
              I’m grateful for the opportunity to learn about your business and help
              build the website it deserves.
            </p>
            <p>
              I’ll be in touch soon to confirm your project details, next steps, and
              timeline. I look forward to building something powerful with you.
            </p>
            <p className={styles.signature}>
              — Michael Lewis
              <span>Founder &amp; Developer</span>
            </p>

            <div className={styles.actions}>
              <Link className={styles.primaryAction} href="/">
                Return to WASCIK
              </Link>
              <a className={styles.secondaryAction} href="tel:+15015782259">
                Call (501) 578-2259
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
