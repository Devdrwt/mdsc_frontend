"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
} from "lucide-react"
import { useAuthStore } from "../../lib/stores/authStore"
import NotificationContainer from "../ui/NotificationContainer"
import Image from "next/image"
import CourseCatalogue from "../courses/CourseCatalogue"

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
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set())
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [activeHref, setActiveHref] = useState<string>("")
  const [activeView, setActiveView] = useState<"dashboard" | "catalogue">("dashboard")
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  // Mettre à jour activeHref quand la route change
  useEffect(() => {
    if (pathname) setActiveHref(pathname)
  }, [pathname])

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
              { name: "Catalogue", href: "/courses", icon: Grid3x3 },
              { name: "Mes Cours", href: `/dashboard/${userRole}/courses`, icon: BookOpen },
            ],
          },
          { name: "Progression", href: `/dashboard/${userRole}/progress`, icon: BarChart3 },
          { name: "Évaluations", href: `/dashboard/${userRole}/evaluations`, icon: FileText },
          { name: "Certificats", href: `/dashboard/${userRole}/certificates`, icon: Award },
          { name: "Gamification", href: `/dashboard/${userRole}/gamification`, icon: Trophy },
          { name: "Assistant IA", href: `/dashboard/${userRole}/chat-ai`, icon: Brain },
          { name: "Calendrier", href: `/dashboard/${userRole}/calendar`, icon: Calendar },
          { name: "Messages", href: `/dashboard/${userRole}/messages`, icon: MessageSquare },
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
          { name: "Messages", href: `/dashboard/${userRole}/messages`, icon: MessageSquare },
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
          primary: "bg-purple-600",
          primaryText: "text-white",
          hover: "hover:bg-purple-100",
        }
      case "instructor":
        return {
          primary: "bg-yellow-500",
          primaryText: "text-white",
          hover: "hover:bg-yellow-100",
        }
      case "admin":
        return {
          primary: "bg-gray-800",
          primaryText: "text-white",
          hover: "hover:bg-gray-100",
        }
      default:
        return {
          primary: "bg-gray-600",
          primaryText: "text-white",
          hover: "hover:bg-gray-100",
        }
    }
  }

  const colors = getRoleColors()

  // Gestion du thème
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  const toggleSubmenu = (itemName: string) => {
    setOpenSubmenus((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemName)) newSet.delete(itemName)
      else newSet.add(itemName)
      return newSet
    })
  }

  // Render function améliorée — seule l'élément exact actif a le style actif
  const renderNavItem = (item: NavigationItem, isMobile = false) => {
    const hasChildren = item.children && item.children.length > 0
    const isOpen = openSubmenus.has(item.name)

    // Est-ce qu'un enfant est actif (exact match)
    const hasActiveChild = !!item.children?.some((child) => child.href === activeHref)

    // Le parent est actif **seulement** si son href est exactement égal et qu'aucun enfant n'est actif
    const parentActive = activeHref === item.href && !hasActiveChild

    if (hasChildren && !sidebarCollapsed) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleSubmenu(item.name)}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              parentActive ? `${colors.primary} ${colors.primaryText}` : "text-gray-700 hover:bg-gray-50"
            }`}
            aria-expanded={isOpen}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="ml-3">{item.name}</span>
            <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <div className="ml-8 mt-1 space-y-1">
              {item.children!.map((child) => {
                const childActive = activeHref === child.href
                return (
                  <button
                    key={child.name}
                    onClick={() => {
                      // si catalogue on active la view interne, sinon on navigue
                      if (child.name === "Catalogue") {
                        setActiveView("catalogue")
                        setActiveHref(child.href)
                        // fermer le menu mobile si nécessaire
                        setSidebarOpen(false)
                      } else {
                        setActiveHref(child.href)
                        router.push(child.href)
                      }
                    }}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors ${
                      childActive ? `${colors.primary} ${colors.primaryText}` : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <child.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="ml-3">{child.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    // Item simple (sans enfants)
    const itemActive = activeHref === item.href

    // Rendu pour mobile ou desktop (desktop prend en compte sidebarCollapsed)
    return (
      <button
        key={item.name}
        onClick={() => {
          setActiveHref(item.href)
          // si on clique sur un élément, on navigue
          router.push(item.href)
          // fermer le sidebar mobile si besoin
          setSidebarOpen(false)
        }}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors ${
          itemActive ? `${colors.primary} ${colors.primaryText}` : "text-gray-700 hover:bg-gray-50"
        }`}
        title={sidebarCollapsed && !isMobile ? item.name : undefined}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        {!sidebarCollapsed && <span className="ml-3">{item.name}</span>}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <Image
                src="/mdsc-logo1.png"
                alt="MdSC Logo"
                width={80}
                height={80}
                style={{ height: "auto", width: "100%", maxWidth: "120px" }}
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
            <div className="flex items-center w-full justify-center">
              {sidebarCollapsed ? (
                <Image
                  src="/logo-mdsc-1.png"
                  alt="MdSC Icon"
                  width={40}
                  height={40}
                  style={{ height: "auto", width: "40px" }}
                  priority
                />
              ) : (
                <Image
                  src="/mdsc-logo1.png"
                  alt="MdSC Logo"
                  width={120}
                  height={120}
                  style={{ height: "auto", width: "100%", maxWidth: "140px" }}
                  priority
                />
              )}
            </div>

            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-gray-400 hover:text-gray-600">
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
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
                {activeView === "catalogue"
                  ? "Catalogue"
                  : navigationItems.find((item) => item.href === activeHref)?.name || "Tableau de bord"}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={() => {
                const newTheme = theme === "light" ? "dark" : "light"
                setTheme(newTheme)
                localStorage.setItem("theme", newTheme)
                document.documentElement.classList.toggle("dark", newTheme === "dark")
              }}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title={theme === "light" ? "Mode sombre" : "Mode clair"}
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {/* Search */}
            <div className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
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
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
              {activeView === "catalogue" ? <CourseCatalogue /> : children}
            </div>
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <NotificationContainer />
    </div>
  )
}
