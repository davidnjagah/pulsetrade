"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  Trophy,
  User,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  LucideIcon
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const navItems: NavItem[] = [
  {
    id: "trade",
    label: "Trade",
    icon: TrendingUp,
    href: "/",
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    icon: Trophy,
    href: "/leaderboard",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    href: "/profile",
  },
  {
    id: "stats",
    label: "Stats",
    icon: BarChart3,
    href: "/stats",
  },
];

interface SidebarProps {
  activeItem?: string;
  onItemClick?: (id: string) => void;
}

export default function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  // Determine active item from pathname or prop
  const getActiveItem = () => {
    if (activeItem) return activeItem;

    // Match pathname to nav item
    const matchedItem = navItems.find((item) => {
      if (item.href === "/") {
        return pathname === "/";
      }
      return pathname.startsWith(item.href);
    });

    return matchedItem?.id || "trade";
  };

  const currentActiveItem = getActiveItem();

  return (
    <aside
      className={`fixed left-0 top-14 bottom-0 z-40 flex flex-col transition-all duration-300 ease-in-out ${
        isExpanded ? "w-48" : "w-16"
      } bg-pulse-bg/95 backdrop-blur-md border-r border-pulse-pink/10`}
    >
      {/* Navigation items */}
      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = currentActiveItem === item.id;
            const IconComponent = item.icon;

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => onItemClick?.(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 tap-target ${
                    isActive
                      ? "bg-pulse-nav-active text-white shadow-pulse-glow"
                      : "text-pulse-text-secondary hover:text-white hover:bg-pulse-bg-secondary/50"
                  }`}
                >
                  <span
                    className={`${
                      isActive ? "text-pulse-pink" : ""
                    } transition-colors`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </span>
                  {isExpanded && (
                    <span className="text-sm font-medium whitespace-nowrap animate-fade-in">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Toggle button */}
      <div className="p-2 border-t border-pulse-pink/10">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-pulse-text-secondary hover:text-white hover:bg-pulse-bg-secondary/50 transition-colors"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
