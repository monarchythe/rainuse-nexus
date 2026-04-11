import Link from "next/link";
import { Droplets } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              RainUSE
            </span>
            <span className="text-lg font-light text-muted-foreground">
              {" "}
              Nexus
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
