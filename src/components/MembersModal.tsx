"use client";

import { useState } from "react";

type Member = {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string };
};

type Project = {
  id: string;
  name: string;
  color: string;
  icon: string;
  userId: string;
  members?: Member[];
};

const AVATARS = ["#f43f5e", "#3b82f6", "#10b981", "#8b5cf6", "#f97316", "#06b6d4"];

function getColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATARS[Math.abs(hash) % AVATARS.length];
}

function initials(name: string | null, email: string) {
  if (name) return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  return email[0].toUpperCase();
}

function Avatar({ name, email, size = 32 }: { name: string | null; email: string; size?: number }) {
  const ini = initials(name, email);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: getColor(email),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, color: "#dfebff",
      fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
    }}>{ini}</div>
  );
}

export default function MembersModal({
  project,
  currentUserId,
  onClose,
  onUpdate,
}: {
  project: Project;
  currentUserId: string;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isOwner = project.userId === currentUserId;
  const members = project.members ?? [];

  const handleInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/projects/${project.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to invite");
    } else {
      setSuccess(`${data.name ?? data.email} added to project!`);
      setEmail("");
      onUpdate();
    }
    setLoading(false);
  };

  const handleRemove = async (userId: string) => {
    setRemoving(userId);
    const res = await fetch(`/api/projects/${project.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) onUpdate();
    setRemoving(null);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(4px)",
      fontFamily: "'DM Sans', sans-serif",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{
        background: "#ededed", border: "1px solid #cbd5e1",
        borderRadius: 16, padding: 28, width: 460,
        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        maxHeight: "85vh", display: "flex", flexDirection: "column",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{project.icon}</span>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "#505050" }}>
                Members
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{project.name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>

        {/* Invite (only owner) */}
        {isOwner && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              Invite by email
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); setSuccess(""); }}
                onKeyDown={e => e.key === "Enter" && handleInvite()}
                placeholder="colleague@company.com"
                style={{
                  flex: 1, background: "#f1f5f9",
                  border: `1px solid ${error ? "#ef4444" : "#0f172a"}`,
                  borderRadius: 8, padding: "9px 14px",
                  color: "#0f172a", fontSize: 13, outline: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => (e.target.style.borderColor = project.color)}
                onBlur={e => (e.target.style.borderColor = error ? "#ef4444" : "#0f172a")}
              />
              <button
                onClick={handleInvite}
                disabled={loading || !email.trim()}
                style={{
                  background: project.color, border: "none", borderRadius: 8,
                  padding: "9px 16px", color: "#ededed", fontSize: 13, fontWeight: 600,
                  cursor: loading || !email.trim() ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  opacity: loading || !email.trim() ? 0.6 : 1,
                  boxShadow: `0 0 16px ${project.color}44`,
                  whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {loading ? (
                  <div style={{ width: 14, height: 14, border: "2px solid #fff4", borderTopColor: "#dfebff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                ) : "＋ Invite"}
              </button>
            </div>

            {error && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444", display: "flex", alignItems: "center", gap: 5 }}>
                ⚠ {error}
              </div>
            )}
            {success && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#10b981", display: "flex", alignItems: "center", gap: 5 }}>
                ✓ {success}
              </div>
            )}
          </div>
        )}

        {/* Members list */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
          {members.length} {members.length === 1 ? "Member" : "Members"}
        </div>

        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {members.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>
              No members yet — invite someone above
            </div>
          )}

          {members.map(member => {
            const isMe = member.user.id === currentUserId;
            const isProjectOwner = member.user.id === project.userId;
            return (
              <div key={member.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 10,
                background: isMe ? "#eff6ff" : "#f1f5f9",
                border: `1px solid ${isMe ? project.color + "33" : "#0f172a"}`,
              }}>
                <Avatar name={member.user.name} email={member.user.email} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                    {member.user.name ?? member.user.email}
                    {isMe && <span style={{ fontSize: 10, color: project.color, fontWeight: 700, background: `${project.color}22`, padding: "1px 6px", borderRadius: 100 }}>you</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {member.user.email}
                  </div>
                </div>

                {/* Role badge */}
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                  padding: "2px 8px", borderRadius: 100, textTransform: "uppercase",
                  background: isProjectOwner ? "#f9731622" : "#0f172a",
                  color: isProjectOwner ? "#f97316" : "#64748b",
                  border: `1px solid ${isProjectOwner ? "#f9731644" : "#cbd5e1"}`,
                }}>
                  {isProjectOwner ? "owner" : "member"}
                </span>

                {/* Remove button (owner only, can't remove owner) */}
                {isOwner && !isProjectOwner && (
                  <button
                    onClick={() => handleRemove(member.user.id)}
                    disabled={removing === member.user.id}
                    title="Remove from project"
                    style={{
                      background: "none", border: "none",
                      color: removing === member.user.id ? "#334155" : "#94a3b8",
                      cursor: "pointer", fontSize: 16, padding: "2px 4px",
                      borderRadius: 6, transition: "color 0.15s", flexShrink: 0,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
                  >
                    {removing === member.user.id ? "…" : "×"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
