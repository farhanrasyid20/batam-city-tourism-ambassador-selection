"use client";
/* eslint-disable jsx-a11y/alt-text */

import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { StageStatus } from "../../../../data/mockData";

type DocumentItem = {
  label: string;
  done: boolean;
};

type ParticipantPdfData = {
  number?: string;
  auditionNumber?: string;
  participantCode?: string;
  showAuditionNumber?: boolean;
  name?: string;
  nickname?: string;
  religion?: string;
  gender?: string;
  currentStatus?: string;
  nationalId?: string;
  birthPlace?: string;
  birthDate?: string;
  heightCm?: number;
  weightKg?: string;
  shirtSize?: string;
  chestCircumferenceCm?: string;
  waistCircumferenceCm?: string;
  hipCircumferenceCm?: string;
  pantsSize?: string;
  shoeSize?: string;
  domicileAddress?: string;
  ktpAddress?: string;
  education?: string;
  instagram?: string;
  tiktok?: string;
  phone?: string;
  parentPhone?: string;
  fatherName?: string;
  motherName?: string;
  occupation?: string;
  skills?: string;
  hobbies?: string;
  languages?: string;
  vision?: string;
  mission?: string;
  experience?: string;
  achievement?: string;
  agreementNoAgency?: string;
  agreementParentPermission?: string;
  agreementAllStages?: string;
  motivationStatement?: string;
  contributionIdea?: string;
  publicSpeakingExperience?: string;
  email?: string;
  photo?: string;
  status: StageStatus;
};

type ParticipantPdfDocumentProps = {
  participant: ParticipantPdfData;
  printedDate: string;
  educationDisplay: string;
  documentItems: DocumentItem[];
  doneCount: number;
  statusLabel: Record<StageStatus, string>;
  logoSrc: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    backgroundColor: "#faf7ef",
    fontSize: 11,
    color: "#2f2a22",
    fontFamily: "Helvetica",
  },
  card: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#d6c089",
    borderRadius: 10,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "#d6c089",
    backgroundColor: "#faf7ef",
  },
  logo: {
    width: 38,
    height: 38,
    marginRight: 12,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    color: "#8b6a22",
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 10,
    color: "#a98835",
    marginTop: 2,
  },
  dept: {
    fontSize: 8,
    color: "#555",
    marginTop: 3,
  },
  participantNumberWrap: {
    alignItems: "flex-end",
  },
  participantNumberLabel: {
    fontSize: 8,
    color: "#666",
  },
  participantNumber: {
    fontSize: 16,
    color: "#8b6a22",
    fontWeight: 700,
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  profileRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 14,
  },
  photo: {
    width: 100,
    height: 120,
    borderRadius: 8,
    border: "2 solid #d6c089",
  },
  infoWrap: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    color: "#8b6a22",
    fontWeight: 700,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: 126,
    fontWeight: 700,
  },
  infoSep: {
    width: 10,
  },
  infoValue: {
    flex: 1,
    color: "#555",
  },
  sectionTitle: {
    fontSize: 11,
    color: "#8b6a22",
    fontWeight: 700,
    marginBottom: 8,
  },
  badgeList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  badgeDone: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    border: "1 solid #7cd89e",
    color: "#22a055",
    backgroundColor: "#eefaf2",
    fontSize: 9,
  },
  badgeFail: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    border: "1 solid #f0b0b0",
    color: "#d14b4b",
    backgroundColor: "#fff2f2",
    fontSize: 9,
  },
  statusBox: {
    border: "1 solid #d6c089",
    borderRadius: 8,
    backgroundColor: "#fffdf7",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  small: {
    fontSize: 8,
    color: "#666",
    marginBottom: 4,
  },
  strong: {
    fontSize: 11,
    color: "#8b6a22",
    fontWeight: 700,
  },
  footer: {
    borderTop: "1 solid #d6c089",
    padding: 10,
    textAlign: "center",
    fontSize: 8,
    color: "#666",
  },
  detailSection: {
    border: "1 solid #d6c089",
    borderRadius: 8,
    backgroundColor: "#fffdf7",
    padding: 10,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: "#a98835",
    fontWeight: 700,
    marginBottom: 6,
  },
});

/**
 * Template dokumen PDF biodata peserta.
 * Digunakan oleh halaman export untuk menghasilkan berkas siap cetak/unduh.
 */
export default function ParticipantPdfDocument({
  participant,
  printedDate,
  educationDisplay,
  documentItems,
  doneCount,
  statusLabel,
  logoSrc,
}: ParticipantPdfDocumentProps) {
  const genderLabel = participant.gender === "Encik" ? "ENCIK (Putra)" : "PUAN (Putri)";
  const yesNoLabel = (value?: string) =>
    value === "yes" ? "Ya" : value === "no" ? "Tidak" : "-";
  const showValue = (value?: string | number | null) => {
    const normalized = String(value ?? "").trim();
    return normalized || "-";
  };
  const ttl = participant.birthDate
    ? `${participant.birthPlace || "-"}, ${participant.birthDate}`
    : "-";
  const showAuditionNumber =
    participant.showAuditionNumber ??
    ["Pending", "Verified", "TechnicalMeeting", "Audition", "Rejected"].includes(participant.status);

  return (
    <Document title="Biodata Peserta">
      <Page size="A4" style={styles.page}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Image src={logoSrc} style={styles.logo} />
            <View style={styles.titleWrap}>
              <Text style={styles.title}>PEMILIHAN DUTA WISATA KOTA BATAM</Text>
              <Text style={styles.subtitle}>ENCIK & PUAN - 2026</Text>
              <Text style={styles.dept}>Dinas Kebudayaan dan Pariwisata Kota Batam</Text>
            </View>
            <View style={styles.participantNumberWrap}>
              <Text style={styles.participantNumberLabel}>
                {showAuditionNumber ? "No. Audisi" : "Kode Peserta"}
              </Text>
              <Text style={styles.participantNumber}>
                {showAuditionNumber
                  ? participant.auditionNumber || participant.number || "-"
                  : participant.participantCode || "-"}
              </Text>
              {showAuditionNumber ? (
                <>
                  <Text style={[styles.participantNumberLabel, { marginTop: 4 }]}>Kode Peserta</Text>
                  <Text style={[styles.participantNumber, { fontSize: 12 }]}>
                    {participant.participantCode || "-"}
                  </Text>
                </>
              ) : null}
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.profileRow}>
              <Image src={participant.photo || logoSrc} style={styles.photo} />
              <View style={styles.infoWrap}>
                <Text style={styles.participantName}>{participant.name || "Nama Peserta"}</Text>

                {[
                  ["Nama Panggilan", showValue(participant.nickname)],
                  ["Agama", showValue(participant.religion)],
                  ["Kategori", genderLabel],
                  ["Status Saat Ini", showValue(participant.currentStatus)],
                  ["NIK", participant.nationalId || "-"],
                  ["TTL", ttl],
                  ["Tinggi Badan", participant.heightCm ? `${participant.heightCm} cm` : "-"],
                  ["Berat Badan", participant.weightKg ? `${participant.weightKg} kg` : "-"],
                  ["Ukuran Baju", showValue(participant.shirtSize)],
                  ["Lingkar Dada", participant.chestCircumferenceCm ? `${participant.chestCircumferenceCm} cm` : "-"],
                  ["Lingkar Pinggang", participant.waistCircumferenceCm ? `${participant.waistCircumferenceCm} cm` : "-"],
                  ["Lingkar Pinggul", participant.hipCircumferenceCm ? `${participant.hipCircumferenceCm} cm` : "-"],
                  ["Ukuran Celana", showValue(participant.pantsSize)],
                  ["Ukuran Sepatu", showValue(participant.shoeSize)],
                  ["Pendidikan", educationDisplay],
                  ["Alamat Domisili", showValue(participant.domicileAddress)],
                  ["Alamat sesuai KTP", showValue(participant.ktpAddress)],
                  ["Instagram", participant.instagram || "-"],
                  ["TikTok", showValue(participant.tiktok)],
                  ["No. HP / WA", showValue(participant.phone)],
                  ["No. HP Orang Tua", showValue(participant.parentPhone)],
                  ["Nama Ayah Kandung", showValue(participant.fatherName)],
                  ["Nama Ibu Kandung", showValue(participant.motherName)],
                  ["Email", participant.email || "-"],
                ].map(([label, value]) => (
                  <View key={label} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoSep}>:</Text>
                    <Text style={styles.infoValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.sectionTitle}>
              STATUS BERKAS ({doneCount}/{documentItems.length})
            </Text>

            <View style={styles.badgeList}>
              {documentItems.map((item) => (
                <Text key={item.label} style={item.done ? styles.badgeDone : styles.badgeFail}>
                  {item.done ? "\u2713" : "x"} {item.label}
                </Text>
              ))}
            </View>

            <View style={styles.statusBox}>
              <View>
                <Text style={styles.small}>Status Seleksi Saat Ini</Text>
                <Text style={styles.strong}>
                  {statusLabel[participant.status] || "Menunggu Verifikasi"}
                </Text>
              </View>
              <View>
                <Text style={styles.small}>Dicetak pada</Text>
                <Text>{printedDate}</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text>
              Dokumen ini digenerate secara otomatis oleh Sistem Pemilihan Duta Wisata Kota Batam 2026
            </Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Image src={logoSrc} style={styles.logo} />
            <View style={styles.titleWrap}>
              <Text style={styles.title}>LAMPIRAN BIODATA PESERTA</Text>
              <Text style={styles.subtitle}>Data Tambahan Form S-01</Text>
              <Text style={styles.dept}>Pemilihan Duta Wisata Kota Batam 2026</Text>
            </View>
            <View style={styles.participantNumberWrap}>
              <Text style={styles.participantNumberLabel}>Nama Peserta</Text>
              <Text style={[styles.participantNumber, { fontSize: 12 }]}>
                {participant.name || "-"}
              </Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionSubtitle}>Data Tambahan</Text>
              {[
                ["Pekerjaan", showValue(participant.occupation)],
                ["Keahlian / Bakat", showValue(participant.skills)],
                ["Hobi", showValue(participant.hobbies)],
                ["Bahasa yang Dikuasai", showValue(participant.languages)],
                ["Visi", showValue(participant.vision)],
                ["Misi", showValue(participant.mission)],
                ["Pengalaman Organisasi/Kepemudaan", showValue(participant.experience)],
                ["Prestasi & Penghargaan", showValue(participant.achievement)],
              ].map(([label, value]) => (
                <View key={label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoSep}>:</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionSubtitle}>Pertanyaan Tambahan</Text>
              {[
                [
                  "Terikat kontrak/perjanjian agensi model",
                  yesNoLabel(participant.agreementNoAgency),
                ],
                [
                  "Bersedia & diizinkan ikut Pra-karantina s/d Grand Final",
                  yesNoLabel(participant.agreementParentPermission),
                ],
                [
                  "Bersedia ikut kegiatan lokal/nasional/internasional",
                  yesNoLabel(participant.agreementAllStages),
                ],
                ["Motivasi mengikuti pemilihan", showValue(participant.motivationStatement)],
                ["Rencana kontribusi pariwisata Batam", showValue(participant.contributionIdea)],
                ["Pengalaman public speaking/duta/modelling", showValue(participant.publicSpeakingExperience)],
              ].map(([label, value]) => (
                <View key={label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoSep}>:</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.footer}>
            Lampiran biodata ini menampilkan ringkasan seluruh data form peserta.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
