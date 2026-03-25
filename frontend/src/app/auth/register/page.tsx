"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  UserPlus,
  CheckCircle,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { GoldButton } from "../../../components/ui/GoldButton";
import { getReadableApiError } from "../../../lib/api";
import {
  loginParticipant,
  registerParticipant,
  resendParticipantOtp,
  verifyParticipantOtp,
} from "../../../lib/auth-api";
import { saveParticipantAuthSession } from "../../../lib/auth-storage";

type Step = "form" | "otp" | "success";

export default function RegisterPage() {
  const router = useRouter();
  const { login, setPasswordForEmail } = useApp();

  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [debugOtp, setDebugOtp] = useState("");

  const [form, setForm] = useState({
    nama: "",
    email: "",
    noHp: "",
    password: "",
    confirmPassword: "",
    kategori: "encik",
  });

  const [otpMeta, setOtpMeta] = useState({
    expiresInMinutes: 5,
    resendAvailableInSeconds: 60,
  });

  const hasMinLength = form.password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(form.password);
  const hasNumber = /\d/.test(form.password);
  const passwordScore = [hasMinLength, hasLetter, hasNumber].filter(Boolean).length;
  const passwordStrengthLabel =
    passwordScore <= 1 ? "Lemah" : passwordScore === 2 ? "Sedang" : "Kuat";

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (form.password !== form.confirmPassword) {
      setError("Password tidak cocok!");
      return;
    }
    if (form.password.length < 8) {
      setError("Password minimal 8 karakter!");
      return;
    }
    if (!hasLetter || !hasNumber) {
      setError("Password harus mengandung huruf dan angka.");
      return;
    }

    setLoading(true);
    try {
      const response = await registerParticipant({
        name: form.nama,
        email: form.email,
        phone: form.noHp,
        password: form.password,
        password_confirmation: form.confirmPassword,
      });

      setOtp("");
      setDebugOtp(response.debug_otp ?? "");
      setOtpMeta({
        expiresInMinutes: response.otp_expires_in_minutes,
        resendAvailableInSeconds: response.resend_available_in_seconds,
      });
      setInfo(response.message);
      setStep("otp");
    } catch (err) {
      setError(getReadableApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      await verifyParticipantOtp({
        email: form.email,
        otp,
      });

      const loginResponse = await loginParticipant({
        email: form.email,
        password: form.password,
      });

      saveParticipantAuthSession({
        token: loginResponse.access_token,
        tokenType: loginResponse.token_type,
        expiresInMinutes: loginResponse.expires_in_minutes,
        savedAt: new Date().toISOString(),
        user: loginResponse.user,
      });

      setPasswordForEmail(form.email, form.password);
      login(form.email, form.password, "participant");
      setInfo("Email berhasil diverifikasi. Anda akan diarahkan ke dashboard peserta.");
      setStep("success");

      setTimeout(() => {
        router.push("/pages/participant/dashboard");
      }, 2000);
    } catch (err) {
      setError(getReadableApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const response = await resendParticipantOtp({ email: form.email });
      setDebugOtp(response.debug_otp ?? "");
      setOtpMeta({
        expiresInMinutes: response.otp_expires_in_minutes,
        resendAvailableInSeconds: response.resend_available_in_seconds,
      });
      setInfo(response.message);
    } catch (err) {
      setError(getReadableApiError(err));
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
              PENDAFTARAN PESERTA
            </h1>
            <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              Duta Wisata Kota Batam 2026
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            {(["form", "otp", "success"] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background:
                      step === s
                        ? "linear-gradient(135deg, #F5D06F, #C8A24D)"
                        : ["form", "otp", "success"].indexOf(step) > i
                          ? "rgba(200,162,77,0.3)"
                          : "rgba(255,255,255,0.05)",
                    color: step === s ? "#0F0F0F" : "#BDBDBD",
                    fontFamily: "var(--font-cinzel)",
                  }}
                >
                  {i + 1}
                </div>
                {i < 2 ? (
                  <div className="w-8 h-0.5" style={{ background: "rgba(200,162,77,0.2)" }} />
                ) : null}
              </React.Fragment>
            ))}
          </div>

          {step === "form" ? (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Nama sesuai KTP"
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#111", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                />
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#111", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                />
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                  No. HP / WhatsApp *
                </label>
                <input
                  type="tel"
                  value={form.noHp}
                  onChange={(e) => setForm({ ...form, noHp: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#111", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                />
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                  Kategori *
                </label>
                <select
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#111", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                >
                  <option value="encik">Encik (Putra)</option>
                  <option value="puan">Puan (Putri)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimal 8 karakter (huruf + angka)"
                    required
                    className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none"
                    style={{ background: "#111", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#BDBDBD", background: "none", border: "none", cursor: "pointer" }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="mt-2">
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(passwordScore / 3) * 100}%`,
                        background:
                          passwordScore <= 1
                            ? "linear-gradient(90deg,#ef4444,#f97316)"
                            : passwordScore === 2
                              ? "linear-gradient(90deg,#f59e0b,#facc15)"
                              : "linear-gradient(90deg,#22c55e,#16a34a)",
                      }}
                    />
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                    Kekuatan password: <strong style={{ color: "#C8A24D" }}>{passwordStrengthLabel}</strong>
                    {" | "}Gunakan minimal 8 karakter, huruf, dan angka.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                  Konfirmasi Password *
                </label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Ulangi password"
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#111", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                />
              </div>

              {error ? (
                <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-poppins)" }}>
                  {error}
                </p>
              ) : null}

              <GoldButton type="submit" variant="primary" fullWidth disabled={loading}>
                <UserPlus size={16} />
                {loading ? "Memproses..." : "Daftar & Kirim OTP"}
              </GoldButton>

              <div className="text-center">
                <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                  Sudah punya akun?{" "}
                  <button
                    onClick={() => router.push("/auth/login")}
                    style={{ color: "#C8A24D", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                    type="button"
                  >
                    Login
                  </button>
                </p>
              </div>
            </form>
          ) : null}

          {step === "otp" ? (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(200,162,77,0.15)", border: "1px solid rgba(200,162,77,0.3)" }}
                >
                  <span style={{ color: "#C8A24D", fontSize: "1.5rem" }}>✉</span>
                </div>
                <p className="text-sm mb-1" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                  Verifikasi Email
                </p>
                <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                  Kode OTP telah dikirim ke
                  <br />
                  <strong style={{ color: "#C8A24D" }}>{form.email}</strong>
                </p>
                <p className="text-[11px] mt-2" style={{ color: "#8E8E8E", fontFamily: "var(--font-poppins)" }}>
                  Kode berlaku {otpMeta.expiresInMinutes} menit.
                </p>
              </div>

              <div>
                <label className="block text-xs mb-1.5 text-center" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                  Masukkan Kode OTP (6 digit)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="_ _ _ _ _ _"
                  maxLength={6}
                  className="w-full rounded-xl px-4 py-3 text-center text-2xl tracking-widest outline-none"
                  style={{ background: "#111", border: "1px solid rgba(200,162,77,0.25)", color: "#F5D06F", fontFamily: "var(--font-cinzel)" }}
                />
                {debugOtp ? (
                  <p className="text-xs text-center mt-2" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}>
                    Debug OTP lokal: <strong>{debugOtp}</strong>
                  </p>
                ) : null}
              </div>

              {info ? (
                <p className="text-xs text-center" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                  {info}
                </p>
              ) : null}

              {error ? (
                <p className="text-xs text-red-400 text-center" style={{ fontFamily: "var(--font-poppins)" }}>
                  {error}
                </p>
              ) : null}

              <GoldButton type="submit" variant="primary" fullWidth disabled={loading}>
                {loading ? "Memverifikasi..." : "Verifikasi OTP"}
              </GoldButton>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-xs mr-3"
                  style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                >
                  {loading ? "Mengirim..." : "Kirim Ulang OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="text-xs"
                  style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", background: "none", border: "none", cursor: "pointer" }}
                >
                  ← Ubah email
                </button>
              </div>
            </form>
          ) : null}

          {step === "success" ? (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.4)" }}
              >
                <CheckCircle size={32} style={{ color: "#22c55e" }} />
              </div>
              <h3 className="mb-2" style={{ fontFamily: "var(--font-cinzel)", color: "#C8A24D", fontSize: "1.1rem", fontWeight: 700 }}>
                Pendaftaran Berhasil!
              </h3>
              <p className="text-sm mb-4" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                Selamat datang, <strong style={{ color: "#F5D06F" }}>{form.nama}</strong>!
                Akun Anda telah berhasil dibuat.
              </p>
              {info ? (
                <p className="text-xs mb-4" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                  {info}
                </p>
              ) : null}
              <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", opacity: 0.7 }}>
                Mengalihkan ke dashboard...
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
