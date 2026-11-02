# Spec: admin-content

## Goal
The admin can edit everything the public site shows without a code change. That includes credentials (certifications, feedback, learning history) and the site profile text on Home and About, as well as posts and projects.

## Background
In portfolio-v1, credentials are static JSON in `src/content/*.json`, and the Home/About description is hard-coded in `src/domain/site.ts`. Changing either needs a commit and a redeploy. This feature moves both into the database and adds admin screens for them.

## User stories and acceptance criteria

**Credentials list.** Given the admin is signed in, when they open `/admin/credentials`:
- They see tabs for Certifications, Feedback and Learning history, each with a count.
- They can search by name or issuer.
- Each row links to its editor.

**Credential editor.** When the admin creates or edits a credential:
- The fields are kind, name, issuer, date, credential ID (optional), image (picked from `/img/**`), verify link (optional) and certificate link.
- Invalid fields show the contract's message next to the field, and no request is sent.
- A duplicate of an existing credential (same kind, name and date) returns 409, shown as an alert.

**Deleting a credential.** Given a credential exists, when the admin confirms Delete, it disappears from the admin and public lists. Deleting twice returns 204.

**Site profile editor.** When the admin opens `/admin/profile`, they can edit:
- the tagline (Home hero)
- the career start date (drives "{years}")
- the summary (Markdown paragraphs; `{years}` is replaced on render; shown on Home and About)
- the About introduction (optional Markdown, shown above the summary on About)

When they press Save, a status reads "Saved". Home and About show the new text after the CDN cache expires, which takes up to 5 minutes.

**Public pages.**
- `/credentials` and the About page's certifications read from the API, not bundled JSON.
- With no profile row yet, Home and About fall back to the ported text, so a fresh database never shows an empty hero.

**Security.**
- Every new admin route returns 401 without a session and 403 for a cross-origin write, through `requireAdmin`.
- The profile and credential text is rendered as text or through `Markdown` with `skipHtml`. It is never raw HTML.

## Out of scope
- Image upload. The admin picks an existing file under `public/img`; new images still go into the repo.
- Editing the name, email or social links. These stay in `src/domain/site.ts`.
- Profile version history.

## Free-tier impact
- **Vercel functions:** 9 now, at most 12 on Hobby. The design adds no net function beyond 11 by folding the feeds into one public content function. See the design doc.
- **Neon storage:** about 330 credential rows plus 1 profile row, under 1 MB.
- **Reads:** public reads are CDN-cached (`s-maxage=300`), so Neon stays asleep for most visits.

## Open questions
None blocking. Image upload to Cloudflare R2 can come later as its own spec.
