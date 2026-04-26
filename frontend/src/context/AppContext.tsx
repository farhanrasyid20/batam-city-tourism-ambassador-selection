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
  type ScoreRecord, // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ INI YANG BENAR (bukan Score)
} from "../data/mockData";
import { type FAQItem } from "../data/faqData";
import {
  fetchPublicFaqs,
  fetchPublicNews,
  fetchPublicFinalists,
  fetchPublicParticipantResources,
  fetchJudgeParticipants,
  submitFeedback,
  type FeedbackCategory as BackendFeedbackCategory,
  type FeedbackEntry as BackendFeedbackEntry,
  type ParticipantResourcesPayload,
  type PublicFinalistListItem,
  type JudgeParticipantListItem,
} from "../lib/auth-api";
import { resolveApiAssetUrl } from "../lib/api";
import {
  clearParticipantAuthSession,
  getParticipantAuthSession,
  getParticipantProfileSnapshot,
} from "../lib/auth-storage";

/**
 * Role autentikasi yang didukung oleh aplikasi.
 */
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

export type FeedbackCategory = BackendFeedbackCategory;

export type FeedbackEntry = BackendFeedbackEntry;

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

/**
 * Kontrak data dan aksi yang diekspos melalui React Context aplikasi.
 */
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

  scoreList: ScoreRecord[]; // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ INI YANG BENAR
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
  }) => Promise<void>;

  participantResources: ParticipantResources;
  setParticipantResources: React.Dispatch<React.SetStateAction<ParticipantResources>>;

  landingPageContent: LandingPageContent;
  setLandingPageContent: React.Dispatch<React.SetStateAction<LandingPageContent>>;
};

/**
 * Context utama aplikasi untuk state lintas halaman (auth, peserta, konten publik, voting, dan resources).
 */
const AppContext = createContext<AppContextType | null>(null);

/**
 * Template kosong dokumen resources peserta.
 */
const emptyResourceDocument: ResourceDocument = {
  linkUrl: "",
  fileName: "",
  fileDataUrl: "",
  fileMimeType: "",
};

/**
 * Template kosong gambar resources peserta.
 */
const emptyResourceImage: ResourceImage = {
  imageUrl: "",
  imageName: "",
  caption: "",
};

/**
 * Nilai default resources peserta saat belum ada data dari backend/storage.
 */
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

/**
 * Konten default landing page yang dipakai sebagai fallback awal.
 */
const defaultLandingPageContent: LandingPageContent = {
  hero: {
    organizerLabel: "Dinas Kebudayaan & Pariwisata Kota Batam",
    titleLine1: "PEMILIHAN DUTA WISATA",
    titleLine2: "ENCIK & PUAN",
    titleLine3: "KOTA BATAM 2026",
    description:
      "Platform digital resmi pemilihan Encik & Puan Duta Wisata Kota Batam 2026. Daftarkan diri Anda dan jadilah representasi terbaik Kota Batam!",
    primaryButtonLabel: "Daftar Sekarang",
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

function normalizeParticipantResourceAssetUrl(value?: string | null): string {
  const normalized = (value ?? "").trim();
  if (!normalized) return "";
  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }
  if (normalized.startsWith("/storage/") || normalized.startsWith("storage/")) {
    return resolveApiAssetUrl(normalized) ?? normalized;
  }
  return normalized;
}

function normalizeResourceDocumentForUi(document: ResourceDocument): ResourceDocument {
  return {
    ...document,
    linkUrl: normalizeParticipantResourceAssetUrl(document.linkUrl),
    fileDataUrl: normalizeParticipantResourceAssetUrl(document.fileDataUrl),
  };
}

function normalizeResourceImageForUi(image: ResourceImage): ResourceImage {
  return {
    ...image,
    imageUrl: normalizeParticipantResourceAssetUrl(image.imageUrl),
  };
}

function normalizeParticipantResourcesForUi(resources: ParticipantResources): ParticipantResources {
  return {
    ...resources,
    guideDocument: normalizeResourceDocumentForUi(resources.guideDocument),
    submissionDocument: normalizeResourceDocumentForUi(resources.submissionDocument),
    formS1Document: normalizeResourceDocumentForUi(resources.formS1Document),
    formS2Document: normalizeResourceDocumentForUi(resources.formS2Document),
    formS3Document: normalizeResourceDocumentForUi(resources.formS3Document),
    formS4Document: normalizeResourceDocumentForUi(resources.formS4Document),
    twibbonDocument: normalizeResourceDocumentForUi(resources.twibbonDocument),
    twibbonThumbnail: normalizeResourceImageForUi(resources.twibbonThumbnail),
    whatsappThumbnail: normalizeResourceImageForUi(resources.whatsappThumbnail),
    closeUpExamples: resources.closeUpExamples.map(normalizeResourceImageForUi),
    fullBodyExamples: resources.fullBodyExamples.map(normalizeResourceImageForUi),
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

function mapJudgeParticipantToParticipant(item: JudgeParticipantListItem): Participant {
  const normalizeOptionalString = (value: string | number | null | undefined): string | undefined => {
    if (value === null || value === undefined) return undefined;
    const normalized = String(value).trim();
    return normalized === "" ? undefined : normalized;
  };

  const education = [
    item.education_category?.trim(),
    item.education_institution?.trim(),
    item.education_degree?.trim(),
    item.education_major?.trim(),
  ]
    .filter(Boolean)
    .join(" - ");

  const selectionStatus = (item.selection_status ?? "Pending") as
    | "Pending"
    | "Verified"
    | "TechnicalMeeting"
    | "Rejected"
    | "Audition"
    | "Top20"
    | "PreCamp"
    | "Camp"
    | "GrandFinal"
    | "Winner";

  const verificationStatus =
    selectionStatus === "Rejected"
      ? "Rejected"
      : [
          "Verified",
          "TechnicalMeeting",
          "Audition",
          "Top20",
          "PreCamp",
          "Camp",
          "GrandFinal",
          "Winner",
        ].includes(selectionStatus)
        ? "Verified"
        : "Pending";

  const number =
    item.participant_code?.trim() ||
    item.audition_number?.trim() ||
    item.participant_number?.trim() ||
    `P-${item.id}`;

  return {
    id: `P_API_${item.id}`,
    number,
    auditionNumber: item.audition_number ?? undefined,
    participantCode: item.participant_code ?? undefined,
    name: item.name ?? "Peserta",
    nickname: item.nickname ?? undefined,
    fullName: item.name ?? undefined,
    religion: item.religion ?? undefined,
    gender: (item.gender ?? "Encik") as "Encik" | "Puan",
    nationalId: item.national_id ?? "",
    currentStatus: item.current_status ?? undefined,
    birthPlace: item.birth_place ?? "",
    birthDate: item.birth_date ?? "",
    domicileAddress: item.domicile_address ?? undefined,
    ktpAddress: item.ktp_address ?? undefined,
    heightCm: typeof item.height_cm === "number" ? item.height_cm : Number(item.height_cm ?? 0),
    weightKg: normalizeOptionalString(item.weight_kg),
    shirtSize: item.shirt_size ?? undefined,
    chestCircumferenceCm: normalizeOptionalString(item.chest_circumference_cm),
    waistCircumferenceCm: normalizeOptionalString(item.waist_circumference_cm),
    hipCircumferenceCm: normalizeOptionalString(item.hip_circumference_cm),
    pantsSize: item.pants_size ?? undefined,
    shoeSize: item.shoe_size ?? undefined,
    education: education || "-",
    instagram: item.instagram ?? "",
    tiktok: item.tiktok ?? undefined,
    parentPhone: item.parent_phone ?? undefined,
    fatherName: item.father_name ?? undefined,
    motherName: item.mother_name ?? undefined,
    phone: item.phone ?? "",
    email: item.email ?? "",
    occupation: item.occupation ?? undefined,
    skills: item.skills ?? undefined,
    hobbies: item.hobbies ?? undefined,
    languages: item.languages ?? undefined,
    vision: item.vision ?? undefined,
    mission: item.mission ?? undefined,
    experience: item.experience ?? undefined,
    achievement: item.achievement ?? undefined,
    agreementNoAgency: item.agreement_no_agency ?? undefined,
    agencyName: item.agency_name ?? undefined,
    agreementParentPermission: item.agreement_parent_permission ?? undefined,
    agreementAllStages: item.agreement_all_stages ?? undefined,
    motivationStatement: item.motivation_statement ?? undefined,
    contributionIdea: item.contribution_idea ?? undefined,
    publicSpeakingExperience: item.public_speaking_experience ?? undefined,
    photo: item.photo ?? "",
    status: selectionStatus,
    verificationStatus,
    selectionStage: item.selection_stage ?? undefined,
    adminVerificationNote: item.selection_status_note ?? undefined,
    documents:
      item.documents?.map((doc) => ({
        key: doc.key,
        label: doc.label,
        status: doc.status ?? "missing",
        note: doc.note ?? undefined,
        url: doc.url ?? undefined,
        originalName: doc.original_name ?? undefined,
      })) ?? [],
    submittedToAdmin: Boolean(item.submitted_to_admin),
    eliminatedInAudition: Boolean(item.eliminated_in_audition),
    registeredAt: item.registered_at ?? new Date().toISOString().slice(0, 10),
    scores: [],
  };
}

/**
 * Provider global aplikasi.
 * Bertanggung jawab menginisialisasi state runtime,
 * memuat data publik dari backend, serta menyediakan aksi mutasi ke seluruh komponen.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const tabIdRef = useRef("");
  const jurySyncChannelRef = useRef<BroadcastChannel | null>(null);
  const applyingRemoteJurySyncRef = useRef(false);

  const [authInitialized, setAuthInitialized] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const [participantList, setParticipantList] = useState<Participant[]>([]);

  const [judgeList, setJudgeList] = useState<Judge[]>([]);

  const [newsList, setNewsList] = useState<NewsItem[]>([]);

  // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ mockScores itu array ScoreRecord, bukan Score
  const [scoreList, setScoreList] = useState<ScoreRecord[]>([]);

  const [currentParticipant, setCurrentParticipant] =
    useState<Participant | null>(null);
  const [faqList, setFaqList] = useState<FAQItem[]>([]);

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
      const bootstrap = getStoredParticipantBootstrap([]);
      setUser(bootstrap.user);
      setCurrentParticipant(bootstrap.participant);

      setAuthInitialized(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPublicNews = async () => {
      try {
        const response = await fetchPublicNews();
        if (cancelled) return;
        setNewsList(response.data);
      } catch {
        setNewsList([]);
      }
    };

    const loadPublicFaqs = async () => {
      try {
        const response = await fetchPublicFaqs();
        if (cancelled) return;
        setFaqList(response.data);
      } catch {
        // keep fallback FAQ from local data when backend is unavailable
      }
    };

    void loadPublicNews();
    void loadPublicFaqs();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authInitialized) return;
    const session = getParticipantAuthSession();
    const role = session?.user?.role ?? user?.role;
    if (!session?.token) return;
    if (role !== "admin" && role !== "super_admin" && role !== "judge") return;

    let cancelled = false;
    const loadParticipants = async () => {
      try {
        const response = await fetchJudgeParticipants(session.token, { force: true, maxAgeMs: 0 });
        if (cancelled) return;
        const mapped = response.data.map(mapJudgeParticipantToParticipant);
        if (mapped.length) {
          setParticipantList(mapped);
        }
      } catch {
        // fallback to existing participantList
      }
    };

    void loadParticipants();
    const intervalId = window.setInterval(() => {
      void loadParticipants();
    }, 15000);
    const handleWindowFocus = () => {
      void loadParticipants();
    };
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [authInitialized, user?.role]);

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
          setParticipantResources(
            normalizeParticipantResourcesForUi(
              response.data as ParticipantResourcesPayload as ParticipantResources
            )
          );
        }
      } catch {
        // fallback ke default in-memory
      }
    };

    void syncPublicFinalists();
    void syncParticipantResources();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const setPasswordForEmail = useCallback((_email: string, _password: string) => {
    void _email;
    void _password;
  }, []);

  const requestPasswordReset = useCallback((_email: string): boolean => {
    void _email;
    return false;
  }, []);

  const resetPasswordWithOtp = useCallback(
    (_email: string, _otp: string, _newPassword: string): boolean => {
      void _email;
      void _otp;
      void _newPassword;
      return false;
    },
    []
  );

  const changePassword = useCallback(
    (_email: string, _currentPassword: string, _newPassword: string): boolean => {
      void _email;
      void _currentPassword;
      void _newPassword;
      return false;
    },
    []
  );

  const login = useCallback((_email: string, _password: string, _role: Role): boolean => {
    void _email;
    void _password;
    void _role;
    return false;
  }, []);

  const setAuthenticatedUser = useCallback((nextUser: AuthUser | null) => {
    setUser((prev) => {
      if (!prev && !nextUser) return prev;

      if (
        prev &&
        nextUser &&
        prev.id === nextUser.id &&
        prev.name === nextUser.name &&
        prev.email === nextUser.email &&
        prev.role === nextUser.role
      ) {
        return prev;
      }

      return nextUser;
    });

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
    async (payload: { name: string; email: string; category: FeedbackCategory; message: string }) => {
      const response = await submitFeedback({
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        category: payload.category,
        message: payload.message.trim(),
      });

      setFeedbackList((prev) => [response.data, ...prev.filter((item) => item.id !== response.data.id)]);
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

/**
 * Hook helper untuk mengakses AppContext secara aman.
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}


