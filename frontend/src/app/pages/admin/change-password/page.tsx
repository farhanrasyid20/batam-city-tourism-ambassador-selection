"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React, { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { getReadableApiError } from "../../../../lib/api";
import { changeAuthenticatedPassword } from "../../../../lib/auth-api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";

export default function AdminChangePasswordPage() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice("");
    setError("");

    if (form.newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (!/[A-Za-z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) {
      setError("Password baru harus mengandung huruf dan angka.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Konfirmasi password baru tidak cocok.");
      return;
    }

    const token = getParticipantAuthSession()?.token;
    if (!token) {
      setError("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    setLoading(true);
    try {
      const response = await changeAuthenticatedPassword(token, {
        current_password: form.currentPassword,
        password: form.newPassword,
        password_confirmation: form.confirmPassword,
      });
      setNotice(response.message);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setError(getReadableApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#C8A24D", fontSize: "1.5rem", fontWeight: 700 }}>
          Ubah Password
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Perbarui password akun admin/super admin Anda tanpa OTP.
        </p>
      </div>

      <GoldCard className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
              Password Saat Ini
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={form.currentPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none"
                style={{ background: "#111", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                required
              />
              <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#BDBDBD", background: "none", border: "none", cursor: "pointer" }}>
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showNewPass ? "text" : "password"}
                value={form.newPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none"
                style={{ background: "#111", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                required
              />
              <button type="button" onClick={() => setShowNewPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#BDBDBD", background: "none", border: "none", cursor: "pointer" }}>
                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <input
                type={showConfirmPass ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none"
                style={{ background: "#111", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                required
              />
              <button type="button" onClick={() => setShowConfirmPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#BDBDBD", background: "none", border: "none", cursor: "pointer" }}>
                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {notice ? <p className="text-xs" style={{ color: "#22c55e", fontFamily: "var(--font-poppins)" }}>{notice}</p> : null}
          {error ? <p className="text-xs" style={{ color: "#ef4444", fontFamily: "var(--font-poppins)" }}>{error}</p> : null}

          <GoldButton type="submit" variant="primary" disabled={loading}>
            <KeyRound size={16} />
            {loading ? "Menyimpan..." : "Simpan Password"}
          </GoldButton>
        </form>
      </GoldCard>
    </div>
  );
}

