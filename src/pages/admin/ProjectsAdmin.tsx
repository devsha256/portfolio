import { Link } from 'react-router';
import { formatPeriod } from '../../domain/project';
import { useApi } from '../../hooks/useApi';
import { ProjectList } from '../../lib/api-schemas';
import { LoadNotice } from './LoadNotice';

export default function ProjectsAdmin() {
  const projects = useApi('/api/admin/projects', ProjectList);
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <Link to="/admin/projects/new" className="button button--primary">
          New project
        </Link>
      </div>
      {projects.status !== 'ready' ? (
        <LoadNotice status={projects.status} what="projects" back="/admin/projects" />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {projects.data.items.map((project) => (
            <li key={project.id} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]">
              <span className="text-sm text-muted tabular-nums">{formatPeriod(project.startMonth, project.endMonth)}</span>
              <span>
                <Link to={`/admin/projects/${project.id}`}>{project.title}</Link>
                <span className="text-muted">, {project.company}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
