"use client"

import type { MouseEvent } from "react"
import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  ChevronDown,
  FileText,
  Images,
  Layers,
  ListOrdered,
  LogOut,
  Megaphone,
  MessageSquare,
  Package,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Truck,
  Users,
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string
}

type NavGroup = {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "main",
    label: "الرئيسية",
    icon: BarChart3,
    items: [{ href: "/admin/dashboard", label: "لوحة التحكم", icon: BarChart3 }],
  },
  {
    id: "sales",
    label: "المبيعات",
    icon: ShoppingBag,
    items: [
      { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
      { href: "/admin/abandoned-carts", label: "السلات المتروكة", icon: ShoppingCart },
    ],
  },
  {
    id: "products",
    label: "المنتجات والمتجر",
    icon: Package,
    items: [
      { href: "/admin/products", label: "المنتجات", icon: Package },
      { href: "/admin/products/order", label: "ترتيب المنتجات", icon: ListOrdered },
      { href: "/admin/categories", label: "الفئات", icon: Layers },
      { href: "/admin/carousel", label: "صور السلايدر", icon: Images },
      { href: "/admin/reviews", label: "التقييمات", icon: MessageSquare },
    ],
  },
  {
    id: "b2b",
    label: "B2B",
    icon: Store,
    items: [
      { href: "/admin/b2b/products", label: "منتجات الجملة", icon: Store },
      { href: "/admin/b2b/products/order", label: "ترتيب منتجات الجملة", icon: ListOrdered },
      { href: "/admin/b2b", label: "إعدادات الجملة", icon: Store },
    ],
  },
  {
    id: "marketing",
    label: "العروض والتسويق",
    icon: Tag,
    items: [
      { href: "/admin/offers", label: "العروض", icon: Tag },
      { href: "/admin/featured-products/order", label: "أبرز المنتجات", icon: Star },
      { href: "/admin/sauces", label: "إعدادات الصوصات", icon: Megaphone },
      { href: "/admin/free-shipping", label: "الشحن المجاني", icon: Truck },
      { href: "/admin/promo-banner", label: "قسم العروض", icon: Megaphone },
    ],
  },
  {
    id: "content",
    label: "الشحن والمحتوى",
    icon: FileText,
    items: [
      { href: "/admin/shipping", label: "الشحن", icon: Truck },
      { href: "/admin/site-content", label: "محتوى الموقع", icon: FileText },
    ],
  },
  {
    id: "analytics",
    label: "التحليلات والمستخدمين",
    icon: Users,
    items: [
      { href: "/admin/revenue", label: "الإيرادات", icon: BarChart3 },
      { href: "/admin/users", label: "المستخدمين", icon: Users },
    ],
  },
]

function NavItemLink({
  item,
  isActive,
  onClick,
  isCollapsed,
}: {
  item: NavItem
  isActive: boolean
  onClick: (e: MouseEvent<HTMLAnchorElement>, href: string) => void
  isCollapsed: boolean
}) {
  const Icon = item.icon

  const linkContent = (
    <Link
      href={item.href}
      onClick={(e) => onClick(e, item.href)}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "hover:bg-white/[0.08]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f39c12]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#362b21]",
        isActive
          ? "bg-gradient-to-l from-[#e08e0a] to-[#f39c12] text-white shadow-md shadow-amber-900/30 rounded-tr-lg ring-1 ring-white/20"
          : "text-white/95 hover:text-white hover:bg-[#4a3d32]/50"
      )}
    >
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-all duration-200",
          isActive
            ? "text-white drop-shadow-sm"
            : "text-white/70 group-hover:text-white group-hover:scale-105"
        )}
      />

      {!isCollapsed && (
        <>
          <span className="truncate">{item.label}</span>

          {item.badge && (
            <span className="mr-auto rounded-full bg-amber-500/25 px-2 py-0.5 text-xs font-semibold text-amber-100 ring-1 ring-amber-400/20">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  )

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="left" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}

function CollapsibleNavGroup({
  group,
  pathname,
  isCollapsed,
  onNavClick,
  defaultOpen,
}: {
  group: NavGroup
  pathname: string
  isCollapsed: boolean
  onNavClick: (e: MouseEvent<HTMLAnchorElement>, href: string) => void
  defaultOpen: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const GroupIcon = group.icon
  const hasActiveItem = group.items.some((item) => pathname === item.href)

  // For single-item groups, render directly without collapsible
  if (group.items.length === 1) {
    const item = group.items[0]
    return (
      <SidebarGroup className="py-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <NavItemLink
              item={item}
              isActive={pathname === item.href}
              onClick={onNavClick}
              isCollapsed={isCollapsed}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    )
  }

  if (isCollapsed) {
    return (
      <SidebarGroup className="py-1">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center justify-center rounded-lg p-2.5 transition-all duration-200",
                hasActiveItem
                  ? "bg-amber-500/25 text-[#f5a623] shadow-inner ring-1 ring-amber-400/20"
                  : "text-white/70 hover:bg-[#4a3d32]/60 hover:text-white"
              )}
            >
              <GroupIcon className="size-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-medium">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-[#362b21]">{group.label}</span>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "text-xs transition-colors hover:text-[#f39c12]",
                      pathname === item.href ? "text-[#f39c12]" : "text-[#362b21]"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </SidebarGroup>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible">
      <SidebarGroup className="py-1">
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200",
              "hover:bg-[#4a3d32]/50",
              hasActiveItem ? "text-[#f5a623]" : "text-white/85 hover:text-white"
            )}
          >
            <GroupIcon
              className={cn(
                "size-4 transition-colors",
                hasActiveItem ? "text-[#f5a623]" : "text-white/60 group-hover:text-white/90"
              )}
            />
            <span>{group.label}</span>
            <ChevronDown
              className={cn(
                "mr-auto size-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <SidebarGroupContent>
            <SidebarMenu className="mt-1 space-y-0.5 pr-2">
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <NavItemLink
                    item={item}
                    isActive={pathname === item.href}
                    onClick={onNavClick}
                    isCollapsed={false}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setOpenMobile, state } = useSidebar()
  const supabase = getSupabaseClient()
  const isCollapsed = state === "collapsed"

  // Memoize which groups should be open by default (those containing active items)
  const defaultOpenGroups = useMemo(() => {
    return NAV_GROUPS.reduce(
      (acc, group) => {
        acc[group.id] = group.items.some((item) => pathname.startsWith(item.href))
        return acc
      },
      {} as Record<string, boolean>
    )
  }, [pathname])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push("/")
  }, [supabase, router])

  const handleNavClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: string) => {
      // Force refresh for products page to reset filters
      if (href === "/admin/products" && pathname === "/admin/products") {
        event.preventDefault()
        router.replace(`/admin/products?reset=${Date.now()}`)
      }
      setOpenMobile(false)
    },
    [pathname, router, setOpenMobile]
  )

  return (
    <Sidebar
      side="right"
      collapsible="icon"
      className={cn(
        "border-l border-[#4a3d32]/80",
        "bg-gradient-to-b from-[#3d3026] to-[#362b21]"
      )}
    >
      {/* Header */}
      <SidebarHeader
        className={cn(
          "border-b border-[#4a3d32]/60 px-4 py-5",
          "bg-[#362b21]/95"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              "bg-gradient-to-br from-[#f39c12] to-[#e08e0a]",
              "shadow-md shadow-black/20 ring-1 ring-white/10",
              "transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-amber-600/20"
            )}
          >
            <Store className="size-5 text-white drop-shadow-sm" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-white drop-shadow-sm">لوحة التحكم</h2>
              <span className="text-xs text-white/75">إدارة المتجر</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="overflow-y-auto overflow-x-hidden px-2 py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#5c4d3f] bg-[#3f352c]">
        <div className="space-y-1">
          {NAV_GROUPS.map((group) => (
            <CollapsibleNavGroup
              key={group.id}
              group={group}
              pathname={pathname}
              isCollapsed={isCollapsed}
              onNavClick={handleNavClick}
              defaultOpen={defaultOpenGroups[group.id] ?? true}
            />
          ))}
        </div>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-[#4a3d32]/60 p-3 bg-[#3f352c]">
        <SidebarMenu>
          <SidebarMenuItem>
            {isCollapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={handleLogout}
                    className={cn(
                      "flex w-full items-center justify-center rounded-lg p-2.5",
                      "bg-red-900/30 text-red-300 ring-1 ring-red-500/20",
                      "transition-all duration-200",
                      "hover:bg-red-800/40 hover:text-red-200 hover:ring-red-500/30",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
                    )}
                  >
                    <LogOut className="size-[18px]" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="left" className="font-medium">
                  تسجيل الخروج
                </TooltipContent>
              </Tooltip>
            ) : (
              <SidebarMenuButton
                onClick={handleLogout}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5",
                  "bg-red-900/30 text-red-300 ring-1 ring-red-500/20",
                  "transition-all duration-200",
                  "hover:bg-red-800/40 hover:text-red-200 hover:ring-red-500/30",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
                )}
              >
                <LogOut className="size-[18px] transition-transform duration-200 group-hover:-translate-x-0.5" />
                <span className="text-sm font-medium">تسجيل الخروج</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Inline styles for animations */}
      <style jsx global>{`
        @keyframes collapsible-down {
          from {
            height: 0;
            opacity: 0;
          }
          to {
            height: var(--radix-collapsible-content-height);
            opacity: 1;
          }
        }

        @keyframes collapsible-up {
          from {
            height: var(--radix-collapsible-content-height);
            opacity: 1;
          }
          to {
            height: 0;
            opacity: 0;
          }
        }

        .animate-collapsible-down {
          animation: collapsible-down 200ms ease-out;
        }

        .animate-collapsible-up {
          animation: collapsible-up 200ms ease-out;
        }

        /* Custom scrollbar for webkit browsers */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgb(92 77 63 / 0.9);
          border-radius: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgb(110 92 76);
        }
      `}</style>
    </Sidebar>
  )
}