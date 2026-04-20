import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, GraduationCap, User, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Accueil', path: '/' },
  { icon: BookOpen, label: 'Épreuves', path: '/classes' },
  { icon: GraduationCap, label: 'Ressources', path: '/resources' },
  { icon: User, label: 'Profil', path: '/profile' },
  { icon: ShieldCheck, label: 'Admin', path: '/admin', adminOnly: true },
];

export function MobileNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[72px] items-center justify-around ios-blur pb-safe safe-bottom md:hidden border-t-0 shadow-[0_-1px_0_rgba(0,0,0,0.05)]">
      {navItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 transition-all duration-300",
              isActive ? "nav-tab-active" : "nav-tab-inactive"
            )}
          >
            <div className={cn(
              "flex h-8 w-12 items-center justify-center rounded-2xl transition-all duration-300",
              isActive ? "bg-primary/5" : ""
            )}>
              <Icon className={cn("h-6 w-6 stroke-[2px]")} />
            </div>
            <span className={cn("text-[9px] font-black uppercase tracking-[0.1em]")}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  );
}
