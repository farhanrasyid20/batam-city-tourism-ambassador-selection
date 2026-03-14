"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Search, Filter, Eye, Instagram } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { useApp } from "../../../../context/AppContext";
import { statusColors, statusLabelsId, type StageStatus } from "../../../../data/mockData";

type StatusFilterValue = "all" | StageStatus;
type GenderFilterValue = "all" | "Encik" | "Puan";

const stageFilterOptions: Array<{ value: StatusFilterValue; label: string }> = [
  { value: "all", label: "Semua Status" },
  { value: "Pending", label: statusLabelsId.Pending },
  { value: "Verified", label: statusLabelsId.Verified },
  { value: "Rejected", label: statusLabelsId.Rejected },
  { value: "GrandFinal", label: statusLabelsId.GrandFinal },
  { value: "Camp", label: "Karantina" },
  { value: "PreCamp", label: "Pra-Karantina" },
];

export default function AdminParticipantsPage() {
  const { participantList } = useApp();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [genderFilter, setGenderFilter] = useState<GenderFilterValue>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredParticipants = useMemo(() => {
    return participantList.filter((participant) => {
      const normalizedSearch = searchKeyword.toLowerCase();
      const matchSearch =
        participant.name.toLowerCase().includes(normalizedSearch) ||
        participant.number.toLowerCase().includes(normalizedSearch) ||
        participant.email.toLowerCase().includes(normalizedSearch);
      const matchStatus = statusFilter === "all" || participant.status === statusFilter;
      const matchGender = genderFilter === "all" || participant.gender === genderFilter;
      return matchSearch && matchStatus && matchGender;
    });
  }, [genderFilter, participantList, searchKeyword, statusFilter]);

  const selectedParticipant = selectedId
    ? participantList.find((participant) => participant.id === selectedId) ?? null
    : null;

  return (
    <div>
      <div className="mb-8">
        <h1
          style={{
            fontFamily: "var(--font-cinzel)",
            color: "#D4AF37",
            fontSize: "1.5rem",
            fontWeight: 700,
          }}
        >
          Data Peserta
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Daftar seluruh peserta terdaftar - {participantList.length} peserta
        </p>
      </div>

      <GoldCard className="mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "#D4AF37", textAlign: "right", maxWidth: "160px", wordBreak: "break-word" }}
            />
            <input
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Cari nama, nomor, atau email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "#111",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#F5E6C8",
                fontFamily: "var(--font-poppins)",
              }}
              onFocus={(event) => (event.target.style.borderColor = "rgba(212,175,55,0.6)")}
              onBlur={(event) => (event.target.style.borderColor = "rgba(212,175,55,0.25)")}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilterValue)}
            className="px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "#111",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "#F5E6C8",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {stageFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={genderFilter}
            onChange={(event) => setGenderFilter(event.target.value as GenderFilterValue)}
            className="px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "#111",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "#F5E6C8",
              fontFamily: "var(--font-poppins)",
            }}
          >
            <option value="all">Semua Kategori</option>
            <option value="Encik">Encik (Putra)</option>
            <option value="Puan">Puan (Putri)</option>
          </select>
        </div>

        <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
          <Filter size={12} />
          Menampilkan {filteredParticipants.length} dari {participantList.length} peserta
        </p>
      </GoldCard>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(212,175,55,0.2)", background: "#1A1A1A" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      background: "rgba(212,175,55,0.08)",
                      borderBottom: "1px solid rgba(212,175,55,0.15)",
                    }}
                  >
                    <th className="px-4 py-3 text-left text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                      No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                      Peserta
                    </th>
                    <th className="px-4 py-3 text-left text-xs hidden md:table-cell" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-left text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((participant, index) => (
                    <tr
                      key={participant.id}
                      className="transition-colors cursor-pointer"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: selectedId === participant.id ? "rgba(212,175,55,0.08)" : "transparent",
                      }}
                      onClick={() => setSelectedId(participant.id)}
                      onMouseEnter={(event) => {
                        if (selectedId !== participant.id) {
                          event.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        }
                      }}
                      onMouseLeave={(event) => {
                        if (selectedId !== participant.id) {
                          event.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <td className="px-4 py-3 text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Image
                            src={participant.photo}
                            alt={participant.name}
                            width={32}
                            height={32}
                            unoptimized
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                          <div>
                            <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                              {participant.name}
                            </p>
                            <p className="text-xs" style={{ color: "#666" }}>
                              {participant.number}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            background: participant.gender === "Encik" ? "rgba(59,130,246,0.15)" : "rgba(236,72,153,0.15)",
                            color: participant.gender === "Encik" ? "#60a5fa" : "#f472b6",
                            fontFamily: "var(--font-cinzel)",
                          }}
                        >
                          {participant.gender}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-1 rounded-full whitespace-nowrap"
                          style={{
                            background: `${statusColors[participant.status]}20`,
                            color: statusColors[participant.status],
                            fontFamily: "var(--font-poppins)",
                          }}
                        >
                          {statusLabelsId[participant.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedId(participant.id);
                          }}
                          className="p-1.5 rounded-lg transition-all"
                          style={{
                            color: "#D4AF37",
                            background: "rgba(212,175,55,0.1)",
                            border: "none",
                            cursor: "pointer",
                          }}
                          type="button"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredParticipants.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                    Tidak ada peserta yang sesuai filter
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          {selectedParticipant ? (
            <GoldCard glow>
              <div className="text-center mb-5">
                <Image
                  src={selectedParticipant.photo}
                  alt={selectedParticipant.name}
                  width={80}
                  height={80}
                  unoptimized
                  className="w-20 h-20 rounded-2xl object-cover object-top mx-auto mb-3"
                  style={{ border: "2px solid rgba(212,175,55,0.5)" }}
                />
                <p className="text-xs mb-1" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
                  {selectedParticipant.number}
                </p>
                <h3 className="text-sm font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
                  {selectedParticipant.name}
                </h3>
                <span
                  className="inline-block text-xs px-3 py-1 rounded-full mt-2"
                  style={{
                    background: `${statusColors[selectedParticipant.status]}20`,
                    color: statusColors[selectedParticipant.status],
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  {statusLabelsId[selectedParticipant.status]}
                </span>
              </div>

              <div className="space-y-2 text-xs" style={{ fontFamily: "var(--font-poppins)" }}>
                {[
                  { label: "Kategori", value: selectedParticipant.gender },
                  { label: "Tinggi", value: `${selectedParticipant.heightCm} cm` },
                  { label: "Pendidikan", value: selectedParticipant.education },
                  { label: "Email", value: selectedParticipant.email },
                  { label: "HP", value: selectedParticipant.phone },
                  { label: "Daftar", value: selectedParticipant.registeredAt },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between gap-2">
                    <span style={{ color: "#888" }}>{item.label}</span>
                    <span style={{ color: "#F5E6C8", textAlign: "right", maxWidth: "160px", wordBreak: "break-word" }}>
                      {item.value}
                    </span>
                  </div>
                ))}

                <div className="flex justify-between gap-2">
                  <span style={{ color: "#888" }}>Instagram</span>
                  {selectedParticipant.instagram ? (
                    <a
                      href={selectedParticipant.instagram.startsWith("http") ? selectedParticipant.instagram : `https://instagram.com/${selectedParticipant.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1"
                      style={{ color: "#D4AF37", textAlign: "right", maxWidth: "160px", wordBreak: "break-word" }}
                    >
                      <Instagram size={11} />
                      {selectedParticipant.instagram}
                    </a>
                  ) : (
                    <span style={{ color: "#666" }}>-</span>
                  )}
                </div>
              </div>
            </GoldCard>
          ) : (
            <GoldCard className="text-center py-12">
              <Eye size={32} style={{ color: "#444", margin: "0 auto 12px" }} />
              <p className="text-sm" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                Pilih peserta untuk melihat detail
              </p>
            </GoldCard>
          )}
        </div>
      </div>
    </div>
  );
}
