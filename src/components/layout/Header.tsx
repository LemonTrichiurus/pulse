'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Newspaper, Menu, X, Shield, LogIn, LogOut, User, PenTool, FileText, MessageSquare, Users } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/Authcontext'
import { toast } from 'sonner'
import { useI18n } from '@/contexts/I18nContext'

const navigation = [
  { name: 'nav.sharespeare', href: '/sharespeare' },
  { name: 'nav.topics', href: '/topics' },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, loading, signOut } = useAuth()
  const { t, lang, setLang } = useI18n()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success(lang === 'zh' ? '已退出登录' : 'Signed out')
      router.push('/')
    } catch (error) {
      console.error('退出登录失败:', error)
      toast.error(lang === 'zh' ? '退出登录失败' : 'Failed to sign out')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold font-serif italic text-muted-foreground">
              Sharespeare
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {t(item.name)}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Language toggle */}
            <div className="hidden md:flex items-center">
              <Button variant="outline" size="sm" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
                {lang === 'zh' ? 'EN' : '中文'}
              </Button>
            </div>

            {!loading && (
              <>
                {user ? (
                  <>
                    {/* User Info */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md bg-accent/50">
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {user.displayName || user.email?.split('@')[0]}
                      </span>
                    </div>
                    
                    {/* Submit Links - only show for logged in users */}
                    <Link
                      href="/submit/news"
                      className={cn(
                        "hidden md:flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        pathname.startsWith('/submit')
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <PenTool className="w-4 h-4" />
                      {t('actions.submit')}
                    </Link>
                    
                    {/* My Submissions Link */}
                    <Link
                      href="/me/submissions"
                      className={cn(
                        "hidden md:flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        pathname === '/me/submissions'
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <FileText className="w-4 h-4" />
                      {t('actions.my_submissions')}
                    </Link>
                    
                    {/* Profile Link */}
                    <Link
                      href="/profile"
                      className={cn(
                        "hidden md:flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        pathname === '/profile'
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <User className="w-4 h-4" />
                      {t('actions.profile')}
                    </Link>
                    
                    {/* Admin Links - only show for ADMIN and MOD users */}
                    {user.role && ['ADMIN', 'MOD'].includes(user.role) && (
                      <>
                        <Link
                          href="/admin"
                          className={cn(
                            "hidden md:flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            pathname === '/admin'
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          <Shield className="w-4 h-4" />
                          {t('admin.admin')}
                        </Link>
                        
                        {/* Topic Management Link */}
                        <Link
                          href="/admin/topics"
                          className={cn(
                            "hidden md:flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            pathname === '/admin/topics'
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          <MessageSquare className="w-4 h-4" />
                          {t('admin.topics')}
                        </Link>
                        
                        {/* Comment Moderation Link */}
                        <Link
                          href="/admin/comments"
                          className={cn(
                            "hidden md:flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            pathname === '/admin/comments'
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          <Users className="w-4 h-4" />
                          {t('admin.comments')}
                        </Link>
                      </>
                    )}
                    
                    {/* Sign Out Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="hidden md:flex items-center gap-1"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('auth.sign_out')}
                    </Button>
                  </>
                ) : (
                  /* Sign In Button */
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="hidden md:flex items-center gap-1"
                  >
                    <Link href="/login">
                      <LogIn className="w-4 h-4" />
                      {t('auth.sign_in')}
                    </Link>
                  </Button>
                )}
              </>
            )}
            
            <ThemeToggle />

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t(item.name)}
                </Link>
              ))}
              
              {/* Mobile Language toggle */}
              <div className="px-3">
                <Button variant="outline" size="sm" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="w-full">
                  {lang === 'zh' ? 'EN' : '中文'}
                </Button>
              </div>
              
              {/* Mobile Auth Actions */}
              {!loading && (
                <>
                  {user ? (
                    <>
                      {/* User Info for Mobile */}
                      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent/50">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {user.displayName || user.email?.split('@')[0]}
                        </span>
                      </div>
                      
                      {/* Submit Links for Mobile */}
                      <Link
                        href="/submit/news"
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          pathname.startsWith('/submit')
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <PenTool className="w-4 h-4" />
                        {t('actions.submit')}
                      </Link>
                      
                      {/* My Submissions Link for Mobile */}
                      <Link
                        href="/me/submissions"
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          pathname === '/me/submissions'
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <FileText className="w-4 h-4" />
                        {t('actions.my_submissions')}
                      </Link>
                      
                      {/* Profile Link for Mobile */}
                      <Link
                        href="/profile"
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          pathname === '/profile'
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        {t('actions.profile')}
                      </Link>
                      
                      {/* Admin Links for Mobile - only show for ADMIN and MOD users */}
                      {user.role && ['ADMIN', 'MOD'].includes(user.role) && (
                        <>
                          <Link
                            href="/admin"
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                              pathname === '/admin'
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Shield className="w-4 h-4" />
                            {t('admin.admin')}
                          </Link>
                          
                          {/* Topic Management Link for Mobile */}
                          <Link
                            href="/admin/topics"
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                              pathname === '/admin/topics'
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <MessageSquare className="w-4 h-4" />
                            {t('admin.topics')}
                          </Link>
                          
                          {/* Comment Moderation Link for Mobile */}
                          <Link
                            href="/admin/comments"
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                              pathname === '/admin/comments'
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Users className="w-4 h-4" />
                            {t('admin.comments')}
                          </Link>
                        </>
                      )}
                      
                      {/* Sign Out for Mobile */}
                      <button
                        onClick={() => {
                          handleSignOut()
                          setMobileMenuOpen(false)
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-accent/50 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('auth.sign_out')}
                      </button>
                    </>
                  ) : (
                    /* Sign In for Mobile */
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LogIn className="w-4 h-4" />
                      {t('auth.sign_in')}
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}