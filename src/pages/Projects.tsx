import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, FolderOpen, Plus } from "lucide-react";
import { api, ApiError, type Project } from "@/lib/api";
import { useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectProgress, ProjectStatusBadge, projectDateRange } from "@/components/projects/ProjectProgress";

export default function Projects() {
  const { t, language } = useLanguage();
  const p = t.projects;
  const locale = language === "es" ? "es-CR" : "en-US";
  const navigate = useNavigate();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    api.projects
      .list()
      .then((list) => {
        setProjects(list);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : p.failedToLoad))
      .finally(() => setLoading(false));
  }, [p.failedToLoad]);

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="flex flex-col gap-1.5">
            <CardTitle>{p.title}</CardTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">{p.intro}</p>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{p.add}</span>
          </Button>
        </CardHeader>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!error && projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">{p.none}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => {
            const dates = projectDateRange(project, locale);
            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="rounded-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="h-full transition-colors hover:bg-accent/40">
                  <CardContent className="flex flex-col gap-3 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <FolderOpen className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span className="truncate font-medium">{project.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <ProjectStatusBadge status={project.status} />
                        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[dates, p.expenseCount(project.expense_count)].filter(Boolean).join(" · ")}
                    </p>
                    <ProjectProgress project={project} />
                    {project.counted_as_regular && (
                      <p className="text-xs text-muted-foreground">{p.countedAsRegular}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {creating && (
        <ProjectForm
          existing={null}
          onClose={() => setCreating(false)}
          onSaved={(project) => navigate(`/projects/${project.id}`)}
        />
      )}
    </div>
  );
}
