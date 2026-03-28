"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle, Save, Upload } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { useApp } from "../../../../context/AppContext";

type JudgeProfileForm = {
  name: string;
  email: string;
  title: string;
  organization: string;
  avatar: string;
};

export default function JudgeProfilePage() {
  const { user, judgeList, setJudgeList, setAuthenticatedUser } = useApp();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const activeJudge = useMemo(
    () =>
      judgeList.find(
        (judge) =>
          judge.id === user?.judgeId ||
          (judge.email ?? "").trim().toLowerCase() === (user?.email ?? "").trim().toLowerCase()
      ) ?? judgeList[0],
    [judgeList, user?.email, user?.judgeId]
  );

  const [form, setForm] = useState<JudgeProfileForm>({
    name: activeJudge?.name ?? user?.name ?? "",
    email: activeJudge?.email ?? user?.email ?? "",
    title: activeJudge?.title ?? "",
    organization: activeJudge?.organization ?? "",
    avatar: activeJudge?.avatar ?? "",
  });

  const updateField = <K extends keyof JudgeProfileForm>(key: K, value: JudgeProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setNotice("");
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("File foto harus berupa gambar (JPG/PNG/WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateField("avatar", String(reader.result ?? ""));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setNotice("");
    setError("");

    if (!activeJudge) {
      setError("Data juri tidak ditemukan.");
      return;
    }
    if (!form.name.trim() || !form.email.trim()) {
      setError("Nama dan email wajib diisi.");
      return;
    }

    const normalizedEmail = form.email.trim().toLowerCase();

    setJudgeList((prev) =>
      prev.map((judge) =>
        judge.id === activeJudge.id
          ? {
              ...judge,
              name: form.name.trim(),
              email: normalizedEmail,
              title: form.title.trim(),
              organization: form.organization.trim(),
              avatar: form.avatar || judge.avatar,
            }
          : judge
      )
    );

    if (user) {
      setAuthenticatedUser({
        ...user,
        name: form.name.trim(),
        email: normalizedEmail,
      });
    }

    setNotice("Profil juri berhasil diperbarui.");
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
          Edit Profil Juri
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Perbarui foto profil dan data dasar juri.
        </p>
      </div>

      <GoldCard glow className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
              Foto Profil
            </label>
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#111", border: "1px solid rgba(212,175,55,0.25)" }}>
              <Image
                src={form.avatar || "/encik-puan-logo-2026.png"}
                alt="Preview foto profil juri"
                width={64}
                height={64}
                unoptimized
                className="w-16 h-16 rounded-xl object-cover"
                style={{ border: "1px solid rgba(212,175,55,0.35)" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                  Ganti foto profil juri untuk tampilan dashboard.
                </p>
                <p className="text-[11px] mt-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                  Format JPG/PNG/WebP, ukuran maksimal 5 MB.
                </p>
              </div>
              <label
                className="px-3 py-2 rounded-lg text-xs cursor-pointer inline-flex items-center gap-2"
                style={{
                  background: "rgba(212,175,55,0.12)",
                  border: "1px solid rgba(212,175,55,0.28)",
                  color: "#D4AF37",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                <Upload size={12} />
                Ganti Foto
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                Nama Lengkap
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: "#111", border: "1px solid rgba(212,175,55,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: "#111", border: "1px solid rgba(212,175,55,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                Jabatan
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: "#111", border: "1px solid rgba(212,175,55,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                Instansi / Organisasi
              </label>
              <input
                type="text"
                value={form.organization}
                onChange={(event) => updateField("organization", event.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: "#111", border: "1px solid rgba(212,175,55,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
              />
            </div>
          </div>

          {notice ? (
            <div className="flex items-center gap-2 text-xs" style={{ color: "#22c55e", fontFamily: "var(--font-poppins)" }}>
              <CheckCircle size={14} />
              {notice}
            </div>
          ) : null}
          {error ? (
            <p className="text-xs" style={{ color: "#ef4444", fontFamily: "var(--font-poppins)" }}>
              {error}
            </p>
          ) : null}

          <GoldButton type="submit" variant="primary">
            <Save size={16} />
            Simpan Perubahan
          </GoldButton>
        </form>
      </GoldCard>
    </div>
  );
}

