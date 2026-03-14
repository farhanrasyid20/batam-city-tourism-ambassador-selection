"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, ChevronRight, PanelLeft, PanelRight, ChevronDown, KeyRound, UserCircle2, Bell, AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { useApp } from "../../context/AppContext";

type NavItem = {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavItem[];
};

type DashboardLayoutProps = {
  navItems: NavItem[];
  children: React.ReactNode;
  role: "participant" | "admin" | "judge";
};

export default function DashboardLayout({
  navItems,
  children,
  role,
}: DashboardLayoutProps) {
  const { user, logout, currentParticipant, participantList } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const participant = currentParticipant ?? participantList[0] ?? null;
  const profilePhoto = role === "participant" ? participant?.photo : undefined;
  const verificationIssues = participant?.verificationIssues ?? [];
  const participantNotifications =
    role === "participant" && participant
      ? [
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
        ].filter(Boolean)
      : [];

  const roleColors = {
    participant: "#C8A24D",
    admin: "#F5D06F",
    judge: "#B68D2A",
  } as const;

  const roleLabel = {
    participant: "Peserta",
    admin: "Administrator",
    judge: "Dewan Juri",
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

  const changePasswordPath = role === "participant" ? "/pages/participant/change-password" : "/auth/forgot-password";

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
          {profilePhoto ? (
            <Image
              src={profilePhoto}
              alt={user?.name ?? "Foto Profil"}
              width={40}
              height={40}
              unoptimized
              className={`w-10 h-10 rounded-full object-cover ${sidebarCollapsed ? "" : "mb-2"}`}
              style={{ border: "1px solid rgba(200,162,77,0.45)" }}
            />
          ) : (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${sidebarCollapsed ? "" : "mb-2"}`}
              style={{ background: "linear-gradient(135deg, #F5D06F, #8C6A1C)" }}
            >
              <span
                style={{
                  color: "#0F0F0F",
                  fontFamily: "var(--font-cinzel)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              >
                {user?.name?.charAt(0).toUpperCase() ?? "P"}
              </span>
            </div>
          )}
        </div>
        <div className={sidebarCollapsed ? "hidden" : ""}>
          <p
            className="text-xs font-semibold truncate"
            style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
          >
            {user?.name ?? "Peserta"}
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
          {role === "participant" ? (
            <button
              onClick={() => {
                router.push("/pages/participant/biodata");
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
        {role === "participant" && sidebarCollapsed ? (
          <button
            onClick={() => {
              router.push("/pages/participant/biodata");
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
          <button
            className="lg:hidden p-2 rounded-lg"
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
          <div className="lg:hidden flex items-center gap-2">
            <span
              className="text-sm font-semibold"
              style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
            >
              DUTA WISATA BATAM 2026
            </span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            {role === "participant" ? (
              <div className="relative" ref={notificationMenuRef}>
                <button
                  type="button"
                  onClick={() => setNotificationMenuOpen((prev) => !prev)}
                  className="relative flex items-center justify-center rounded-xl w-10 h-10"
                  style={{
                    background: "rgba(200,162,77,0.08)",
                    border: "1px solid rgba(200,162,77,0.22)",
                    color: "#F5E6C8",
                  }}
                  title="Notifikasi"
                >
                  <Bell size={17} style={{ color: "#C8A24D" }} />
                  {participantNotifications.length > 0 ? (
                    <span
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center font-bold"
                      style={{
                        background: "#ef4444",
                        color: "#fff",
                        fontFamily: "var(--font-poppins)",
                      }}
                    >
                      {participantNotifications.length}
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
                    {participantNotifications.length > 0 ? (
                      participantNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => {
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
                {profilePhoto ? (
                  <Image
                    src={profilePhoto}
                    alt={user?.name ?? "Foto profil"}
                    width={28}
                    height={28}
                    unoptimized
                    className="w-7 h-7 rounded-full object-cover"
                    style={{ border: "1px solid rgba(200,162,77,0.45)" }}
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #F5D06F, #8C6A1C)" }}
                  >
                    <span style={{ color: "#0F0F0F", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: "0.7rem" }}>
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </span>
                  </div>
                )}
                <span className="hidden sm:block text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                  {user?.email}
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
                      {user?.name ?? "Pengguna"}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                      {user?.email}
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
                  {role === "participant" ? (
                    <button
                      type="button"
                      onClick={() => {
                        router.push("/pages/participant/biodata");
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


