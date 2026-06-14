"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getReadableApiError } from "../../../../lib/api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import {
  activateInternalUser,
  createInternalUser,
  deleteInternalUser,
  fetchInternalUsers,
  suspendInternalUser,
  type InternalUser,
  type InternalUserRole,
} from "../../../../lib/user-management-api";
import { useApp } from "../../../../context/AppContext";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useApp();
  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin";
  const canAccessPage = isSuperAdmin || isAdmin;
  const [items, setItems] = useState<InternalUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<InternalUserRole>("judge");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const token = useMemo(() => getParticipantAuthSession()?.token ?? "", []);

  useEffect(() => {
    if (!user) return;
    if (!canAccessPage) {
      router.replace("/pages/admin/dashboard");
    }
  }, [canAccessPage, router, user]);

  const loadUsers = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetchInternalUsers(token, isAdmin ? "judge" : undefined);
      setItems(response.data);
    } catch (error) {
      setError(getReadableApiError(error));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, token]);

  useEffect(() => {
    if (canAccessPage) {
      void loadUsers();
    }
  }, [canAccessPage, loadUsers]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (password !== passwordConfirmation) {
      setMessage("");
      setError("Konfirmasi password user baru tidak cocok.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await createInternalUser(token, {
        name,
        email,
        phone,
        role: isAdmin ? "judge" : role,
        password,
        password_confirmation: passwordConfirmation,
        account_status: "active",
      });
      setMessage(response.message);
      setName("");
      setEmail("");
      setPhone("");
      setRole("judge");
      setPassword("");
      setPasswordConfirmation("");
      await loadUsers();
    } catch (error) {
      setError(getReadableApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (target: InternalUser) => {
    if (!token) return;

    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (target.account_status === "active") {
        const response = await suspendInternalUser(token, target.id);
        setMessage(response.message);
      } else {
        const response = await activateInternalUser(token, target.id);
        setMessage(response.message);
      }
      await loadUsers();
    } catch (error) {
      setError(getReadableApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (target: InternalUser) => {
    if (!token) return;
    if (!window.confirm(`Hapus akun ${target.name} (${target.email})?`)) return;

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await deleteInternalUser(token, target.id);
      setMessage(response.message);
      await loadUsers();
    } catch (error) {
      setError(getReadableApiError(error));
    } finally {
      setSaving(false);
    }
  };

  if (!user || !canAccessPage) return null;

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontSize: "1.5rem", fontWeight: 700 }}>
          Manajemen User
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          {isSuperAdmin
            ? "Kelola akun internal admin dan juri."
            : "Kelola akun juri. Role admin hanya dapat membuat dan mengelola akun juri."}
        </p>
      </div>

      <GoldCard className="p-4 sm:p-6">
        <h3 className="text-sm font-bold mb-4" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
          Tambah User Internal
        </h3>
        <p className="text-xs mb-4" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Masukkan email dan password baru yang akan digunakan oleh user untuk login.
        </p>
        <form onSubmit={handleCreate} autoComplete="off" className="grid md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>Nama lengkap</span>
            <input
              name="new-internal-user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              autoComplete="off"
              required
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: "#141414", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8" }}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>Email user baru</span>
            <input
              name="new-internal-user-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Contoh: juri@dutawisatabatam.id"
              type="email"
              autoComplete="off"
              required
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: "#141414", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8" }}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>No. HP user baru (opsional)</span>
            <input
              name="new-internal-user-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              type="tel"
              autoComplete="off"
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: "#141414", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8" }}
            />
          </label>
          {isSuperAdmin ? (
            <label className="space-y-1">
              <span className="text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>Role user baru</span>
              <select
                name="new-internal-user-role"
                value={role}
                onChange={(e) => setRole(e.target.value as InternalUserRole)}
                className="w-full rounded-xl px-3 py-2 text-sm"
                style={{ background: "#141414", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8" }}
              >
                <option value="judge">Juri</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          ) : (
            <label className="space-y-1">
              <span className="text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>Role user baru</span>
              <input
                value="Juri"
                disabled
                className="w-full rounded-xl px-3 py-2 text-sm"
                style={{ background: "#141414", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8", opacity: 0.85 }}
              />
            </label>
          )}
          <label className="space-y-1">
            <span className="text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>Password user baru</span>
            <input
              name="new-internal-user-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: "#141414", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8" }}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>Konfirmasi password user baru</span>
            <input
              name="new-internal-user-password-confirmation"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Ketik ulang password baru"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: "#141414", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8" }}
            />
          </label>
          <div className="md:col-span-2">
            <GoldButton type="submit" variant="primary" size="sm" disabled={saving} className="w-full sm:w-auto">
              {saving ? "Menyimpan..." : "Tambah User"}
            </GoldButton>
          </div>
        </form>
      </GoldCard>

      <GoldCard className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
            Daftar User Internal
          </h3>
          <GoldButton variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
            {loading ? "Memuat..." : "Refresh"}
          </GoldButton>
        </div>

        {message ? (
          <p className="text-xs mb-3" style={{ color: "#22c55e", fontFamily: "var(--font-poppins)" }}>
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-xs mb-3" style={{ color: "#ef4444", fontFamily: "var(--font-poppins)" }}>
            {error}
          </p>
        ) : null}

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="min-w-0 rounded-xl px-3 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,162,77,0.18)" }}
            >
              <div className="min-w-0">
                <p className="break-words" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                  {item.name}
                </p>
                <p className="text-xs break-all sm:hidden" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                  {item.email}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 sm:hidden">
                  <span
                    className="rounded-full px-2 py-1 text-[10px] font-semibold"
                    style={{ background: "rgba(212,175,55,0.1)", color: "#D4AF37", fontFamily: "var(--font-poppins)" }}
                  >
                    {item.role === "judge" ? "JURI" : "ADMIN"}
                  </span>
                  <span
                    className="rounded-full px-2 py-1 text-[10px] font-semibold"
                    style={{
                      background: item.account_status === "active" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: item.account_status === "active" ? "#4ade80" : "#f87171",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    {item.account_status === "active" ? "AKTIF" : "NONAKTIF"}
                  </span>
                </div>
                <p className="hidden text-xs sm:block" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                  {item.email} - {item.role === "judge" ? "JURI" : "ADMIN"} - {item.account_status === "active" ? "AKTIF" : "NONAKTIF"}
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
                <GoldButton
                  variant="outline"
                  size="sm"
                  onClick={() => toggleStatus(item)}
                  disabled={saving}
                  className="w-full whitespace-nowrap px-2 text-xs sm:w-auto sm:px-4 sm:text-sm"
                >
                  {item.account_status === "active" ? "Nonaktifkan" : "Aktifkan"}
                </GoldButton>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDelete(item)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold sm:w-auto"
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.35)",
                    color: "#ef4444",
                    fontFamily: "var(--font-poppins)",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!loading && items.length === 0 ? (
            <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              Belum ada user internal.
            </p>
          ) : null}
        </div>
      </GoldCard>
    </div>
  );
}

