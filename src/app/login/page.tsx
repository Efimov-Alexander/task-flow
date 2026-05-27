"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#eef8ff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`* { box-sizing: border-box; }`}</style>

      <div style={{ width: "100%", maxWidth: 420, padding: "0 20px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(#fde4d8, #ffae37)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, margin: "0 auto 14px",
          }}>⚡</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: "#505050", letterSpacing: "-0.03em" }}>
            TaskFlow
          </div>
          <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 6 }}>
            Sign in to your workspace
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "#dfebff", border: "1px solid #0f172a",
          borderRadius: 16, padding: 28,
          boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
        }}>
          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, padding: "10px 14px", marginBottom: 20,
              color: "#ef4444", fontSize: 13, fontWeight: 500,
            }}>{error}</div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 7 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="you@company.com"
              style={{
                width: "100%", background: "#f1f5f9",
                border: "1px solid #0f172a", borderRadius: 8,
                padding: "11px 14px", color: "#0f172a", fontSize: 14,
                outline: "none", fontFamily: "'DM Sans', sans-serif",
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = "#f97316")}
              onBlur={e => (e.target.style.borderColor = "#0f172a")}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 7 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="••••••••"
              style={{
                width: "100%", background: "#f1f5f9",
                border: "1px solid #0f172a", borderRadius: 8,
                padding: "11px 14px", color: "#0f172a", fontSize: 14,
                outline: "none", fontFamily: "'DM Sans', sans-serif",
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = "#f97316")}
              onBlur={e => (e.target.style.borderColor = "#0f172a")}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", background: loading ? "#7c3a1a" : "#f97316",
              border: "none", borderRadius: 10, padding: "12px 0",
              color: "#dfebff", fontWeight: 700, fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 0 24px #f9731644",
              transition: "all 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: "2px solid #fff4", borderTopColor: "#dfebff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Signing in…
              </>
            ) : "Sign in →"}
          </button>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#94a3b8" }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ color: "#f97316", fontWeight: 600, textDecoration: "none" }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}