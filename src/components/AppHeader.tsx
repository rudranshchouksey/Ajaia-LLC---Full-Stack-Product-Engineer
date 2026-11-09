import Link from "next/link";
import type { User } from "@/lib/users";
import { Avatar } from "./Avatar";
import { LogoutButton } from "./LogoutButton";
import { Logo } from "./Logo";

export function AppHeader({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="rounded-md focus-visible:outline-2 focus-visible:outline-blue-600">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 sm:inline">
            Demo login
          </span>
          <div className="flex items-center gap-2" title={user.email}>
            <Avatar name={user.name} size="sm" />
            <span className="hidden text-sm text-slate-700 sm:inline">{user.name}</span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
