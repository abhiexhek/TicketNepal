
"use client"

import Link from "next/link"
import { Flame, Ticket, User as UserIcon, Shield, LogIn, UserPlus, Scan, Briefcase, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useContext, useState } from "react"
import { UserContext } from "@/context/UserContext"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Header() {
  const pathname = usePathname();
  const { currentUser, logout } = useContext(UserContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Events', icon: Ticket },
    { href: '/my-tickets', label: 'My Tickets', icon: Ticket },
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

  const getDashboardLabel = () => {
    if (!currentUser) return null;
    switch(currentUser.role) {
      case 'Admin': return 'Admin Dashboard';
      case 'Organizer': return 'Organizer Dashboard';
      case 'Staff': return 'Staff Dashboard';
      default: return null;
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 glass">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl font-headline text-foreground hover:text-foreground/80 transition-colors">
            <div className="relative">
              <Flame className="h-7 w-7 text-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
            </div>
            <span className="hidden sm:inline">TicketNepal</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className={cn(
                  "flex items-center gap-2 transition-all duration-200 hover:text-foreground/80 relative group",
                  pathname === link.href ? "text-foreground" : "text-foreground/60"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
                {pathname === link.href && (
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-muted/50 transition-colors">
                  <Avatar className="h-10 w-10 ring-2 ring-border hover:ring-primary/20 transition-all">
                    <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">{currentUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        currentUser.role === 'Admin' && "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                        currentUser.role === 'Organizer' && "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                        currentUser.role === 'Staff' && "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                        currentUser.role === 'Customer' && "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
                      )}>
                        {currentUser.role}
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <UserIcon className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/my-tickets" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <Ticket className="h-4 w-4" />
                    <span>My Tickets</span>
                  </Link>
                </DropdownMenuItem>
                {dashboardLink && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link 
                        href={dashboardLink} 
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-colors",
                          pathname.startsWith("/admin") 
                            ? "bg-primary/10 text-primary hover:bg-primary/20" 
                            : "hover:bg-muted/50"
                        )}
                      > 
                        {getDashboardIcon()}
                        <span>{getDashboardLabel()}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={logout}
                  className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogIn className="mr-3 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-3">
              <Button asChild variant="outline" size="sm" className="font-medium">
                <Link href="/auth/login">
                  <LogIn className="mr-2 h-4 w-4"/>
                  Login
                </Link>
              </Button>
              <Button asChild size="sm" className="font-medium shadow-sm">
                <Link href="/auth/signup">
                  <UserPlus className="mr-2 h-4 w-4"/>
                  Sign Up
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <Link href="/" className="flex items-center gap-2 font-bold text-lg font-headline">
                    <Flame className="h-6 w-6 text-primary" />
                    TicketNepal
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <nav className="flex flex-col gap-2 mb-6">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link 
                        key={link.href} 
                        href={link.href} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-colors",
                          pathname === link.href 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-muted/50"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>

                {currentUser ? (
                  <div className="flex flex-col gap-2">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="font-semibold text-sm">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                    </div>
                    <Link 
                      href="/profile" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <UserIcon className="h-5 w-5" />
                      Profile
                    </Link>
                    <Link 
                      href="/my-tickets" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Ticket className="h-5 w-5" />
                      My Tickets
                    </Link>
                    {dashboardLink && (
                      <Link 
                        href={dashboardLink} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {getDashboardIcon()}
                        {getDashboardLabel()}
                      </Link>
                    )}
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogIn className="mr-3 h-5 w-5" />
                      Log out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" className="justify-start">
                      <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <LogIn className="mr-3 h-5 w-5"/>
                        Login
                      </Link>
                    </Button>
                    <Button asChild className="justify-start">
                      <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                        <UserPlus className="mr-3 h-5 w-5"/>
                        Sign Up
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
