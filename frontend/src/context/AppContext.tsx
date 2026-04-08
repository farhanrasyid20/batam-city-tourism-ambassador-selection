"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  type Participant,
  type Judge,
  type NewsItem,
  type ScoreRecord, // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ INI YANG BENAR (bukan Score)
  mockParticipants,
  mockNews,
} from "../data/mockData";
import { faqItems, type FAQItem } from "../data/faqData";
import {
  fetchPublicFinalists,
  fetchPublicParticipantResources,
  type ParticipantResourcesPayload,
  type PublicFinalistListItem,
} from "../lib/auth-api";
import { resolveApiAssetUrl } from "../lib/api";
import {
  clearParticipantAuthSession,
  getParticipantAuthSession,
  getParticipantProfileSnapshot,
} from "../lib/auth-storage";

export type Role = "participant" | "admin" | "judge" | "super_admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  participantId?: string;
  judgeId?: string;
};

export type VotePublicCandidate = {
  id: string;
  participantId: string;
  number: string;
  name: string;
  gender: "Encik" | "Puan";
  education: string;
  photo: string;
  instagramHandle: string;
  instagramProfileUrl: string;
  instagramPostUrl: string;
  officialLikeCount: number;
  likeUpdatedAt: string | null;
  enabled: boolean;
};

export type VoteTopItem = {
  id: string;
  participantId: string;
  number: string;
  name: string;
  gender: "Encik" | "Puan";
  photo: string;
  instagramHandle: string;
  instagramProfileUrl: string;
  instagramPostUrl: string;
  voteCount: number;
  rank: 1 | 2 | 3;
};

export type JudgeWinnerItem = {
  id: string;
  participantId: string;
  number: string;
  name: string;
  gender: "Encik" | "Puan";
  photo: string;
  instagramHandle: string;
  totalScore: number;
  rank: 1 | 2 | 3;
};

export type JudgePairRankingItem = {
  rank: 1 | 2 | 3;
  encikParticipantId: string;
  puanParticipantId: string;
};

export type JudgeWinnerDisplayMode = "name_only" | "name_with_score";

export type FeedbackCategory = "Saran" | "Kritik" | "Pertanyaan" | "Lainnya";

export type FeedbackEntry = {
  id: string;
  name: string;
  email: string;
  category: FeedbackCategory;
  message: string;
  createdAt: string;
  status: "baru" | "ditinjau" | "selesai";
};

export type ResourceDocument = {
  linkUrl: string;
  fileName: string;
  fileDataUrl: string;
  fileMimeType: string;
};

export type ResourceImage = {
  imageUrl: string;
  imageName: string;
  caption: string;
};

export type ParticipantResources = {
  guideDocument: ResourceDocument;
  submissionDocument: ResourceDocument;
  formS1Document: ResourceDocument;
  formS2Document: ResourceDocument;
  formS3Document: ResourceDocument;
  formS4Document: ResourceDocument;
  hardcopyGuide: string;
  closeUpPhotoGuide: string;
  fullBodyPhotoGuide: string;
  twibbonDocument: ResourceDocument;
  twibbonOpenLink: string;
  whatsappGroupLink: string;
  twibbonThumbnail: ResourceImage;
  whatsappThumbnail: ResourceImage;
  closeUpExamples: ResourceImage[];
  fullBodyExamples: ResourceImage[];
  instagramMentions: string;
  hashtagList: string;
  postingInstruction: string;
  additionalNote: string;
};

export type LandingScheduleItem = {
  id: string;
  activity: string;
  date: string;
};

export type LandingPageContent = {
  hero: {
    organizerLabel: string;
    titleLine1: string;
    titleLine2: string;
    titleLine3: string;
    description: string;
    primaryButtonLabel: string;
    secondaryButtonLabel: string;
  };
  about: {
    sectionLabel: string;
    sectionTitle: string;
    aboutCardTitle: string;
    aboutCardDescription: string;
    visionMissionCardTitle: string;
    visionText: string;
    missionItems: string[];
  };
  registration: {
    sectionLabel: string;
    sectionTitle: string;
    stepsTitle: string;
    steps: string[];
    registerButtonLabel: string;
    scheduleTitle: string;
    scheduleItems: LandingScheduleItem[];
  };
};

type AppContextType = {
  authInitialized: boolean;
  user: AuthUser | null;
  login: (email: string, password: string, role: Role) => boolean;
  setAuthenticatedUser: (user: AuthUser | null) => void;
  logout: () => void;
  setPasswordForEmail: (email: string, password: string) => void;
  requestPasswordReset: (email: string) => boolean;
  resetPasswordWithOtp: (email: string, _otp: string, newPassword: string) => boolean;
  changePassword: (email: string, currentPassword: string, newPassword: string) => boolean;

  participantList: Participant[];
  setParticipantList: React.Dispatch<React.SetStateAction<Participant[]>>;

  judgeList: Judge[];
  setJudgeList: React.Dispatch<React.SetStateAction<Judge[]>>;

  newsList: NewsItem[];
  setNewsList: React.Dispatch<React.SetStateAction<NewsItem[]>>;

  scoreList: ScoreRecord[]; // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ INI YANG BENAR
  setScoreList: React.Dispatch<React.SetStateAction<ScoreRecord[]>>;

  currentParticipant: Participant | null;
  setCurrentParticipant: React.Dispatch<
    React.SetStateAction<Participant | null>
  >;

  faqList: FAQItem[];
  setFaqList: React.Dispatch<React.SetStateAction<FAQItem[]>>;

  voteCandidateList: VotePublicCandidate[];
  setVoteCandidateList: React.Dispatch<React.SetStateAction<VotePublicCandidate[]>>;

  voteTopList: VoteTopItem[];
  setVoteTopList: React.Dispatch<React.SetStateAction<VoteTopItem[]>>;
  voteTopPublished: boolean;
  setVoteTopPublished: React.Dispatch<React.SetStateAction<boolean>>;
  voteRankingPublished: boolean;
  setVoteRankingPublished: React.Dispatch<React.SetStateAction<boolean>>;

  judgeWinnerList: JudgeWinnerItem[];
  setJudgeWinnerList: React.Dispatch<React.SetStateAction<JudgeWinnerItem[]>>;
  judgeEncikWinnerList: JudgeWinnerItem[];
  setJudgeEncikWinnerList: React.Dispatch<React.SetStateAction<JudgeWinnerItem[]>>;
  judgePuanWinnerList: JudgeWinnerItem[];
  setJudgePuanWinnerList: React.Dispatch<React.SetStateAction<JudgeWinnerItem[]>>;
  judgePairRankingList: JudgePairRankingItem[];
  setJudgePairRankingList: React.Dispatch<React.SetStateAction<JudgePairRankingItem[]>>;
  judgeEncikPublished: boolean;
  setJudgeEncikPublished: React.Dispatch<React.SetStateAction<boolean>>;
  judgePuanPublished: boolean;
  setJudgePuanPublished: React.Dispatch<React.SetStateAction<boolean>>;
  judgePairPublished: boolean;
  setJudgePairPublished: React.Dispatch<React.SetStateAction<boolean>>;
  judgeEncikDisplayMode: JudgeWinnerDisplayMode;
  setJudgeEncikDisplayMode: React.Dispatch<React.SetStateAction<JudgeWinnerDisplayMode>>;
  judgePuanDisplayMode: JudgeWinnerDisplayMode;
  setJudgePuanDisplayMode: React.Dispatch<React.SetStateAction<JudgeWinnerDisplayMode>>;
  // Legacy aggregate controls (kept for compatibility with older code paths).
  judgeWinnersPublished: boolean;
  setJudgeWinnersPublished: React.Dispatch<React.SetStateAction<boolean>>;
  judgeWinnerDisplayMode: JudgeWinnerDisplayMode;
  setJudgeWinnerDisplayMode: React.Dispatch<React.SetStateAction<JudgeWinnerDisplayMode>>;

  feedbackList: FeedbackEntry[];
  setFeedbackList: React.Dispatch<React.SetStateAction<FeedbackEntry[]>>;
  addFeedbackEntry: (payload: {
    name: string;
    email: string;
    category: FeedbackCategory;
    message: string;
  }) => void;

  participantResources: ParticipantResources;
  setParticipantResources: React.Dispatch<React.SetStateAction<ParticipantResources>>;

  landingPageContent: LandingPageContent;
  setLandingPageContent: React.Dispatch<React.SetStateAction<LandingPageContent>>;
};

const AppContext = createContext<AppContextType | null>(null);

const emptyResourceDocument: ResourceDocument = {
  linkUrl: "",
  fileName: "",
  fileDataUrl: "",
  fileMimeType: "",
};

const emptyResourceImage: ResourceImage = {
  imageUrl: "",
  imageName: "",
  caption: "",
};

const defaultParticipantResources: ParticipantResources = {
  guideDocument: { ...emptyResourceDocument },
  submissionDocument: { ...emptyResourceDocument },
  formS1Document: { ...emptyResourceDocument },
  formS2Document: { ...emptyResourceDocument },
  formS3Document: { ...emptyResourceDocument },
  formS4Document: { ...emptyResourceDocument },
  hardcopyGuide: "",
  closeUpPhotoGuide: "",
  fullBodyPhotoGuide: "",
  twibbonDocument: { ...emptyResourceDocument },
  twibbonOpenLink: "",
  whatsappGroupLink: "",
  twibbonThumbnail: { ...emptyResourceImage, caption: "Thumbnail Twibbon" },
  whatsappThumbnail: { ...emptyResourceImage, caption: "Thumbnail Grup WhatsApp" },
  closeUpExamples: [],
  fullBodyExamples: [],
  instagramMentions: "@dutawisatakotabatam, @batamtourism.official",
  hashtagList: "#encikpuanbatam\n#dutawisatakotabatam\n#pemilihandutawisatakotabatam2026",
  postingInstruction:
    "Wajib posting twibbon di Instagram dan mention akun resmi yang telah ditentukan oleh panitia.",
  additionalNote: "",
};

const defaultLandingPageContent: LandingPageContent = {
  hero: {
    organizerLabel: "Dinas Kebudayaan & Pariwisata Kota Batam",
    titleLine1: "PEMILIHAN DUTA WISATA",
    titleLine2: "ENCIK & PUAN",
    titleLine3: "KOTA BATAM 2026",
    description:
      "Platform digital resmi pemilihan Encik & Puan Duta Wisata Kota Batam 2026. Daftarkan diri Anda dan jadilah representasi terbaik Kota Batam!",
    primaryButtonLabel: "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Daftar Sekarang",
    secondaryButtonLabel: "Login Peserta",
  },
  about: {
    sectionLabel: "Tentang Program",
    sectionTitle: "ENCIK & PUAN DUTA WISATA BATAM",
    aboutCardTitle: "Tentang Program",
    aboutCardDescription:
      "Encik & Puan Duta Wisata Kota Batam adalah program tahunan yang diselenggarakan oleh Dinas Kebudayaan dan Pariwisata Kota Batam untuk menjaring generasi muda terbaik sebagai representasi dan promotor pariwisata Batam.",
    visionMissionCardTitle: "Visi & Misi",
    visionText:
      "Mewujudkan generasi muda Batam sebagai duta pariwisata yang unggul, berkarakter, dan berdaya saing.",
    missionItems: [
      "Mempromosikan destinasi wisata Batam ke tingkat nasional dan internasional.",
      "Menumbuhkan generasi muda yang aktif, inspiratif, dan peduli terhadap potensi daerah.",
    ],
  },
  registration: {
    sectionLabel: "Pendaftaran",
    sectionTitle: "TATA CARA PENDAFTARAN",
    stepsTitle: "Langkah Pendaftaran",
    steps: ["Buat akun peserta", "Lengkapi biodata", "Unggah berkas", "Submit pendaftaran"],
    registerButtonLabel: "Daftar Sekarang",
    scheduleTitle: "Jadwal Penting",
    scheduleItems: [
      { id: "schedule-1", activity: "Pendaftaran Online", date: "1 Mei - 31 Mei 2026" },
      { id: "schedule-2", activity: "Seleksi Administrasi", date: "2 Juni - 5 Juni 2026" },
      { id: "schedule-3", activity: "Pengumuman Finalis", date: "10 Juni 2026" },
      { id: "schedule-4", activity: "Grand Final", date: "27 Juni 2026" },
    ],
  },
};

const NEWS_STORAGE_KEY = "duta-wisata-news-list";
const FAQ_STORAGE_KEY = "duta-wisata-faq-list";
const PARTICIPANT_LIST_STORAGE_KEY = "duta-wisata-participant-list";
const PARTICIPANT_RESOURCES_STORAGE_KEY = "duta-wisata-participant-resources";
const LANDING_PAGE_CONTENT_STORAGE_KEY = "duta-wisata-landing-page-content";
const VOTE_CANDIDATE_LIST_STORAGE_KEY = "duta-wisata-vote-candidate-list";
const VOTE_TOP_LIST_STORAGE_KEY = "duta-wisata-vote-top-list";
const VOTE_TOP_PUBLISHED_STORAGE_KEY = "duta-wisata-vote-top-published";
const VOTE_RANKING_PUBLISHED_STORAGE_KEY = "duta-wisata-vote-ranking-published";
const JUDGE_ENCIK_WINNERS_STORAGE_KEY = "duta-wisata-judge-encik-winners";
const JUDGE_PUAN_WINNERS_STORAGE_KEY = "duta-wisata-judge-puan-winners";
const JUDGE_PAIR_RANKING_STORAGE_KEY = "duta-wisata-judge-pair-ranking";
const JUDGE_ENCIK_PUBLISHED_STORAGE_KEY = "duta-wisata-judge-encik-published";
const JUDGE_PUAN_PUBLISHED_STORAGE_KEY = "duta-wisata-judge-puan-published";
const JUDGE_PAIR_PUBLISHED_STORAGE_KEY = "duta-wisata-judge-pair-published";
const JUDGE_ENCIK_DISPLAY_MODE_STORAGE_KEY = "duta-wisata-judge-encik-display-mode";
const JUDGE_PUAN_DISPLAY_MODE_STORAGE_KEY = "duta-wisata-judge-puan-display-mode";
const JUDGE_WINNERS_PUBLISHED_STORAGE_KEY = "duta-wisata-judge-winners-published";
const JUDGE_WINNERS_DISPLAY_MODE_STORAGE_KEY = "duta-wisata-judge-winners-display-mode";

const storageFallbackMemory = new Map<string, unknown>();

function readStoredJson<T>(key: string): T | null {
  if (storageFallbackMemory.has(key)) {
    return storageFallbackMemory.get(key) as T;
  }

  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function normalizeInstagram(raw: string) {
  const value = raw.trim();
  if (!value) {
    return {
      handle: "",
      profileUrl: "",
      originalValue: "",
    };
  }

  const normalizedValue = value.replace(/^https?:\/\/www\./i, "https://");
  const isUrl = /^https?:\/\//i.test(normalizedValue);

  if (isUrl) {
    const withoutQuery = normalizedValue.split("?")[0].replace(/\/+$/, "");
    const handleSegment = withoutQuery.split("/").filter(Boolean).pop() ?? "";
    const handle = handleSegment.replace("@", "").trim();

    return {
      handle: handle ? `@${handle}` : "",
      profileUrl: normalizedValue,
      originalValue: value,
    };
  }

  const handle = value.replace("@", "").trim();

  return {
    handle: handle ? `@${handle}` : "",
    profileUrl: handle ? `https://instagram.com/${handle}` : "",
    originalValue: value,
  };
}

function isQuotaExceededError(error: unknown) {
  if (!(error instanceof DOMException)) return false;
  return (
    error.code === 22 ||
    error.code === 1014 ||
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED"
  );
}

function setStoredJsonSafely(key: string, value: unknown) {
  storageFallbackMemory.set(key, value);

  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Prevent runtime crash when storage quota is exceeded.
    // Do not remove existing key value, to avoid losing published/status flags.
    if (isQuotaExceededError(error)) return;
  }
}

function stripInlineImage(value?: string | null) {
  const normalized = value?.trim() ?? "";
  if (!normalized) return "/default-avatar.svg";
  if (normalized.startsWith("data:image")) return "/default-avatar.svg";
  return normalized;
}

function compactVoteCandidatesForStorage(list: VotePublicCandidate[]) {
  return list.map((item) => ({
    ...item,
    photo: stripInlineImage(item.photo),
  }));
}

function compactVoteTopForStorage(list: VoteTopItem[]) {
  return list.map((item) => ({
    ...item,
    photo: stripInlineImage(item.photo),
  }));
}

function compactJudgeWinnersForStorage(list: JudgeWinnerItem[]) {
  return list.map((item) => ({
    ...item,
    photo: stripInlineImage(item.photo),
  }));
}

function compactResourceDocumentForStorage(document: ResourceDocument): ResourceDocument {
  return {
    ...document,
    // Avoid quota issues from large inline base64 in localStorage.
    fileDataUrl: document.fileDataUrl?.startsWith("data:") ? "" : document.fileDataUrl,
  };
}

function compactResourceImageForStorage(image: ResourceImage): ResourceImage {
  return {
    ...image,
    imageUrl: stripInlineImage(image.imageUrl),
  };
}

function compactParticipantResourcesForStorage(resources: ParticipantResources): ParticipantResources {
  return {
    ...resources,
    guideDocument: compactResourceDocumentForStorage(resources.guideDocument),
    submissionDocument: compactResourceDocumentForStorage(resources.submissionDocument),
    formS1Document: compactResourceDocumentForStorage(resources.formS1Document),
    formS2Document: compactResourceDocumentForStorage(resources.formS2Document),
    formS3Document: compactResourceDocumentForStorage(resources.formS3Document),
    formS4Document: compactResourceDocumentForStorage(resources.formS4Document),
    twibbonDocument: compactResourceDocumentForStorage(resources.twibbonDocument),
    twibbonThumbnail: compactResourceImageForStorage(resources.twibbonThumbnail),
    whatsappThumbnail: compactResourceImageForStorage(resources.whatsappThumbnail),
    closeUpExamples: resources.closeUpExamples.map(compactResourceImageForStorage),
    fullBodyExamples: resources.fullBodyExamples.map(compactResourceImageForStorage),
  };
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function buildVoteDisplayName(gender: "Encik" | "Puan", rawName: string) {
  const normalized = rawName.trim().replace(/^(encik|puan)\s+/i, "");
  const nickname = toTitleCase((normalized.split(/\s+/)[0] ?? "").trim());
  const finalName = nickname || toTitleCase(normalized) || "Peserta";
  return `${gender} ${finalName}`.trim();
}

function normalizeVoteDisplayCode(
  rawCode: string | null | undefined,
  gender: "Encik" | "Puan",
  fallbackParticipantId?: string
) {
  const clean = (rawCode ?? "").trim().toUpperCase();
  const matched = clean.match(/^(ECK|PUA)-(\d{1,4})$/i);

  let value = matched ? Number.parseInt(matched[2], 10) : NaN;
  if (!Number.isFinite(value)) {
    const fallbackDigits = (fallbackParticipantId ?? "").match(/(\d{1,4})$/)?.[1] ?? "1";
    value = Number.parseInt(fallbackDigits, 10);
  }
  if (!Number.isFinite(value) || value < 1) value = 1;

  if (gender === "Encik" && value % 2 === 0) value = value > 1 ? value - 1 : 1;
  if (gender === "Puan" && value % 2 === 1) value += 1;

  const prefix = gender === "Encik" ? "ECK" : "PUA";
  return `${prefix}-${String(value).padStart(3, "0")}`;
}

function isVoteEligibleSelectionStage(stage: string) {
  return stage === "Top20" || stage === "PreCamp" || stage === "Camp" || stage === "GrandFinal" || stage === "Winner";
}

function normalizeVoteCandidatePhoto(raw?: string | null) {
  const value = raw?.trim();
  if (!value) return "/default-avatar.svg";

  // Keep frontend static assets as-is.
  if (
    value.startsWith("/vote-candidates/") ||
    value.startsWith("/storage/") ||
    value === "/default-avatar.svg"
  ) {
    return value;
  }

  // Keep backend/public absolute URLs as-is.
  if (value.startsWith("http://") || value.startsWith("https://")) {
    const defaultAvatarIndex = value.indexOf("/default-avatar.svg");
    if (defaultAvatarIndex >= 0) {
      return "/default-avatar.svg";
    }
    return value;
  }

  return resolveApiAssetUrl(value) ?? "/default-avatar.svg";
}

function buildVoteCandidatesFromPublicFinalists(
  finalists: PublicFinalistListItem[],
  previousCandidates: VotePublicCandidate[]
): VotePublicCandidate[] {
  const previousMap = new Map(previousCandidates.map((item) => [item.participantId, item] as const));
  const mappedFinalists = finalists
    .filter((item) => isVoteEligibleSelectionStage((item.selection_status ?? "").trim()))
    .map((item) => {
      const participantId = `P_API_${item.id}`;
      const normalizedGender = (item.gender ?? "Encik") as "Encik" | "Puan";
      const number = normalizeVoteDisplayCode(
        item.participant_code ?? item.audition_number ?? item.participant_number ?? "-",
        normalizedGender,
        participantId,
      );
      const instagram = normalizeInstagram(item.instagram ?? "");
      const education = [
        item.education_category?.trim(),
        item.education_institution?.trim(),
        item.education_degree?.trim(),
        item.education_major?.trim(),
      ]
        .filter(Boolean)
        .join(" - ");
      const previous = previousMap.get(participantId);

      return {
        id: previous?.id ?? `vc-${participantId}`,
        participantId,
        number,
        name: buildVoteDisplayName(normalizedGender, item.name ?? "Peserta"),
        gender: normalizedGender,
        education: education || "-",
        photo: normalizeVoteCandidatePhoto(item.photo),
        instagramHandle: instagram.handle,
        instagramProfileUrl:
          item.vote_instagram_profile_url?.trim() ||
          previous?.instagramProfileUrl ||
          instagram.profileUrl,
        instagramPostUrl:
          item.vote_instagram_post_url?.trim() ||
          previous?.instagramPostUrl ||
          "",
        officialLikeCount:
          typeof item.vote_official_like_count === "number"
            ? item.vote_official_like_count
            : previous?.officialLikeCount ?? 0,
        likeUpdatedAt: item.vote_like_updated_at ?? previous?.likeUpdatedAt ?? null,
        enabled:
          typeof item.vote_is_enabled === "boolean"
            ? item.vote_is_enabled
            : previous?.enabled ?? true,
      } satisfies VotePublicCandidate;
    });

  // Jangan bawa kandidat lama yang sudah tidak lolos di backend.
  // Sumber kebenaran vote harus daftar finalis dari API.
  const normalized = mappedFinalists.sort((a, b) => {
    const aNum = Number.parseInt(a.number.match(/(\d{1,4})$/)?.[1] ?? "9999", 10);
    const bNum = Number.parseInt(b.number.match(/(\d{1,4})$/)?.[1] ?? "9999", 10);
    return aNum - bNum;
  });

  // Failsafe: jika ada nomor bentrok dari data lama, resequence otomatis agar tetap ganjil/genap konsisten.
  const hasDuplicateNumbers =
    new Set(normalized.map((item) => item.number.toUpperCase())).size !== normalized.length;
  if (!hasDuplicateNumbers) return normalized;

  const resequence = (items: VotePublicCandidate[]) =>
    items
      .sort((a, b) => {
        const aNum = Number.parseInt(a.number.match(/(\d{1,4})$/)?.[1] ?? "9999", 10);
        const bNum = Number.parseInt(b.number.match(/(\d{1,4})$/)?.[1] ?? "9999", 10);
        if (aNum !== bNum) return aNum - bNum;
        return a.name.localeCompare(b.name);
      })
      .map((item, index) => {
        const rank = index + 1;
        const code =
          item.gender === "Encik"
            ? `ECK-${String((rank * 2) - 1).padStart(3, "0")}`
            : `PUA-${String(rank * 2).padStart(3, "0")}`;
        return { ...item, number: code };
      });

  const encik = resequence(normalized.filter((item) => item.gender === "Encik"));
  const puan = resequence(normalized.filter((item) => item.gender === "Puan"));
  return [...encik, ...puan].sort((a, b) => {
    const aNum = Number.parseInt(a.number.match(/(\d{1,4})$/)?.[1] ?? "9999", 10);
    const bNum = Number.parseInt(b.number.match(/(\d{1,4})$/)?.[1] ?? "9999", 10);
    return aNum - bNum;
  });
}

function getStoredParticipantBootstrap(participants: Participant[]) {
  const session = getParticipantAuthSession();
  if (!session?.user) {
    return {
      user: null as AuthUser | null,
      participant: null as Participant | null,
    };
  }

  const normalizedEmail = session.user.email.trim().toLowerCase();
  const sessionRole = (session.user.role ?? "participant").toLowerCase();

  if (sessionRole === "admin" || sessionRole === "super_admin" || sessionRole === "judge") {
    return {
      user: {
        id: String(session.user.id),
        name: session.user.name,
        email: normalizedEmail,
        role: sessionRole as Role,
      },
      participant: null as Participant | null,
    };
  }

  const matchedParticipant = participants.find(
    (item) => item.email.trim().toLowerCase() === normalizedEmail
  );
  const snapshot = getParticipantProfileSnapshot();
  const matchedSnapshot =
    snapshot && snapshot.email.trim().toLowerCase() === normalizedEmail ? snapshot : null;

  if (matchedParticipant) {
    return {
      user: {
        id: String(session.user.id),
        name: matchedSnapshot?.name ?? session.user.name,
        email: normalizedEmail,
        role: "participant" as const,
        participantId: matchedParticipant.id,
      },
      participant: {
        ...matchedParticipant,
        name: matchedSnapshot?.name ?? matchedParticipant.name,
        number: matchedSnapshot?.number ?? matchedParticipant.number,
        gender: matchedSnapshot?.gender ?? matchedParticipant.gender,
        phone: matchedSnapshot?.phone ?? matchedParticipant.phone,
        photo: matchedSnapshot?.photo ?? matchedParticipant.photo,
      },
    };
  }

  return {
    user: {
      id: String(session.user.id),
      name: matchedSnapshot?.name ?? session.user.name,
      email: normalizedEmail,
      role: "participant" as const,
      participantId: `P_API_${session.user.id}`,
    },
    participant: {
      id: `P_API_${session.user.id}`,
      number: matchedSnapshot?.number ?? "-",
      name: matchedSnapshot?.name ?? session.user.name,
      gender: matchedSnapshot?.gender ?? "Encik",
      nationalId: "",
      birthPlace: "",
      birthDate: "",
      heightCm: 0,
      education: "",
      instagram: "",
      phone: matchedSnapshot?.phone ?? session.user.phone ?? "",
      email: normalizedEmail,
      photo: matchedSnapshot?.photo ?? "",
      status: "Pending",
      registeredAt: new Date().toISOString().slice(0, 10),
      scores: [],
      submittedToAdmin: false,
    } satisfies Participant,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const tabIdRef = useRef("");
  const jurySyncChannelRef = useRef<BroadcastChannel | null>(null);
  const applyingRemoteJurySyncRef = useRef(false);

  const [authInitialized, setAuthInitialized] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const [participantList, setParticipantList] = useState<Participant[]>([]);

  const [judgeList, setJudgeList] = useState<Judge[]>([]);

  const [newsList, setNewsList] = useState<NewsItem[]>(mockNews);

  // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ mockScores itu array ScoreRecord, bukan Score
  const [scoreList, setScoreList] = useState<ScoreRecord[]>([]);

  const [currentParticipant, setCurrentParticipant] =
    useState<Participant | null>(null);
  const [faqList, setFaqList] = useState<FAQItem[]>(faqItems);

  const [voteCandidateList, setVoteCandidateList] = useState<VotePublicCandidate[]>([]);
  const [voteTopList, setVoteTopList] = useState<VoteTopItem[]>([]);
  const [voteTopPublished, setVoteTopPublished] = useState<boolean>(true);
  const [voteRankingPublished, setVoteRankingPublished] = useState<boolean>(true);
  const [judgeWinnerList, setJudgeWinnerList] = useState<JudgeWinnerItem[]>([]);
  const [judgeEncikWinnerList, setJudgeEncikWinnerList] = useState<JudgeWinnerItem[]>([]);
  const [judgePuanWinnerList, setJudgePuanWinnerList] = useState<JudgeWinnerItem[]>([]);
  const [judgePairRankingList, setJudgePairRankingList] = useState<JudgePairRankingItem[]>([]);
  const [judgeEncikPublished, setJudgeEncikPublished] = useState<boolean>(false);
  const [judgePuanPublished, setJudgePuanPublished] = useState<boolean>(false);
  const [judgePairPublished, setJudgePairPublished] = useState<boolean>(false);
  const [judgeEncikDisplayMode, setJudgeEncikDisplayMode] =
    useState<JudgeWinnerDisplayMode>("name_with_score");
  const [judgePuanDisplayMode, setJudgePuanDisplayMode] =
    useState<JudgeWinnerDisplayMode>("name_with_score");
  // Legacy aggregate settings
  const [judgeWinnersPublished, setJudgeWinnersPublished] = useState<boolean>(false);
  const [judgeWinnerDisplayMode, setJudgeWinnerDisplayMode] =
    useState<JudgeWinnerDisplayMode>("name_with_score");
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [participantResources, setParticipantResources] =
    useState<ParticipantResources>(defaultParticipantResources);
  const [landingPageContent, setLandingPageContent] =
    useState<LandingPageContent>(defaultLandingPageContent);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const bootstrap = getStoredParticipantBootstrap(mockParticipants);
      setUser(bootstrap.user);
      setCurrentParticipant(bootstrap.participant);

      const storedNews = readStoredJson<NewsItem[]>(NEWS_STORAGE_KEY);
      const storedFaq = readStoredJson<FAQItem[]>(FAQ_STORAGE_KEY);
      const storedParticipantResources = readStoredJson<ParticipantResources>(PARTICIPANT_RESOURCES_STORAGE_KEY);
      const storedLandingPageContent = readStoredJson<LandingPageContent>(LANDING_PAGE_CONTENT_STORAGE_KEY);
      const storedVoteTopPublished = readStoredJson<boolean>(VOTE_TOP_PUBLISHED_STORAGE_KEY);
      const storedVoteRankingPublished = readStoredJson<boolean>(VOTE_RANKING_PUBLISHED_STORAGE_KEY);
      const storedJudgeEncikWinnerList = readStoredJson<JudgeWinnerItem[]>(JUDGE_ENCIK_WINNERS_STORAGE_KEY);
      const storedJudgePuanWinnerList = readStoredJson<JudgeWinnerItem[]>(JUDGE_PUAN_WINNERS_STORAGE_KEY);
      const storedJudgePairRankingList = readStoredJson<JudgePairRankingItem[]>(JUDGE_PAIR_RANKING_STORAGE_KEY);
      const storedJudgeEncikPublished = readStoredJson<boolean>(JUDGE_ENCIK_PUBLISHED_STORAGE_KEY);
      const storedJudgePuanPublished = readStoredJson<boolean>(JUDGE_PUAN_PUBLISHED_STORAGE_KEY);
      const storedJudgePairPublished = readStoredJson<boolean>(JUDGE_PAIR_PUBLISHED_STORAGE_KEY);
      const storedJudgeEncikDisplayMode = readStoredJson<JudgeWinnerDisplayMode>(JUDGE_ENCIK_DISPLAY_MODE_STORAGE_KEY);
      const storedJudgePuanDisplayMode = readStoredJson<JudgeWinnerDisplayMode>(JUDGE_PUAN_DISPLAY_MODE_STORAGE_KEY);
      const storedJudgeWinnersPublished = readStoredJson<boolean>(JUDGE_WINNERS_PUBLISHED_STORAGE_KEY);
      const storedJudgeWinnersDisplayMode =
        readStoredJson<JudgeWinnerDisplayMode>(JUDGE_WINNERS_DISPLAY_MODE_STORAGE_KEY);

      if (storedNews) setNewsList(storedNews);
      if (storedFaq) setFaqList(storedFaq);
      if (storedParticipantResources) setParticipantResources(storedParticipantResources);
      if (typeof storedVoteTopPublished === "boolean") setVoteTopPublished(storedVoteTopPublished);
      if (typeof storedVoteRankingPublished === "boolean") setVoteRankingPublished(storedVoteRankingPublished);
      if (storedJudgeEncikWinnerList?.length) setJudgeEncikWinnerList(storedJudgeEncikWinnerList);
      if (storedJudgePuanWinnerList?.length) setJudgePuanWinnerList(storedJudgePuanWinnerList);
      if (storedJudgePairRankingList?.length) setJudgePairRankingList(storedJudgePairRankingList);
      if (typeof storedJudgeEncikPublished === "boolean") setJudgeEncikPublished(storedJudgeEncikPublished);
      if (typeof storedJudgePuanPublished === "boolean") setJudgePuanPublished(storedJudgePuanPublished);
      if (typeof storedJudgePairPublished === "boolean") setJudgePairPublished(storedJudgePairPublished);
      if (typeof storedJudgeWinnersPublished === "boolean") setJudgeWinnersPublished(storedJudgeWinnersPublished);
      if (
        storedJudgeEncikDisplayMode === "name_only" ||
        storedJudgeEncikDisplayMode === "name_with_score"
      ) {
        setJudgeEncikDisplayMode(storedJudgeEncikDisplayMode);
      }
      if (
        storedJudgePuanDisplayMode === "name_only" ||
        storedJudgePuanDisplayMode === "name_with_score"
      ) {
        setJudgePuanDisplayMode(storedJudgePuanDisplayMode);
      }
      if (
        storedJudgeWinnersDisplayMode === "name_only" ||
        storedJudgeWinnersDisplayMode === "name_with_score"
      ) {
        setJudgeWinnerDisplayMode(storedJudgeWinnersDisplayMode);
      }

      // Backward compatibility: when old aggregate publish/mode exists and new keys are absent.
      if (
        typeof storedJudgeWinnersPublished === "boolean" &&
        typeof storedJudgeEncikPublished !== "boolean" &&
        typeof storedJudgePuanPublished !== "boolean" &&
        typeof storedJudgePairPublished !== "boolean"
      ) {
        setJudgeEncikPublished(storedJudgeWinnersPublished);
        setJudgePuanPublished(storedJudgeWinnersPublished);
        setJudgePairPublished(storedJudgeWinnersPublished);
      }
      if (
        (storedJudgeWinnersDisplayMode === "name_only" || storedJudgeWinnersDisplayMode === "name_with_score") &&
        storedJudgeEncikDisplayMode !== "name_only" &&
        storedJudgeEncikDisplayMode !== "name_with_score" &&
        storedJudgePuanDisplayMode !== "name_only" &&
        storedJudgePuanDisplayMode !== "name_with_score"
      ) {
        setJudgeEncikDisplayMode(storedJudgeWinnersDisplayMode);
        setJudgePuanDisplayMode(storedJudgeWinnersDisplayMode);
      }
      if (storedLandingPageContent) {
        setLandingPageContent({
          ...defaultLandingPageContent,
          ...storedLandingPageContent,
          hero: {
            ...defaultLandingPageContent.hero,
            ...storedLandingPageContent.hero,
          },
          about: {
            ...defaultLandingPageContent.about,
            ...storedLandingPageContent.about,
            missionItems:
              storedLandingPageContent.about?.missionItems?.length
                ? storedLandingPageContent.about.missionItems
                : defaultLandingPageContent.about.missionItems,
          },
          registration: {
            ...defaultLandingPageContent.registration,
            ...storedLandingPageContent.registration,
            steps:
              storedLandingPageContent.registration?.steps?.length
                ? storedLandingPageContent.registration.steps
                : defaultLandingPageContent.registration.steps,
            scheduleItems:
              storedLandingPageContent.registration?.scheduleItems?.length
                ? storedLandingPageContent.registration.scheduleItems
                : defaultLandingPageContent.registration.scheduleItems,
          },
        });
      }

      setAuthInitialized(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncPublicFinalists = async () => {
      try {
        const response = await fetchPublicFinalists({ force: true, maxAgeMs: 0 });
        if (cancelled) return;

        setVoteCandidateList((prev) => {
          const mapped = buildVoteCandidatesFromPublicFinalists(response.data, prev);
          return mapped.length > 0 ? mapped : prev;
        });
        if (typeof response.vote_top_published === "boolean") {
          setVoteTopPublished(response.vote_top_published);
        }
        if (typeof response.vote_ranking_published === "boolean") {
          setVoteRankingPublished(response.vote_ranking_published);
        }
        if (typeof response.judge_encik_published === "boolean") {
          setJudgeEncikPublished(response.judge_encik_published);
        }
        if (typeof response.judge_puan_published === "boolean") {
          setJudgePuanPublished(response.judge_puan_published);
        }
        if (typeof response.judge_pair_published === "boolean") {
          setJudgePairPublished(response.judge_pair_published);
        }
        if (
          response.judge_encik_display_mode === "name_only" ||
          response.judge_encik_display_mode === "name_with_score"
        ) {
          setJudgeEncikDisplayMode(response.judge_encik_display_mode);
        }
        if (
          response.judge_puan_display_mode === "name_only" ||
          response.judge_puan_display_mode === "name_with_score"
        ) {
          setJudgePuanDisplayMode(response.judge_puan_display_mode);
        }
        if (Array.isArray(response.judge_encik_winners)) {
          setJudgeEncikWinnerList(response.judge_encik_winners as JudgeWinnerItem[]);
        }
        if (Array.isArray(response.judge_puan_winners)) {
          setJudgePuanWinnerList(response.judge_puan_winners as JudgeWinnerItem[]);
        }
        if (Array.isArray(response.judge_pair_rankings)) {
          setJudgePairRankingList(response.judge_pair_rankings as JudgePairRankingItem[]);
        }
      } catch {
        // fallback to local/mock data
      }
    };

    const syncParticipantResources = async () => {
      try {
        const response = await fetchPublicParticipantResources();
        if (cancelled) return;
        if (response?.data) {
          setParticipantResources(response.data as ParticipantResourcesPayload as ParticipantResources);
        }
      } catch {
        // fallback to local storage / defaults
      }
    };

    void syncPublicFinalists();
    void syncParticipantResources();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;

    const syncJuryPublishSettings = () => {
      const storedJudgeEncikWinnerList = readStoredJson<JudgeWinnerItem[]>(JUDGE_ENCIK_WINNERS_STORAGE_KEY);
      const storedJudgePuanWinnerList = readStoredJson<JudgeWinnerItem[]>(JUDGE_PUAN_WINNERS_STORAGE_KEY);
      const storedJudgePairRankingList = readStoredJson<JudgePairRankingItem[]>(JUDGE_PAIR_RANKING_STORAGE_KEY);
      const storedEncikPublished = readStoredJson<boolean>(JUDGE_ENCIK_PUBLISHED_STORAGE_KEY);
      const storedPuanPublished = readStoredJson<boolean>(JUDGE_PUAN_PUBLISHED_STORAGE_KEY);
      const storedPairPublished = readStoredJson<boolean>(JUDGE_PAIR_PUBLISHED_STORAGE_KEY);
      const storedEncikDisplayMode = readStoredJson<JudgeWinnerDisplayMode>(JUDGE_ENCIK_DISPLAY_MODE_STORAGE_KEY);
      const storedPuanDisplayMode = readStoredJson<JudgeWinnerDisplayMode>(JUDGE_PUAN_DISPLAY_MODE_STORAGE_KEY);
      const storedJudgeWinnersPublished = readStoredJson<boolean>(JUDGE_WINNERS_PUBLISHED_STORAGE_KEY);
      const storedJudgeWinnersDisplayMode = readStoredJson<JudgeWinnerDisplayMode>(JUDGE_WINNERS_DISPLAY_MODE_STORAGE_KEY);

      if (Array.isArray(storedJudgeEncikWinnerList)) setJudgeEncikWinnerList(storedJudgeEncikWinnerList);
      if (Array.isArray(storedJudgePuanWinnerList)) setJudgePuanWinnerList(storedJudgePuanWinnerList);
      if (Array.isArray(storedJudgePairRankingList)) setJudgePairRankingList(storedJudgePairRankingList);

      if (typeof storedEncikPublished === "boolean") setJudgeEncikPublished(storedEncikPublished);
      if (typeof storedPuanPublished === "boolean") setJudgePuanPublished(storedPuanPublished);
      if (typeof storedPairPublished === "boolean") setJudgePairPublished(storedPairPublished);
      if (typeof storedJudgeWinnersPublished === "boolean") setJudgeWinnersPublished(storedJudgeWinnersPublished);

      if (storedEncikDisplayMode === "name_only" || storedEncikDisplayMode === "name_with_score") {
        setJudgeEncikDisplayMode(storedEncikDisplayMode);
      }
      if (storedPuanDisplayMode === "name_only" || storedPuanDisplayMode === "name_with_score") {
        setJudgePuanDisplayMode(storedPuanDisplayMode);
      }
      if (
        storedJudgeWinnersDisplayMode === "name_only" ||
        storedJudgeWinnersDisplayMode === "name_with_score"
      ) {
        setJudgeWinnerDisplayMode(storedJudgeWinnersDisplayMode);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (
        event.key === JUDGE_ENCIK_WINNERS_STORAGE_KEY ||
        event.key === JUDGE_PUAN_WINNERS_STORAGE_KEY ||
        event.key === JUDGE_PAIR_RANKING_STORAGE_KEY ||
        event.key === JUDGE_ENCIK_PUBLISHED_STORAGE_KEY ||
        event.key === JUDGE_PUAN_PUBLISHED_STORAGE_KEY ||
        event.key === JUDGE_PAIR_PUBLISHED_STORAGE_KEY ||
        event.key === JUDGE_ENCIK_DISPLAY_MODE_STORAGE_KEY ||
        event.key === JUDGE_PUAN_DISPLAY_MODE_STORAGE_KEY ||
        event.key === JUDGE_WINNERS_PUBLISHED_STORAGE_KEY ||
        event.key === JUDGE_WINNERS_DISPLAY_MODE_STORAGE_KEY
      ) {
        syncJuryPublishSettings();
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [authInitialized]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!tabIdRef.current) {
      tabIdRef.current =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : "jury-tab";
    }
    if (typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel("duta-wisata-jury-sync");
    jurySyncChannelRef.current = channel;

    channel.onmessage = (event: MessageEvent) => {
      const message = event.data as
        | {
            type?: string;
            source?: string;
            payload?: {
              judgeEncikWinnerList?: JudgeWinnerItem[];
              judgePuanWinnerList?: JudgeWinnerItem[];
              judgePairRankingList?: JudgePairRankingItem[];
              judgeEncikPublished?: boolean;
              judgePuanPublished?: boolean;
              judgePairPublished?: boolean;
              judgeEncikDisplayMode?: JudgeWinnerDisplayMode;
              judgePuanDisplayMode?: JudgeWinnerDisplayMode;
              judgeWinnersPublished?: boolean;
              judgeWinnerDisplayMode?: JudgeWinnerDisplayMode;
            };
          }
        | undefined;

      if (!message || message.type !== "jury-sync") return;
      if (message.source === tabIdRef.current) return;
      const payload = message.payload;
      if (!payload) return;

      applyingRemoteJurySyncRef.current = true;
      if (Array.isArray(payload.judgeEncikWinnerList)) setJudgeEncikWinnerList(payload.judgeEncikWinnerList);
      if (Array.isArray(payload.judgePuanWinnerList)) setJudgePuanWinnerList(payload.judgePuanWinnerList);
      if (Array.isArray(payload.judgePairRankingList)) setJudgePairRankingList(payload.judgePairRankingList);
      if (typeof payload.judgeEncikPublished === "boolean") setJudgeEncikPublished(payload.judgeEncikPublished);
      if (typeof payload.judgePuanPublished === "boolean") setJudgePuanPublished(payload.judgePuanPublished);
      if (typeof payload.judgePairPublished === "boolean") setJudgePairPublished(payload.judgePairPublished);
      if (payload.judgeEncikDisplayMode === "name_only" || payload.judgeEncikDisplayMode === "name_with_score") {
        setJudgeEncikDisplayMode(payload.judgeEncikDisplayMode);
      }
      if (payload.judgePuanDisplayMode === "name_only" || payload.judgePuanDisplayMode === "name_with_score") {
        setJudgePuanDisplayMode(payload.judgePuanDisplayMode);
      }
      if (typeof payload.judgeWinnersPublished === "boolean") setJudgeWinnersPublished(payload.judgeWinnersPublished);
      if (payload.judgeWinnerDisplayMode === "name_only" || payload.judgeWinnerDisplayMode === "name_with_score") {
        setJudgeWinnerDisplayMode(payload.judgeWinnerDisplayMode);
      }

      window.requestAnimationFrame(() => {
        applyingRemoteJurySyncRef.current = false;
      });
    };

    return () => {
      channel.close();
      if (jurySyncChannelRef.current === channel) {
        jurySyncChannelRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(NEWS_STORAGE_KEY, newsList);
  }, [authInitialized, newsList]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(FAQ_STORAGE_KEY, faqList);
  }, [authInitialized, faqList]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(PARTICIPANT_LIST_STORAGE_KEY, participantList);
  }, [authInitialized, participantList]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(
      PARTICIPANT_RESOURCES_STORAGE_KEY,
      compactParticipantResourcesForStorage(participantResources)
    );
  }, [authInitialized, participantResources]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(LANDING_PAGE_CONTENT_STORAGE_KEY, landingPageContent);
  }, [authInitialized, landingPageContent]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(
      VOTE_CANDIDATE_LIST_STORAGE_KEY,
      compactVoteCandidatesForStorage(voteCandidateList)
    );
  }, [authInitialized, voteCandidateList]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(VOTE_TOP_LIST_STORAGE_KEY, compactVoteTopForStorage(voteTopList));
  }, [authInitialized, voteTopList]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(VOTE_TOP_PUBLISHED_STORAGE_KEY, voteTopPublished);
  }, [authInitialized, voteTopPublished]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(VOTE_RANKING_PUBLISHED_STORAGE_KEY, voteRankingPublished);
  }, [authInitialized, voteRankingPublished]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(
      JUDGE_ENCIK_WINNERS_STORAGE_KEY,
      compactJudgeWinnersForStorage(judgeEncikWinnerList)
    );
  }, [authInitialized, judgeEncikWinnerList]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(
      JUDGE_PUAN_WINNERS_STORAGE_KEY,
      compactJudgeWinnersForStorage(judgePuanWinnerList)
    );
  }, [authInitialized, judgePuanWinnerList]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(JUDGE_PAIR_RANKING_STORAGE_KEY, judgePairRankingList);
  }, [authInitialized, judgePairRankingList]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(JUDGE_ENCIK_PUBLISHED_STORAGE_KEY, judgeEncikPublished);
  }, [authInitialized, judgeEncikPublished]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(JUDGE_PUAN_PUBLISHED_STORAGE_KEY, judgePuanPublished);
  }, [authInitialized, judgePuanPublished]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(JUDGE_PAIR_PUBLISHED_STORAGE_KEY, judgePairPublished);
  }, [authInitialized, judgePairPublished]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(JUDGE_ENCIK_DISPLAY_MODE_STORAGE_KEY, judgeEncikDisplayMode);
  }, [authInitialized, judgeEncikDisplayMode]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    setStoredJsonSafely(JUDGE_PUAN_DISPLAY_MODE_STORAGE_KEY, judgePuanDisplayMode);
  }, [authInitialized, judgePuanDisplayMode]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    const aggregatePublished =
      judgeWinnersPublished || judgeEncikPublished || judgePuanPublished || judgePairPublished;
    setStoredJsonSafely(JUDGE_WINNERS_PUBLISHED_STORAGE_KEY, aggregatePublished);
  }, [authInitialized, judgeWinnersPublished, judgeEncikPublished, judgePuanPublished, judgePairPublished]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    const aggregateDisplayMode: JudgeWinnerDisplayMode =
      judgeWinnerDisplayMode ||
      (judgeEncikDisplayMode === "name_with_score" || judgePuanDisplayMode === "name_with_score"
        ? "name_with_score"
        : "name_only");
    setStoredJsonSafely(JUDGE_WINNERS_DISPLAY_MODE_STORAGE_KEY, aggregateDisplayMode);
  }, [authInitialized, judgeWinnerDisplayMode, judgeEncikDisplayMode, judgePuanDisplayMode]);

  useEffect(() => {
    if (!authInitialized) return;
    if (applyingRemoteJurySyncRef.current) return;
    const channel = jurySyncChannelRef.current;
    if (!channel) return;

    channel.postMessage({
      type: "jury-sync",
      source: tabIdRef.current,
      payload: {
        judgeEncikWinnerList,
        judgePuanWinnerList,
        judgePairRankingList,
        judgeEncikPublished,
        judgePuanPublished,
        judgePairPublished,
        judgeEncikDisplayMode,
        judgePuanDisplayMode,
        judgeWinnersPublished,
        judgeWinnerDisplayMode,
      },
    });
  }, [
    authInitialized,
    judgeEncikWinnerList,
    judgePuanWinnerList,
    judgePairRankingList,
    judgeEncikPublished,
    judgePuanPublished,
    judgePairPublished,
    judgeEncikDisplayMode,
    judgePuanDisplayMode,
    judgeWinnersPublished,
    judgeWinnerDisplayMode,
  ]);

  const [passwordStore, setPasswordStore] = useState<Record<string, string>>({
    "admin@dutawisatabatam.id": "admin123",
    "juri1@dutawisatabatam.id": "demo123",
    "ahmadrizky@email.com": "demo123",
  });

  const getDefaultPasswordByRole = useCallback((role: Role) => {
    if (role === "super_admin") return "SuperAdmin123!";
    if (role === "admin") return "admin123";
    return "demo123";
  }, []);

  const resolveStoredPassword = useCallback(
    (email: string, role: Role) => {
      return passwordStore[email] ?? getDefaultPasswordByRole(role);
    },
    [passwordStore, getDefaultPasswordByRole]
  );

  const setPasswordForEmail = useCallback((email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;
    setPasswordStore((prev) => ({ ...prev, [normalized]: password }));
  }, []);

  const requestPasswordReset = useCallback((email: string): boolean => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;

    const emailKnown =
      Boolean(participantList.find((p) => p.email.toLowerCase() === normalized)) ||
      Boolean(judgeList.find((j) => (j.email ?? "").toLowerCase() === normalized)) ||
      normalized === "admin@dutawisatabatam.id" ||
      Boolean(passwordStore[normalized]);

    return emailKnown;
  }, [participantList, judgeList, passwordStore]);

  const resetPasswordWithOtp = useCallback((email: string, _otp: string, newPassword: string): boolean => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || newPassword.length < 8) return false;
    setPasswordStore((prev) => ({ ...prev, [normalized]: newPassword }));
    return true;
  }, []);

  const changePassword = useCallback(
    (email: string, currentPassword: string, newPassword: string): boolean => {
      const normalized = email.trim().toLowerCase();
      if (!normalized || newPassword.length < 8) return false;

      const knownRole = normalized === "admin@dutawisatabatam.id"
        ? "admin"
        : judgeList.some((j) => (j.email ?? "").toLowerCase() === normalized)
        ? "judge"
        : "participant";
      const activePassword = resolveStoredPassword(normalized, knownRole);
      if (activePassword !== currentPassword) return false;

      setPasswordStore((prev) => ({ ...prev, [normalized]: newPassword }));
      return true;
    },
    [judgeList, resolveStoredPassword]
  );

  const login = useCallback((email: string, password: string, role: Role): boolean => {
    const normalizedEmail = email.trim().toLowerCase();
    const activePassword = resolveStoredPassword(normalizedEmail, role);
    if (activePassword !== password) {
      return false;
    }

    if (role === "super_admin") {
      setUser({ id: "superadmin001", name: "Super Administrator", email: normalizedEmail, role: "super_admin" });
      return true;
    }

    // ADMIN (demo)
    if (role === "admin") {
      setUser({ id: "admin001", name: "Administrator", email: normalizedEmail, role: "admin" });
      return true;
    }

    // JUDGE (demo)
    if (role === "judge") {
      const judge = judgeList.find((j) => (j.email ?? "").toLowerCase() === normalizedEmail);

      if (judge) {
        setUser({
          id: judge.id,
          name: judge.name,
          email: normalizedEmail,
          role: "judge",
          judgeId: judge.id,
        });
        return true;
      }

      // fallback demo
      setUser({
        id: "J001",
        name: "Judge Demo",
        email: normalizedEmail,
        role: "judge",
        judgeId: "J001",
      });
      return true;
    }

    // PARTICIPANT (demo)
    if (role === "participant") {
      const participant = participantList.find((p) => p.email.toLowerCase() === normalizedEmail);

      if (participant) {
        setUser({
          id: participant.id,
          name: participant.name,
          email: normalizedEmail,
          role: "participant",
          participantId: participant.id,
        });
        setCurrentParticipant(participant);
        return true;
      }

      // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ create demo participant session (HARUS sesuai type Participant)
      const newParticipant: Participant = {
        id: "P_DEMO",
        number: "-",
        name: "Demo Participant",

        gender: "Encik", // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ HARUS "Encik" / "Puan", BUKAN "Male"

        nationalId: "",
        birthPlace: "",
        birthDate: "",
        heightCm: 0, // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ field bener: heightCm (bukan height)
        education: "",
        instagram: "",
        phone: "",
        email: normalizedEmail,

        photo: "",

        status: "Pending",
        registeredAt: new Date().toISOString().slice(0, 10),

        scores: [], // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ WAJIB ada (sesuai interface Participant)
      };

      setUser({
        id: newParticipant.id,
        name: newParticipant.name,
        email: normalizedEmail,
        role: "participant",
        participantId: newParticipant.id,
      });

      setCurrentParticipant(newParticipant);

      // optional: kalau mau muncul di admin list
      // setParticipantList((prev) => [newParticipant, ...prev]);

      return true;
    }

    return false;
  }, [resolveStoredPassword, judgeList, participantList]);

  const setAuthenticatedUser = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    if (!nextUser || nextUser.role !== "participant") {
      setCurrentParticipant(null);
    }
  }, []);

  const logout = useCallback(() => {
    clearParticipantAuthSession();
    setUser(null);
    setCurrentParticipant(null);
  }, []);

  const addFeedbackEntry = useCallback(
    (payload: { name: string; email: string; category: FeedbackCategory; message: string }) => {
      const newItem: FeedbackEntry = {
        id: `fb-${Date.now()}`,
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        category: payload.category,
        message: payload.message.trim(),
        createdAt: new Date().toISOString(),
        status: "baru",
      };
      setFeedbackList((prev) => [newItem, ...prev]);
    },
    []
  );

  const value = useMemo<AppContextType>(
    () => ({
      authInitialized,
      user,
      login,
      setAuthenticatedUser,
      logout,
      setPasswordForEmail,
      requestPasswordReset,
      resetPasswordWithOtp,
      changePassword,

      participantList,
      setParticipantList,

      judgeList,
      setJudgeList,

      newsList,
      setNewsList,

      scoreList,
      setScoreList,

      currentParticipant,
      setCurrentParticipant,

      faqList,
      setFaqList,

      voteCandidateList,
      setVoteCandidateList,

      voteTopList,
      setVoteTopList,
      voteTopPublished,
      setVoteTopPublished,
      voteRankingPublished,
      setVoteRankingPublished,

      judgeWinnerList,
      setJudgeWinnerList,
      judgeEncikWinnerList,
      setJudgeEncikWinnerList,
      judgePuanWinnerList,
      setJudgePuanWinnerList,
      judgePairRankingList,
      setJudgePairRankingList,
      judgeEncikPublished,
      setJudgeEncikPublished,
      judgePuanPublished,
      setJudgePuanPublished,
      judgePairPublished,
      setJudgePairPublished,
      judgeEncikDisplayMode,
      setJudgeEncikDisplayMode,
      judgePuanDisplayMode,
      setJudgePuanDisplayMode,
      judgeWinnersPublished,
      setJudgeWinnersPublished,
      judgeWinnerDisplayMode,
      setJudgeWinnerDisplayMode,

      feedbackList,
      setFeedbackList,
      addFeedbackEntry,

      participantResources,
      setParticipantResources,

      landingPageContent,
      setLandingPageContent,
    }),
    [
      authInitialized,
      user,
      login,
      setAuthenticatedUser,
      logout,
      setPasswordForEmail,
      requestPasswordReset,
      resetPasswordWithOtp,
      changePassword,
      participantList,
      judgeList,
      setJudgeList,
      newsList,
      scoreList,
      currentParticipant,
      faqList,
      voteCandidateList,
      voteTopList,
      voteTopPublished,
      voteRankingPublished,
      judgeWinnerList,
      judgeEncikWinnerList,
      judgePuanWinnerList,
      judgePairRankingList,
      judgeEncikPublished,
      judgePuanPublished,
      judgePairPublished,
      judgeEncikDisplayMode,
      judgePuanDisplayMode,
      judgeWinnersPublished,
      judgeWinnerDisplayMode,
      feedbackList,
      addFeedbackEntry,
      participantResources,
      landingPageContent,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

