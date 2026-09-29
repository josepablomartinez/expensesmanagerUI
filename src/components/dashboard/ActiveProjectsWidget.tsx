import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FolderOpen } from "lucide-react";
import { api, type Project } from "@/lib/api";
import { useT } from "@/lib/language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectProgress } from "@/components/projects/ProjectProgress";

// Active projects with their budget use, a glance at what's running (the
// Projects page itself lives in the header's More menu). refreshKey reloads it after an expense edit on
// the same page, which may have created a project or moved spend.
export function ActiveProjectsWidget({ refreshKey = 0 }: { refreshKey?: number }) {
  const t = useT();
  const p = t.projects;
  const [projects, setProjects] = React.useState<Project[] | null>(null);

  React.useEffect(() => {
    api.projects
      .list()
      .then((list) => setProjects(list.filter((project) => project.status === "active")))
      .catch(() => setProjects([]));
  }, [refreshKey]);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>{p.home.title}</CardTitle>
        <Link to="/projects" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {p.home.viewAll}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {projects === null ? (
          <p className="text-sm text-muted-foreground">{t.common.loading}</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">{p.none}</p>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="flex flex-col gap-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <FolderOpen className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">{project.name}</span>
              </span>
              <ProjectProgress project={project} />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
