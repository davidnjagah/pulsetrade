"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Trophy,
  User,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  LucideIcon,
  Menu,
  X,
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

// Custom hook for responsive detection
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export default function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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

  // Mobile bottom navigation
  if (isMobile) {
    return (
      <>
        {/* Mobile Bottom Navigation Bar */}
        <motion.nav
          className="fixed bottom-0 left-0 right-0 z-50 bg-pulse-bg/95 backdrop-blur-lg border-t border-pulse-pink/10 safe-area-bottom"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = currentActiveItem === item.id;
              const IconComponent = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => onItemClick?.(item.id)}
                  className={`
                    flex flex-col items-center justify-center
                    min-w-[64px] h-full px-3 py-2
                    rounded-lg transition-all duration-200
                    tap-target
                    ${isActive
                      ? "text-pulse-pink"
                      : "text-pulse-text-secondary active:text-white"
                    }
                  `}
                >
                  <motion.div
                    animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </motion.div>
                  <motion.span
                    className="text-[10px] font-medium mt-1"
                    animate={{ opacity: isActive ? 1 : 0.7 }}
                  >
                    {item.label}
                  </motion.span>
                  {/* Active indicator dot */}
                  {isActive && (
                    <motion.div
                      className="absolute top-1 w-1 h-1 rounded-full bg-pulse-pink"
                      layoutId="activeIndicator"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </motion.nav>

        {/* Spacer for bottom nav */}
        <div className="h-16" />
      </>
    );
  }

  // Desktop Sidebar
  return (
    <motion.aside
      className={`fixed left-0 top-14 bottom-0 z-40 flex flex-col bg-pulse-bg/95 backdrop-blur-md border-r border-pulse-pink/10`}
      initial={false}
      animate={{ width: isExpanded ? 192 : 64 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Navigation items */}
      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = currentActiveItem === item.id;
            const IconComponent = item.icon;

            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  onClick={() => onItemClick?.(item.id)}
                  className={`
                    relative w-full flex items-center gap-3 px-3 py-3 rounded-lg
                    transition-all duration-200 tap-target group
                    ${isActive
                      ? "bg-pulse-nav-active text-white"
                      : "text-pulse-text-secondary hover:text-white hover:bg-pulse-bg-secondary/50"
                    }
                  `}
                >
                  {/* Active indicator line */}
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-pulse-pink"
                      layoutId="sidebarActiveIndicator"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  <motion.span
                    className={`${isActive ? "text-pulse-pink" : "group-hover:text-pulse-pink"} transition-colors`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </motion.span>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Tooltip for collapsed state */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-pulse-bg-secondary text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg border border-pulse-pink/10">
                      {item.label}
                    </div>
                  )}
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Toggle button */}
      <div className="p-2 border-t border-pulse-pink/10">
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-pulse-text-secondary hover:text-white hover:bg-pulse-bg-secondary/50 transition-colors"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.div>
        </motion.button>
      </div>
    </motion.aside>
  );
}

// Mobile hamburger menu button (for header integration)
export function MobileMenuButton({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      className="md:hidden p-2 rounded-lg text-pulse-text-secondary hover:text-white hover:bg-pulse-bg-secondary/50 transition-colors tap-target"
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <X className="w-5 h-5" />
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Menu className="w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
