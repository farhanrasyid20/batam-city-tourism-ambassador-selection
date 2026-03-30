"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";
import { Save, Upload, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import {
  fetchParticipantBiodata,
  updateParticipantBiodata,
  type ParticipantBiodata,
  type ParticipantDocumentMeta,
} from "../../../../lib/auth-api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import { API_BASE_URL, getReadableApiError } from "../../../../lib/api";
import type { Participant, StageStatus } from "../../../../data/mockData";

type FormState = {
  fullName: string;
  gender: "Encik" | "Puan";
  nationalId: string;
  birthPlace: string;
  birthDate: string;
  heightCm: string;
  educationInstitution: string;
  educationMajor: string;
  email: string;
  phone: string;
  instagram: string;
  vision: string;
  mission: string;
  experience: string;
  achievement: string;
  introVideoUrl: string;
  profilePhoto: string;
  educationCategory: "SMA" | "SMK" | "MA" | "Kuliah";
  educationDegree: string;
  agreementNoAgency: "" | "yes" | "no";
  agencyName: string;
  agreementParentPermission: "" | "yes" | "no";
  agreementAllStages: "" | "yes" | "no";
  motivationStatement: string;
  contributionIdea: string;
  publicSpeakingExperience: string;
};

type EducationCategory = FormState["educationCategory"];

const inputStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid rgba(200,162,77,0.25)",
  color: "#F5E6C8",
  fontFamily: "var(--font-poppins)",
};

const API_ORIGIN = API_BASE_URL.replace(/\/api$/i, "");

function resolveParticipantPhotoUrl(photo?: string | null): string | undefined {
  const value = photo?.trim();
  if (!value) return undefined;
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }
  return value.startsWith("/") ? `${API_ORIGIN}${value}` : `${API_ORIGIN}/${value}`;
}

function mapBiodataStatus(accountStatus?: string, fallback?: StageStatus): StageStatus {
  const normalized = (accountStatus ?? "").toLowerCase();
  if (normalized === "suspended") return "Rejected";
  if (normalized === "active") return fallback ?? "Pending";
  return fallback ?? "Pending";
}

function mapSelectionStatus(
  selectionStatus?: ParticipantBiodata["selection_status"],
  accountStatus?: string,
  fallback?: StageStatus
): StageStatus {
  const allowed: StageStatus[] = [
    "Pending",
    "Verified",
    "Rejected",
    "Audition",
    "Top20",
    "PreCamp",
    "Camp",
    "GrandFinal",
    "Winner",
  ];

  if (selectionStatus && allowed.includes(selectionStatus as StageStatus)) {
    return selectionStatus as StageStatus;
  }

  return mapBiodataStatus(accountStatus, fallback);
}

function formatIsoDateToDisplay(iso: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

function parseDisplayDateToIso(display: string): string | null {
  const normalized = display.trim();
  if (!normalized) return "";

  const match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!day || !month || !year) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function parseIsoDateToDate(iso: string): Date | null {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildEducationTextFromBiodata(data: ParticipantBiodata): string {
  const category = data.education_category?.trim();
  const institution = data.education_institution?.trim();
  const degree = data.education_degree?.trim();
  const major = data.education_major?.trim();

  if (!institution) return "";

  if (category === "Kuliah" && degree && major) {
    return `${category} - ${institution} - ${degree} - ${major}`;
  }
  if (category && major) {
    return `${category} - ${institution} - ${major}`;
  }
  if (major) {
    return `${institution} - ${major}`;
  }
  return institution;
}

function mergeParticipantFromBiodata(base: Participant | null, data: ParticipantBiodata): Participant {
  const normalizedDocuments =
    data.documents?.map((doc: ParticipantDocumentMeta) => ({
      key: doc.key,
      label: doc.label,
      status:
        doc.status === "verified" || doc.status === "revision_required" || doc.status === "missing"
          ? doc.status
          : ("submitted" as const),
      note: doc.note ?? undefined,
    })) ?? base?.documents ?? [];

  return {
    id: base?.id ?? `P_API_${data.id}`,
    number: data.participant_number ?? base?.number ?? "-",
    name: data.name ?? base?.name ?? "Peserta",
    gender: data.gender ?? base?.gender ?? "Encik",
    nationalId: data.national_id ?? base?.nationalId ?? "",
    birthPlace: data.birth_place ?? base?.birthPlace ?? "",
    birthDate: data.birth_date ?? base?.birthDate ?? "",
    heightCm: data.height_cm ?? base?.heightCm ?? 0,
    education: buildEducationTextFromBiodata(data) || base?.education || "",
    instagram: data.instagram ?? base?.instagram ?? "",
    phone: data.phone ?? base?.phone ?? "",
    email: data.email ?? base?.email ?? "",
    photo: resolveParticipantPhotoUrl(data.photo) ?? base?.photo ?? "",
    status: mapSelectionStatus(data.selection_status, data.account_status, base?.status),
    verificationStatus: base?.verificationStatus,
    selectionStage: base?.selectionStage,
    adminVerificationNote: base?.adminVerificationNote,
    adminRevisionNote: base?.adminRevisionNote,
    reviewItems: base?.reviewItems ?? [],
    documents: normalizedDocuments,
    submittedToAdmin: data.submitted_to_admin ?? base?.submittedToAdmin ?? false,
    rejectionReason: base?.rejectionReason,
    verificationIssues: base?.verificationIssues ?? [],
    agreementNoAgency: data.agreement_no_agency ?? base?.agreementNoAgency,
    agencyName: data.agency_name ?? base?.agencyName,
    agreementParentPermission: data.agreement_parent_permission ?? base?.agreementParentPermission,
    agreementAllStages: data.agreement_all_stages ?? base?.agreementAllStages,
    motivationStatement: data.motivation_statement ?? base?.motivationStatement,
    contributionIdea: data.contribution_idea ?? base?.contributionIdea,
    publicSpeakingExperience: data.public_speaking_experience ?? base?.publicSpeakingExperience,
    registeredAt: base?.registeredAt ?? new Date().toISOString().slice(0, 10),
    scores: base?.scores ?? [],
    likes: base?.likes ?? 0,
  };
}

export default function BiodataPage() {
  // Ambil data peserta aktif dan state form biodata.
  const router = useRouter();
  const { currentParticipant, setCurrentParticipant, setParticipantList, user } = useApp();
  const participant = currentParticipant;
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSyncingBiodata, setIsSyncingBiodata] = useState(false);
  const [isSavingBiodata, setIsSavingBiodata] = useState(false);
  const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false);
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const institutionRef = useRef<HTMLDivElement | null>(null);
  const majorRef = useRef<HTMLDivElement | null>(null);
  const birthDatePickerWrapperRef = useRef<HTMLDivElement | null>(null);

  // Data referensi pendidikan per kategori (SMA/SMK/MA/Kuliah).
  const educationData = {
    SMA: {
      institutions: [
        "SMAN 3 Batam",
        "SMAN 1 Batam",
        "SMAN 10 Batam",
        "SMAN 11 Batam",
        "SMAN 12 Batam",
        "SMAN 13 Batam",
        "SMAN 14 Batam",
        "SMAN 15 Batam",
        "SMAN 16 Batam",
        "SMAN 17 Batam",
        "SMAN 18 Batam",
        "SMAN 19 Batam",
        "SMAN 2 Batam",
        "SMAN 20 Batam",
        "SMAN 21 Batam",
        "SMAN 22 Batam",
        "SMAN 23 Batam",
        "SMAN 24 Batam",
        "SMAN 25 Batam",
        "SMAN 26 Batam",
        "SMAN 27 Batam",
        "SMAN 28 Batam",
        "SMAN 3 Batam",
        "SMAN 4 Batam",
        "SMAN 5 Batam",
        "SMAN 6 Batam",
        "SMAN 7 Batam",
        "SMAN 8 Batam",
        "SMAN 9 Batam",
        "SMA Kartini Batam",
        "SMA Yos Sudarso Batam",
        "SMA Maitreyawira Batam",
      ],
      majors: ["IPA", "IPS", "Bahasa", "Keagamaan"],
    },
    SMK: {
      institutions: [
        "SMKN 1 Batam",
        "SMKN 2 Batam",
        "SMKN 3 Batam",
        "SMKN 4 Batam",
        "SMKN 5 Batam",
        "SMKN 6 Batam",
        "SMKN 7 Batam",
        "SMKN 8 Batam",
        "SMKN 9 Batam",
      ],
      majors: [
        "Teknik Komputer dan Jaringan",
        "Rekayasa Perangkat Lunak",
        "Multimedia",
        "Akuntansi",
        "Administrasi Perkantoran",
        "Perhotelan",
        "Usaha Perjalanan Wisata",
        "Teknik Mesin",
        "Teknik Elektro",
        "Tata Boga",
      ],
    },
    MA: {
      institutions: [
        "MAN 1 Kota Batam",
        "MAN 2 Kota Batam",
        "MAN Insan Cendekia Kota Batam",
        "MA YA HUSNAYA",
        "MA NAHDLATUL WATHAN",
        "MA MANBAUL HIDAYAH",
        "MA AMANATUL UMMAH",
        "MA ISKANDAR MUDA",
        "MA QUR`AN CENTRE",
        "MA BATAMIYAH",
        "MA AL MARHAMAH",
        "MA Al-Mukarramah",
        "MA DARUL IHSAN",
        "MA DARUL FALAH",
        "MA INDUSTRI ALJABAR",
        "MA AN NI`MAH",
        "MA PLUS NURUL HAQ",
      ],
      majors: ["MIPA", "IPS", "Bahasa", "Keagamaan", "Ilmu Keagamaan Islam"],
    },
    Kuliah: {
      institutions: [
        "Politeknik Negeri Batam",
        "Universitas Batam",
        "Universitas Putera Batam",
        "Universitas Internasional Batam",
        "Universitas Riau Kepulauan (UNRIKA) Batam",
        "STIT Hidayatullah Batam",
      ],
      majors: [
        "Teknik Informatika",
        "Sistem Informasi",
        "Teknik Komputer",
        "Akuntansi",
        "Manajemen",
        "Ilmu Komunikasi",
        "Hukum",
        "Pariwisata",
        "Teknik Industri",
        "Bahasa Inggris",
      ],
      degrees: ["D1", "D2", "D3", "D4", "S1", "S2", "S3", "Profesi"],
    },
  } as const;

  const isEducationCategory = (value: string | undefined): value is EducationCategory =>
    value === "SMA" || value === "SMK" || value === "MA" || value === "Kuliah";

  // Parsing string pendidikan lama ke format field terpisah.
  const parseEducation = (value: string | undefined) => {
    if (!value) return { institution: "", major: "" };
    const normalized = value.replace(" ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ ", " - ").replace(" | ", " - ");
    const parts = normalized.split(" - ");
    const rawCategory = parts[0]?.trim();
    return {
      institution: parts[1]?.trim() ?? parts[0]?.trim() ?? "",
      major: parts.slice(2).join(" - ").trim() || parts.slice(1).join(" - ").trim(),
      category: rawCategory === "Kampus" ? "Kuliah" : isEducationCategory(rawCategory) ? rawCategory : undefined,
    };
  };

  const parsedEducation = parseEducation(participant?.education);

  // Initial state form biodata peserta.
  const [form, setForm] = useState<FormState>({
    fullName: participant?.name ?? "",
    gender: participant?.gender ?? "Encik",
    nationalId: participant?.nationalId ?? "",
    birthPlace: participant?.birthPlace ?? "",
    birthDate: participant?.birthDate ?? "",
    heightCm: participant?.heightCm ? String(participant.heightCm) : "",
    educationInstitution: parsedEducation.institution,
    educationMajor: parsedEducation.major,
    educationCategory: parsedEducation.category ?? "Kuliah",
    educationDegree: "",
    email: participant?.email ?? user?.email ?? "",
    phone: participant?.phone ?? "",
    instagram: participant?.instagram ?? "",
    vision: "",
    mission: "",
    experience: "",
    achievement: "",
    introVideoUrl: "",
    profilePhoto: participant?.photo ?? "",
    agreementNoAgency: participant?.agreementNoAgency ?? "",
    agencyName: participant?.agencyName ?? "",
    agreementParentPermission: participant?.agreementParentPermission ?? "",
    agreementAllStages: participant?.agreementAllStages ?? "",
    motivationStatement: participant?.motivationStatement ?? "",
    contributionIdea: participant?.contributionIdea ?? "",
    publicSpeakingExperience: participant?.publicSpeakingExperience ?? "",
  });
  const [birthDateDisplay, setBirthDateDisplay] = useState<string>(
    formatIsoDateToDisplay(participant?.birthDate ?? "")
  );
  const [isBirthDatePickerOpen, setIsBirthDatePickerOpen] = useState(false);
  const [birthDateView, setBirthDateView] = useState<Date>(
    () => parseIsoDateToDate(participant?.birthDate ?? "") ?? new Date()
  );

  useEffect(() => {
    const token = getParticipantAuthSession()?.token;
    if (!token) return;

    let cancelled = false;
    const syncBiodata = async () => {
      setIsSyncingBiodata(true);
      try {
        const response = await fetchParticipantBiodata(token);
        if (cancelled) return;
        const data = response.data;

        setForm((prev) => ({
          ...prev,
          fullName: data.name ?? prev.fullName,
          gender: data.gender ?? prev.gender,
          nationalId: data.national_id ?? prev.nationalId,
          birthPlace: data.birth_place ?? prev.birthPlace,
          birthDate: data.birth_date ?? prev.birthDate,
          heightCm:
            data.height_cm !== null && data.height_cm !== undefined
              ? String(data.height_cm)
              : prev.heightCm,
          educationCategory: data.education_category ?? prev.educationCategory,
          educationInstitution: data.education_institution ?? prev.educationInstitution,
          educationMajor: data.education_major ?? prev.educationMajor,
          educationDegree: data.education_degree ?? prev.educationDegree,
          email: data.email ?? prev.email,
          phone: data.phone ?? prev.phone,
          instagram: data.instagram ?? prev.instagram,
          vision: data.vision ?? prev.vision,
          mission: data.mission ?? prev.mission,
          experience: data.experience ?? prev.experience,
          achievement: data.achievement ?? prev.achievement,
          introVideoUrl: data.intro_video_url ?? prev.introVideoUrl,
          profilePhoto: data.photo ?? prev.profilePhoto,
          agreementNoAgency: data.agreement_no_agency ?? prev.agreementNoAgency,
          agencyName: data.agency_name ?? prev.agencyName,
          agreementParentPermission:
            data.agreement_parent_permission ?? prev.agreementParentPermission,
          agreementAllStages: data.agreement_all_stages ?? prev.agreementAllStages,
          motivationStatement: data.motivation_statement ?? prev.motivationStatement,
          contributionIdea: data.contribution_idea ?? prev.contributionIdea,
          publicSpeakingExperience:
            data.public_speaking_experience ?? prev.publicSpeakingExperience,
        }));
        setBirthDateDisplay(formatIsoDateToDisplay(data.birth_date ?? form.birthDate ?? ""));

        setCurrentParticipant((prev) => mergeParticipantFromBiodata(prev, data));
        setParticipantList((prev) => {
          const merged = mergeParticipantFromBiodata(
            prev.find((item) => item.email.toLowerCase() === (data.email ?? "").toLowerCase()) ??
              null,
            data
          );
          const index = prev.findIndex(
            (item) =>
              item.id === merged.id ||
              item.email.toLowerCase() === (data.email ?? "").toLowerCase()
          );
          if (index === -1) return [merged, ...prev];
          const next = [...prev];
          next[index] = merged;
          return next;
        });

        setErrorMessage("");
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(`Gagal sinkron biodata dari backend: ${getReadableApiError(error)}`);
        }
      } finally {
        if (!cancelled) {
          setIsSyncingBiodata(false);
        }
      }
    };

    void syncBiodata();
    return () => {
      cancelled = true;
    };
  }, [setCurrentParticipant, setParticipantList]);

  useEffect(() => {
    if (!isBirthDatePickerOpen) return;

    const close = () => setIsBirthDatePickerOpen(false);
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!birthDatePickerWrapperRef.current?.contains(target)) {
        close();
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onEscape);
    window.addEventListener("resize", close);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onEscape);
      window.removeEventListener("resize", close);
    };
  }, [isBirthDatePickerOpen]);

  // Progress kelengkapan biodata untuk indikator persentase.
  const completionProgress = useMemo(() => {
    const requiredFields = [
      form.fullName,
      form.nationalId,
      form.birthPlace,
      form.birthDate,
      form.heightCm,
      form.educationInstitution,
      form.email,
      form.phone,
      form.instagram,
      form.vision,
      form.mission,
      form.agreementNoAgency,
      form.agreementParentPermission,
      form.agreementAllStages,
      form.motivationStatement,
      form.contributionIdea,
      form.publicSpeakingExperience,
      form.introVideoUrl,
    ];
    const filledCount = requiredFields.filter(Boolean).length;
    return Math.round((filledCount / requiredFields.length) * 100);
  }, [form]);

  // Opsi dropdown yang berubah sesuai kategori pendidikan.
  const selectedEducation = educationData[form.educationCategory] ?? educationData.Kuliah;
  const institutionOptions = selectedEducation.institutions;
  const majorOptions = selectedEducation.majors;
  const degreeOptions = form.educationCategory === "Kuliah" ? educationData.Kuliah.degrees : [];

  const institutionKeyword = form.educationInstitution.toLowerCase().trim();
  const filteredInstitutions = institutionKeyword
    ? institutionOptions.filter((item) => item.toLowerCase().includes(institutionKeyword))
    : institutionOptions;

  const majorKeyword = form.educationMajor.toLowerCase().trim();
  const filteredMajors = majorKeyword
    ? majorOptions.filter((item) => item.toLowerCase().includes(majorKeyword))
    : majorOptions;

  // Menutup dropdown jika klik di luar area field.
  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (institutionRef.current && !institutionRef.current.contains(target)) {
        setShowInstitutionDropdown(false);
      }
      if (majorRef.current && !majorRef.current.contains(target)) {
        setShowMajorDropdown(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Helper update field agar penulisan state tetap konsisten.
  const updateFormField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Merangkai teks pendidikan ke format penyimpanan peserta.
  const buildEducationValue = () =>
    form.educationInstitution.trim()
      ? form.educationMajor.trim()
        ? form.educationCategory === "Kuliah" && form.educationDegree.trim()
          ? `${form.educationCategory} - ${form.educationInstitution.trim()} - ${form.educationDegree.trim()} - ${form.educationMajor.trim()}`
          : `${form.educationCategory} - ${form.educationInstitution.trim()} - ${form.educationMajor.trim()}`
        : form.educationInstitution.trim()
      : "";

  // Simpan draft biodata peserta.
  const handleSaveDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSavingBiodata(true);

    const parsedHeight = Number(form.heightCm);
    if (!Number.isFinite(parsedHeight) || parsedHeight <= 0) {
      setErrorMessage("Tinggi badan tidak valid. Mohon isi angka yang benar.");
      setIsSavingBiodata(false);
      return;
    }
    const normalizedHeight = Math.round(parsedHeight);

    const educationValue = buildEducationValue();
    const token = getParticipantAuthSession()?.token;

    try {
      if (token) {
        const response = await updateParticipantBiodata(token, {
          name: form.fullName,
          phone: form.phone,
          gender: form.gender,
          national_id: form.nationalId,
          birth_place: form.birthPlace,
          birth_date: form.birthDate,
          height_cm: normalizedHeight || undefined,
          instagram: form.instagram,
          photo: form.profilePhoto || undefined,
          education_category: form.educationCategory,
          education_institution: form.educationInstitution,
          education_major: form.educationMajor,
          education_degree: form.educationDegree || undefined,
          vision: form.vision,
          mission: form.mission,
          experience: form.experience || undefined,
          achievement: form.achievement || undefined,
          intro_video_url: form.introVideoUrl,
          agreement_no_agency: form.agreementNoAgency || undefined,
          agency_name: form.agencyName.trim() || undefined,
          agreement_parent_permission: form.agreementParentPermission || undefined,
          agreement_all_stages: form.agreementAllStages || undefined,
          motivation_statement: form.motivationStatement.trim() || undefined,
          contribution_idea: form.contributionIdea.trim() || undefined,
          public_speaking_experience: form.publicSpeakingExperience.trim() || undefined,
        });

        const merged = mergeParticipantFromBiodata(participant, response.data);
        merged.education = educationValue || merged.education;
        setCurrentParticipant(merged);
        setParticipantList((prev) => {
          const index = prev.findIndex(
            (item) =>
              item.id === merged.id ||
              item.email.toLowerCase() === (response.data.email ?? "").toLowerCase()
          );
          if (index === -1) return [merged, ...prev];
          const next = [...prev];
          next[index] = merged;
          return next;
        });
      } else if (participant) {
        const updatedParticipant = {
          ...participant,
          name: form.fullName,
          gender: form.gender,
          nationalId: form.nationalId,
          birthPlace: form.birthPlace,
          birthDate: form.birthDate,
          heightCm: normalizedHeight,
          education: educationValue,
          email: participant.email || form.email,
          phone: form.phone,
          instagram: form.instagram,
          photo: form.profilePhoto || participant.photo,
          agreementNoAgency: form.agreementNoAgency || undefined,
          agencyName: form.agencyName.trim() || undefined,
          agreementParentPermission: form.agreementParentPermission || undefined,
          agreementAllStages: form.agreementAllStages || undefined,
          motivationStatement: form.motivationStatement.trim() || undefined,
          contributionIdea: form.contributionIdea.trim() || undefined,
          publicSpeakingExperience: form.publicSpeakingExperience.trim() || undefined,
        };
        setCurrentParticipant(updatedParticipant);
        setParticipantList((prev) =>
          prev.map((item) => (item.id === updatedParticipant.id ? updatedParticipant : item))
        );
      }

      setIsSaved(true);
      window.setTimeout(() => setIsSaved(false), 2800);
    } catch (error) {
      setErrorMessage(getReadableApiError(error));
    } finally {
      setIsSavingBiodata(false);
    }
  };

  // Komponen helper input standar.
  const renderInputField = ({
    label,
    name,
    type = "text",
    placeholder,
    required = false,
    hint,
    readOnly = false,
    disabled = false,
  }: {
    label: string;
    name: keyof FormState;
    type?: string;
    placeholder?: string;
    required?: boolean;
    hint?: string;
    readOnly?: boolean;
    disabled?: boolean;
  }) => (
    <div>
      <label
        className="block text-xs mb-1.5"
        style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
      >
        {label} {required ? <span style={{ color: "#ef4444" }}>*</span> : null}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => updateFormField(name, e.target.value)}
        onWheel={type === "number" ? (e) => (e.currentTarget as HTMLInputElement).blur() : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        inputMode={type === "number" ? "numeric" : undefined}
        step={type === "number" ? 1 : undefined}
        min={name === "heightCm" ? (form.gender === "Encik" ? 175 : 165) : undefined}
        max={name === "heightCm" ? 250 : undefined}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
        style={{
          ...inputStyle,
          opacity: disabled ? 0.72 : 1,
          cursor: readOnly || disabled ? "not-allowed" : "text",
          background: readOnly || disabled ? "#161616" : inputStyle.background,
        }}
        onFocus={(e) => {
          if (!readOnly && !disabled) {
            e.target.style.borderColor = "rgba(200,162,77,0.6)";
          }
        }}
        onBlur={(e) => {
          if (!readOnly && !disabled) {
            e.target.style.borderColor = "rgba(200,162,77,0.25)";
          }
        }}
      />
      {hint ? (
        <p className="text-xs mt-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );

  // Komponen helper textarea standar.
  const renderTextAreaField = ({
    label,
    name,
    placeholder,
    required = false,
    rows = 4,
    hint,
  }: {
    label: string;
    name: keyof FormState;
    placeholder?: string;
    required?: boolean;
    rows?: number;
    hint?: string;
  }) => (
    <div>
      <label
        className="block text-xs mb-1.5"
        style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
      >
        {label} {required ? <span style={{ color: "#ef4444" }}>*</span> : null}
      </label>
      <textarea
        value={form[name]}
        onChange={(e) => updateFormField(name, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = "rgba(200,162,77,0.6)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(200,162,77,0.25)")}
      />
      {hint ? (
        <p className="text-xs mt-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );

  // Komponen helper radio Ya/Tidak untuk pertanyaan tambahan.
  const renderYesNoField = ({
    label,
    name,
    required = false,
  }: {
    label: string;
    name: "agreementNoAgency" | "agreementParentPermission" | "agreementAllStages";
    required?: boolean;
  }) => (
    <div>
      <label
        className="block text-xs mb-1.5"
        style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
      >
        {label} {required ? <span style={{ color: "#ef4444" }}>*</span> : null}
      </label>
      <div className="flex gap-3">
        <label className="inline-flex items-center gap-2 text-sm" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
          <input
            type="radio"
            name={String(name)}
            checked={form[name] === "yes"}
            onChange={() => updateFormField(name, "yes")}
          />
          Ya
        </label>
        <label className="inline-flex items-center gap-2 text-sm" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
          <input
            type="radio"
            name={String(name)}
            checked={form[name] === "no"}
            onChange={() => updateFormField(name, "no")}
          />
          Tidak
        </label>
      </div>
    </div>
  );

  const renderBirthDateField = () => (
    <div>
      <label
        className="block text-xs mb-1.5"
        style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
      >
        Tanggal Lahir <span style={{ color: "#ef4444" }}>*</span>
      </label>
      <div className="relative" ref={birthDatePickerWrapperRef}>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-[1]">
          <svg
            className="h-4 w-4"
            style={{ color: "#BDBDBD" }}
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={birthDateDisplay}
          onChange={(event) => {
            const next = event.target.value;
            setBirthDateDisplay(next);
            const iso = parseDisplayDateToIso(next);
            if (iso !== null) {
              updateFormField("birthDate", iso);
            }
          }}
          onBlur={(event) => {
            const iso = parseDisplayDateToIso(event.target.value);
            if (iso === null) {
              setErrorMessage("Format tanggal lahir harus dd/mm/yyyy.");
              window.setTimeout(() => setErrorMessage(""), 2500);
              if (form.birthDate) {
                setBirthDateDisplay(formatIsoDateToDisplay(form.birthDate));
              } else {
                setBirthDateDisplay("");
              }
              event.target.style.borderColor = "rgba(200,162,77,0.25)";
              return;
            }
            if (iso === "") {
              updateFormField("birthDate", "");
              setBirthDateDisplay("");
            } else {
              setBirthDateDisplay(formatIsoDateToDisplay(iso));
              const selectedDate = parseIsoDateToDate(iso);
              if (selectedDate) setBirthDateView(selectedDate);
            }
            event.target.style.borderColor = "rgba(200,162,77,0.25)";
          }}
          onFocus={() => setIsBirthDatePickerOpen(true)}
          placeholder="dd/mm/yyyy"
          aria-label="Tanggal lahir"
          className="block w-full rounded-xl border px-4 py-3 pl-10 pr-11 text-sm outline-none transition-all"
          style={{
            background: "#111",
            border: "1px solid rgba(200,162,77,0.25)",
            color: "#F5E6C8",
            fontFamily: "var(--font-poppins)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(200,162,77,0.6)")}
        />
        <button
          type="button"
          onClick={() => {
            setIsBirthDatePickerOpen((prev) => !prev);
          }}
          className="absolute inset-y-0 right-0 flex items-center pr-3"
          style={{ color: "#BDBDBD" }}
          aria-label="Buka kalender tanggal lahir"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
            />
          </svg>
        </button>
        {isBirthDatePickerOpen ? (
          <div
            className="absolute left-0 top-[calc(100%+8px)] z-50 w-[320px] rounded-xl border p-3"
            style={{
              background: "#111",
              borderColor: "rgba(200,162,77,0.35)",
              boxShadow: "0 14px 34px rgba(0,0,0,0.45)",
            }}
          >
            {(() => {
              const currentMonth = birthDateView.getMonth();
              const currentYear = birthDateView.getFullYear();
              const firstDay = new Date(currentYear, currentMonth, 1);
              const startWeekday = firstDay.getDay();
              const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
              const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
              const monthName = new Intl.DateTimeFormat("id-ID", {
                month: "long",
                year: "numeric",
              }).format(firstDay);
              const selectedDate = parseIsoDateToDate(form.birthDate);
              const today = new Date();
              const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
              const maxDate = new Date();
              const cells: { date: Date; currentMonth: boolean }[] = [];
              for (let i = 0; i < 42; i += 1) {
                const dayOffset = i - startWeekday + 1;
                if (dayOffset <= 0) {
                  cells.push({
                    date: new Date(currentYear, currentMonth - 1, daysInPrevMonth + dayOffset),
                    currentMonth: false,
                  });
                } else if (dayOffset > daysInMonth) {
                  cells.push({
                    date: new Date(currentYear, currentMonth + 1, dayOffset - daysInMonth),
                    currentMonth: false,
                  });
                } else {
                  cells.push({
                    date: new Date(currentYear, currentMonth, dayOffset),
                    currentMonth: true,
                  });
                }
              }

              return (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setBirthDateView((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                      }
                      className="rounded-md px-2 py-1 text-sm"
                      style={{ color: "#F5E6C8", border: "1px solid rgba(200,162,77,0.2)" }}
                    >
                      {"<"}
                    </button>
                    <p style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                      {monthName}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setBirthDateView((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                      }
                      className="rounded-md px-2 py-1 text-sm"
                      style={{ color: "#F5E6C8", border: "1px solid rgba(200,162,77,0.2)" }}
                    >
                      {">"}
                    </button>
                  </div>
                  <div className="mb-2 grid grid-cols-7 text-center text-xs">
                    {weekdayLabels.map((label) => (
                      <span key={label} style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map(({ date, currentMonth }) => {
                      const disabled = date > maxDate;
                      const selected = selectedDate ? isSameDate(date, selectedDate) : false;
                      const todayCell = isSameDate(date, today);
                      return (
                        <button
                          key={date.toISOString()}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                            updateFormField("birthDate", iso);
                            setBirthDateDisplay(formatIsoDateToDisplay(iso));
                            setBirthDateView(new Date(date.getFullYear(), date.getMonth(), 1));
                            setIsBirthDatePickerOpen(false);
                          }}
                          className="h-9 rounded-md text-sm"
                          style={{
                            fontFamily: "var(--font-poppins)",
                            background: selected ? "#C8A24D" : todayCell ? "rgba(200,162,77,0.2)" : "transparent",
                            color: selected ? "#111" : currentMonth ? "#F5E6C8" : "#8E8E8E",
                            border: selected ? "1px solid #C8A24D" : "1px solid transparent",
                            opacity: disabled ? 0.35 : 1,
                            cursor: disabled ? "not-allowed" : "pointer",
                          }}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        ) : null}
      </div>
      <p className="text-xs mt-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
        Bisa ketik manual format dd/mm/yyyy atau pilih dari kalender.
      </p>
    </div>
  );

  // Validasi + preview upload foto profil peserta.
  const handleProfilePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Foto profil harus berupa file gambar.");
      window.setTimeout(() => setErrorMessage(""), 2800);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Ukuran foto profil maksimal 5 MB.");
      window.setTimeout(() => setErrorMessage(""), 2800);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateFormField("profilePhoto", String(reader.result ?? ""));
      setErrorMessage("");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full">
      {/* Header halaman biodata + progress */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1
            style={{ fontFamily: "var(--font-cinzel)", color: "#C8A24D", fontSize: "1.5rem", fontWeight: 700 }}
          >
            Data Diri dan Biodata
          </h1>
          <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
            Lengkapi biodata Anda dengan benar dan lengkap.
          </p>
          {isSyncingBiodata ? (
            <p className="text-xs mt-1" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}>
              Menyinkronkan biodata dari backend...
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              Kelengkapan
            </p>
            <p className="text-lg font-bold" style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}>
              {completionProgress}%
            </p>
          </div>
          <div className="relative w-12 h-12">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(200,162,77,0.15)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="#C8A24D"
                strokeWidth="3"
                strokeDasharray={`${completionProgress * 0.974} 100`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.5s ease" }}
              />
            </svg>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveDraft} className="space-y-6">
        {/* Section data pribadi peserta */}
        <GoldCard glow>
          <h2
            className="text-sm font-bold mb-5 pb-3"
            style={{
              color: "#C8A24D",
              fontFamily: "var(--font-cinzel)",
              borderBottom: "1px solid rgba(200,162,77,0.15)",
            }}
          >
            DATA PRIBADI
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                className="block text-xs mb-1.5"
                style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
              >
                Foto Profil Peserta
              </label>
              <div
                className="rounded-xl p-3 flex items-center gap-3"
                style={{ background: "#111", border: "1px solid rgba(200,162,77,0.25)" }}
              >
                <NextImage
                  src={resolveParticipantPhotoUrl(form.profilePhoto) || "/default-avatar.svg"}
                  alt="Preview foto profil"
                  width={64}
                  height={64}
                  unoptimized
                  className="w-16 h-16 rounded-xl object-cover"
                  style={{ border: "1px solid rgba(200,162,77,0.35)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                    Upload foto close-up formal untuk profil dashboard.
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                    Format JPG/PNG, ukuran maksimal 5 MB.
                  </p>
                </div>
                <label
                  className="px-3 py-2 rounded-lg text-xs cursor-pointer inline-flex items-center gap-2"
                  style={{
                    background: "rgba(200,162,77,0.12)",
                    border: "1px solid rgba(200,162,77,0.28)",
                    color: "#C8A24D",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  <Upload size={12} />
                  Ganti Foto
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoChange} />
                </label>
              </div>
            </div>
            {renderInputField({
              label: "Nama Lengkap",
              name: "fullName",
              placeholder: "Sesuai KTP/Akta Lahir",
              required: true,
            })}
            <div>
              <label
                className="block text-xs mb-1.5"
                style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
              >
                Kategori <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={form.gender}
                onChange={(e) => updateFormField("gender", e.target.value as "Encik" | "Puan")}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={inputStyle}
                disabled={Boolean(participant)}
              >
                <option value="Encik">Encik (Pria)</option>
                <option value="Puan">Puan (Wanita)</option>
              </select>
              <p className="text-xs mt-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                Kategori ditentukan saat register dan tidak dapat diubah di biodata.
              </p>
            </div>
            {renderInputField({ label: "NIK", name: "nationalId", placeholder: "16 digit NIK", required: true })}
            {renderInputField({ label: "Tempat Lahir", name: "birthPlace", placeholder: "Batam", required: true })}
            {renderBirthDateField()}
            {renderInputField({
              label: "Tinggi Badan (cm)",
              name: "heightCm",
              type: "number",
              placeholder: "Contoh: 170",
              required: true,
              hint: `Min. Encik: 175 cm | Min. Puan: 165 cm (${form.gender === "Encik" ? "saat ini Encik" : "saat ini Puan"})`,
            })}
            <div className="sm:col-span-2">
              <label
                className="block text-xs mb-1.5"
                style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
              >
                Pendidikan Terakhir <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] mb-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                    Kategori Pendidikan
                  </p>
                  <select
                    value={form.educationCategory}
                    onChange={(e) => {
                      const category = e.target.value as "SMA" | "SMK" | "MA" | "Kuliah";
                      setForm((prev) => ({
                        ...prev,
                        educationCategory: category,
                        educationInstitution: "",
                        educationDegree: "",
                        educationMajor: "",
                      }));
                      setShowInstitutionDropdown(false);
                      setShowMajorDropdown(false);
                    }}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={inputStyle}
                  >
                    <option value="SMA">SMA</option>
                    <option value="SMK">SMK</option>
                    <option value="MA">MA / MAN (Sekolah Agama)</option>
                    <option value="Kuliah">Kuliah</option>
                  </select>
                </div>
                <div className="relative" ref={institutionRef}>
                  <p className="text-[11px] mb-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                    Instansi (Sekolah/Kampus/Perguruan Tinggi)
                  </p>
                  <input
                    type="text"
                    value={form.educationInstitution}
                    onChange={(e) => {
                      updateFormField("educationInstitution", e.target.value);
                      setShowInstitutionDropdown(true);
                    }}
                    onFocus={(e) => {
                      setShowInstitutionDropdown(true);
                      e.target.style.borderColor = "rgba(200,162,77,0.6)";
                    }}
                    placeholder="Contoh: Politeknik Negeri Batam"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={inputStyle}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(200,162,77,0.25)")}
                  />
                  {showInstitutionDropdown ? (
                    <div
                      className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden z-30"
                      style={{
                        background: "#141414",
                        border: "1px solid rgba(200,162,77,0.25)",
                        maxHeight: 220,
                        overflowY: "auto",
                      }}
                    >
                      {filteredInstitutions.length > 0 ? (
                        filteredInstitutions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              updateFormField("educationInstitution", item);
                              setShowInstitutionDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-[#1f1f1f]"
                            style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                          >
                            {item}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Tidak ada hasil, tetap bisa ketik bebas.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
                {form.educationCategory === "Kuliah" ? (
                  <div>
                    <p className="text-[11px] mb-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                      Jenjang
                    </p>
                    <select
                      value={form.educationDegree}
                      onChange={(e) => updateFormField("educationDegree", e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                      style={inputStyle}
                    >
                      <option value="">Pilih jenjang</option>
                      {degreeOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div
                  className={`relative ${form.educationCategory === "Kuliah" ? "" : "sm:col-span-2"}`}
                  ref={majorRef}
                >
                  <p className="text-[11px] mb-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                    Jurusan
                  </p>
                  <input
                    type="text"
                    value={form.educationMajor}
                    onChange={(e) => {
                      updateFormField("educationMajor", e.target.value);
                      setShowMajorDropdown(true);
                    }}
                    onFocus={(e) => {
                      setShowMajorDropdown(true);
                      e.target.style.borderColor = "rgba(200,162,77,0.6)";
                    }}
                    placeholder="Contoh: Teknik Informatika"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={inputStyle}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(200,162,77,0.25)")}
                  />
                  {showMajorDropdown ? (
                    <div
                      className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden z-30"
                      style={{
                        background: "#141414",
                        border: "1px solid rgba(200,162,77,0.25)",
                        maxHeight: 220,
                        overflowY: "auto",
                      }}
                    >
                      {filteredMajors.length > 0 ? (
                        filteredMajors.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              updateFormField("educationMajor", item);
                              setShowMajorDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-[#1f1f1f]"
                            style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                          >
                            {item}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Tidak ada hasil, tetap bisa ketik bebas.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
              <p className="text-xs mt-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                Pilih dari list atau ketik bebas untuk instansi dan jurusan.
              </p>
            </div>
          </div>
        </GoldCard>

        {/* Section sosial media */}
        <GoldCard>
          <h2
            className="text-sm font-bold mb-5 pb-3"
            style={{
              color: "#C8A24D",
              fontFamily: "var(--font-cinzel)",
              borderBottom: "1px solid rgba(200,162,77,0.15)",
            }}
          >
            MEDIA SOSIAL
          </h2>
          <div className="space-y-4">
            {renderInputField({
              label: "Email Terdaftar",
              name: "email",
              placeholder: "Email terdaftar",
              required: true,
              readOnly: true,
              disabled: true,
              hint: "Email mengikuti data registrasi dan tidak dapat diubah di halaman biodata.",
            })}
          {renderInputField({
            label: "No. HP / WA",
            name: "phone",
            placeholder: "08xxxxxxxxxx",
            required: true,
            hint: "Masukkan nomor HP aktif yang dapat dihubungi panitia.",
          })}
            {renderInputField({
              label: "Link Instagram",
              name: "instagram",
              placeholder: "https://instagram.com/username",
              required: true,
              hint: "Masukkan link profil Instagram yang aktif dan tidak di-private sesuai ketentuan.",
            })}
          </div>
        </GoldCard>

        {/* Section visi, misi, pengalaman */}
        <GoldCard>
          <h2
            className="text-sm font-bold mb-5 pb-3"
            style={{
              color: "#C8A24D",
              fontFamily: "var(--font-cinzel)",
              borderBottom: "1px solid rgba(200,162,77,0.15)",
            }}
          >
            VISI, MISI, DAN PENGALAMAN
          </h2>
          <div className="space-y-4">
            {renderTextAreaField({
              label: "Visi",
              name: "vision",
              placeholder: "Tuliskan visi Anda sebagai Duta Wisata Kota Batam...",
              required: true,
              rows: 3,
            })}
            {renderTextAreaField({
              label: "Misi",
              name: "mission",
              placeholder: "Tuliskan misi-misi konkret yang akan Anda laksanakan...",
              required: true,
              rows: 4,
            })}
            {renderTextAreaField({
              label: "Pengalaman Organisasi dan Kepemudaan",
              name: "experience",
              placeholder: "Sebutkan pengalaman organisasi atau kegiatan pariwisata...",
              rows: 4,
            })}
          </div>
        </GoldCard>

        {/* Section pertanyaan tambahan untuk screening awal */}
        <GoldCard>
          <h2
            className="text-sm font-bold mb-5 pb-3"
            style={{
              color: "#C8A24D",
              fontFamily: "var(--font-cinzel)",
              borderBottom: "1px solid rgba(200,162,77,0.15)",
            }}
          >
            PERTANYAAN TAMBAHAN
          </h2>
          <div className="space-y-4">
            {renderYesNoField({
              label: "Apakah Anda saat ini terikat kontrak dengan agensi model?",
              name: "agreementNoAgency",
              required: true,
            })}
            {form.agreementNoAgency === "yes"
              ? renderInputField({
                  label: "Jika Ya, sebutkan nama agensi",
                  name: "agencyName",
                  placeholder: "Nama agensi model",
                })
              : null}

            {renderYesNoField({
              label:
                "Apakah Anda bersedia dan sudah mendapat izin orang tua/wali/sekolah/kampus/kantor untuk mengikuti seluruh rangkaian seleksi?",
              name: "agreementParentPermission",
              required: true,
            })}

            {renderYesNoField({
              label:
                "Jika menjadi finalis atau juara, apakah Anda bersedia mengikuti kegiatan skala lokal, nasional, maupun internasional?",
              name: "agreementAllStages",
              required: true,
            })}

            {renderTextAreaField({
              label: "Motivasi mengikuti Pemilihan Duta Wisata",
              name: "motivationStatement",
              placeholder: "Tuliskan alasan utama Anda mengikuti ajang ini...",
              required: true,
              rows: 3,
            })}

            {renderTextAreaField({
              label: "Rencana kontribusi untuk pariwisata Kota Batam",
              name: "contributionIdea",
              placeholder: "Tuliskan ide atau program nyata yang ingin Anda jalankan...",
              required: true,
              rows: 3,
            })}

            {renderTextAreaField({
              label: "Pengalaman public speaking / duta / modeling",
              name: "publicSpeakingExperience",
              placeholder: "Jelaskan pengalaman yang pernah Anda ikuti...",
              required: true,
              rows: 3,
            })}
          </div>
        </GoldCard>

        {/* Section informasi tambahan */}
        <GoldCard>
          <h2
            className="text-sm font-bold mb-5 pb-3"
            style={{
              color: "#C8A24D",
              fontFamily: "var(--font-cinzel)",
              borderBottom: "1px solid rgba(200,162,77,0.15)",
            }}
          >
            INFORMASI TAMBAHAN (OPSIONAL)
          </h2>
          <div className="space-y-4">
            {renderTextAreaField({
              label: "Prestasi dan Penghargaan",
              name: "achievement",
              placeholder: "Sebutkan prestasi, penghargaan, atau sertifikasi...",
              rows: 3,
            })}
            {renderInputField({
              label: "Link Video Perkenalan",
              name: "introVideoUrl",
              placeholder: "https://youtube.com/... atau https://drive.google.com/...",
              required: true,
              hint: "Video perkenalan maksimal 3 menit.",
            })}
          </div>
        </GoldCard>

        {/* Tombol aksi utama halaman biodata */}
        <div className="flex gap-3 flex-wrap">
          <GoldButton type="submit" variant="outline" size="md" disabled={isSavingBiodata}>
            <Save size={16} />
            {isSavingBiodata ? "Menyimpan..." : "Simpan Draft"}
          </GoldButton>
          <GoldButton variant="outline" size="md" onClick={() => router.push("/pages/participant/dashboard")}>
            Batal
          </GoldButton>
        </div>
      </form>

      {/* Toast sukses simpan draft */}
      {isSaved ? (
        <div
          className="fixed bottom-5 right-5 z-50 rounded-xl px-4 py-3 shadow-lg"
          style={{
            background: "rgba(17,17,17,0.95)",
            border: "1px solid rgba(34,197,94,0.5)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={16} style={{ color: "#22c55e" }} />
            <p className="text-sm" style={{ color: "#22c55e", fontFamily: "var(--font-poppins)" }}>
              Draft berhasil disimpan
            </p>
          </div>
        </div>
      ) : null}

      {/* Toast error validasi/input */}
      {errorMessage ? (
        <div
          className="fixed bottom-5 right-5 z-50 rounded-xl px-4 py-3 shadow-lg"
          style={{
            background: "rgba(17,17,17,0.95)",
            border: "1px solid rgba(239,68,68,0.55)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="flex items-center gap-2">
            <p className="text-sm" style={{ color: "#ef4444", fontFamily: "var(--font-poppins)" }}>
              {errorMessage}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

