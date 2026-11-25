# Indiana Life & Health Insurance Exam Prep

An unofficial, offline-capable practice app for the Indiana Life & Health insurance producer exam.

- 242 original practice questions across 12 topic categories
- 150-question timed mock exams
- Separate on-device study profiles with name and local passcode (not cloud accounts)
- Persistent **Missed Questions** list: correct retries do NOT automatically remove questions; removal is manual
- Answer explanations, topic practice, study guide, progress dashboard, and export/import backups

## Use the app
Open the GitHub Pages URL after Pages is enabled under **Settings → Pages → Deploy from a branch → main → /(root)**.

On first visit, create a study profile by entering a name and passcode (at least 6 characters). Later choose that profile and sign in. Each profile has separate quizzes, missed questions, scores, and study history. The first profile can optionally import previous pre-login progress stored in that browser.

**Important**: These are on-device profiles, not true cloud user accounts. Passcodes are hashed locally; they do not provide strong security against someone who can access the same browser's storage. Your answers and progress are stored in that browser, not GitHub or a server, and **do not sync across devices**. Export backups periodically from Settings. For actual cross-device user accounts, use hosted identity and a database (such as Firebase Authentication + Firestore or Supabase).

The app is independent of the Indiana Department of Insurance and Pearson VUE. It does not replace official prelicensing study or guarantee a pass.
