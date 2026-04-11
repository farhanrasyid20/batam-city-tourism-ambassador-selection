/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */
import React from "react";
import { Hash, Link as LinkIcon } from "lucide-react";
import GoldCard from "../../../../../components/dashboard/GoldCard";
import type { ParticipantResources } from "../../../../../context/AppContext";

type HashtagMentionsCardProps = {
  form: ParticipantResources;
};

export default function HashtagMentionsCard({ form }: HashtagMentionsCardProps) {
  return (
    <GoldCard>
      <h3 className="text-sm font-bold mb-4" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
        Hashtag dan Mention
      </h3>
      <div className="space-y-4 text-xs" style={{ fontFamily: "var(--font-poppins)" }}>
        <div>
          <div className="flex items-center gap-2 mb-2" style={{ color: "#D4AF37" }}>
            <LinkIcon size={12} />
            <span>Mention Instagram</span>
          </div>
          <p style={{ color: "#F5E6C8", whiteSpace: "pre-line" }}>
            {form.instagramMentions || "Belum diisi"}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2" style={{ color: "#D4AF37" }}>
            <Hash size={12} />
            <span>Hashtag Resmi</span>
          </div>
          <p style={{ color: "#F5E6C8", whiteSpace: "pre-line" }}>
            {form.hashtagList || "Belum diisi"}
          </p>
        </div>
      </div>
    </GoldCard>
  );
}

