"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff, KeyRound, MailCheck } from "lucide-react";
import { GoldButton } from "../../../components/ui/GoldButton";
import { getReadableApiError } from "../../../lib/api";
import {
  requestForgotPasswordOtp,
  resetForgotPassword,
  verifyForgotPasswordOtp,
} from "../../../lib/auth-api";

type Step = "email" | "otp" | "new_password" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const response = await requestForgotPasswordOtp({ email: email.trim() });
      setInfo(response.message);
      setResendCooldown(response.resend_available_in_seconds ?? 0);
      setStep("otp");
    } catch (error) {
      setError(getReadableApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (otp.length !== 6) {
      setError("Kode OTP harus 6 digit.");
      return;
    }

    setLoading(true);

    try {
      const response = await verifyForgotPasswordOtp({ email: email.trim(), otp });
      setInfo(response.message);
      setStep("new_password");
    } catch (error) {
      setError(getReadableApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;

    setError("");
    setInfo("");
    setLoading(true);

    try {
      const response = await requestForgotPasswordOtp({ email: email.trim() });
      setInfo(response.message);
      setResendCooldown(response.resend_available_in_seconds ?? 0);
    } catch (error) {
      setError(getReadableApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError("Password baru harus mengandung huruf dan angka.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const response = await resetForgotPassword({
        email: email.trim(),
        otp,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setInfo(response.message);
      setStep("success");
      setTimeout(() => router.push("/auth/login"), 1300);
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
            background: "radial-gradient(ellipse, rgba(200,162,77,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <button
          onClick={() => router.push("/auth/login")}
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
          Kembali ke Login
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
            <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#C8A24D", fontSize: "1.2rem", fontWeight: 700 }}>
              RESET PASSWORD
            </h1>
            <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              Duta Wisata Kota Batam 2026
            </p>
          </div>

          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <label className="block text-xs mb-1.5" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                Email Akun
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email akun"
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: "#111", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
              />
              {info ? <p className="text-xs text-emerald-300" style={{ fontFamily: "var(--font-poppins)" }}>{info}</p> : null}
              {error ? <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-poppins)" }}>{error}</p> : null}
              <GoldButton type="submit" variant="primary" fullWidth disabled={loading}>
                <MailCheck size={16} />
                {loading ? "Mengirim OTP..." : "Kirim Kode OTP"}
              </GoldButton>
            </form>
          ) : null}

          {step === "otp" ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <label className="block text-xs mb-1.5 text-center" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                Verifikasi OTP (6 digit)
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="_ _ _ _ _ _"
                maxLength={6}
                className="w-full rounded-xl px-4 py-3 text-center text-xl tracking-widest outline-none"
                style={{ background: "#111", border: "1px solid rgba(200,162,77,0.25)", color: "#F5D06F", fontFamily: "var(--font-cinzel)" }}
              />
              {info ? <p className="text-xs text-emerald-300 text-center" style={{ fontFamily: "var(--font-poppins)" }}>{info}</p> : null}
              {error ? <p className="text-xs text-red-400 text-center" style={{ fontFamily: "var(--font-poppins)" }}>{error}</p> : null}
              <GoldButton type="submit" variant="primary" fullWidth disabled={loading}>
                <KeyRound size={16} />
                {loading ? "Memverifikasi..." : "Verifikasi OTP"}
              </GoldButton>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || resendCooldown > 0}
                className="w-full text-xs text-center pt-1 disabled:opacity-50"
                style={{
                  color: "#C8A24D",
                  fontFamily: "var(--font-poppins)",
                  background: "none",
                  border: "none",
                  cursor: loading || resendCooldown > 0 ? "not-allowed" : "pointer",
                }}
              >
                {resendCooldown > 0 ? `Kirim ulang OTP dalam ${resendCooldown} detik` : "Kirim ulang OTP"}
              </button>
            </form>
          ) : null}

          {step === "new_password" ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter (huruf + angka)"
                    className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none"
                    style={{ background: "#111", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#BDBDBD", background: "none", border: "none", cursor: "pointer" }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none"
                    style={{ background: "#111", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#BDBDBD", background: "none", border: "none", cursor: "pointer" }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {info ? <p className="text-xs text-emerald-300" style={{ fontFamily: "var(--font-poppins)" }}>{info}</p> : null}
              {error ? <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-poppins)" }}>{error}</p> : null}
              <GoldButton type="submit" variant="primary" fullWidth disabled={loading}>
                <KeyRound size={16} />
                {loading ? "Menyimpan..." : "Simpan Password Baru"}
              </GoldButton>
            </form>
          ) : null}

          {step === "success" ? (
            <div className="text-center py-2">
              <p style={{ color: "#22c55e", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>
                Password berhasil diubah
              </p>
              <p className="text-xs mt-2" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                Mengalihkan ke halaman login...
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
