"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Plus,
  ShieldCheck,
  Users,
  Vote,
} from "lucide-react";
import { useApp, useRemote } from "./app-provider";
import { Button } from "./ui/button";
import { ErrorState, Loading, StatusBadge } from "./common";
import { LoginButton } from "./site-header";
import type { PollCard } from "@/lib/types";
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { admin, ready } = useApp();
  if (!ready) return <Loading />;
  if (!admin)
    return (
      <div className="empty-state">
        <ShieldCheck size={36} />
        <h1>This is the admin space.</h1>
        <p>Log in to create polls, choose finalists, and manage results.</p>
        <LoginButton />
      </div>
    );
  return <>{children}</>;
}
function Dashboard() {
  const { data: polls, error } = useRemote<PollCard[]>("/api/polls");
  if (error) return <ErrorState error={error} />;
  if (!polls) return <Loading />;
  return (
    <>
      <div className="page-eyebrow">CONTROL ROOM</div>
      <div className="admin-heading">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="muted">
            Good questions. Live decisions. Everything in one place.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/new">
            <Plus size={18} />
            Create poll
          </Link>
        </Button>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <span>
            <BarChart3 size={17} />
            Total polls
          </span>
          <strong>{polls.length}</strong>
        </div>
        <div className="stat-card">
          <span>
            <Vote size={17} />
            Open for voting
          </span>
          <strong>
            {polls.filter((p) => ["LIVE", "FINAL"].includes(p.status)).length}
          </strong>
        </div>
        <div className="stat-card">
          <span>
            <Users size={17} />
            Current-round participants
          </span>
          <strong>{polls.reduce((n, p) => n + p.participants, 0)}</strong>
        </div>
      </div>
      <div className="section-label">
        <h2>Your polls</h2>
        <span className="muted">Updates appear automatically</span>
      </div>
      {polls.length ? (
        <div className="admin-poll-list">
          {polls.map((p) => (
            <Link className="admin-poll-row" key={p.id} href={`/admin/${p.id}`}>
              <div className="admin-poll-icon">
                <BarChart3 />
              </div>
              <div className="admin-poll-info">
                <h3>{p.title}</h3>
                <span>
                  {p.questionCount} questions · Round {p.currentRound} ·{" "}
                  {p.participants} participants
                </span>
              </div>
              <StatusBadge status={p.status} />
              <ArrowUpRight size={20} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Vote size={36} />
          <h2>Start a conversation.</h2>
          <p>Create your first poll and open it when you’re ready.</p>
          <Button asChild>
            <Link href="/admin/new">
              <Plus size={18} />
              Create poll
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
export function AdminDashboard() {
  return (
    <AdminGate>
      <Dashboard />
    </AdminGate>
  );
}
