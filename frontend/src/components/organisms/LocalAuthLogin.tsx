"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

import { setLocalAuthToken } from "@/auth/localAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LocalAuthLogin() {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = token.trim();
    if (!cleaned) {
      setError("Bearer token is required.");
      return;
    }
    setLocalAuthToken(cleaned);
    setError(null);
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="mx-auto rounded-full bg-slate-100 p-3 text-slate-700">
            <Lock className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold text-slate-900">
              Local Authentication
            </h1>
            <p className="text-sm text-slate-600">
              Enter the shared local token configured as
              <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-xs">
                LOCAL_AUTH_TOKEN
              </code>
              on the backend.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste token"
              autoFocus
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
