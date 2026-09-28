import Link from "next/link";
import styles from "./landing.module.css";

const STEPS = [
  {
    title: "Assess",
    text: "The trainer records the member's measurements, goal, available equipment and any injuries or restrictions.",
  },
  {
    title: "Recommend",
    text: "A machine-learning model suggests a workout category and shows how confident it is, so the trainer can judge it.",
  },
  {
    title: "Plan and check",
    text: "A rule-based generator and a Gemini-assisted generator draft weekly plans from an approved exercise catalogue. Every plan is checked against equipment, restrictions, duration and safe set and rep ranges.",
  },
  {
    title: "Approve and train",
    text: "Only a plan the trainer approves reaches the member's app. Completed workouts feed adherence and a transparent progress projection.",
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <span className="brand" style={{ fontSize: 20 }}>
          <span className="brand-mark" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </span>
          FitWise
        </span>
        <nav className={styles.navLinks}>
          <Link href="/signup">For trainers</Link>
          <Link href="/login" className="button primary small-button">
            Sign in
          </Link>
        </nav>
      </header>

      <main>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Personalised fitness recommendation</p>
            <h1 className={styles.title}>Weekly plans that fit the member, checked before they reach them.</h1>
            <p className={styles.lede}>
              FitWise helps gym trainers turn a member&apos;s assessment into a safe, structured weekly plan. Machine learning and
              generative AI draft the plan; fixed rules check it; the trainer approves it.
            </p>
            <div className={styles.ctas}>
              <Link href="/signup" className="button primary">
                Apply as a trainer
              </Link>
              <Link href="/login" className="button secondary">
                Member or trainer sign in
              </Link>
            </div>
          </div>
          <div className={styles.planCard} aria-label="Example plan check">
            <div className={styles.planHead}>
              <strong>Beginner, knee sensitivity</strong>
              <span className="status">plan valid</span>
            </div>
            <ul className={styles.checks}>
              <li>Only dumbbell and bike exercises the member has access to</li>
              <li>No high-impact or knee-loading movements</li>
              <li>Each session within 35 minutes</li>
              <li>2 sets × 10 reps, 75 s rest for beginners</li>
            </ul>
            <p className="muted small">Example of the checks every generated plan must pass before a trainer can approve it.</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>How it works</h2>
          <ol className={styles.steps}>
            {STEPS.map((s) => (
              <li key={s.title}>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={`${styles.section} ${styles.audiences}`}>
          <div className="card">
            <h3>For trainers</h3>
            <p className="muted">
              Register members, review predictions, compare generated plans side by side and follow up on members who fall behind.
              Apply online; a gym administrator approves new trainer accounts.
            </p>
            <Link href="/signup" className="button primary small-button">
              Apply as a trainer
            </Link>
          </div>
          <div className="card">
            <h3>For members</h3>
            <p className="muted">
              Your trainer creates your account and gives you your sign-in details. Use the FitWise app to see today&apos;s workout,
              record what you completed and track your progress.
            </p>
            <Link href="/login" className="button secondary small-button">
              Sign in
            </Link>
          </div>
          <div className="card">
            <h3>Your data</h3>
            <p className="muted">
              Fitness records are visible only to you and your own trainer. Gym administrators manage accounts but cannot read fitness
              data.
            </p>
          </div>
        </section>

        <p className={styles.disclaimer}>
          FitWise gives general fitness guidance reviewed by a trainer. It is not medical advice. If you have pain, an injury or a health
          condition, speak to a qualified professional before training.
        </p>
      </main>

      <footer className={styles.footer}>
        <span>FitWise · BCNS capstone project, University of Technology, Mauritius</span>
        <a href="/api/health">System status</a>
      </footer>
    </div>
  );
}
