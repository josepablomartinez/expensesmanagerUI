import * as React from "react";
import { api, type Category } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

export default function Categories() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api.categories
      .list()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Categories</h1>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between pt-4">
              <div className="flex flex-col">
                <span className="font-medium">{c.category}</span>
                <span className="text-xs text-muted-foreground">{c.subcategory}</span>
              </div>
              {c.budget != null && <span className="text-sm text-muted-foreground">{c.budget.toFixed(0)}</span>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
