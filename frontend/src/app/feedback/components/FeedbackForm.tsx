"use client";

import React, { useState } from "react";
import { GoldButton } from "../../../components/ui/GoldButton";
import { useApp, type FeedbackCategory } from "../../../context/AppContext";
import { getReadableApiError } from "../../../lib/api";

type FormState = {
  name: string;
  email: string;
  category: FeedbackCategory;
  message: string;
};

/**
 * Nilai awal form feedback saat halaman pertama kali dibuka atau setelah submit berhasil.
 */
const initialState: FormState = {
  name: "",
  email: "",
  category: "Saran",
  message: "",
};

/**
 * Komponen form feedback.
 * Mengelola state input, submit async ke context, dan umpan balik status submit ke pengguna.
 */
export default function FeedbackForm() {
  const { addFeedbackEntry } = useApp();
  const [form, setForm] = useState<FormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  /**
   * Factory handler untuk memperbarui field form secara dinamis berdasarkan key.
   */
  const onChange =
    (key: keyof FormState) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  /**
   * Menangani submit form feedback dan menampilkan pesan sukses/gagal.
   */
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setSubmitMessage("");
      await addFeedbackEntry(form);
      setSubmitted(true);
      setForm(initialState);
    } catch (error) {
      setSubmitted(false);
      setSubmitMessage(getReadableApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl p-6 sm:p-8"
      style={{
        background: "#1A1A1A",
        border: "1px solid rgba(200,162,77,0.25)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label
            className="text-xs block mb-2"
            style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}
          >
            Nama
          </label>
          <input
            required
            value={form.name}
            onChange={onChange("name")}
            className="w-full rounded-xl px-4 py-3 outline-none"
            style={{
              background: "#111111",
              border: "1px solid rgba(200,162,77,0.2)",
              color: "#F5E6C8",
              fontFamily: "var(--font-poppins)",
            }}
          />
        </div>

        <div>
          <label
            className="text-xs block mb-2"
            style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}
          >
            Email
          </label>
          <input
            required
            type="email"
            value={form.email}
            onChange={onChange("email")}
            className="w-full rounded-xl px-4 py-3 outline-none"
            style={{
              background: "#111111",
              border: "1px solid rgba(200,162,77,0.2)",
              color: "#F5E6C8",
              fontFamily: "var(--font-poppins)",
            }}
          />
        </div>
      </div>

      <div className="mt-4">
        <label
          className="text-xs block mb-2"
          style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}
        >
          Kategori
        </label>
        <select
          value={form.category}
          onChange={onChange("category")}
          className="w-full rounded-xl px-4 py-3 outline-none"
          style={{
            background: "#111111",
            border: "1px solid rgba(200,162,77,0.2)",
            color: "#F5E6C8",
            fontFamily: "var(--font-poppins)",
          }}
        >
          <option value="Saran">Saran</option>
          <option value="Kritik">Kritik</option>
          <option value="Pertanyaan">Pertanyaan</option>
          <option value="Lainnya">Lainnya</option>
        </select>
      </div>

      <div className="mt-4">
        <label
          className="text-xs block mb-2"
          style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}
        >
          Pesan
        </label>
        <textarea
          required
          rows={6}
          value={form.message}
          onChange={onChange("message")}
          className="w-full rounded-xl px-4 py-3 outline-none resize-y"
          style={{
            background: "#111111",
            border: "1px solid rgba(200,162,77,0.2)",
            color: "#F5E6C8",
            fontFamily: "var(--font-poppins)",
          }}
        />
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p
          className="text-xs"
          style={{
            color: submitMessage ? "#F59E0B" : submitted ? "#C8A24D" : "#8F8F8F",
            fontFamily: "var(--font-poppins)",
          }}
        >
          {submitMessage || (submitted ? "Terima kasih, feedback Anda sudah diterima." : "Feedback akan ditinjau oleh panitia.")}
        </p>

        <GoldButton type="submit" variant="primary" size="sm" disabled={submitting}>
          {submitting ? "Mengirim..." : "Kirim Feedback"}
        </GoldButton>
      </div>
    </form>
  );
}

