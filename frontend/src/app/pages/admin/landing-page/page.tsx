"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Save, Trash2 } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { getReadableApiError } from "../../../../lib/api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import PartnershipEditor from "./components/PartnershipEditor";
import {
  defaultLandingPageContent,
  saveLandingPageContent,
  useLandingPageContent,
  type LandingPageContent,
} from "../../../../lib/landing-page-content";

const inputStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid rgba(212,175,55,0.25)",
  color: "#F5E6C8",
  fontFamily: "var(--font-poppins)",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-xs mb-1.5"
      style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
    >
      {children}
    </label>
  );
}

type StringListEditorProps = {
  title: string;
  items: string[];
  placeholder: string;
  onChange: (items: string[]) => void;
  addLabel: string;
  compact?: boolean;
};

function StringListEditor({ title, items, placeholder, onChange, addLabel }: StringListEditorProps) {
  const updateItem = (index: number, value: string) => {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const addItem = () => {
    onChange([...items, ""]);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <FieldLabel>{title}</FieldLabel>
        <button
          type="button"
          onClick={addItem}
          className="px-3 py-2 rounded-xl text-xs flex items-center gap-1"
          style={{
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.2)",
            color: "#D4AF37",
            fontFamily: "var(--font-poppins)",
            cursor: "pointer",
          }}
        >
          <Plus size={12} />
          {addLabel}
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="flex gap-3 items-start">
            <textarea
              value={item}
              onChange={(event) => updateItem(index, event.target.value)}
              rows={1}
              placeholder={`${placeholder} ${index + 1}`}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="mt-1 px-3 py-3 rounded-xl"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444",
                cursor: "pointer",
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminLandingPageContentPage() {
  const landingPageContent = useLandingPageContent();
  const [form, setForm] = useState<LandingPageContent>(defaultLandingPageContent);
  const [saveMessage, setSaveMessage] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    hero: true,
    about: true,
    registration: true,
    winners: true,
    requirements: true,
    partnership: true,
  });

  useEffect(() => {
    setForm(landingPageContent);
  }, [landingPageContent]);

  const updateHero = (key: keyof LandingPageContent["hero"], value: string) => {
    setForm((prev) => ({ ...prev, hero: { ...prev.hero, [key]: value } }));
    if (saveMessage) setSaveMessage("");
  };

  const updateAbout = (key: keyof LandingPageContent["about"], value: string | string[]) => {
    setForm((prev) => ({ ...prev, about: { ...prev.about, [key]: value } }));
    if (saveMessage) setSaveMessage("");
  };

  const updateRegistration = (
    key: keyof LandingPageContent["registration"],
    value: string | string[] | LandingPageContent["registration"]["scheduleItems"]
  ) => {
    setForm((prev) => ({ ...prev, registration: { ...prev.registration, [key]: value } }));
    if (saveMessage) setSaveMessage("");
  };

  const updateScheduleItem = (
    index: number,
    field: "activity" | "date",
    value: string
  ) => {
    updateRegistration(
      "scheduleItems",
      form.registration.scheduleItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const addScheduleItem = () => {
    updateRegistration("scheduleItems", [
      ...form.registration.scheduleItems,
      {
        id: `schedule-${Date.now()}`,
        activity: "",
        date: "",
      },
    ]);
  };

  const removeScheduleItem = (index: number) => {
    updateRegistration(
      "scheduleItems",
      form.registration.scheduleItems.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const handleSave = async () => {
    const token = getParticipantAuthSession()?.token;
    if (!token) {
      setSaveMessage("Sesi login tidak ditemukan.");
      return;
    }

    try {
      await saveLandingPageContent(
        {
          ...form,
          about: {
            ...form.about,
            missionItems: form.about.missionItems.map((item) => item.trim()).filter(Boolean),
          },
          registration: {
            ...form.registration,
            steps: form.registration.steps.map((item) => item.trim()).filter(Boolean),
            scheduleItems: form.registration.scheduleItems
              .map((item, index) => ({
                ...item,
                id: item.id || `schedule-${index + 1}`,
                activity: item.activity.trim(),
                date: item.date.trim(),
              }))
              .filter((item) => item.activity || item.date),
          },
        },
        token
      );
      setSaveMessage("Konten landing page berhasil diperbarui.");
    } catch (error) {
      setSaveMessage(getReadableApiError(error));
    }
  };

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSectionHeader = (key: keyof typeof openSections, title: string) => {
    const isOpen = openSections[key];

    return (
      <button
        type="button"
        onClick={() => toggleSection(key)}
        className="w-full flex items-center justify-between gap-3 text-left"
        style={{ cursor: "pointer" }}
      >
        <h3
          className="text-sm font-bold"
          style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}
        >
          {title}
        </h3>
        <span style={{ color: "#D4AF37" }}>
          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
      </button>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
          Kelola Landing Page
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Ubah isi konten landing page tanpa mengubah label section dan tombol sistem yang sudah tetap.
        </p>
      </div>

      <div className="space-y-6">
        <GoldCard glow>
          {renderSectionHeader("hero", "Hero Section")}
          {openSections.hero ? (
            <>
          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <div className="lg:col-span-2">
              <FieldLabel>Label Instansi</FieldLabel>
              <input
                value={form.hero.organizerLabel}
                onChange={(event) => updateHero("organizerLabel", event.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <FieldLabel>Judul Baris 1</FieldLabel>
              <input
                value={form.hero.titleLine1}
                onChange={(event) => updateHero("titleLine1", event.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <FieldLabel>Judul Baris 2</FieldLabel>
              <input
                value={form.hero.titleLine2}
                onChange={(event) => updateHero("titleLine2", event.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div className="lg:col-span-2">
              <FieldLabel>Judul Baris 3</FieldLabel>
              <input
                value={form.hero.titleLine3}
                onChange={(event) => updateHero("titleLine3", event.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="mt-4">
            <FieldLabel>Deskripsi Hero</FieldLabel>
            <textarea
              value={form.hero.description}
              onChange={(event) => updateHero("description", event.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={inputStyle}
            />
          </div>
            </>
          ) : null}
        </GoldCard>

        <GoldCard>
          {renderSectionHeader("about", "Tentang, Visi, dan Misi")}
          {openSections.about ? (
            <>
          <div className="mt-4">
            <FieldLabel>Tentang Program</FieldLabel>
            <textarea
              value={form.about.aboutCardDescription}
              onChange={(event) => updateAbout("aboutCardDescription", event.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={inputStyle}
            />
          </div>
          <div className="mt-4">
            <FieldLabel>Visi</FieldLabel>
            <textarea
              value={form.about.visionText}
              onChange={(event) => updateAbout("visionText", event.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={inputStyle}
            />
          </div>
          <div className="mt-4">
            <StringListEditor
              title="Daftar Misi"
              items={form.about.missionItems}
              placeholder="Tulis misi"
              onChange={(items) => updateAbout("missionItems", items)}
              addLabel="Tambah Misi"
            />
          </div>
            </>
          ) : null}
        </GoldCard>

        <GoldCard>
          {renderSectionHeader("registration", "Tata Cara & Jadwal")}
          {openSections.registration ? (
            <>
          <div className="mt-4">
            <StringListEditor
              title="Langkah Pendaftaran"
              items={form.registration.steps}
              placeholder="Langkah"
              onChange={(items) => updateRegistration("steps", items)}
              addLabel="Tambah Langkah"
              compact
            />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <FieldLabel>Jadwal Penting</FieldLabel>
              <button
                type="button"
                onClick={addScheduleItem}
                className="px-3 py-2 rounded-xl text-xs flex items-center gap-1"
                style={{
                  background: "rgba(212,175,55,0.1)",
                  border: "1px solid rgba(212,175,55,0.2)",
                  color: "#D4AF37",
                  fontFamily: "var(--font-poppins)",
                  cursor: "pointer",
                }}
              >
                <Plus size={12} />
                Tambah Jadwal
              </button>
            </div>

            <div className="space-y-3">
              {form.registration.scheduleItems.map((item, index) => (
                <div key={item.id} className="grid lg:grid-cols-[1fr_0.8fr_auto] gap-3 items-start">
                  <input
                    value={item.activity}
                    onChange={(event) => updateScheduleItem(index, "activity", event.target.value)}
                    placeholder="Nama kegiatan"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={inputStyle}
                  />
                  <input
                    value={item.date}
                    onChange={(event) => updateScheduleItem(index, "date", event.target.value)}
                    placeholder="Tanggal atau rentang jadwal"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => removeScheduleItem(index)}
                    className="px-3 py-3 rounded-xl"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#ef4444",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
            </>
          ) : null}
        </GoldCard>

        <GoldCard>
          {renderSectionHeader("winners", "Kategori Pemenang")}
          {openSections.winners ? (
            <div className="space-y-5 mt-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] mb-1" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
                Kategori Utama
              </p>
              <p className="text-xs mb-3" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                Susun deskripsi pemenang utama seperti tampilan kartu di landing page, dengan Encik di kiri dan Puan di kanan.
              </p>
              <div className="grid lg:grid-cols-2 gap-4">
                {form.winnerCategories.soloItems.map((item, index) => (
                  <div
                    key={item.title}
                    className="rounded-2xl p-4"
                    style={{
                      border: "1px solid rgba(212,175,55,0.18)",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <FieldLabel>{item.title}</FieldLabel>
                    <textarea
                      value={item.description}
                      onChange={(event) => setForm((prev) => ({
                        ...prev,
                        winnerCategories: {
                          ...prev.winnerCategories,
                          soloItems: prev.winnerCategories.soloItems.map((entry, itemIndex) =>
                            itemIndex === index ? { ...entry, description: event.target.value } : entry
                          ),
                        },
                      }))}
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] mb-1" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
                Kategori Pasangan
              </p>
              <p className="text-xs mb-3" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                Bagian ini tetap full width seperti kartu pasangan utama di landing page.
              </p>
              <div
                className="rounded-2xl p-4"
                style={{
                  border: "1px solid rgba(212,175,55,0.18)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <FieldLabel>{form.winnerCategories.pairItem.title}</FieldLabel>
                <textarea
                  value={form.winnerCategories.pairItem.description}
                  onChange={(event) => setForm((prev) => ({
                    ...prev,
                    winnerCategories: {
                      ...prev.winnerCategories,
                      pairItem: { ...prev.winnerCategories.pairItem, description: event.target.value },
                    },
                  }))}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] mb-1" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
                Kategori Favorit
              </p>
              <p className="text-xs mb-3" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                Susun pemenang favorit dengan pola kartu kiri dan kanan yang lebih ringkas untuk memudahkan input admin.
              </p>
              <div className="grid lg:grid-cols-2 gap-4">
                {form.winnerCategories.favoriteItems.map((item, index) => (
                  <div
                    key={item.title}
                    className="rounded-2xl p-4"
                    style={{
                      border: "1px solid rgba(212,175,55,0.18)",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <FieldLabel>{item.title}</FieldLabel>
                    <textarea
                      value={item.description}
                      onChange={(event) => setForm((prev) => ({
                        ...prev,
                        winnerCategories: {
                          ...prev.winnerCategories,
                          favoriteItems: prev.winnerCategories.favoriteItems.map((entry, itemIndex) =>
                            itemIndex === index ? { ...entry, description: event.target.value } : entry
                          ),
                        },
                      }))}
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          ) : null}
        </GoldCard>

        <GoldCard>
          {renderSectionHeader("requirements", "Syarat Pendaftaran")}
          {openSections.requirements ? (
            <>
          <div className="mt-4">
            <FieldLabel>Teks Pengantar</FieldLabel>
            <textarea
              value={form.requirements.introText}
              onChange={(event) => setForm((prev) => ({ ...prev, requirements: { ...prev.requirements, introText: event.target.value } }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={inputStyle}
            />
          </div>
          <div className="mt-4 grid xl:grid-cols-2 gap-6 items-start">
            <div>
              <StringListEditor
                title="Persyaratan Umum"
                items={form.requirements.generalItems}
                placeholder="Tulis syarat umum"
                onChange={(items) => setForm((prev) => ({ ...prev, requirements: { ...prev.requirements, generalItems: items } }))}
                addLabel="Tambah Syarat"
              />
            </div>
            <div>
              <StringListEditor
                title="Persyaratan Khusus"
                items={form.requirements.specialItems}
                placeholder="Tulis syarat khusus"
                onChange={(items) => setForm((prev) => ({ ...prev, requirements: { ...prev.requirements, specialItems: items } }))}
                addLabel="Tambah Syarat"
              />
            </div>
          </div>
            </>
          ) : null}
        </GoldCard>

        <GoldCard>
          {renderSectionHeader("partnership", "Partnership")}
          {openSections.partnership ? (
            <div className="mt-4">
          <PartnershipEditor
            partners={form.partnership.partners}
            onChange={(partners) =>
              setForm((prev) => ({
                ...prev,
                partnership: {
                  ...prev.partnership,
                  partners,
                },
              }))
            }
          />
            </div>
          ) : null}
        </GoldCard>

        <div className="flex items-center gap-3">
          <GoldButton variant="primary" size="sm" onClick={handleSave}>
            <Save size={14} />
            Simpan Perubahan
          </GoldButton>
          {saveMessage ? (
            <p className="text-xs" style={{ color: "#22c55e", fontFamily: "var(--font-poppins)" }}>
              {saveMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

