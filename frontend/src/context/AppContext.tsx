"use client";

import React, {
  useEffect,
  useCallback,
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getParticipantSelectionStage,
  type Participant,
  type Judge,
  type NewsItem,
  type ScoreRecord, // Ã¢Å“â€¦ INI YANG BENAR (bukan Score)
  mockParticipants,
  mockJudges,
  mockNews,
  mockScores, // Ã¢Å“â€¦ ini harus ScoreRecord[]
} from "../data/mockData";
import { faqItems, type FAQItem } from "../data/faqData";
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

  scoreList: ScoreRecord[]; // Ã¢Å“â€¦ INI YANG BENAR
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

  judgeWinnerList: JudgeWinnerItem[];
  setJudgeWinnerList: React.Dispatch<React.SetStateAction<JudgeWinnerItem[]>>;
  judgeWinnersPublished: boolean;
  setJudgeWinnersPublished: React.Dispatch<React.SetStateAction<boolean>>;

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
    primaryButtonLabel: "✦ Daftar Sekarang",
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
const PARTICIPANT_RESOURCES_STORAGE_KEY = "duta-wisata-participant-resources";
const LANDING_PAGE_CONTENT_STORAGE_KEY = "duta-wisata-landing-page-content";

function readStoredJson<T>(key: string): T | null {
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

function buildVoteCandidates(participants: Participant[]): VotePublicCandidate[] {
  return participants
    .filter((participant) => {
      const selectionStage = getParticipantSelectionStage(participant);
      return selectionStage === "Grand Final" || selectionStage === "Final Result";
    })
    .map((participant) => {
      const instagram = normalizeInstagram(participant.instagram);
      return {
        id: `vc-${participant.id}`,
        participantId: participant.id,
        number: participant.number,
        name: participant.name,
        gender: participant.gender,
        education: participant.education,
        photo: participant.photo,
        instagramHandle: instagram.handle,
        instagramProfileUrl: instagram.profileUrl,
        instagramPostUrl: "",
        enabled: true,
      };
    });
}

function buildInitialVoteTop(candidates: VotePublicCandidate[], participants: Participant[]): VoteTopItem[] {
  const sorted = [...participants]
    .filter((participant) => {
      const selectionStage = getParticipantSelectionStage(participant);
      return selectionStage === "Grand Final" || selectionStage === "Final Result";
    })
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
    .slice(0, 3);

  return sorted.map((participant, index) => {
    const candidate = candidates.find((item) => item.participantId === participant.id);
    return {
      id: `vt-${index + 1}`,
      participantId: participant.id,
      number: participant.number,
      name: participant.name,
      gender: participant.gender,
      photo: candidate?.photo ?? participant.photo,
      instagramHandle: candidate?.instagramHandle ?? participant.instagram,
      instagramProfileUrl: candidate?.instagramProfileUrl ?? "",
      instagramPostUrl: candidate?.instagramPostUrl ?? "",
      voteCount: participant.likes ?? 0,
      rank: (index + 1) as 1 | 2 | 3,
    };
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
  const [authInitialized, setAuthInitialized] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const [participantList, setParticipantList] =
    useState<Participant[]>(mockParticipants);

  const [judgeList, setJudgeList] = useState<Judge[]>(mockJudges);

  const [newsList, setNewsList] = useState<NewsItem[]>(mockNews);

  // Ã¢Å“â€¦ mockScores itu array ScoreRecord, bukan Score
  const [scoreList, setScoreList] = useState<ScoreRecord[]>(mockScores);

  const [currentParticipant, setCurrentParticipant] =
    useState<Participant | null>(null);
  const [faqList, setFaqList] = useState<FAQItem[]>(faqItems);

  const [voteCandidateList, setVoteCandidateList] = useState<VotePublicCandidate[]>(
    () => buildVoteCandidates(mockParticipants)
  );
  const [voteTopList, setVoteTopList] = useState<VoteTopItem[]>(() =>
    buildInitialVoteTop(buildVoteCandidates(mockParticipants), mockParticipants)
  );
  const [voteTopPublished, setVoteTopPublished] = useState<boolean>(true);
  const [judgeWinnerList, setJudgeWinnerList] = useState<JudgeWinnerItem[]>([]);
  const [judgeWinnersPublished, setJudgeWinnersPublished] = useState<boolean>(false);
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

      if (storedNews) setNewsList(storedNews);
      if (storedFaq) setFaqList(storedFaq);
      if (storedParticipantResources) setParticipantResources(storedParticipantResources);
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
    if (!authInitialized || typeof window === "undefined") return;
    window.localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(newsList));
  }, [authInitialized, newsList]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    window.localStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(faqList));
  }, [authInitialized, faqList]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    window.localStorage.setItem(
      PARTICIPANT_RESOURCES_STORAGE_KEY,
      JSON.stringify(participantResources)
    );
  }, [authInitialized, participantResources]);

  useEffect(() => {
    if (!authInitialized || typeof window === "undefined") return;
    window.localStorage.setItem(
      LANDING_PAGE_CONTENT_STORAGE_KEY,
      JSON.stringify(landingPageContent)
    );
  }, [authInitialized, landingPageContent]);

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

      // Ã¢Å“â€¦ create demo participant session (HARUS sesuai type Participant)
      const newParticipant: Participant = {
        id: "P_DEMO",
        number: "-",
        name: "Demo Participant",

        gender: "Encik", // Ã¢Å“â€¦ HARUS "Encik" / "Puan", BUKAN "Male"

        nationalId: "",
        birthPlace: "",
        birthDate: "",
        heightCm: 0, // Ã¢Å“â€¦ field bener: heightCm (bukan height)
        education: "",
        instagram: "",
        phone: "",
        email: normalizedEmail,

        photo: "",

        status: "Pending",
        registeredAt: new Date().toISOString().slice(0, 10),

        scores: [], // Ã¢Å“â€¦ WAJIB ada (sesuai interface Participant)
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

      judgeWinnerList,
      setJudgeWinnerList,
      judgeWinnersPublished,
      setJudgeWinnersPublished,

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
      judgeWinnerList,
      judgeWinnersPublished,
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
