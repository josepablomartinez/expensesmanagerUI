import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MiHarinaLogo } from "@/components/brand/MiHarinaLogo";
import { useT } from "@/lib/language";

export default function Login() {
  const t = useT();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: Location })?.from?.pathname ?? "/review";
      navigate(from, { replace: true });
    } catch {
      setError(t.login.invalidCredentials);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-3 pt-6 text-center">
          <MiHarinaLogo />
          <div className="space-y-1">
            <h1 className="text-xl font-medium text-foreground">{t.login.welcome}</h1>
            <p className="text-sm text-muted-foreground">{t.login.prompt}</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-sm font-medium text-foreground">{t.login.email}</label>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-sm font-medium text-foreground">{t.login.password}</label>
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="mt-1 w-full">
              {loading ? t.login.signingIn : t.login.signIn}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
