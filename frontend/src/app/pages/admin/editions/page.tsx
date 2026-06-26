"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarRange, CheckCircle2, Lock, Play, Plus, RefreshCw, Users } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import { getReadableApiError } from "../../../../lib/api";
import { createEdition, fetchEditionRegistrations, fetchEditions, updateEdition, type CompetitionEdition, type EditionRegistrationRow, type EditionStatus } from "../../../../lib/competition-edition-api";

const statusLabel: Record<EditionStatus, string> = {
  draft: "Draft", registration_open: "Pendaftaran Dibuka", registration_closed: "Pendaftaran Ditutup",
  ongoing: "Sedang Berlangsung", completed: "Selesai", archived: "Diarsipkan",
};

export default function CompetitionEditionsPage() {
  const [items, setItems] = useState<CompetitionEdition[]>([]);
  const [year, setYear] = useState(new Date().getFullYear() + 1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [recapEdition, setRecapEdition] = useState<CompetitionEdition | null>(null);
  const [recapRows, setRecapRows] = useState<EditionRegistrationRow[]>([]);

  const token = () => getParticipantAuthSession()?.token ?? "";
  const load = useCallback(async () => {
    setLoading(true);
    try { setItems((await fetchEditions(token())).data); }
    catch (error) { setMessage(getReadableApiError(error)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function addEdition() {
    try {
      setMessage("");
      await createEdition(token(), { year });
      setMessage(`Edisi ${year} berhasil dibuat sebagai draft.`);
      setYear((value) => value + 1);
      await load();
    } catch (error) { setMessage(getReadableApiError(error)); }
  }

  async function change(item: CompetitionEdition, body: Partial<CompetitionEdition>) {
    setBusyId(item.id);
    try {
      setMessage("");
      await updateEdition(token(), item.id, body);
      setMessage("Pengaturan edisi berhasil diperbarui.");
      await load();
    } catch (error) { setMessage(getReadableApiError(error)); }
    finally { setBusyId(null); }
  }

  function reopen(item: CompetitionEdition) {
    const reason = window.prompt("Alasan membuka kembali pendaftaran:", "Perpanjangan waktu pendaftaran");
    if (reason === null) return;
    void change(item, { status: "registration_open", registration_reopen_reason: reason, is_active: true });
  }

  async function showRecap(item: CompetitionEdition) {
    setBusyId(item.id);
    try {
      const response = await fetchEditionRegistrations(token(), item.id);
      setRecapEdition(response.edition);
      setRecapRows(response.data);
    } catch (error) { setMessage(getReadableApiError(error)); }
    finally { setBusyId(null); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}>Edisi Lomba</h1>
        <p className="text-sm mt-1" style={{ color: "#A3A3A3" }}>Buat tahun lomba baru tanpa menghapus riwayat tahun sebelumnya.</p>
      </div>

      <GoldCard>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-56 text-sm" style={{ color: "#F5E6C8" }}>
            Tahun edisi baru
            <input type="number" min={2020} max={2100} value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="mt-2 w-full rounded-xl px-4 py-3 outline-none" style={{ background: "#101010", border: "1px solid rgba(212,175,55,.35)", color: "white" }} />
          </label>
          <GoldButton onClick={addEdition}><Plus size={16} /> Buat Edisi</GoldButton>
        </div>
      </GoldCard>

      {message && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(212,175,55,.1)", border: "1px solid rgba(212,175,55,.3)", color: "#F5D06F" }}>{message}</div>}
      {loading ? <p style={{ color: "#A3A3A3" }}>Memuat edisi...</p> : (
        <div className="grid gap-5 xl:grid-cols-2">
          {items.map((item) => (
            <GoldCard key={item.id} glow={item.is_active}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><CalendarRange size={19} color="#C8A24D" /><h2 className="font-bold" style={{ color: "#F5E6C8" }}>{item.name}</h2></div>
                  <p className="text-xs mt-2" style={{ color: item.registration_is_open ? "#4ade80" : "#A3A3A3" }}>{statusLabel[item.status]}{item.is_active ? " • Edisi aktif" : ""}</p>
                </div>
                {item.is_active && <CheckCircle2 size={22} color="#4ade80" />}
              </div>
              <div className="grid grid-cols-3 gap-3 my-5">
                <Stat label="Total" value={item.counts?.total ?? 0} />
                <Stat label="Submit" value={item.counts?.submitted ?? 0} />
                <Stat label="Draft" value={item.counts?.draft ?? 0} />
              </div>
              <div className="flex flex-wrap gap-2">
                <GoldButton size="sm" variant="outline" disabled={busyId === item.id} onClick={() => void showRecap(item)}><Users size={14} /> Lihat Rekap</GoldButton>
                {!item.is_active && <GoldButton size="sm" variant="outline" disabled={busyId === item.id} onClick={() => void change(item, { is_active: true })}><Play size={14} /> Jadikan Aktif</GoldButton>}
                {item.status !== "registration_open" && item.status !== "archived" && <GoldButton size="sm" disabled={busyId === item.id} onClick={() => reopen(item)}><RefreshCw size={14} /> {item.status === "draft" ? "Buka Pendaftaran" : "Buka Kembali"}</GoldButton>}
                {item.status === "registration_open" && <GoldButton size="sm" variant="outline" disabled={busyId === item.id} onClick={() => void change(item, { status: "registration_closed" })}><Lock size={14} /> Tutup Pendaftaran</GoldButton>}
                {item.status !== "archived" && <GoldButton size="sm" variant="ghost" disabled={busyId === item.id} onClick={() => void change(item, { status: "archived", is_active: false })}>Arsipkan</GoldButton>}
              </div>
              {item.registration_reopen_reason && <p className="text-xs mt-4" style={{ color: "#A3A3A3" }}>Catatan: {item.registration_reopen_reason}</p>}
            </GoldCard>
          ))}
        </div>
      )}

      {recapEdition && (
        <GoldCard>
          <div className="flex items-start justify-between gap-3 mb-5">
            <div><h2 className="font-bold" style={{ color: "#F5E6C8" }}>Rekap Peserta {recapEdition.year}</h2><p className="text-xs mt-1" style={{ color: "#A3A3A3" }}>{recapRows.length} akun memiliki pendaftaran pada edisi ini.</p></div>
            <button onClick={() => setRecapEdition(null)} className="text-sm" style={{ color: "#C8A24D" }}>Tutup</button>
          </div>
          {recapRows.length === 0 ? <div className="rounded-xl p-6 text-center" style={{ background: "#101010", color: "#A3A3A3" }}>Belum ada peserta yang mendaftar pada Edisi {recapEdition.year}.</div> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr style={{ color: "#C8A24D", borderBottom: "1px solid rgba(212,175,55,.25)" }}><th className="text-left p-3">Peserta</th><th className="text-left p-3">Kategori</th><th className="text-left p-3">Nomor</th><th className="text-left p-3">Pendaftaran</th><th className="text-left p-3">Seleksi</th></tr></thead>
              <tbody>{recapRows.map((row) => <tr key={row.id} style={{ borderBottom: "1px solid rgba(255,255,255,.06)", color: "#E5E5E5" }}><td className="p-3"><p className="font-medium">{row.name}</p><p className="text-xs" style={{ color: "#888" }}>{row.email}</p></td><td className="p-3">{row.gender ?? "-"}</td><td className="p-3">{row.participant_code ?? row.audition_number ?? "-"}</td><td className="p-3">{row.status === "submitted" ? "Sudah submit" : "Draft"}</td><td className="p-3">{row.selection_status ?? "Belum diproses"}</td></tr>)}</tbody>
            </table></div>
          )}
        </GoldCard>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl p-3" style={{ background: "#101010", border: "1px solid rgba(212,175,55,.15)" }}><div className="flex items-center gap-1 text-xs" style={{ color: "#A3A3A3" }}><Users size={12} />{label}</div><p className="text-xl font-bold mt-1" style={{ color: "#F5D06F" }}>{value}</p></div>;
}
