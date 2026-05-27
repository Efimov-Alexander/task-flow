"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {signIn} from "next-auth/react";
import Link from "next/link";

const Field = ({
                 label, value, onChange, type = "text", placeholder, error, handleSubmit,
               }: {
  label: string; value: string;
  onChange: (v: string) => void;
  type?: string; placeholder: string; error?: string;
  handleSubmit: () => Promise<void>;
}) => (
  <div style={{marginBottom: 16}}>
    <label style={{
      fontSize: 12,
      fontWeight: 600,
      color: "#64748b",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      display: "block",
      marginBottom: 7
    }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === "Enter" && handleSubmit()}
      placeholder={placeholder}
      style={{
        width: "100%", background: "#f1f5f9",
        border: `1px solid ${error ? "#ef4444" : "#0f172a"}`,
        borderRadius: 8, padding: "11px 14px",
        color: "#0f172a", fontSize: 14, outline: "none",
        fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.15s",
      }}
      onFocus={e => (e.target.style.borderColor = error ? "#ef4444" : "#f97316")}
      onBlur={e => (e.target.style.borderColor = error ? "#ef4444" : "#0f172a")}
    />
    {error && <div style={{fontSize: 12, color: "#ef4444", marginTop: 5}}>{error}</div>}
  </div>
);

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email address";
    if (password.length < 8) e.password = "Password must be at least 8 characters";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setLoading(true);
    setErrors({});

    const res = await fetch("/api/register", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({name, email, password}),
    });

    if (!res.ok) {
      const data = await res.json();
      setErrors(data.error ?? {general: "Registration failed"});
      setLoading(false);
      return;
    }

    // Auto sign in after registration
    await signIn("credentials", {email, password, redirect: false});
    router.push("/");
    router.refresh();
  };


  return (
    <div style={{
      minHeight: "100vh", background: "#f1f5f9",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap"
        rel="stylesheet"/>
      <style>{`* { box-sizing: border-box; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{width: "100%", maxWidth: 420, padding: "0 20px"}}>

        {/* Logo */}
        <div style={{textAlign: "center", marginBottom: 36}}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(#fde4d8, #ffae37)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, margin: "0 auto 14px",
          }}>⚡
          </div>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 26,
            color: "#dfebff",
            letterSpacing: "-0.03em"
          }}>
            TaskFlow
          </div>
          <div style={{color: "#94a3b8", fontSize: 14, marginTop: 6}}>
            Create your workspace
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "#dfebff", border: "1px solid #0f172a",
          borderRadius: 16, padding: 28,
          boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
        }}>
          {errors.general && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, padding: "10px 14px", marginBottom: 20,
              color: "#ef4444", fontSize: 13, fontWeight: 500,
            }}>{errors.general}</div>
          )}

          <Field label="Full Name" value={name} onChange={setName} placeholder="Alex Kim" error={errors.name}
                 handleSubmit={handleSubmit}/>
          <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@company.com"
                 error={errors.email} handleSubmit={handleSubmit}/>
          <Field label="Password" value={password} onChange={setPassword} type="password"
                 placeholder="At least 8 characters" error={errors.password} handleSubmit={handleSubmit}/>

          {/* Password strength */}
          {password.length > 0 && (
            <div style={{marginBottom: 20, marginTop: -8}}>
              <div style={{display: "flex", gap: 4, marginBottom: 4}}>
                {[1, 2, 3, 4].map(i => {
                  const strength = password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4
                    : password.length >= 10 ? 3
                      : password.length >= 8 ? 2 : 1;
                  const colors = ["#ef4444", "#f97316", "#eab308", "#10b981"];
                  return (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= strength ? colors[strength - 1] : "#0f172a",
                      transition: "background 0.2s",
                    }}/>
                  );
                })}
              </div>
              <div style={{fontSize: 11, color: "#64748b"}}>
                {password.length < 8 ? "Too short" : password.length < 10 ? "Weak" : password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? "Strong 💪" : "Good"}
              </div>
            </div>
          )}

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
                <div style={{
                  width: 16,
                  height: 16,
                  border: "2px solid #fff4",
                  borderTopColor: "#dfebff",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite"
                }}/>
                Creating account…
              </>
            ) : "Create account →"}
          </button>
        </div>

        <div style={{textAlign: "center", marginTop: 20, fontSize: 14, color: "#94a3b8"}}>
          Already have an account?{" "}
          <Link href="/login" style={{color: "#f97316", fontWeight: 600, textDecoration: "none"}}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}