# Spec: portfolio-v1


**Goal.** Visitors can read Saddam's work, credentials and blog. The single admin can manage posts and projects from a browser.

**Content ported from the old site**
- Home: tagline "MuleSoft · Integration · Architecture" and a summary. The summary uses an experience counter that starts at 2020-02-24. The 100 summaries in `summaries.yml` are near-duplicates, so I keep 1.
- Projects: 7 entries from `projects.yml` → DB seed.
  - `slugified_skills` is dropped and skill slugs are derived from the names. This fixes the old Salesforce↔SAP mislink at its cause.
- Blog: 3 posts from `_posts` → DB seed.
- Credentials: 6 certifications, 15 feedback items and 309 learning entries → `src/content/*.json`, plus their images → `public/img`.
- Social links: email, GitHub, LinkedIn, YouTube, and the resume Drive link.
- Dropped: `notice-period` (hidden on the old site), the Python helper scripts, Google Analytics and the bundled `resume.pdf` (the Drive link stays).

**User stories and acceptance criteria (Given/When/Then)**
- **Home page.** When a visitor opens `/`, they see the name, tagline, summary with computed years, call-to-action links and social links.
- **Projects.**
  - When a visitor opens `/projects`, projects show newest first with period text such as "Jul 2025 – Present".
  - With `?skill=dataweave`, only matching projects show.
  - A section lists public, non-fork GitHub repos. It is cached per browser session. If GitHub fails, it shows a link to the GitHub profile.
- **Blog list.** When a visitor opens `/blog`, they see only published posts, newest first, paginated at 10. Tags filter the list.
- **Blog post.** A post at `/blog/:slug` renders GFM Markdown with no raw HTML. An unknown or draft slug returns a 404 page.
- **About page.** `/about` shows the summary, skills grouped from project data, and the top certifications.
- **Contact page.** `/contact` shows mailto and social links. There is no form, so no email service is needed.
- **Credentials.** `/credentials` has tabs for certifications, feedback and learning history. Learning history has text search and pagination.
- **Sign-in.**
  - When the admin clicks "Sign in with GitHub", OAuth completes and an HttpOnly session cookie is set.
  - Any other GitHub login gets 403 and no session.
- **Admin protection.** Every `/api/admin/*` request without a valid session returns 401. A non-allowlisted login returns 403. This is checked server-side.
- **Post editing.** The admin can create, edit, preview, publish, unpublish and delete posts.
  - Publish sets `publishedAt` once.
  - A duplicate slug returns 409.
  - Delete is idempotent: a second delete returns 204.
- **Project editing.** The admin can create, edit and delete projects.
- **SEO.** `/rss.xml` and `/sitemap.xml` list published posts. Each page sets a title, description and Open Graph meta.

**Out of scope:** deploying, a custom domain, comments, a contact form, image upload (images live in `/public`), editing credentials in the admin, prerendering or SSR.

**Free-tier impact:** see section 4.

**Glossary terms:** Post, PostStatus, Project, Credential (certification | feedback | learning), AdminSession, Allowlist.


## Open questions
- Resolved before approval: routes add /credentials; credentials static JSON; PGlite for local DB.
