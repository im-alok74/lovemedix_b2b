"use client"

import Link from "next/link"
import { LayoutDashboard, Package, FileText, MapPin, User as UserIcon, Heart, Settings } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import SignOutButton from "@/components/auth/signout-button"
import type { User } from "@/lib/types"

/** Menu contents per role. Keeps the header markup free of nested role conditionals. */
const MENU_BY_ROLE: Record<User["user_type"], Array<{ href: string; label: string; icon: typeof Package }>> = {
  customer: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/orders", label: "My orders", icon: Package },
    { href: "/prescriptions", label: "Prescriptions", icon: FileText },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
    { href: "/addresses", label: "Addresses", icon: MapPin },
    { href: "/profile", label: "Profile", icon: UserIcon },
  ],
  pharmacy: [
    { href: "/pharmacy/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pharmacy/orders", label: "Orders", icon: Package },
    { href: "/pharmacy/inventory", label: "Inventory", icon: Package },
    { href: "/pharmacy/prescriptions", label: "Prescriptions", icon: FileText },
    { href: "/pharmacy/procurement", label: "Procurement", icon: Settings },
  ],
  distributor: [
    { href: "/distributor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/distributor/orders", label: "Orders", icon: Package },
    { href: "/distributor/inventory", label: "Inventory", icon: Package },
    { href: "/distributor/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/admin", label: "Admin dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: Package },
    { href: "/admin/users", label: "Users", icon: UserIcon },
    { href: "/admin/prescriptions", label: "Prescriptions", icon: FileText },
  ],
}

export function UserMenu({ user }: { user: User }) {
  const items = MENU_BY_ROLE[user.user_type] ?? MENU_BY_ROLE.customer
  const initial = (user.full_name?.trim()?.[0] || user.email[0] || "U").toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium text-foreground">{user.full_name || "Account"}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-1 inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {user.user_type}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href} className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <SignOutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
