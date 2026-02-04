"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SignInButton, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";

import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { DashboardShell } from "@/components/templates/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SearchableSelect, {
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  DEFAULT_IDENTITY_TEMPLATE,
  DEFAULT_SOUL_TEMPLATE,
} from "@/lib/agent-templates";

const apiBase = getApiBaseUrl();

type Agent = {
  id: string;
  name: string;
};

type Board = {
  id: string;
  name: string;
  slug: string;
};

const HEARTBEAT_TARGET_OPTIONS: SearchableSelectOption[] = [
  { value: "none", label: "None (no outbound message)" },
  { value: "last", label: "Last channel" },
];

const getBoardOptions = (boards: Board[]): SearchableSelectOption[] =>
  boards.map((board) => ({
    value: board.id,
    label: board.name,
  }));

export default function NewAgentPage() {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();

  const [name, setName] = useState("");
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardId, setBoardId] = useState<string>("");
  const [heartbeatEvery, setHeartbeatEvery] = useState("10m");
  const [heartbeatTarget, setHeartbeatTarget] = useState("none");
  const [identityTemplate, setIdentityTemplate] = useState(
    DEFAULT_IDENTITY_TEMPLATE
  );
  const [soulTemplate, setSoulTemplate] = useState(DEFAULT_SOUL_TEMPLATE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBoards = async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const response = await fetch(`${apiBase}/api/v1/boards`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!response.ok) {
        throw new Error("Unable to load boards.");
      }
      const data = (await response.json()) as Board[];
      setBoards(data);
      if (!boardId && data.length > 0) {
        setBoardId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  useEffect(() => {
    loadBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSignedIn) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Agent name is required.");
      return;
    }
    if (!boardId) {
      setError("Select a board before creating an agent.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch(`${apiBase}/api/v1/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          name: trimmed,
          board_id: boardId,
          heartbeat_config: {
            every: heartbeatEvery.trim() || "10m",
            target: heartbeatTarget,
          },
          identity_template: identityTemplate.trim() || null,
          soul_template: soulTemplate.trim() || null,
        }),
      });
      if (!response.ok) {
        throw new Error("Unable to create agent.");
      }
      const created = (await response.json()) as Agent;
      router.push(`/agents/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardShell>
      <SignedOut>
        <div className="col-span-2 flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 p-10 text-center">
          <div className="rounded-xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
            <p className="text-sm text-slate-600">Sign in to create an agent.</p>
            <SignInButton
              mode="modal"
              forceRedirectUrl="/agents/new"
              signUpForceRedirectUrl="/agents/new"
            >
              <Button className="mt-4">Sign in</Button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-8 py-6">
            <div>
              <h1 className="font-heading text-2xl font-semibold text-slate-900 tracking-tight">
                Create agent
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Agents start in provisioning until they check in.
              </p>
            </div>
          </div>

          <div className="p-8">
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Agent identity
                </p>
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">
                      Agent name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="e.g. Deploy bot"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">
                      Board <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      ariaLabel="Select board"
                      value={boardId}
                      onValueChange={setBoardId}
                      options={getBoardOptions(boards)}
                      placeholder="Select board"
                      searchPlaceholder="Search boards..."
                      emptyMessage="No matching boards."
                      triggerClassName="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      contentClassName="rounded-xl border border-slate-200 shadow-lg"
                      itemClassName="px-4 py-3 text-sm text-slate-700 data-[selected=true]:bg-slate-50 data-[selected=true]:text-slate-900"
                      disabled={boards.length === 0}
                    />
                    {boards.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        Create a board before adding agents.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Agent persona
                </p>
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">
                      Identity template
                    </label>
                    <Textarea
                      value={identityTemplate}
                      onChange={(event) => setIdentityTemplate(event.target.value)}
                      rows={8}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-slate-500">
                      Keep the agent_name and agent_id variables unchanged so
                      the gateway can render them correctly.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">
                      Soul template
                    </label>
                    <Textarea
                      value={soulTemplate}
                      onChange={(event) => setSoulTemplate(event.target.value)}
                      rows={10}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Heartbeat settings
                </p>
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">
                      Interval
                    </label>
                    <Input
                      value={heartbeatEvery}
                      onChange={(event) => setHeartbeatEvery(event.target.value)}
                      placeholder="e.g. 10m"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-slate-500">
                      How often this agent runs HEARTBEAT.md (10m, 30m, 2h).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">
                      Target
                    </label>
                    <SearchableSelect
                      ariaLabel="Select heartbeat target"
                      value={heartbeatTarget}
                      onValueChange={setHeartbeatTarget}
                      options={HEARTBEAT_TARGET_OPTIONS}
                      placeholder="Select target"
                      searchPlaceholder="Search targets..."
                      emptyMessage="No matching targets."
                      triggerClassName="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      contentClassName="rounded-xl border border-slate-200 shadow-lg"
                      itemClassName="px-4 py-3 text-sm text-slate-700 data-[selected=true]:bg-slate-50 data-[selected=true]:text-slate-900"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-sm">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating…" : "Create agent"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.push("/agents")}
                >
                  Back to agents
                </Button>
              </div>
            </form>
          </div>
        </main>
      </SignedIn>
    </DashboardShell>
  );
}
