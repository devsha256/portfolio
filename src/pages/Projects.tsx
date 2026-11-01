import { Link, useSearchParams } from 'react-router';
import { Seo } from '../components/Seo';
import type { ProjectDto } from '../domain/contracts';
import { collectSkills, filterBySkill, formatPeriod, type SkillCount } from '../domain/project';
import { slugify } from '../domain/slug';
import { SITE } from '../domain/site';
import { useApi } from '../hooks/useApi';
import { ProjectList } from '../lib/api-schemas';
import { GITHUB_REPOS_URL, RepoList } from '../lib/github';

function SkillFilter({ skills, active }: { skills: readonly SkillCount[]; active: string | null }) {
  const [, setSearchParams] = useSearchParams();
  return (
    <label className="flex flex-wrap items-center gap-3">
      <span className="font-medium">Filter by skill</span>
      <select
        value={active ?? ''}
        onChange={(event) => setSearchParams(event.target.value ? { skill: event.target.value } : {})}
        className="rounded-md border border-line bg-panel px-3 py-2"
      >
        <option value="">All skills</option>
        {skills.map((skill) => (
          <option key={skill.slug} value={skill.slug}>
            {skill.name} ({skill.count})
          </option>
        ))}
      </select>
    </label>
  );
}

function TimelineItem({ project }: { project: ProjectDto }) {
  return (
    <li>
      <p className="text-sm text-muted tabular-nums">{formatPeriod(project.startMonth, project.endMonth)}</p>
      <h3 className="mt-1 text-2xl font-semibold tracking-tight">{project.title}</h3>
      <p className="font-medium">{project.company}</p>
      <p className="mt-3 max-w-prose leading-relaxed">{project.description}</p>
      <ul aria-label="Skills used" className="mt-4 flex flex-wrap gap-2 text-sm">
        {project.skills.map((skill) => (
          <li key={skill}>
            <Link to={`/projects?skill=${slugify(skill)}`} className="rounded-full border border-line px-2.5 py-0.5 no-underline">
              {skill}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

function Timeline({ projects }: { projects: readonly ProjectDto[] }) {
  const [searchParams] = useSearchParams();
  const active = searchParams.get('skill');
  const shown = filterBySkill(projects, active);
  return (
    <>
      <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-3">
        <SkillFilter skills={collectSkills(projects)} active={active} />
        {active && <Link to="/projects">Show all projects</Link>}
      </div>
      {shown.length === 0 ? (
        <p className="text-muted">No project uses this skill yet. Pick another skill or show all projects.</p>
      ) : (
        <ol aria-label="Project timeline" className="timeline">
          {shown.map((project) => (
            <TimelineItem key={project.id} project={project} />
          ))}
        </ol>
      )}
    </>
  );
}

function Repositories() {
  const repos = useApi(GITHUB_REPOS_URL, RepoList, { cacheKey: 'github-repos' });
  const profile = (
    <a href={SITE.links.github}>See all repositories on GitHub</a>
  );
  if (repos.status === 'loading') return <p className="text-muted">Loading repositories…</p>;
  if (repos.status !== 'ready') return <p>GitHub could not be reached right now. {profile}</p>;
  return (
    <>
      <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {repos.data.map((repo) => (
          <li key={repo.name}>
            <a href={repo.html_url} className="text-lg font-semibold">
              {repo.name}
            </a>
            {repo.description && <p className="mt-1 text-muted">{repo.description}</p>}
            {repo.language && <p className="mt-1 text-sm text-muted">{repo.language}</p>}
          </li>
        ))}
      </ul>
      <p className="mt-8">{profile}</p>
    </>
  );
}

export default function Projects() {
  const projects = useApi('/api/projects', ProjectList);
  return (
    <>
      <Seo title="Projects" description={`Integration projects by ${SITE.name}, from 2020 to today.`} path="/projects" />
      <h1 className="pt-12 text-5xl font-bold tracking-tight">Projects</h1>
      <p className="mt-4 mb-12 max-w-prose text-lg text-muted">Integration work from 2020 to today, newest first.</p>
      {projects.status === 'loading' && <p className="text-muted">Loading projects…</p>}
      {(projects.status === 'error' || projects.status === 'not-found') && (
        <p>Projects could not be loaded. Refresh the page to try again.</p>
      )}
      {projects.status === 'ready' && <Timeline projects={projects.data.items} />}
      <section className="mt-12">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">Open source</h2>
        <Repositories />
      </section>
    </>
  );
}
