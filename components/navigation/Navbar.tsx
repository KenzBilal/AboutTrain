"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrainFront, User, Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/planner", label: "Plan Journey" },
  { href: "/compare", label: "Compare" },
  { href: "/insights", label: "Insights" },
];

interface NavbarProps {
  /** Pass the current user email from a server component if available */
  userEmail?: string | null;
}

export function Navbar({ userEmail }: NavbarProps = {}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <TrainFront className="h-5 w-5 text-primary" />
            <span className="font-bold text-base text-primary tracking-tight">AboutTrain</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-primary bg-primary/8"
                    : "text-foreground/60 hover:text-foreground hover:bg-accent/60"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <Link
            href="/profile"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 hidden sm:flex",
              pathname === "/profile" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Profile"
          >
            <User className="h-4 w-4" />
            <span className="text-sm">{userEmail ? userEmail.split('@')[0] : 'Profile'}</span>
          </Link>

          {/* Mobile profile icon */}
          <Link
            href="/profile"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "sm:hidden")}
            aria-label="Profile"
          >
            <User className="h-4 w-4 text-muted-foreground" />
          </Link>

          {/* Mobile menu toggle */}
          <button
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "md:hidden")}
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-primary bg-primary/8"
                  : "text-foreground/60 hover:text-foreground hover:bg-accent"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-accent transition-colors"
          >
            <User className="h-4 w-4 mr-2" />
            {userEmail ? userEmail.split('@')[0] : 'Profile'}
          </Link>
        </div>
      )}
    </nav>
  );
}
