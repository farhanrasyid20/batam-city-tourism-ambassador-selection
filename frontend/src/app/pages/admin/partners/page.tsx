"use client";

import React, { useEffect, useState } from "react";
import { Save } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { getReadableApiError } from "../../../../lib/api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import PartnershipEditor from "../landing-page/components/PartnershipEditor";
import {
  defaultLandingPageContent,
  saveLandingPageContent,
  useLandingPageContent,
  type LandingPartnerItem,
} from "../../../../lib/landing-page-content";

export default function AdminPartnersPage() {
  const landingPageContent = useLandingPageContent();
  const [partners, setPartners] = useState<LandingPartnerItem[]>(defaultLandingPageContent.partnership.partners);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    setPartners(landingPageContent.partnership.partners);
  }, [landingPageContent]);

  const handleSave = async () => {
    const token = getParticipantAuthSession()?.token;
    if (!token) {
      setSaveMessage("Sesi login tidak ditemukan.");
      return;
    }

    try {
      await saveLandingPageContent(
        {
          ...landingPageContent,
          partnership: {
            ...landingPageContent.partnership,
            partners: partners
              .map((item, index) => {
                const src = item.src.trim();
                const alt = item.alt.trim();
                return {
                  id: item.id || `partner-${index + 1}`,
                  src,
                  alt: alt || `Partner ${index + 1}`,
                };
              })
              .filter((item) => item.src !== ""),
          },
        },
        token
      );
      setSaveMessage("Data partner/sponsor berhasil diperbarui.");
    } catch (error) {
      setSaveMessage(getReadableApiError(error));
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
          Partner / Sponsor
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Tambah, ubah, atau hapus logo sponsor tanpa batas jumlah. Semua perubahan langsung dipakai di landing page.
        </p>
      </div>

      <GoldCard glow>
        <PartnershipEditor partners={partners} onChange={setPartners} />

        <div className="flex items-center gap-3 mt-6">
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
      </GoldCard>
    </div>
  );
}
