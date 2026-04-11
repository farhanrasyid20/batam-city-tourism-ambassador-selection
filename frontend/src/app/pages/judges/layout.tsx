"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Star } from "lucide-react";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { useApp } from "../../../context/AppContext";
import { fetchAuthenticatedParticipant, fetchJudgeParticipants } from "../../../lib/auth-api";
import { resolveAvatarUrl, resolveApiAssetUrl } from "../../../lib/api";
import { getParticipantAuthSession } from "../../../lib/auth-storage";
import type { JudgeAssignedStageKey, JudgeType, Participant } from "../../../data/mockData";

const judgeNavItems = [
  { label: "Dashboard", href: "/pages/judges/dashboard", icon: <LayoutDashboard size={16} /> },
  { label: "Input Penilaian", href: "/pages/judges/scoring", icon: <Star size={16} /> },
];

/**
 * Layout area judges.
 * Menjaga akses hanya untuk role juri dan melakukan sinkronisasi data juri/peserta dari backend.
 */
export default function JudgePagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, authInitialized, setJudgeList, setParticipantList, setAuthenticatedUser } = useApp();
  const router = useRouter();
  const hasUser = Boolean(user);
  const userRole = user?.role;
  const userId = user?.id;
  const userName = user?.name;
  const userEmail = user?.email;
  const userJudgeId = user?.judgeId;

  useEffect(() => {
    if (!authInitialized) return;

    if (!hasUser) {
      router.replace("/auth/login");
      return;
    }

    if (userRole !== "judge") {
      router.replace("/");
    }
  }, [router, hasUser, userRole, authInitialized]);

  useEffect(() => {
    if (!authInitialized || !hasUser || !userId || userRole !== "judge") return;

    const token = getParticipantAuthSession()?.token;
    if (!token) return;

    let cancelled = false;

    const syncJudge = async () => {
      try {
        const response = await fetchAuthenticatedParticipant(token);
        if (cancelled) return;

        const payload = response.user;
        if ((payload.role ?? "").toLowerCase() !== "judge") {
          setAuthenticatedUser(null);
          router.replace("/auth/login");
          return;
        }

        const assignedStages = (payload.judge_assigned_stages?.length
          ? payload.judge_assigned_stages
          : ["Audition", "Pre Camp", "Camp", "Grand Final"]) as JudgeAssignedStageKey[];

        const judgeId = `J_API_${payload.id}`;
        const nextTitle = payload.judge_title || "Dewan Juri";
        const nextOrganization = payload.judge_organization || "Duta Wisata Kota Batam";
        const nextAvatar = resolveAvatarUrl(payload.judge_avatar) || "/default-avatar.svg";

        const hasSameStages = (left: JudgeAssignedStageKey[], right: JudgeAssignedStageKey[]) =>
          left.length === right.length && left.every((value, index) => value === right[index]);

        setJudgeList((prev) => {
          const currentJudge = prev.find((item) => item.id === judgeId);
          const isUnchanged =
            currentJudge &&
            currentJudge.name === payload.name &&
            currentJudge.email === payload.email &&
            currentJudge.title === nextTitle &&
            currentJudge.organization === nextOrganization &&
            currentJudge.avatar === nextAvatar &&
            hasSameStages(currentJudge.stages as JudgeAssignedStageKey[], assignedStages) &&
            hasSameStages(
              (currentJudge.assignedStages ?? currentJudge.stages) as JudgeAssignedStageKey[],
              assignedStages
            );

          if (isUnchanged) {
            return prev;
          }

        const nextJudge = {
          id: judgeId,
          name: payload.name,
          email: payload.email,
          title: nextTitle,
          organization: nextOrganization,
          stages: assignedStages,
          assignedStages,
          avatar: nextAvatar,
          judgeType: (payload.judge_type ?? "judge") as JudgeType,
        };

          const others = prev.filter((item) => item.id !== judgeId);
          return [nextJudge, ...others];
        });

        if (
          userId !== String(payload.id) ||
          userName !== payload.name ||
          userEmail !== payload.email ||
          userJudgeId !== judgeId
        ) {
          setAuthenticatedUser({
            id: String(payload.id),
            name: payload.name,
            email: payload.email,
            role: "judge",
            judgeId,
          });
        }
      } catch {
        // silent fallback to existing local judge list
      }
    };

    void syncJudge();

    return () => {
      cancelled = true;
    };
  }, [
    authInitialized,
    hasUser,
    userRole,
    userId,
    userName,
    userEmail,
    userJudgeId,
    setAuthenticatedUser,
    setJudgeList,
    router,
  ]);

  useEffect(() => {
    if (!authInitialized || !hasUser || userRole !== "judge") return;

    const token = getParticipantAuthSession()?.token;
    if (!token) return;

    let cancelled = false;

    const syncParticipants = async () => {
      try {
        const response = await fetchJudgeParticipants(token);
        if (cancelled) return;

        const mappedParticipants: Participant[] = response.data.map((item) => {
          const education = [
            item.education_category?.trim(),
            item.education_institution?.trim(),
            item.education_degree?.trim(),
            item.education_major?.trim(),
          ]
            .filter(Boolean)
            .join(" - ");

          const status = (item.selection_status ?? "Pending") as Participant["status"];
          const number = item.participant_code ?? item.audition_number ?? item.participant_number ?? "-";

          return {
            id: `P_API_${item.id}`,
            number,
            auditionNumber: item.audition_number ?? item.participant_number ?? number,
            participantCode: item.participant_code ?? undefined,
            name: item.name ?? "Peserta",
            gender: item.gender ?? "Encik",
            nationalId: "",
            birthPlace: "",
            birthDate: "",
            heightCm: item.height_cm ?? 0,
            education,
            instagram: "",
            phone: item.phone ?? "",
            email: (item.email ?? "").trim().toLowerCase(),
            photo: resolveApiAssetUrl(item.photo) ?? "/default-avatar.svg",
            status,
            selectionStage: item.selection_stage ?? undefined,
            registeredAt: item.registered_at ?? new Date().toISOString().slice(0, 10),
            scores: [],
          };
        });

        setParticipantList((prev) => {
          const changed =
            prev.length !== mappedParticipants.length ||
            prev.some((item, index) => {
              const next = mappedParticipants[index];
              if (!next) return true;
              return (
                item.id !== next.id ||
                item.name !== next.name ||
                item.number !== next.number ||
                item.email !== next.email ||
                item.status !== next.status ||
                item.selectionStage !== next.selectionStage ||
                item.photo !== next.photo
              );
            });

          return changed ? mappedParticipants : prev;
        });
      } catch {
        // silent fallback to local data
      }
    };

    void syncParticipants();

    return () => {
      cancelled = true;
    };
  }, [authInitialized, hasUser, userRole, setParticipantList]);

  if (!authInitialized) return null;
  if (!user || user.role !== "judge") return null;

  return (
    <DashboardLayout navItems={judgeNavItems} role="judge">
      {children}
    </DashboardLayout>
  );
}
