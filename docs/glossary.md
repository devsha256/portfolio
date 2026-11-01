# Glossary

- **Post**: a blog article written in Markdown and stored in the `posts` table.
- **PostStatus**: `draft` (visible to the admin only) or `published` (public). A published post always has `publishedAt`.
- **Project**: an engagement on the career timeline (company, period, description, skills). Stored in the `projects` table.
- **Credential**: static content in `src/content`. Its kind is `certification`, `feedback` or `learning` (a learning-history entry).
- **AdminSession**: a server-side login record. The cookie holds a random token, and the DB stores only its SHA-256 hash.
- **Allowlist**: the one GitHub login allowed to administer the site, set by `ADMIN_GITHUB_LOGIN`.
- **Skill slug**: a URL-safe form of a skill name (`MuleSoft Anypoint Platform` → `mulesoft-anypoint-platform`), derived and never stored.
