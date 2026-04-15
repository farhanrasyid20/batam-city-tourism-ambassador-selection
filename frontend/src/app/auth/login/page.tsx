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
import { getReadableApiError } from "../../../lib/api";
import { loginParticipant } from "../../../lib/auth-api";
import { saveParticipantAuthSession } from "../../../lib/auth-storage";
import { resolveBrandingAssetUrl, useSiteBrandingContent } from "../../../lib/site-branding-content";

type LocalRole = "peserta" | "admin" | "juri";

/**
 * Menormalkan nilai role dari backend agar konsisten dengan role internal aplikasi.
 */
function normalizeBackendRole(rawRole?: string | null): "participant" | "admin" | "super_admin" | "judge" | null {
  const normalized = (rawRole ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (normalized === "participant" || normalized === "peserta") return "participant";
  if (normalized === "admin") return "admin";
  if (normalized === "super_admin" || normalized === "superadmin") return "super_admin";
  if (normalized === "judge" || normalized === "juri") return "judge";
  return null;
}

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

/**
 * Halaman login multi-role (peserta, admin, juri).
 * Mengakomodasi login API dan pengalihan berdasarkan role.
 */
export default function LoginPage() {
  const branding = useSiteBrandingContent();
  const router = useRouter();
  const { setPasswordForEmail, setAuthenticatedUser } = useApp();

  const [role, setRole] = useState<LocalRole>("peserta");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const canQuickReset = role === "peserta" && email.trim().length > 0;

  /**
   * Mengarahkan pengguna ke dashboard sesuai role yang aktif.
   */
  const redirectByRole = (targetRole: LocalRole) => {
    if (targetRole === "peserta") {
      router.push("/pages/participant/dashboard");
      return;
    }
    if (targetRole === "admin") {
      router.push("/pages/admin/dashboard");
      return;
    }
    router.push("/pages/judges/dashboard");
  };

  /**
   * Menangani proses autentikasi berdasarkan role terpilih via API backend.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (role === "peserta") {
        const response = await loginParticipant({ email, password });
        const backendRole = normalizeBackendRole(response.user.role);

        if (backendRole !== "participant") {
          setError("Akun ini bukan role peserta. Silakan login sesuai role akun.");
          return;
        }

        saveParticipantAuthSession({
          token: response.access_token,
          tokenType: response.token_type,
          expiresInMinutes: response.expires_in_minutes,
          savedAt: new Date().toISOString(),
          user: response.user,
        });
        setAuthenticatedUser({
          id: String(response.user.id),
          name: response.user.name,
          email: response.user.email,
          role: "participant",
        });

        setPasswordForEmail(email, password);
        redirectByRole("peserta");
        return;
      }

      if (role === "admin") {
        try {
          const response = await loginParticipant({ email, password });
          const backendRole = normalizeBackendRole(response.user.role);

          if (backendRole === "admin" || backendRole === "super_admin") {
            saveParticipantAuthSession({
              token: response.access_token,
              tokenType: response.token_type,
              expiresInMinutes: response.expires_in_minutes,
              savedAt: new Date().toISOString(),
              user: response.user,
            });

            setAuthenticatedUser({
              id: String(response.user.id),
              name: response.user.name,
              email: response.user.email,
              role: backendRole,
            });
            redirectByRole("admin");
            return;
          }
          setError("Akun ini bukan role admin/super admin.");
          return;
        } catch (error) {
          setError(getReadableApiError(error));
          return;
        }
      }

      if (role === "juri") {
        try {
          const response = await loginParticipant({ email, password });
          const backendRole = normalizeBackendRole(response.user.role);

          if (backendRole === "judge") {
            saveParticipantAuthSession({
              token: response.access_token,
              tokenType: response.token_type,
              expiresInMinutes: response.expires_in_minutes,
              savedAt: new Date().toISOString(),
              user: response.user,
            });

            setAuthenticatedUser({
              id: String(response.user.id),
              name: response.user.name,
              email: response.user.email,
              role: "judge",
              judgeId: `J_API_${response.user.id}`,
            });
            redirectByRole("juri");
            return;
          }

          setError("Akun ini bukan role juri.");
          return;
        } catch (error) {
          setError(getReadableApiError(error));
          return;
        }
      }

      setError("Email atau password salah. Silakan coba lagi.");
    } catch (error) {
      setError(getReadableApiError(error));
    } finally {
      setLoading(false);
    }
  };

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
              src={resolveBrandingAssetUrl(branding.logoMain)}
              alt="Logo"
              width={64}
              height={64}
              unoptimized
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
              {branding.siteNameLine1} {branding.siteNameLine2}
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
                  onClick={() =>
                    router.push(
                      `/auth/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`
                    )
                  }
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
              <div>
                <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-poppins)" }}>
                  {error}
                </p>
                {canQuickReset ? (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/auth/forgot-password?email=${encodeURIComponent(email.trim())}`)
                    }
                    className="text-xs mt-2"
                    style={{
                      color: "#F5D06F",
                      fontFamily: "var(--font-poppins)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Password salah? Ganti password sekarang
                  </button>
                ) : null}
              </div>
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
        </div>
      </div>
    </div>
  );
}

