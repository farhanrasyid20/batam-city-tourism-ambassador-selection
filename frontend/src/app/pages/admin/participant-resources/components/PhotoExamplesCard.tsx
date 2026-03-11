import React from "react";
import { ImageIcon, Upload } from "lucide-react";
import GoldCard from "../../../../../components/dashboard/GoldCard";
import type { ParticipantResources, ResourceImage } from "../../../../../context/AppContext";
import type { ResourceImageListField } from "./types";

type PhotoExamplesCardProps = {
  form: ParticipantResources;
  inputStyle: React.CSSProperties;
  updateExampleCaption: (
    key: ResourceImageListField,
    index: number,
    caption: string,
    fallbackCaption: string
  ) => void;
  updateExampleImage: (
    key: ResourceImageListField,
    index: number,
    file: File | null,
    fallbackCaption: string
  ) => Promise<void>;
  clearExampleImage: (key: ResourceImageListField, index: number, fallbackCaption: string) => void;
};

function createEmptyImage(caption: string): ResourceImage {
  return {
    imageUrl: "",
    imageName: "",
    caption,
  };
}

export default function PhotoExamplesCard({
  form,
  inputStyle,
  updateExampleCaption,
  updateExampleImage,
  clearExampleImage,
}: PhotoExamplesCardProps) {
  return (
    <GoldCard glow>
      <div className="flex items-center gap-2 mb-5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(212,175,55,0.12)", color: "#D4AF37" }}
        >
          <ImageIcon size={16} />
        </div>
        <h3 style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>
          Contoh Foto Peserta
        </h3>
      </div>

      <div className="space-y-6">
        {[
          { key: "closeUpExamples" as const, title: "Contoh Foto Close Up", prefix: "Close Up" },
          { key: "fullBodyExamples" as const, title: "Contoh Foto Full Body", prefix: "Full Body" },
        ].map((group) => (
          <div key={group.key}>
            <p className="text-xs font-semibold mb-3" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
              {group.title}
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {[0, 1, 2].map((index) => {
                const item = form[group.key][index] ?? createEmptyImage(`${group.prefix} ${index + 1}`);
                return (
                  <div
                    key={`${group.key}-${index}`}
                    className="p-3 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.12)" }}
                  >
                    <p className="text-[11px] mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                      Contoh {index + 1}
                    </p>
                    <div
                      className="rounded-xl overflow-hidden mb-3"
                      style={{ border: "1px solid rgba(212,175,55,0.15)", background: "#101010", minHeight: 150 }}
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.caption || `${group.prefix} ${index + 1}`} className="w-full h-40 object-cover" />
                      ) : (
                        <div className="h-40 flex items-center justify-center text-xs" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                          Belum ada contoh
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={item.caption}
                      onChange={(event) => updateExampleCaption(group.key, index, event.target.value, group.prefix)}
                      placeholder={`${group.prefix} ${index + 1}`}
                      className="w-full px-3 py-2 rounded-xl text-xs outline-none mb-2"
                      style={inputStyle}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <label
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer"
                        style={{
                          background: "rgba(212,175,55,0.12)",
                          border: "1px solid rgba(212,175,55,0.28)",
                          color: "#D4AF37",
                          fontFamily: "var(--font-poppins)",
                        }}
                      >
                        <Upload size={12} />
                        Choose Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => void updateExampleImage(group.key, index, event.target.files?.[0] ?? null, group.prefix)}
                        />
                      </label>
                      {item.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => clearExampleImage(group.key, index, group.prefix)}
                          className="px-3 py-2 rounded-xl text-xs"
                          style={{
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            color: "#ef4444",
                            fontFamily: "var(--font-poppins)",
                            cursor: "pointer",
                          }}
                        >
                          Hapus
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </GoldCard>
  );
}
