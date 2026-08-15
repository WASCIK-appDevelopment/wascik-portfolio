"use client";

import { useMemo, useState } from "react";
import styles from "./ReviewPanel.module.css";

type ApprovedReview = {
  name: string;
  service: string;
  rating: number;
  review: string;
  date: string;
};

// Add only genuine, approved customer reviews here.
// Netlify form submissions remain private until Michael approves them.
const approvedReviews: ApprovedReview[] = [];

function Stars({ rating = 0, label }: { rating?: number; label: string }) {
  return (
    <span className={styles.stars} aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= Math.round(rating) ? styles.starFilled : styles.starEmpty} aria-hidden="true">★</span>
      ))}
    </span>
  );
}

export default function ReviewPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  const average = useMemo(() => {
    if (!approvedReviews.length) return 0;
    return approvedReviews.reduce((total, review) => total + review.rating, 0) / approvedReviews.length;
  }, []);

  return (
    <section id="reviews" className={styles.shell} aria-labelledby="review-summary-title">
      <button
        type="button"
        className={styles.summary}
        aria-expanded={isOpen}
        aria-controls="wascik-review-content"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={styles.summaryCopy}>
          <span className={styles.eyebrow}>CUSTOMER REVIEWS</span>
          <strong id="review-summary-title">What people say about WASCIK</strong>
        </span>
        <span className={styles.ratingBlock}>
          <Stars rating={average} label={approvedReviews.length ? `${average.toFixed(1)} out of 5 stars` : "No approved ratings yet"} />
          <span>{approvedReviews.length ? `${average.toFixed(1)} · ${approvedReviews.length} approved ${approvedReviews.length === 1 ? "review" : "reviews"}` : "No rating yet · 0 approved reviews"}</span>
        </span>
        <span className={styles.openLabel}>{isOpen ? "Close reviews" : "Read or leave a review"} <b aria-hidden="true">{isOpen ? "−" : "+"}</b></span>
      </button>

      {isOpen && (
        <div id="wascik-review-content" className={styles.expanded}>
          <div className={styles.expandedHeader}>
            <div>
              <span className={styles.eyebrow}>HONEST FEEDBACK</span>
              <h2>WASCIK customer reviews</h2>
              <p>Only genuine reviews approved for public display are shown here.</p>
            </div>
            <button type="button" className={styles.closeIcon} aria-label="Close reviews" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className={styles.reviewList}>
            {approvedReviews.length ? approvedReviews.map((item) => (
              <article className={styles.reviewCard} key={`${item.name}-${item.date}`}>
                <Stars rating={item.rating} label={`${item.rating} out of 5 stars`} />
                <blockquote>“{item.review}”</blockquote>
                <footer><strong>{item.name}</strong><span>{item.service} · {item.date}</span></footer>
              </article>
            )) : (
              <div className={styles.emptyState}>
                <Stars label="No approved ratings yet" />
                <h3>Be the first verified WASCIK customer to leave a review.</h3>
                <p>New submissions are reviewed before appearing publicly.</p>
              </div>
            )}
          </div>

          <div className={styles.formSection}>
            <div className={styles.formIntro}>
              <span className={styles.eyebrow}>SHARE YOUR EXPERIENCE</span>
              <h3>Leave a review</h3>
              <p>Your email is used only to verify the submission and will never be displayed. Reviews remain pending until approved.</p>
            </div>

            <form
              name="wascik-customer-review"
              method="POST"
              data-netlify="true"
              data-netlify-honeypot="company-website"
              className={styles.form}
            >
              <input type="hidden" name="form-name" value="wascik-customer-review" />
              <p className={styles.honeypot}>
                <label>Do not fill this out: <input name="company-website" tabIndex={-1} autoComplete="off" /></label>
              </p>

              <fieldset className={styles.ratingPicker}>
                <legend>Your rating</legend>
                <div>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating}>
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        required
                        checked={selectedRating === rating}
                        onChange={() => setSelectedRating(rating)}
                      />
                      <span className={rating <= selectedRating ? styles.starFilled : styles.starEmpty} aria-hidden="true">★</span>
                      <span className={styles.srOnly}>{rating} star{rating === 1 ? "" : "s"}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label>
                Your name
                <input name="customer-name" type="text" maxLength={80} autoComplete="name" required />
              </label>
              <label>
                Email for verification
                <input name="email" type="email" maxLength={120} autoComplete="email" required />
              </label>
              <label>
                Service received
                <select name="service" required defaultValue="">
                  <option value="" disabled>Select a service</option>
                  <option>Website development</option>
                  <option>Website maintenance</option>
                  <option>Mobile app or app planning</option>
                  <option>AI or business automation</option>
                  <option>Branding or digital design</option>
                  <option>Other WASCIK service</option>
                </select>
              </label>
              <label className={styles.fullWidth}>
                Your review
                <textarea name="review" rows={5} minLength={20} maxLength={1200} required placeholder="Tell others what WASCIK helped you accomplish." />
              </label>
              <label className={`${styles.consent} ${styles.fullWidth}`}>
                <input type="checkbox" name="permission-to-publish" value="yes" required />
                <span>I confirm this is my honest experience and give WASCIK permission to publish my review and first name or displayed name.</span>
              </label>

              <div className={`${styles.formActions} ${styles.fullWidth}`}>
                <button type="submit" className={styles.submitButton}>Submit review for approval</button>
                <p>Reviews are checked before they appear publicly.</p>
              </div>
            </form>
          </div>

          <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)}>Close reviews</button>
        </div>
      )}
    </section>
  );
}
