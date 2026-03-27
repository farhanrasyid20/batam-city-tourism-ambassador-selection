"use client";

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
    <div className="space-y-6">
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

      <GoldCard>
        <h3 className="text-sm font-bold mb-4" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
          Tambah User Internal
        </h3>
        <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama lengkap"
            required
            className="rounded-xl px-3 py-2 text-sm"
            style={{ background: "#141414", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8" }}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
            className="rounded-xl px-3 py-2 text-sm"
            style={{ background: "#141414", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8" }}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="No. HP (opsional)"
            className="rounded-xl px-3 py-2 text-sm"
            style={{ background: "#141414", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8" }}
          />
          {isSuperAdmin ? (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as InternalUserRole)}
              className="rounded-xl px-3 py-2 text-sm"
              style={{ background: "#141414", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8" }}
            >
              <option value="judge">Juri</option>
              <option value="admin">Admin</option>
            </select>
          ) : (
            <input
              value="Juri"
              disabled
              className="rounded-xl px-3 py-2 text-sm"
              style={{ background: "#141414", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8", opacity: 0.85 }}
            />
          )}
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password minimal 8 karakter"
            type="password"
            required
            className="rounded-xl px-3 py-2 text-sm"
            style={{ background: "#141414", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8" }}
          />
          <input
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="Konfirmasi password"
            type="password"
            required
            className="rounded-xl px-3 py-2 text-sm"
            style={{ background: "#141414", border: "1px solid rgba(200,162,77,0.25)", color: "#F5E6C8" }}
          />
          <div className="md:col-span-2">
            <GoldButton type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? "Menyimpan..." : "Tambah User"}
            </GoldButton>
          </div>
        </form>
      </GoldCard>

      <GoldCard>
        <div className="flex items-center justify-between mb-4">
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
              className="rounded-xl px-3 py-3 flex items-center justify-between gap-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,162,77,0.18)" }}
            >
              <div>
                <p style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                  {item.name}
                </p>
                <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                  {item.email} - {item.role === "judge" ? "JURI" : "ADMIN"} - {item.account_status === "active" ? "AKTIF" : "NONAKTIF"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <GoldButton variant="outline" size="sm" onClick={() => toggleStatus(item)} disabled={saving}>
                  {item.account_status === "active" ? "Nonaktifkan" : "Aktifkan"}
                </GoldButton>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDelete(item)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold"
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
