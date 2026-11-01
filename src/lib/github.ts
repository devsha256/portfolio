import { z } from 'zod';
import { SITE } from '../domain/site';

export const GITHUB_REPOS_URL = `https://api.github.com/users/${SITE.github}/repos?per_page=100&sort=updated&type=owner`;

const Repo = z.object({
  name: z.string(),
  html_url: z.url(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stargazers_count: z.number().int(),
  fork: z.boolean(),
  updated_at: z.iso.datetime(),
});

/** Own (non-fork) repositories, most recently updated first. */
export const RepoList = z
  .array(Repo)
  .transform((repos) => repos.filter((repo) => !repo.fork).sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
export type Repo = z.infer<typeof Repo>;
