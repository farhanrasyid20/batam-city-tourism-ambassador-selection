/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */
import React from "react";
import { ImageIcon, Megaphone, MessageCircle } from "lucide-react";
import GoldCard from "../../../../../components/dashboard/GoldCard";
import type { ParticipantResources } from "../../../../../context/AppContext";

type ResourceStatusCardProps = {
  form: ParticipantResources;
};

export default function ResourceStatusCard({ form }: ResourceStatusCardProps) {
  return (
    <GoldCard>
      <h3 className="text-sm font-bold mb-4" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
        Status Resource Utama
      </h3>
      <div className="space-y-3 text-xs" style={{ fontFamily: "var(--font-poppins)" }}>
        {[
          { label: "Twibbon", value: form.twibbonDocument.fileName || form.twibbonOpenLink, icon: <ImageIcon size={12} /> },
          { label: "Grup WhatsApp", value: form.whatsappGroupLink, icon: <MessageCircle size={12} /> },
          { label: "Instruksi Posting", value: form.postingInstruction, icon: <Megaphone size={12} /> },
        ].map((item) => (
          <div
            key={item.label}
            className="p-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.12)" }}
          >
            <div className="flex items-center gap-2 mb-1" style={{ color: "#D4AF37" }}>
              {item.icon}
              <span>{item.label}</span>
            </div>
            <p style={{ color: item.value ? "#F5E6C8" : "#666", whiteSpace: "pre-line" }}>
              {item.value || "Belum diisi"}
            </p>
          </div>
        ))}
      </div>
    </GoldCard>
  );
}

