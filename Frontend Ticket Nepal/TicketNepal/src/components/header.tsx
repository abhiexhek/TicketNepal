
"use client"

import Link from "next/link"
import { Flame, Search, Ticket, User as UserIcon, Shield, LogIn, UserPlus, Scan, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useContext } from "react"
import { UserContext } from "@/context/UserContext"

export function Header() {
  const pathname = usePathname();
  const { currentUser, logout } = useContext(UserContext);

  const navLinks = [
    { href: '/', label: 'Events' },
    { href: '/my-tickets', label: 'My Tickets' },
  ]

  const getDashboardLink = () => {
    if (!currentUser) return null;
    switch(currentUser.role) {
      case 'Admin':
      case 'Organizer':
      case 'Staff':
        return "/admin";
      default:
        return null;
    }
  }

  const dashboardLink = getDashboardLink();

  const getDashboardIcon = () => {
     if (!currentUser) return null;
     switch(currentUser.role) {
       case 'Admin': return <Shield className="mr-2 h-4 w-4" />;
       case 'Organizer': return <Briefcase className="mr-2 h-4 w-4" />;
       case 'Staff': return <Scan className="mr-2 h-4 w-4" />;
       default: return null;
     }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg font-headline">
            <Flame className="h-6 w-6 text-primary" />
            TicketNepal
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === link.href ? "text-foreground" : "text-foreground/60"
            )}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
          <div className="relative hidden sm:block w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search events..." className="pl-9" />
          </div>
          
          {currentUser ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-tickets">
                    <Ticket className="mr-2 h-4 w-4" />
                    <span>My Tickets</span>
                  </Link>
                </DropdownMenuItem>
                 {dashboardLink && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={dashboardLink}>
                        {getDashboardIcon()}
                        <span>{currentUser.role} Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/auth/login">
                  <LogIn className="mr-2 h-4 w-4"/>
                  Login
                </Link>
              </Button>
               <Button asChild>
                <Link href="/auth/signup">
                  <UserPlus className="mr-2 h-4 w-4"/>
                  Sign Up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
