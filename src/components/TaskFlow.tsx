"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import MembersModal from "./MembersModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type Project = {
  id: string;
  name: string;
  color: string;
  icon: string;
  userId: string;
  members?: {
    id: string;
    role: string;
    user: { id: string; name: string | null; email: string };
  }[];
};
type Task = {
  id: string;
  title: string;
  section: string;
  priority: string;
  assignee: string;
  due: string | null;
  done: boolean;
  subtasks: number;
  projectId: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTIONS = ["Todo", "In Progress", "Done"];
const PRIORITY_COLORS: Record<string, string> = { High: "#ef4444", Medium: "#f97316", Low: "#6b7280" };
const PRIORITY_BG: Record<string, string> = { High: "#fef2f2", Medium: "#fff7ed", Low: "#f9fafb" };
const AVATARS: Record<string, string> = { AK: "#f43f5e", JS: "#3b82f6", MR: "#10b981" };

const PROJECT_ICONS = ["📁", "🚀", "🎨", "📣", "⚙️", "💡", "🔥", "⭐", "🎯", "📦"];
const PROJECT_COLORS = ["#f97316", "#8b5cf6", "#06b6d4", "#10b981", "#f43f5e", "#3b82f6", "#eab308", "#ec4899"];

// ─── API Hooks ────────────────────────────────────────────────────────────────

function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) setProjects(await res.json());
    } catch (e) {
      console.error("Failed to load projects", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const add = async (data: Omit<Project, "id">) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create project");
    await load();
    const created: Project = await res.clone().json();
    return created;
  };

  const remove = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    await load();
  };

  useEffect(() => { load(); }, [load]);
  return { projects, loading, add, remove, reload: load };
}

function useTasks(projectId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?projectId=${projectId}`);
      if (res.ok) setTasks(await res.json());
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const add = async (data: { title: string; section: string }) => {
    if (!projectId) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, projectId }),
    });
    await load();
  };

  const update = async (id: string, data: Partial<Task>) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    await load();
  };

  useEffect(() => { load(); }, [load]);
  return { tasks, loading, add, update, remove };
}

// ─── Small Components ─────────────────────────────────────────────────────────

const Avatar = ({ initials, size = 28 }: { initials?: string | null; size?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: initials ? AVATARS[initials] : "#94a3b8",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.35, fontWeight: 700, color: "white",
    fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
    letterSpacing: "-0.02em",
  }}>{initials}</div>
);

const PriorityBadge = ({ priority }: { priority: string }) => (
  <span style={{
    fontSize: 10, fontWeight: 600, letterSpacing: "0.05em",
    padding: "2px 7px", borderRadius: 100,
    background: PRIORITY_BG[priority] ?? "#f9fafb",
    color: PRIORITY_COLORS[priority] ?? "#6b7280",
    border: `1px solid ${(PRIORITY_COLORS[priority] ?? "#6b7280") + "22"}`,
    fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase",
  }}>{priority}</span>
);

const Spinner = () => (
  <div style={{
    width: 18, height: 18, border: "2px solid #1e1e24",
    borderTopColor: "#f97316", borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  }} />
);

// ─── New Project Modal ────────────────────────────────────────────────────────

function NewProjectModal({
                           onClose,
                           onCreate,
                         }: {
  onClose: () => void;
  onCreate: (data: Omit<Project, "id">) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [icon, setIcon] = useState(PROJECT_ICONS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Project name is required"); return; }
    setSaving(true);
    try {
      // @ts-ignore
      await onCreate({ name: name.trim(), color, icon });
      onClose();
    } catch {
      setError("Failed to create project. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(4px)",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#141417", border: "1px solid #2d2d35",
        borderRadius: 16, padding: 28, width: 420,
        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>
            New Project
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>

        {/* Preview */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", background: "#0f0f11",
          borderRadius: 10, marginBottom: 20, border: "1px solid #1e1e24",
        }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <span style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15,
            color: name ? "#e2e8f0" : "#475569",
            borderLeft: `3px solid ${color}`, paddingLeft: 10,
          }}>
            {name || "Project name…"}
          </span>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            Name
          </label>
          <input
            ref={inputRef}
            value={name}
            onChange={e => { setName(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. Q3 Roadmap"
            style={{
              width: "100%", background: "#0f0f11",
              border: `1px solid ${error ? "#ef4444" : "#1e1e24"}`,
              borderRadius: 8, padding: "10px 14px",
              color: "#e2e8f0", fontSize: 14, outline: "none",
              fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
            }}
          />
          {error && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 5 }}>{error}</div>}
        </div>

        {/* Icon picker */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            Icon
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PROJECT_ICONS.map(i => (
              <button key={i} onClick={() => setIcon(i)} style={{
                width: 38, height: 38, borderRadius: 8, fontSize: 18,
                background: icon === i ? "#1e1e28" : "#0f0f11",
                border: `1.5px solid ${icon === i ? color : "#1e1e24"}`,
                cursor: "pointer", transition: "all 0.15s",
                boxShadow: icon === i ? `0 0 8px ${color}44` : "none",
              }}>{i}</button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            Color
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {PROJECT_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 28, height: 28, borderRadius: "50%", background: c,
                border: `2.5px solid ${color === c ? "#fff" : "transparent"}`,
                cursor: "pointer", transition: "all 0.15s",
                boxShadow: color === c ? `0 0 10px ${c}99` : "none",
              }} />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, background: "#1e1e24", border: "none", borderRadius: 10,
            padding: "11px 0", color: "#64748b", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{
            flex: 2, background: color, border: "none", borderRadius: 10,
            padding: "11px 0", color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif",
            opacity: saving ? 0.7 : 1,
            boxShadow: `0 0 20px ${color}55`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {saving ? <><Spinner /> Creating…</> : `${icon} Create Project`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TaskFlow() {
  const { projects, loading: projectsLoading, add: addProject, remove: removeProject, reload: reloadProjects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { tasks, loading: tasksLoading, add: addTask, update: updateTask, remove: removeTask } = useTasks(selectedProjectId);
  const { data: session } = useSession();
  const [showMembers, setShowMembers] = useState(false);

  const [view, setView] = useState<"board" | "list">("board");
  const [addingTask, setAddingTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Drag & drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const dragTask = tasks.find(t => t.id === draggingId) ?? null;

  const handleDragStart = (taskId: string) => {
    setDraggingId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverSection(null);
  };

  const handleDropOnSection = async (section: string) => {
    if (!draggingId || !dragTask || dragTask.section === section) {
      setDraggingId(null);
      setDragOverSection(null);
      return;
    }
    const isDone = section === "Done";
    await updateTask(draggingId, { section, done: isDone });
    if (selectedTask?.id === draggingId) {
      setSelectedTask(prev => prev ? { ...prev, section, done: isDone } : null);
    }
    setDraggingId(null);
    setDragOverSection(null);
  };

  // Auto-select first project once loaded
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (addingTask && inputRef.current) inputRef.current.focus();
  }, [addingTask]);

  const project = projects.find(p => p.id === selectedProjectId) ?? null;

  const projectTasks = tasks.filter(t =>
    search === "" || t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddTask = async (section: string) => {
    if (!newTaskTitle.trim()) { setAddingTask(null); return; }
    await addTask({ title: newTaskTitle.trim(), section });
    setNewTaskTitle("");
    setAddingTask(null);
  };

  const handleToggleDone = async (task: Task) => {
    const newDone = !task.done;
    await updateTask(task.id, { done: newDone, section: newDone ? "Done" : "Todo" });
    if (selectedTask?.id === task.id) {
      setSelectedTask(prev => prev ? { ...prev, done: newDone, section: newDone ? "Done" : "Todo" } : null);
    }
  };

  const handleDeleteTask = async (id: string) => {
    await removeTask(id);
    if (selectedTask?.id === id) setSelectedTask(null);
  };

  const handleCreateProject = async (data: Omit<Project, "id">) => {
    await addProject(data);
  };

  const stats = {
    total: projectTasks.length,
    done: projectTasks.filter(t => t.done).length,
    inProgress: projectTasks.filter(t => t.section === "In Progress").length,
  };
  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#0f0f11",
      minHeight: "100vh",
      display: "flex",
      color: "#e2e8f0",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Syne:wght@600;700;800&display=swap" rel="stylesheet" />

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreate={handleCreateProject}
        />
      )}

      {showMembers && project && session?.user?.id && (
        <MembersModal
          project={project}
          currentUserId={session.user.id}
          onClose={() => setShowMembers(false)}
          onUpdate={reloadProjects}
        />
      )}

      {/* ── Sidebar ── */}
      <div style={{
        width: sidebarOpen ? 240 : 0,
        minWidth: sidebarOpen ? 240 : 0,
        background: "#141417",
        borderRight: "1px solid #1e1e24",
        display: "flex", flexDirection: "column",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg, #f97316, #ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>⚡</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em", color: "#fff" }}>TaskFlow</span>
        </div>

        {/* Projects list */}
        <div style={{ padding: "24px 12px 0", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#475569", textTransform: "uppercase", paddingLeft: 12, marginBottom: 8 }}>
            Projects
          </div>

          {projectsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 16 }}><Spinner /></div>
          ) : (
            projects.map(p => (
              <div key={p.id}
                   onClick={() => { setSelectedProjectId(p.id); setSelectedTask(null); }}
                   style={{
                     display: "flex", alignItems: "center", gap: 10,
                     padding: "8px 12px", borderRadius: 8, marginBottom: 2,
                     cursor: "pointer",
                     background: selectedProjectId === p.id ? "#1e1e28" : "transparent",
                     color: selectedProjectId === p.id ? "#e2e8f0" : "#64748b",
                     fontSize: 13, fontWeight: 500,
                     borderLeft: selectedProjectId === p.id ? `3px solid ${p.color}` : "3px solid transparent",
                     transition: "all 0.15s",
                   }}
              >
                <span style={{ fontSize: 14 }}>{p.icon}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                <span style={{ fontSize: 11, color: "#475569" }}>
                  {tasks.filter(t => t.projectId === p.id && !t.done).length || ""}
                </span>
              </div>
            ))
          )}

          <button
            onClick={() => setShowNewProject(true)}
            style={{
              margin: "12px 0 0",
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1.5px dashed #1e2433",
              fontSize: 12, color: "#475569", cursor: "pointer",
              textAlign: "center", fontWeight: 500,
              background: "none",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#334155"; (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e2433"; (e.currentTarget as HTMLButtonElement).style.color = "#475569"; }}
          >+ New Project</button>
        </div>

        {/* User */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #1e1e24", display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials={session?.user?.name?.[0]} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{session?.user?.name}</div>
            <div style={{ fontSize: 10, color: "#475569" }}>{session?.user?.email}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            style={{
              background: "none", border: "none", color: "#475569",
              cursor: "pointer", fontSize: 16, padding: 4,
              borderRadius: 6, transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
          >⏻</button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Header */}
        <div style={{
          background: "#141417",
          borderBottom: "1px solid #1e1e24",
          padding: "0 24px",
          display: "flex", alignItems: "center", gap: 16, height: 56,
          flexShrink: 0,
        }}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18, padding: "4px 6px", borderRadius: 6 }}
          >☰</button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            {project ? (
              <>
                <span style={{ fontSize: 18 }}>{project.icon}</span>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", letterSpacing: "-0.02em" }}>
                  {project.name}
                </span>
                <div style={{ marginLeft: 4, height: 6, width: 6, borderRadius: "50%", background: project.color, boxShadow: `0 0 8px ${project.color}` }} />
              </>
            ) : (
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "#475569" }}>
                Select a project
              </span>
            )}
            {project && (
              <button
                onClick={() => setShowMembers(true)}
                title="Manage members"
                style={{
                  background: "#1e1e24", border: "none", borderRadius: 8,
                  padding: "6px 12px", color: "#94a3b8", fontSize: 12,
                  fontWeight: 600, cursor: "pointer", display: "flex",
                  alignItems: "center", gap: 6,
                }}
              >
                👥 {(project.members?.length ?? 0)}
              </button>
            )}
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 13 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              style={{
                background: "#0f0f11", border: "1px solid #1e1e24", borderRadius: 8,
                padding: "7px 12px 7px 32px", color: "#e2e8f0", fontSize: 13,
                outline: "none", width: 200, fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>

          {/* View toggle */}
          <div style={{ display: "flex", background: "#0f0f11", borderRadius: 8, padding: 3, gap: 2, border: "1px solid #1e1e24" }}>
            {(["board", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? "#1e1e28" : "transparent",
                border: "none", borderRadius: 6, padding: "5px 12px",
                color: view === v ? "#e2e8f0" : "#475569",
                cursor: "pointer", fontSize: 14, transition: "all 0.15s",
              }}>{v === "board" ? "⊞" : "☰"}</button>
            ))}
          </div>

          <button
            onClick={() => project && setAddingTask("Todo")}
            disabled={!project}
            style={{
              background: project?.color ?? "#1e1e24",
              border: "none", borderRadius: 8, padding: "8px 16px",
              color: "#fff", fontWeight: 600, fontSize: 13, cursor: project ? "pointer" : "not-allowed",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: project ? `0 0 20px ${project.color}44` : "none",
              opacity: project ? 1 : 0.5,
              transition: "all 0.15s",
            }}
          >+ Add Task</button>
        </div>

        {/* Progress bar */}
        {project && (
          <div style={{
            background: "#141417", borderBottom: "1px solid #1e1e24",
            padding: "10px 24px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0,
          }}>
            <div style={{ display: "flex", gap: 20 }}>
              {[{ label: "Total", val: stats.total }, { label: "In Progress", val: stats.inProgress }, { label: "Done", val: stats.done }].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{s.val}</span>
                  <span style={{ fontSize: 11, color: "#475569" }}>{s.label}</span>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, height: 4, background: "#1e1e24", borderRadius: 4, overflow: "hidden", maxWidth: 300 }}>
              <div style={{
                height: "100%", width: `${progress}%`,
                background: `linear-gradient(90deg, ${project.color}, ${project.color}cc)`,
                borderRadius: 4, transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: `0 0 10px ${project.color}66`,
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>{progress}%</span>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {/* Empty state */}
          {!project && !projectsLoading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: 16 }}>
              <div style={{ fontSize: 48 }}>📁</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: "#64748b" }}>No projects yet</div>
              <button
                onClick={() => setShowNewProject(true)}
                style={{
                  background: "#f97316", border: "none", borderRadius: 10,
                  padding: "10px 24px", color: "#fff", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  boxShadow: "0 0 20px #f9731644",
                }}
              >Create your first project</button>
            </div>
          )}

          {/* Tasks loading */}
          {project && tasksLoading && (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}><Spinner /></div>
          )}

          {/* Board view */}
          {project && !tasksLoading && view === "board" && (
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", minHeight: "100%" }}>
              {SECTIONS.map(section => {
                const sectionTasks = projectTasks.filter(t => t.section === section);
                const sectionColor = section === "Todo" ? "#6366f1" : section === "In Progress" ? "#f97316" : "#10b981";
                const isOver = dragOverSection === section && draggingId !== null && dragTask?.section !== section;
                return (
                  <div
                    key={section}
                    style={{ flex: "0 0 300px", minWidth: 300 }}
                    onDragOver={e => { e.preventDefault(); setDragOverSection(section); }}
                    onDragLeave={e => {
                      if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
                        setDragOverSection(null);
                      }
                    }}
                    onDrop={e => { e.preventDefault(); handleDropOnSection(section); }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 4px" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: sectionColor, boxShadow: `0 0 8px ${sectionColor}` }} />
                      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "#94a3b8", letterSpacing: "-0.01em" }}>
                        {section.toUpperCase()}
                      </span>
                      <span style={{ marginLeft: 4, background: "#1e1e24", color: "#64748b", fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 100 }}>
                        {sectionTasks.length}
                      </span>
                    </div>

                    <div style={{
                      display: "flex", flexDirection: "column", gap: 8,
                      minHeight: 80, borderRadius: 12, padding: isOver ? 6 : 0,
                      border: isOver ? `2px dashed ${sectionColor}88` : "2px dashed transparent",
                      background: isOver ? `${sectionColor}0d` : "transparent",
                      transition: "all 0.15s",
                    }}>
                      {sectionTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          project={project}
                          isDragging={draggingId === task.id}
                          onDragStart={() => handleDragStart(task.id)}
                          onDragEnd={handleDragEnd}
                          onToggle={() => handleToggleDone(task)}
                          onDelete={() => handleDeleteTask(task.id)}
                          onSelect={() => setSelectedTask(task)}
                          selected={selectedTask?.id === task.id}
                        />
                      ))}

                      {isOver && (
                        <div style={{
                          border: `2px dashed ${sectionColor}66`, borderRadius: 10,
                          padding: "14px 12px", textAlign: "center", fontSize: 12,
                          color: sectionColor, fontWeight: 600,
                          background: `${sectionColor}0a`,
                        }}>
                          Drop here → {section}
                        </div>
                      )}

                      {addingTask === section ? (
                        <div style={{ background: "#141417", border: "1px solid #2d2d35", borderRadius: 10, padding: 12 }}>
                          <input
                            ref={inputRef}
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleAddTask(section); if (e.key === "Escape") setAddingTask(null); }}
                            placeholder="Task name..."
                            style={{
                              width: "100%", background: "none", border: "none",
                              color: "#e2e8f0", fontSize: 13, outline: "none",
                              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                            }}
                          />
                          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                            <button onClick={() => handleAddTask(section)} style={{
                              background: sectionColor, border: "none", borderRadius: 6,
                              padding: "5px 12px", color: "#fff", fontSize: 12, fontWeight: 600,
                              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                            }}>Add</button>
                            <button onClick={() => setAddingTask(null)} style={{
                              background: "#1e1e24", border: "none", borderRadius: 6,
                              padding: "5px 12px", color: "#64748b", fontSize: 12, fontWeight: 600,
                              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                            }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddingTask(section); setNewTaskTitle(""); }}
                          style={{
                            background: "none", border: "1.5px dashed #1e2433", borderRadius: 10,
                            padding: "10px 12px", color: "#475569", fontSize: 12, fontWeight: 500,
                            cursor: "pointer", textAlign: "left", width: "100%",
                            fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#334155"; (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e2433"; (e.currentTarget as HTMLButtonElement).style.color = "#475569"; }}
                        >+ Add task</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List view */}
          {project && !tasksLoading && view === "list" && (
            <div style={{ maxWidth: 900 }}>
              {SECTIONS.map(section => {
                const sectionTasks = projectTasks.filter(t => t.section === section);
                const sectionColor = section === "Todo" ? "#6366f1" : section === "In Progress" ? "#f97316" : "#10b981";
                return (
                  <div key={section} style={{ marginBottom: 32 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #1e1e24" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: sectionColor, boxShadow: `0 0 8px ${sectionColor}` }} />
                      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#94a3b8", letterSpacing: "0.05em" }}>{section.toUpperCase()}</span>
                      <span style={{ color: "#475569", fontSize: 12 }}>{sectionTasks.length}</span>
                    </div>
                    {sectionTasks.map(task => (
                      <ListRow
                        key={task.id}
                        task={task}
                        project={project}
                        onToggle={() => handleToggleDone(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                        onMove={async (section) => {
                          await updateTask(task.id, { section, done: section === "Done" });
                          if (selectedTask?.id === task.id) setSelectedTask(prev => prev ? { ...prev, section, done: section === "Done" } : null);
                        }}
                        onSelect={() => setSelectedTask(task)}
                        selected={selectedTask?.id === task.id}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Task Detail Panel ── */}
      {selectedTask && project && (
        <div style={{
          width: 340, background: "#141417",
          borderLeft: "1px solid #1e1e24",
          display: "flex", flexDirection: "column",
          flexShrink: 0, overflow: "hidden",
          animation: "fadeIn 0.2s ease",
        }}>
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid #1e1e24",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>Task Details</span>
            <button onClick={() => setSelectedTask(null)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", marginBottom: 20, lineHeight: 1.4 }}>
              {selectedTask.title}
            </div>

            {[
              { label: "Project", val: project.name, icon: project.icon },
              { label: "Assignee", val: selectedTask.assignee, avatar: true },
              { label: "Priority", val: selectedTask.priority, priority: true },
              { label: "Due Date", val: selectedTask.due ?? "—" },
              { label: "Status", val: selectedTask.section },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1e1e24" }}>
                <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{row.label}</span>
                {row.priority ? <PriorityBadge priority={row.val} /> :
                  row.avatar ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Avatar initials={row.val} size={22} />
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{row.val}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                      {(row as { icon?: string }).icon ? (row as { icon?: string }).icon + " " : ""}{row.val}
                    </span>
                  )}
              </div>
            ))}

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 10 }}>DESCRIPTION</div>
              <textarea placeholder="Add a description..." style={{
                width: "100%", background: "#0f0f11",
                border: "1px solid #1e1e24", borderRadius: 8,
                padding: 12, color: "#94a3b8", fontSize: 12,
                outline: "none", resize: "vertical", minHeight: 80,
                fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6,
              }} />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => handleToggleDone(selectedTask)}
                style={{
                  flex: 1, background: selectedTask.done ? "#1e1e24" : project.color,
                  border: "none", borderRadius: 8, padding: "9px 0",
                  color: selectedTask.done ? "#64748b" : "#fff",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: !selectedTask.done ? `0 0 16px ${project.color}44` : "none",
                }}>
                {selectedTask.done ? "↩ Reopen" : "✓ Mark Complete"}
              </button>
              <button
                onClick={() => handleDeleteTask(selectedTask.id)}
                style={{
                  background: "#1e1e24", border: "none", borderRadius: 8,
                  padding: "9px 14px", color: "#ef4444", fontSize: 12,
                  fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}>🗑</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TaskCard({ task, project, isDragging, onDragStart, onDragEnd, onToggle, onDelete, onSelect, selected }: {
  task: Task; project: Project;
  isDragging: boolean;
  onDragStart: () => void; onDragEnd: () => void;
  onToggle: () => void; onDelete: () => void;
  onSelect: () => void; selected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: selected ? "#1a1a24" : hovered ? "#191922" : "#141417",
        border: `1px solid ${selected ? project.color + "44" : "#1e1e24"}`,
        borderRadius: 10, padding: "12px 14px", cursor: isDragging ? "grabbing" : "grab",
        transition: "all 0.15s",
        boxShadow: selected ? `0 0 0 1px ${project.color}22` : "none",
        animation: "fadeIn 0.2s ease",
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? "scale(0.97) rotate(-1deg)" : "scale(1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <button
          onClick={e => { e.stopPropagation(); onToggle(); }}
          style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
            border: `1.5px solid ${task.done ? project.color : "#2d2d35"}`,
            background: task.done ? project.color : "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          {task.done && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 500, color: task.done ? "#475569" : "#e2e8f0",
            textDecoration: task.done ? "line-through" : "none",
            lineHeight: 1.4, marginBottom: 8,
          }}>{task.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <PriorityBadge priority={task.priority} />
            {task.due && <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto" }}>📅 {task.due}</span>}
            <Avatar initials={task.assignee} size={20} />
          </div>
          {task.subtasks > 0 && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ flex: 1, height: 3, background: "#1e1e24", borderRadius: 2 }}>
                <div style={{ width: "30%", height: "100%", background: project.color, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 10, color: "#475569" }}>{task.subtasks} subtasks</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListRow({ task, project, onToggle, onDelete, onMove, onSelect, selected }: {
  task: Task; project: Project;
  onToggle: () => void; onDelete: () => void;
  onMove: (section: string) => void;
  onSelect: () => void; selected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 12px", borderRadius: 8, cursor: "pointer",
        background: selected ? "#1a1a24" : hovered ? "#191922" : "transparent",
        border: `1px solid ${selected ? project.color + "44" : "transparent"}`,
        transition: "all 0.15s", marginBottom: 2,
      }}
    >
      <button
        onClick={e => { e.stopPropagation(); onToggle(); }}
        style={{
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          border: `1.5px solid ${task.done ? project.color : "#2d2d35"}`,
          background: task.done ? project.color : "none",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {task.done && <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>✓</span>}
      </button>
      <span style={{
        flex: 1, fontSize: 13, fontWeight: 500,
        color: task.done ? "#475569" : "#e2e8f0",
        textDecoration: task.done ? "line-through" : "none",
      }}>{task.title}</span>
      <PriorityBadge priority={task.priority} />
      {task.due && <span style={{ fontSize: 11, color: "#475569", width: 60, textAlign: "right" }}>📅 {task.due}</span>}
      {hovered && (
        <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
          {["Todo", "In Progress", "Done"].filter(s => s !== task.section).map(s => {
            const c = s === "Todo" ? "#6366f1" : s === "In Progress" ? "#f97316" : "#10b981";
            return (
              <button key={s} onClick={() => onMove(s)} style={{
                background: `${c}22`, border: `1px solid ${c}44`,
                borderRadius: 6, padding: "3px 8px",
                color: c, fontSize: 10, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                whiteSpace: "nowrap",
              }}>→ {s}</button>
            );
          })}
        </div>
      )}
      <Avatar initials={task.assignee} size={22} />
      {hovered && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: "0 4px" }}
        >×</button>
      )}
    </div>
  );
}
