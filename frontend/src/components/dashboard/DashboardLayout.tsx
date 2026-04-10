"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, ChevronRight, PanelLeft, PanelRight, ChevronDown, KeyRound, UserCircle2, Bell, AlertCircle, CheckCircle2, Clock3, Star } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { resolveApiAssetUrl, resolveAvatarUrl } from "../../lib/api";

type NavItem = {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavItem[];
};

type DashboardLayoutProps = {
  navItems: NavItem[];
  children: React.ReactNode;
  role: "participant" | "admin" | "judge" | "super_admin";
};

export default function DashboardLayout({
  navItems,
  children,
  role,
}: DashboardLayoutProps) {
  const {
    user,
    logout,
    currentParticipant,
    participantList,
    judgeList,
    voteTopList,
    voteRankingPublished,
    judgeEncikWinnerList,
    judgePuanWinnerList,
    judgePairRankingList,
    judgeEncikPublished,
    judgePuanPublished,
    judgePairPublished,
  } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [failedProfileImageSrc, setFailedProfileImageSrc] = useState<string | null>(null);
  const [readParticipantNotificationMap, setReadParticipantNotificationMap] = useState<Record<string, string[]>>({});
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const participant = currentParticipant;
  const activeJudge =
    role === "judge"
      ? judgeList.find(
          (judge) =>
            judge.id === user?.judgeId ||
            (judge.email ?? "").trim().toLowerCase() === (user?.email ?? "").trim().toLowerCase()
        ) ?? null
      : null;
  const profilePhoto =
    role === "participant"
      ? resolveApiAssetUrl(participant?.photo)
      : role === "judge"
      ? resolveAvatarUrl(activeJudge?.avatar)
      : undefined;
  const activeProfilePhoto = profilePhoto && failedProfileImageSrc !== profilePhoto ? profilePhoto : undefined;
  const displayName =
    role === "participant"
      ? participant?.name || user?.name || "Peserta"
      : user?.name || (role === "judge" ? "Juri" : "Pengguna");
  const displayEmail =
    role === "participant"
      ? participant?.email || user?.email || ""
      : role === "judge"
      ? activeJudge?.email || user?.email || ""
      : user?.email || "";
  const verificationIssues = participant?.verificationIssues ?? [];
  const participantNotifications = useMemo(
    () => {
      if (role !== "participant" || !participant) return [];

      const baseNotifications = [
        verificationIssues.length > 0
          ? {
              id: "revision-note",
              title: "Perlu Revisi Berkas",
              message: `${verificationIssues.length} item memerlukan perbaikan. Buka halaman dokumen untuk melihat catatan admin dan upload ulang.`,
              color: "#ef4444",
              icon: <AlertCircle size={14} />,
              href: "/pages/participant/dokumen",
            }
          : null,
        participant.submittedToAdmin && participant.status === "Pending"
          ? {
              id: "pending-review",
              title: "Menunggu Verifikasi",
              message: "Berkas Anda sudah dikirim dan sedang ditinjau oleh admin panitia.",
              color: "#C8A24D",
              icon: <Clock3 size={14} />,
              href: "/pages/participant/status",
            }
          : null,
        participant.status === "Verified"
          ? {
              id: "verified",
              title: "Berkas Terverifikasi",
              message: "Administrasi Anda dinyatakan lengkap. Silakan pantau tahap seleksi berikutnya.",
              color: "#22c55e",
              icon: <CheckCircle2 size={14} />,
              href: "/pages/participant/status",
            }
          : null,
      ].filter(Boolean) as Array<{
        id: string;
        title: string;
        message: string;
        color: string;
        icon: React.ReactNode;
        href: string;
      }>;

      const participantId = participant.id;
      const participantNumber = participant.number;
      const isSameParticipant = (candidateId?: string, candidateNumber?: string) =>
        Boolean(
          (candidateId && candidateId === participantId) ||
            (candidateNumber && candidateNumber === participantNumber)
        );

      const achievementNotifications: Array<{
        id: string;
        title: string;
        message: string;
        color: string;
        icon: React.ReactNode;
        href: string;
      }> = [];

      if (judgeEncikPublished) {
        const encikWinner = judgeEncikWinnerList.find((item) =>
          isSameParticipant(item.participantId, item.number)
        );
        if (encikWinner) {
          achievementNotifications.push({
            id: `jury-encik-${encikWinner.rank}`,
            title: `Juara Encik Versi Juri #${encikWinner.rank}`,
            message: "Selamat! Status juara Encik versi juri Anda sudah dipublikasikan.",
            color: "#22c55e",
            icon: <Star size={14} />,
            href: "/pages/participant/status",
          });
        }
      }

      if (judgePuanPublished) {
        const puanWinner = judgePuanWinnerList.find((item) =>
          isSameParticipant(item.participantId, item.number)
        );
        if (puanWinner) {
          achievementNotifications.push({
            id: `jury-puan-${puanWinner.rank}`,
            title: `Juara Puan Versi Juri #${puanWinner.rank}`,
            message: "Selamat! Status juara Puan versi juri Anda sudah dipublikasikan.",
            color: "#22c55e",
            icon: <Star size={14} />,
            href: "/pages/participant/status",
          });
        }
      }

      if (judgePairPublished) {
        const pairWinner = judgePairRankingList.find(
          (item) =>
            item.encikParticipantId === participantId ||
            item.puanParticipantId === participantId
        );
        if (pairWinner) {
          const partnerId =
            pairWinner.encikParticipantId === participantId
              ? pairWinner.puanParticipantId
              : pairWinner.encikParticipantId;
          const partner = participantList.find((item) => item.id === partnerId);

          achievementNotifications.push({
            id: `jury-pair-${pairWinner.rank}`,
            title: `Juara Pasangan Versi Juri #${pairWinner.rank}`,
            message: `Selamat! Anda ditetapkan sebagai juara pasangan versi juri${
              partner ? ` bersama ${partner.name}.` : "."
            }`,
            color: "#22c55e",
            icon: <Star size={14} />,
            href: "/pages/participant/status",
          });
        }
      }

      if (voteRankingPublished) {
        const voteWinner = voteTopList.find((item) =>
          isSameParticipant(item.participantId, item.number)
        );
        if (voteWinner) {
          achievementNotifications.push({
            id: `vote-top-${voteWinner.rank}`,
            title: `Juara Vote Terfavorit #${voteWinner.rank}`,
            message: "Like tertinggi Anda sudah tercatat dalam ranking vote favorit publik.",
            color: "#22c55e",
            icon: <Star size={14} />,
            href: "/vote",
          });
        }
      }

      return [...achievementNotifications, ...baseNotifications];
    },
    [
      judgeEncikPublished,
      judgeEncikWinnerList,
      judgePairPublished,
      judgePairRankingList,
      judgePuanPublished,
      judgePuanWinnerList,
      participant,
      participantList,
      role,
      verificationIssues.length,
      voteRankingPublished,
      voteTopList,
    ]
  );

  const participantNotificationStorageKey =
    role === "participant" && participant
      ? `participant-notification-read:${participant.id}`
      : "";

  const readParticipantNotificationIds = useMemo(() => {
    if (!participantNotificationStorageKey) return [];
    const fromState = readParticipantNotificationMap[participantNotificationStorageKey];
    if (fromState) return fromState;
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(participantNotificationStorageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [participantNotificationStorageKey, readParticipantNotificationMap]);

  const markParticipantNotificationsRead = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;

      setReadParticipantNotificationMap((prev) => {
        const current = prev[participantNotificationStorageKey] ?? [];
        const next = Array.from(new Set([...current, ...ids]));
        if (participantNotificationStorageKey && typeof window !== "undefined") {
          window.localStorage.setItem(participantNotificationStorageKey, JSON.stringify(next));
        }
        return {
          ...prev,
          [participantNotificationStorageKey]: next,
        };
      });
    },
    [participantNotificationStorageKey]
  );

  const unreadParticipantNotifications = useMemo(
    () =>
      participantNotifications.filter(
        (notification) => !readParticipantNotificationIds.includes(notification.id)
      ),
    [participantNotifications, readParticipantNotificationIds]
  );

  const roleColors = {
    participant: "#C8A24D",
    admin: "#F5D06F",
    judge: "#B68D2A",
    super_admin: "#FFD700",
  } as const;

  const roleLabel = {
    participant: "Peserta",
    admin: "Administrator",
    judge: "Dewan Juri",
    super_admin: "Super Admin",
  } as const;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setNotificationMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changePasswordPath =
    role === "participant"
      ? "/pages/participant/change-password"
      : role === "judge"
      ? "/pages/judges/change-password"
      : "/pages/admin/change-password";
  const editProfilePath =
    role === "participant" ? "/pages/participant/biodata" : role === "judge" ? "/pages/judges/profile" : null;

  const isItemActive = (item: NavItem) => {
    const hasSelfActive = item.href ? pathname === item.href || pathname.startsWith(`${item.href}/`) : false;
    const hasChildActive = item.children?.some((child) => child.href && (pathname === child.href || pathname.startsWith(`${child.href}/`)));
    return hasSelfActive || Boolean(hasChildActive);
  };

  const handleNavItemClick = (item: NavItem) => {
    if (item.children && item.children.length > 0) {
      if (sidebarCollapsed) {
        const firstChildHref = item.children[0]?.href;
        if (firstChildHref) {
          router.push(firstChildHref);
          setSidebarOpen(false);
        }
        return;
      }
      setExpandedMenus((prev) => ({ ...prev, [item.label]: !prev[item.label] }));
      return;
    }

    if (item.href) {
      router.push(item.href);
      setSidebarOpen(false);
    }
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b" style={{ borderColor: "rgba(200,162,77,0.2)" }}>
        <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
          <Image
            src="/logo1.png"
            alt="Logo Duta Wisata Batam"
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
            style={{ filter: "drop-shadow(0 0 8px rgba(200,162,77,0.4))" }}
          />
          <div className={sidebarCollapsed ? "hidden" : ""}>
            <p
              className="text-xs font-bold leading-tight"
              style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
            >
              DUTA WISATA
            </p>
            <p
              className="text-xs leading-tight"
              style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", opacity: 0.7 }}
            >
              BATAM 2026
            </p>
          </div>
        </div>
      </div>

      <div
        className={`py-4 mt-4 rounded-xl ${sidebarCollapsed ? "px-2 mx-2" : "px-4 mx-3"}`}
        style={{ background: "rgba(200,162,77,0.08)", border: "1px solid rgba(200,162,77,0.15)" }}
      >
        <div className={sidebarCollapsed ? "flex justify-center" : ""}>
          {activeProfilePhoto ? (
            <Image
              src={activeProfilePhoto}
              alt={user?.name ?? "Foto Profil"}
              width={40}
              height={40}
              onError={() => setFailedProfileImageSrc(activeProfilePhoto)}
              unoptimized
              className={`w-10 h-10 rounded-full object-cover ${sidebarCollapsed ? "" : "mb-2"}`}
              style={{ border: "1px solid rgba(200,162,77,0.45)" }}
            />
          ) : (
            <Image
              src="/default-avatar.svg"
              alt="Avatar default"
              width={40}
              height={40}
              unoptimized
              className={`w-10 h-10 rounded-full object-cover ${sidebarCollapsed ? "" : "mb-2"}`}
              style={{ border: "1px solid rgba(200,162,77,0.45)" }}
            />
          )}
        </div>
        <div className={sidebarCollapsed ? "hidden" : ""}>
            <p
              className="text-xs font-semibold truncate"
              style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
            >
            {displayName}
            </p>
          <span
            className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
            style={{
              background: "rgba(200,162,77,0.15)",
              color: roleColors[role],
              fontFamily: "var(--font-poppins)",
            }}
          >
            {roleLabel[role]}
          </span>
          {editProfilePath ? (
            <button
              onClick={() => {
                router.push(editProfilePath);
                setSidebarOpen(false);
              }}
              className="w-full mt-3 px-3 py-2 rounded-lg text-xs text-left transition-all duration-200"
              style={{
                background: "rgba(200,162,77,0.12)",
                border: "1px solid rgba(200,162,77,0.28)",
                color: "#F5D06F",
                fontFamily: "var(--font-poppins)",
              }}
              type="button"
            >
              Edit Profil
            </button>
          ) : null}
        </div>
        {editProfilePath && sidebarCollapsed ? (
          <button
            onClick={() => {
              router.push(editProfilePath);
              setSidebarOpen(false);
            }}
            className="w-full mt-3 px-2 py-2 rounded-lg text-xs text-center transition-all duration-200"
            style={{
              background: "rgba(200,162,77,0.12)",
              border: "1px solid rgba(200,162,77,0.28)",
              color: "#F5D06F",
              fontFamily: "var(--font-poppins)",
            }}
            type="button"
            title="Edit Profil"
          >
            Profil
          </button>
        ) : null}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => {
          const isActive = isItemActive(item);
          const hasChildren = Boolean(item.children && item.children.length > 0);
          const hasActiveChild = Boolean(
            item.children?.some(
              (child) => child.href && (pathname === child.href || pathname.startsWith(`${child.href}/`))
            )
          );
          const isExpanded = expandedMenus[item.label] ?? hasActiveChild;

          return (
            <div key={item.href ?? item.label}>
              <button
                onClick={() => handleNavItemClick(item)}
                className={`w-full flex items-center rounded-xl text-sm text-left transition-all duration-200 ${
                  sidebarCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"
                }`}
                style={{
                  background: isActive ? "rgba(200,162,77,0.15)" : "transparent",
                  border: isActive ? "1px solid rgba(200,162,77,0.3)" : "1px solid transparent",
                  color: isActive ? "#C8A24D" : "#BDBDBD",
                  fontFamily: "var(--font-poppins)",
                }}
                type="button"
                title={item.label}
              >
                <span style={{ color: isActive ? "#C8A24D" : "#888" }}>{item.icon}</span>
                {sidebarCollapsed ? null : <span className="flex-1">{item.label}</span>}
                {!sidebarCollapsed ? (
                  hasChildren ? (
                    <ChevronDown
                      size={14}
                      style={{
                        color: isActive ? "#C8A24D" : "#777",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  ) : isActive ? (
                    <ChevronRight size={14} style={{ color: "#C8A24D" }} />
                  ) : null
                ) : null}
              </button>

              {!sidebarCollapsed && hasChildren && isExpanded ? (
                <div className="mt-1 pl-3 space-y-1">
                  {item.children?.map((child) => {
                    const isChildActive = isItemActive(child);
                    return (
                      <button
                        key={child.href ?? child.label}
                        onClick={() => {
                          if (child.href) {
                            router.push(child.href);
                            setSidebarOpen(false);
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-left transition-all"
                        style={{
                          background: isChildActive ? "rgba(200,162,77,0.14)" : "transparent",
                          border: isChildActive ? "1px solid rgba(200,162,77,0.24)" : "1px solid transparent",
                          color: isChildActive ? "#F5D06F" : "#9CA3AF",
                          fontFamily: "var(--font-poppins)",
                        }}
                        type="button"
                      >
                        <span style={{ color: isChildActive ? "#D4AF37" : "#666" }}>{child.icon}</span>
                        <span className="flex-1">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: "rgba(200,162,77,0.15)" }}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center rounded-xl text-sm transition-all duration-200 ${
            sidebarCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"
          }`}
          style={{
            color: "#ff6b6b",
            fontFamily: "var(--font-poppins)",
            background: "rgba(255,107,107,0.05)",
            border: "1px solid rgba(255,107,107,0.1)",
          }}
          type="button"
          title="Logout"
        >
          <LogOut size={16} />
          {sidebarCollapsed ? null : "Logout"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] warm-champagne-bg overflow-hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <aside
        className={`hidden lg:flex flex-col shrink-0 transition-all duration-200 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
        style={{ background: "#141414", borderRight: "1px solid rgba(200,162,77,0.15)" }}
      >
        {renderSidebarContent()}
      </aside>

      {sidebarOpen ? (
        <div className="lg:hidden fixed inset-0 z-40 flex" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)" }} />
          <aside
            className="relative z-50 w-64 flex flex-col"
            style={{ background: "#141414", borderRight: "1px solid rgba(200,162,77,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {renderSidebarContent()}
          </aside>
        </div>
      ) : null}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="h-14 flex items-center justify-between px-4 lg:px-6 shrink-0"
          style={{ background: "#141414", borderBottom: "1px solid rgba(200,162,77,0.15)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              className="lg:hidden p-2 rounded-lg shrink-0"
              style={{ color: "#C8A24D", background: "rgba(200,162,77,0.1)" }}
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              <Menu size={18} />
            </button>
            <button
              className="hidden lg:flex p-2 rounded-lg"
              style={{ color: "#C8A24D", background: "rgba(200,162,77,0.1)" }}
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              type="button"
              title={sidebarCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
            >
              {sidebarCollapsed ? <PanelRight size={18} /> : <PanelLeft size={18} />}
            </button>
            <span
              className="lg:hidden text-sm font-semibold truncate"
              style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
            >
              DUTA WISATA BATAM 2026
            </span>
          </div>
          <div className="flex items-center gap-3">
            {role === "participant" ? (
              <div className="relative" ref={notificationMenuRef}>
                <button
                  type="button"
                  onClick={() =>
                    setNotificationMenuOpen((prev) => {
                      const nextOpen = !prev;
                      if (nextOpen) {
                        markParticipantNotificationsRead(
                          unreadParticipantNotifications.map((item) => item.id)
                        );
                      }
                      return nextOpen;
                    })
                  }
                  className="relative flex items-center justify-center rounded-xl w-10 h-10"
                  style={{
                    background: "rgba(200,162,77,0.08)",
                    border: "1px solid rgba(200,162,77,0.22)",
                    color: "#F5E6C8",
                  }}
                  title="Notifikasi"
                >
                  <Bell size={17} style={{ color: "#C8A24D" }} />
                  {unreadParticipantNotifications.length > 0 ? (
                    <span
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center font-bold"
                      style={{
                        background: "#ef4444",
                        color: "#fff",
                        fontFamily: "var(--font-poppins)",
                      }}
                    >
                      {unreadParticipantNotifications.length}
                    </span>
                  ) : null}
                </button>

                {notificationMenuOpen ? (
                  <div
                    className="absolute right-0 mt-2 w-80 rounded-xl overflow-hidden z-50"
                    style={{
                      background: "#141414",
                      border: "1px solid rgba(200,162,77,0.24)",
                      boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                    }}
                  >
                    <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(200,162,77,0.16)" }}>
                      <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                        Notifikasi Peserta
                      </p>
                    </div>
                    {unreadParticipantNotifications.length > 0 ? (
                      unreadParticipantNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => {
                            markParticipantNotificationsRead([notification.id]);
                            router.push(notification.href);
                            setNotificationMenuOpen(false);
                          }}
                          className="w-full px-3 py-3 text-left border-b last:border-b-0"
                          style={{
                            borderColor: "rgba(200,162,77,0.12)",
                            background: "transparent",
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <span style={{ color: notification.color, marginTop: 1 }}>{notification.icon}</span>
                            <div>
                              <p className="text-xs font-semibold" style={{ color: notification.color, fontFamily: "var(--font-poppins)" }}>
                                {notification.title}
                              </p>
                              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4">
                        <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Belum ada notifikasi baru untuk akun peserta Anda.
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5"
                style={{
                  background: "rgba(200,162,77,0.08)",
                  border: "1px solid rgba(200,162,77,0.22)",
                  color: "#F5E6C8",
                }}
              >
                {activeProfilePhoto ? (
                  <Image
                    src={activeProfilePhoto}
                    alt={user?.name ?? "Foto profil"}
                    width={28}
                    height={28}
                    onError={() => setFailedProfileImageSrc(activeProfilePhoto)}
                    unoptimized
                    className="w-7 h-7 rounded-full object-cover"
                    style={{ border: "1px solid rgba(200,162,77,0.45)" }}
                  />
                ) : (
                  <Image
                    src="/default-avatar.svg"
                    alt="Avatar default"
                    width={28}
                    height={28}
                    unoptimized
                    className="w-7 h-7 rounded-full object-cover"
                    style={{ border: "1px solid rgba(200,162,77,0.45)" }}
                  />
                )}
                <span className="hidden sm:block text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                  {displayName}
                </span>
                <ChevronDown size={14} style={{ color: "#C8A24D" }} />
              </button>

              {profileMenuOpen ? (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden z-50"
                  style={{
                    background: "#141414",
                    border: "1px solid rgba(200,162,77,0.24)",
                    boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                  }}
                >
                  <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(200,162,77,0.16)" }}>
                    <p className="text-xs font-semibold truncate" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                      {displayName}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                      {displayEmail}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(changePasswordPath);
                      setProfileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs flex items-center gap-2"
                    style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}
                  >
                    <KeyRound size={14} />
                    Ubah Password
                  </button>
                  {editProfilePath ? (
                    <button
                      type="button"
                      onClick={() => {
                        router.push(editProfilePath);
                        setProfileMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs flex items-center gap-2"
                      style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
                    >
                      <UserCircle2 size={14} />
                      Edit Profil
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setProfileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs flex items-center gap-2"
                    style={{ color: "#ef4444", fontFamily: "var(--font-poppins)" }}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto dashboard-scrollbar dashboard-main-scroll p-4 lg:p-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}


