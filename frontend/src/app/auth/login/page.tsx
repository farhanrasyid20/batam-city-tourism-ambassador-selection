"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LogIn,
  User,
  Shield,
  Gavel,
  ArrowLeft,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { GoldButton } from "../../../components/ui/GoldButton";

type LocalRole = "peserta" | "admin" | "juri";

const roles = [
  {
    id: "peserta" as LocalRole,
    label: "Peserta",
    icon: User,
    desc: "Login sebagai peserta pemilihan",
  },
  {
    id: "juri" as LocalRole,
    label: "Juri",
    icon: Gavel,
    desc: "Login sebagai dewan juri",
  },
  {
    id: "admin" as LocalRole,
    label: "Admin",
    icon: Shield,
    desc: "Login sebagai administrator",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useApp();

  const [role, setRole] = useState<LocalRole>("peserta");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleMap = {
    peserta: "participant",
    admin: "admin",
    juri: "judge",
  } as const;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800));
    const ok = login(email, password, roleMap[role]);
    setLoading(false);

    if (ok) {
      if (role === "admin") router.push("/pages/admin/dashboard");
      else if (role === "juri") router.push("/pages/juri/dashboard");
      else router.push("/pages/participant/dashboard");
    } else {
      setError("Email atau password salah. Silakan coba lagi.");
    }
  };

  const demoAccounts = [
    {
      role: "peserta" as LocalRole,
      email: "ahmadrizky@email.com",
      password: "demo123",
      label: "Demo Peserta",
    },
    {
      role: "juri" as LocalRole,
      email: "juri1@dutawisatabatam.id",
      password: "demo123",
      label: "Demo Juri",
    },
    {
      role: "admin" as LocalRole,
      email: "admin@dutawisatabatam.id",
      password: "admin123",
      label: "Demo Admin",
    },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "#0F0F0F" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "600px",
            background:
              "radial-gradient(ellipse, rgba(200,162,77,0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 mb-8 text-sm transition-opacity hover:opacity-80"
          style={{
            color: "#C8A24D",
            fontFamily: "var(--font-poppins)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          type="button"
        >
          <ArrowLeft size={16} />
          Kembali ke Beranda
        </button>

        <div
          className="rounded-2xl p-8"
          style={{
            background: "#1A1A1A",
            border: "1px solid rgba(200,162,77,0.3)",
            boxShadow: "0 0 40px rgba(200,162,77,0.08)",
          }}
        >
          <div className="text-center mb-8">
            <Image
              src="/logo1.png"
              alt="Logo"
              width={64}
              height={64}
              className="w-16 h-16 object-contain mx-auto mb-3"
              style={{ filter: "drop-shadow(0 0 10px rgba(200,162,77,0.4))" }}
            />
            <h1
              style={{
                fontFamily: "var(--font-cinzel)",
                color: "#C8A24D",
                fontSize: "1.2rem",
                fontWeight: 700,
              }}
            >
              LOGIN
            </h1>
            <p
              className="text-xs mt-1"
              style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
            >
              Duta Wisata Kota Batam 2026
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {roles.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className="flex flex-col items-center gap-1 rounded-xl py-3 px-2 text-center transition-all duration-200"
                  style={{
                    background:
                      role === r.id
                        ? "rgba(200,162,77,0.15)"
                        : "rgba(255,255,255,0.03)",
                    border:
                      role === r.id
                        ? "1px solid rgba(200,162,77,0.6)"
                        : "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                  }}
                  title={r.desc}
                  type="button"
                >
                  <Icon size={18} style={{ color: role === r.id ? "#C8A24D" : "#BDBDBD" }} />
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: role === r.id ? "#C8A24D" : "#BDBDBD",
                      fontFamily: "var(--font-cinzel)",
                    }}
                  >
                    {r.label}
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                className="block text-xs mb-1.5"
                style={{
                  color: "#C8A24D",
                  fontFamily: "var(--font-poppins)",
                  fontWeight: 600,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email Anda"
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: "#111",
                  border: "1px solid rgba(200,162,77,0.25)",
                  color: "#F5E6C8",
                  fontFamily: "var(--font-poppins)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs mb-1.5"
                style={{
                  color: "#C8A24D",
                  fontFamily: "var(--font-poppins)",
                  fontWeight: 600,
                }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-all"
                  style={{
                    background: "#111",
                    border: "1px solid rgba(200,162,77,0.25)",
                    color: "#F5E6C8",
                    fontFamily: "var(--font-poppins)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{
                    color: "#BDBDBD",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => router.push("/auth/forgot-password")}
                  className="text-xs"
                  style={{
                    color: "#C8A24D",
                    fontFamily: "var(--font-poppins)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Lupa password?
                </button>
              </div>
            </div>

            {error ? (
              <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-poppins)" }}>
                {error}
              </p>
            ) : null}

            <GoldButton type="submit" variant="primary" fullWidth disabled={loading}>
              <LogIn size={16} />
              {loading ? "Memproses..." : "Login"}
            </GoldButton>
          </form>

          {role === "peserta" ? (
            <div className="mt-5 text-center">
              <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                Belum punya akun?{" "}
                <button
                  onClick={() => router.push("/auth/register")}
                  style={{
                    color: "#C8A24D",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                  type="button"
                >
                  Daftar Sekarang
                </button>
              </p>
            </div>
          ) : null}

          <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(200,162,77,0.15)" }}>
            <p
              className="text-xs text-center mb-3"
              style={{
                color: "#BDBDBD",
                fontFamily: "var(--font-poppins)",
                opacity: 0.7,
              }}
            >
              Demo Login (klik untuk isi otomatis):
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => {
                    setRole(acc.role);
                    setEmail(acc.email);
                    setPassword(acc.password);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: "rgba(200,162,77,0.1)",
                    border: "1px solid rgba(200,162,77,0.2)",
                    color: "#C8A24D",
                    fontFamily: "var(--font-poppins)",
                    cursor: "pointer",
                  }}
                  type="button"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

