"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Menu,
  X,
  Home,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  User,
  Trophy,
  MessageSquare,
  FileText,
  Calendar,
  Award,
  Brain,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Activity,
  Grid3x3,
  Loader2,
  AlertCircle,
  Mail
} from "lucide-react"
import { useAuthStore } from "../../lib/stores/authStore"
import NotificationContainer from "../ui/NotificationContainer"
import Image from "next/image"
import StudentService from "../../lib/services/studentService"
import { useTheme } from "../../lib/context/ThemeContext"
import NotificationService, { type NotificationEntry } from "../../lib/services/notificationService"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: "student" | "instructor" | "admin"
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  badge?: number
  children?: NavigationItem[]
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationEntry[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState<string | null>(null)
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set())
  const [language, setLanguage] = useState<"fr" | "en">("fr")
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { theme, setPreference, toggle: toggleTheme } = useTheme()
  const notificationButtonRef = useRef<HTMLButtonElement | null>(null)
  const notificationWrapperRef = useRef<HTMLDivElement | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const isCourseModerationNotification = useCallback((notification: NotificationEntry) => {
    const type = notification.type?.toLowerCase() ?? ""
    if (type.includes("course_approval") || type.includes("course_rejection") || type.includes("course_moderation")) {
      return true
    }
    const metadata = notification.metadata ?? {}
    if (metadata.rejection_reason || metadata.moderation_status || metadata.moderation_comment) {
      return true
    }
    return false
  }, [])

  const isCertificateNotification = useCallback((notification: NotificationEntry) => {
    const type = notification.type?.toLowerCase() ?? ""
    if (type.includes("certificate")) {
      return true
    }
    const metadata = notification.metadata ?? {}
    return Boolean(
      metadata?.certificate_id ||
        metadata?.certificate_url ||
        metadata?.certificate_title ||
        metadata?.certificate_code,
    )
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true)
      setNotificationsError(null)
      const data = await NotificationService.getNotifications({
        limit: 10,
        page: 1,
      })
      const rawNotifications = data.notifications ?? []
      const filteredNotifications =
        userRole === "student"
          ? rawNotifications.filter((notif) => !isCourseModerationNotification(notif))
          : rawNotifications
      setNotifications(filteredNotifications)
      const currentUnread = filteredNotifications.filter((notif) => !notif.is_read).length
      setUnreadCount(currentUnread)
    } catch (error: any) {
      console.error("Erreur lors du chargement des notifications:", error)
      setNotificationsError(error?.message ?? "Impossible de charger les notifications")
      setNotifications([])
    } finally {
      setNotificationsLoading(false)
    }
  }, [userRole, isCourseModerationNotification])

  const refreshUnreadCount = useCallback(async () => {
    try {
      const data = await NotificationService.getNotifications({
        page: 1,
        limit: 50,
        is_read: false,
      })
      const rawUnread = data.notifications ?? []
      const filteredUnread =
        userRole === "student" ? rawUnread.filter((notif) => !isCourseModerationNotification(notif)) : rawUnread
      setUnreadCount(filteredUnread.length)
    } catch (error) {
      console.warn("Impossible de récupérer le nombre de notifications non lues:", error)
    }
  }, [userRole, isCourseModerationNotification])

  const handleNotificationDropdownToggle = useCallback(() => {
    setNotificationDropdownOpen((prev) => !prev)
  }, [])

  useEffect(() => {
    if (notificationDropdownOpen) {
      loadNotifications()
    }
  }, [notificationDropdownOpen, loadNotifications])

  useEffect(() => {
    refreshUnreadCount()
  }, [refreshUnreadCount])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        notificationDropdownOpen &&
        notificationWrapperRef.current &&
        notificationButtonRef.current &&
        !notificationWrapperRef.current.contains(target) &&
        !notificationButtonRef.current.contains(target)
      ) {
        setNotificationDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [notificationDropdownOpen])

  const handleNotificationClick = useCallback(
    async (notification: NotificationEntry) => {
      try {
        const wasUnread = !notification.is_read
        if (wasUnread) {
          await NotificationService.markAsRead(notification.id)
          setNotifications((prev) =>
            prev.map((notif) => (notif.id === notification.id ? { ...notif, is_read: true } : notif)),
          )
          setUnreadCount((prev) => Math.max(prev - 1, 0))
        }

        if (notification.metadata?.action_url) {
          setNotificationDropdownOpen(false)
          router.push(notification.metadata.action_url)
          return
        }

        if (isCertificateNotification(notification)) {
          const certificateUrl =
            notification.metadata?.certificate_url ||
            notification.metadata?.download_url ||
            notification.metadata?.action_url

          setNotificationDropdownOpen(false)

          if (certificateUrl) {
            window.open(certificateUrl, "_blank")
            return
          }

          if (userRole === "student") {
            router.push(`/dashboard/${userRole}/certificates`)
            return
          }
        }

        if (notification.metadata?.course_slug) {
          setNotificationDropdownOpen(false)
          router.push(`/courses/${notification.metadata.course_slug}`)
          return
        }

        if (notification.metadata?.course_id) {
          setNotificationDropdownOpen(false)
          router.push(`/courses/${notification.metadata.course_id}`)
        }
      } catch (error) {
        console.warn("Impossible de traiter la notification:", error)
      }
    },
    [router, isCertificateNotification, userRole],
  )

  const handleMarkAllNotificationsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead()
      setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.warn("Impossible de marquer toutes les notifications comme lues:", error)
    }
  }, [])

  // Navigation items par rôle
  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [{ name: "Tableau de bord", href: `/dashboard/${userRole}`, icon: Home }]

    switch (userRole) {
      case "student":
        return [
          ...baseItems,
          {
            name: "Formations",
            href: `/dashboard/${userRole}/courses`,
            icon: BookOpen,
            children: [
              { name: "Catalogue", href: `/dashboard/${userRole}/courses/catalogue`, icon: Grid3x3 },
              { name: "Mes Cours", href: `/dashboard/${userRole}/courses`, icon: BookOpen },
            ],
          },
          { name: "Progression", href: `/dashboard/${userRole}/progress`, icon: BarChart3 },
          { name: "Évaluations", href: `/dashboard/${userRole}/evaluations`, icon: FileText },
          { name: "Certificats", href: `/dashboard/${userRole}/certificates`, icon: Award },
          { name: "Gamification", href: `/dashboard/${userRole}/gamification`, icon: Trophy },
          { name: "Assistant IA", href: `/dashboard/${userRole}/chat-ai`, icon: Brain },
          { name: "Calendrier", href: `/dashboard/${userRole}/calendar`, icon: Calendar },
          { name: "Profil", href: `/dashboard/${userRole}/profile`, icon: User },
          { name: "Paramètres", href: `/dashboard/${userRole}/settings`, icon: Settings },
        ]

      case "instructor":
        return [
          ...baseItems,
          {
            name: "Mes Cours",
            href: `/dashboard/${userRole}/courses`,
            icon: BookOpen,
            children: [
              { name: "Gestion des Cours", href: `/dashboard/${userRole}/courses`, icon: BookOpen },
              { name: "Modules", href: `/dashboard/${userRole}/modules`, icon: BookOpen },
            ],
          },
          { name: "Mes Étudiants", href: `/dashboard/${userRole}/students`, icon: Users },
          { name: "Analytics", href: `/dashboard/${userRole}/analytics`, icon: BarChart3 },
          { name: "Évaluations", href: `/dashboard/${userRole}/evaluations`, icon: FileText },
          { name: "Gamification", href: `/dashboard/${userRole}/gamification`, icon: Trophy },
          { name: "Assistant IA", href: `/dashboard/${userRole}/chat-ai`, icon: Brain },
          { name: "Profil", href: `/dashboard/${userRole}/profile`, icon: User },
          { name: "Paramètres", href: `/dashboard/${userRole}/settings`, icon: Settings },
        ]

      case "admin":
        return [
          ...baseItems,
          { name: "Domaines", href: `/dashboard/${userRole}/domains`, icon: BookOpen },
          { name: "Utilisateurs", href: `/dashboard/${userRole}/users`, icon: Users },
          { name: "Cours", href: `/dashboard/${userRole}/courses`, icon: BookOpen },
          { name: "Statistiques", href: `/dashboard/${userRole}/statistics`, icon: BarChart3 },
          { name: "Surveillance", href: `/dashboard/${userRole}/monitoring`, icon: Activity },
          { name: "Gamification", href: `/dashboard/${userRole}/gamification`, icon: Trophy },
          { name: "Assistant IA", href: `/dashboard/${userRole}/chat-ai`, icon: Brain },
          { name: "Configuration", href: `/dashboard/${userRole}/settings`, icon: Settings },
        ]

      default:
        return baseItems
    }
  }

  const navigationItems = getNavigationItems()

  // Couleurs par rôle
  const getRoleColors = () => {
    switch (userRole) {
      case "student":
        return {
          primary: "bg-mdsc-blue-primary",
          primaryHover: "hover:bg-mdsc-blue-dark",
          accent: "text-mdsc-blue-primary",
          border: "border-mdsc-blue-primary",
        }
      case "instructor":
        return {
          primary: "bg-mdsc-gold",
          primaryHover: "hover:bg-yellow-600",
          accent: "text-mdsc-gold",
          border: "border-mdsc-gold",
        }
      case "admin":
        return {
          primary: "bg-mdsc-blue-dark",
          primaryHover: "hover:bg-gray-800",
          accent: "text-mdsc-blue-dark",
          border: "border-mdsc-blue-dark",
        }
      default:
        return {
          primary: "bg-gray-600",
          primaryHover: "hover:bg-gray-700",
          accent: "text-gray-600",
          border: "border-gray-600",
        }
    }
  }

  const colors = getRoleColors()

  // Charger les préférences utilisateur (langue uniquement, thème géré par ThemeContext)
  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    let mounted = true

    const loadPreferences = async () => {
      const storedLanguage = localStorage.getItem("mdsc-language") as "fr" | "en" | null
      let nextLanguage: "fr" | "en" = storedLanguage ?? "fr"

      if (userRole === "student") {
        try {
          const prefs = await StudentService.getPreferences()
          if (!mounted || !prefs) {
            return
          }

          // Synchroniser le thème avec ThemeContext si disponible depuis le backend
          if (prefs.theme && (prefs.theme === "light" || prefs.theme === "dark" || prefs.theme === "system")) {
            const currentStored = localStorage.getItem("mdsc-theme")
            if (!currentStored || currentStored !== prefs.theme) {
              setPreference(prefs.theme)
            }
          }

          if (!storedLanguage && prefs.language) {
            nextLanguage = prefs.language
            localStorage.setItem("mdsc-language", prefs.language)
          }
        } catch (error) {
          console.warn("Impossible de charger les préférences utilisateur.", error)
        }
      }

      if (mounted) {
        setLanguage(nextLanguage)
      }
    }

    loadPreferences()

    return () => {
      mounted = false
    }
  }, [userRole, setPreference])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    localStorage.setItem("mdsc-language", language)
    document.documentElement.lang = language
  }, [language])

  // Ouvrir automatiquement le sous-menu si un enfant est actif
  useEffect(() => {
    const openActiveSubmenu = () => {
      navigationItems.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some((child) => isActive(child.href))
          if (hasActiveChild) {
            setOpenSubmenus((prev) => new Set(prev).add(item.name))
          }
        }
      })
    }
    openActiveSubmenu()
  }, [pathname])

  // Synchroniser les changements de thème avec le backend
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (userRole !== "student") {
      return
    }

    const handleThemeChange = async (preference?: "light" | "dark" | "system") => {
      // Annuler le timeout précédent si il existe
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Utiliser un debounce pour éviter trop de requêtes
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const currentPreference =
            preference || (localStorage.getItem("mdsc-theme") as "light" | "dark" | "system" | null)
          if (
            currentPreference &&
            (currentPreference === "light" || currentPreference === "dark" || currentPreference === "system")
          ) {
            await StudentService.updatePreferences({ theme: currentPreference })
          }
        } catch (error) {
          console.warn("Impossible de sauvegarder la préférence de thème dans le backend:", error)
        }
        saveTimeoutRef.current = null
      }, 500)
    }

    // Écouter l'événement personnalisé émis par ThemeContext
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ preference: "light" | "dark" | "system" }>
      if (customEvent.detail?.preference) {
        handleThemeChange(customEvent.detail.preference)
      }
    }

    // Écouter les événements storage (changements depuis d'autres onglets)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "mdsc-theme" && e.newValue) {
        handleThemeChange(e.newValue as "light" | "dark" | "system")
      }
    }

    window.addEventListener("mdsc-theme-changed", handleCustomEvent)
    window.addEventListener("storage", handleStorageEvent)

    return () => {
      window.removeEventListener("mdsc-theme-changed", handleCustomEvent)
      window.removeEventListener("storage", handleStorageEvent)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [userRole])

  const handleThemeToggle = () => {
    toggleTheme()
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  const toggleSubmenu = (itemName: string) => {
    setOpenSubmenus((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemName)) {
        newSet.delete(itemName)
      } else {
        newSet.add(itemName)
      }
      return newSet
    })
  }

  const renderNavItem = (item: NavigationItem, isMobile = false) => {
    const hasChildren = item.children && item.children.length > 0

    // Vérifie si l'item parent est actif (exact match)
    const active = pathname === item.href

    // Vérifie si un enfant est actif
    const childActive = hasChildren ? item.children.some((child) => pathname === child.href) : false

    const isOpen = openSubmenus.has(item.name)

    if (hasChildren && !sidebarCollapsed) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleSubmenu(item.name)}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              active ? ` text-gray-700` : childActive
              // ? `${colors.primary} text-white` // Optionnel si tu veux colorer le parent quand un enfant est actif
              // : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="ml-3">{item.name}</span>
            {item.badge && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">{item.badge}</span>
            )}
            {hasChildren && (
              <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            )}
          </button>
          {isOpen && item.children && (
            <div className="ml-8 mt-1 space-y-1">
              {item.children.map((child) => {
                const childIsActive = pathname === child.href
                return (
                  <a
                    key={child.name}
                    href={child.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      childIsActive ? `${colors.primary} text-white` : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <child.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="ml-3">{child.name}</span>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return (
      <a
        key={item.name}
        href={item.href}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isMobile ? "" : "group"} ${
          active ? `${colors.primary} text-white` : "text-gray-700 hover:bg-gray-100"
        }`}
        title={sidebarCollapsed && !isMobile ? item.name : undefined}
      >
        <item.icon className={`${isMobile ? "mr-3" : ""} h-5 w-5 flex-shrink-0`} />
        {!isMobile && !sidebarCollapsed && <span className="ml-3">{item.name}</span>}
        {sidebarCollapsed && !isMobile && item.badge && (
          <span className="absolute ml-3 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{item.badge}</span>
        )}
      </a>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center cursor-pointer" onClick={() => router.push("/")}>
              <Image
                src={theme === "dark" ? "/logo-mdsc.png" : sidebarCollapsed ? "/logo-mdsc-1.png" : "/mdsc-logo1.png"}
                alt="MdSC Logo"
                width={sidebarCollapsed ? 50 : 100}
                height={sidebarCollapsed ? 50 : 80}
                style={{ height: "auto", width: "100%", maxWidth: sidebarCollapsed ? "50px" : "120px" }}
                priority
              />
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">{navigationItems.map((item) => renderNavItem(item, true))}</nav>
        </div>
      </div>

      {/* Sidebar Desktop */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-20 items-center justify-between px-4">
            <div className="flex items-center w-full cursor-pointer" onClick={() => router.push("/")}>
              
              
              {/* <Image
  src={theme === "dark" ? "/logo-mdsc.png" : sidebarCollapsed ? "/logo-mdsc-1.png" : "/mdsc-logo1.png"}
  alt="MdSC Logo"
  width={sidebarCollapsed ? 50 : 140}
  height={sidebarCollapsed ? 50 : 100}
  style={{ height: "auto", width: "100%", maxWidth: sidebarCollapsed ? "50px" : "140px" }}
  priority
/> */}


 <Image
            src={
              sidebarCollapsed
                ? theme === "light"
                  ? "/logo-mdsc-1.png"
                  : "/logo-mdsc-1.png"
                : theme === "dark"
                  ? "/logo-mdsc.png"
                  : "/mdsc-logo1.png"
            }
            alt="MdSC Logo"
            width={sidebarCollapsed ? 50 : 140}
            height={sidebarCollapsed ? 50 : 100}
            style={{ height: "auto", width: "100%", maxWidth: sidebarCollapsed ? "50px" : "140px" }}
            priority
          />


            </div>
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => renderNavItem(item, false))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className={`lg:transition-all lg:duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center justify-between bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-gray-600 lg:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <div className="ml-4 lg:ml-0">
              <h2 className="text-xl font-semibold text-gray-900">
                {navigationItems.find((item) => isActive(item.href))?.name || "Tableau de bord"}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            

            {/* Search */}
            <div className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={() => router.push(`/dashboard/${userRole}/messages`)}
              className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Messages"
              title="Messages"
            >
              <Mail className="h-6 w-6" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationWrapperRef}>
              <button
                ref={notificationButtonRef}
                onClick={handleNotificationDropdownToggle}
                className={`relative p-2 transition-colors ${
                  notificationDropdownOpen ? "text-mdsc-blue-primary" : "text-gray-400 hover:text-gray-600"
                }`}
                aria-label="Notifications"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] px-1 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full border-2 border-white flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

{notificationDropdownOpen && (
  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
      <div>
        <p className="text-sm font-semibold text-gray-900">
          Notifications
        </p>
        <p className="text-xs text-gray-500">
          {unreadCount > 0
            ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
            : "Toutes lues"}
        </p>
      </div>
      <button
        onClick={handleMarkAllNotificationsRead}
        className="text-xs font-medium text-mdsc-blue-primary hover:underline disabled:text-gray-400"
        disabled={unreadCount === 0}
      >
        Tout marquer lu
      </button>
    </div>
    <div className="max-h-80 overflow-y-auto divide-y divide-gray-200">
      {notificationsLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-mdsc-blue-primary" />
          <span className="ml-2 text-sm text-gray-500">Chargement…</span>
        </div>
      ) : notificationsError ? (
        <div className="flex items-center space-x-2 px-4 py-4 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span>{notificationsError}</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-gray-500">
          Aucune notification
        </div>
      ) : (
        notifications.map((notification) => (
          <button
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors ${
              notification.is_read ? "bg-white" : "bg-blue-50"
            }`}
          >
            <div className="flex items-start">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {notification.title || "Notification"}
                </p>
                {notification.message && (
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                )}
                {notification.metadata?.course_title && (
                  <p className="text-xs text-gray-500 mt-1">
                    Cours : {notification.metadata.course_title}
                  </p>
                )}
                {isCertificateNotification(notification) && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center text-xs font-semibold text-purple-600">
                      <Award className="h-3.5 w-3.5 mr-1" />
                      <span>Certificat obtenu 🎉</span>
                    </div>
                    {notification.metadata?.certificate_title && (
                      <p className="text-xs text-gray-600">
                        {notification.metadata.certificate_title}
                      </p>
                    )}
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleNotificationClick(notification);
                      }}
                      className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Voir mon certificat
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-2">
                  {new Date(notification.created_at).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {!notification.is_read && (
                <span className="ml-3 h-2.5 w-2.5 rounded-full bg-mdsc-blue-primary flex-shrink-0"></span>
              )}
            </div>
          </button>
        ))
      )}
    </div>
    <div className="px-4 py-2 text-center border-t border-gray-200">
      <button
        onClick={() => {
          setNotificationDropdownOpen(false);
          router.push(`/dashboard/${userRole}/notifications`);
        }}
        className="text-sm font-medium text-mdsc-blue-primary hover:underline"
      >
        Voir toutes les notifications
      </button>
    </div>
  </div>
)}
</div>


            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <div className="h-8 w-8 bg-mdsc-blue-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden md:block">
                  {user?.firstName} {user?.lastName}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <a
                    href={`/dashboard/${userRole}/profile`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User className="h-4 w-4 mr-3" />
                    Mon Profil
                  </a>
                  <a
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Paramètres
                  </a>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-20">{children}</div>
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <NotificationContainer />
    </div>
  )
}
