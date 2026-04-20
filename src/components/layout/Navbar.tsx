import { Link } from 'react-router-dom';
import { User, GraduationCap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { profile, user } = useAuth();
  const isAdmin = profile?.role === 'admin' || user?.email === 'yomili999900@gmail.com';

  const navLinks = [
    { label: 'Accueil', path: '/' },
    { label: 'Épreuves', path: '/classes' },
    { label: 'Ressources', path: '/resources' },
    ...(isAdmin ? [{ label: 'Admin', path: '/admin' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full ios-blur shadow-sm">
      <div className="container mx-auto flex h-[64px] items-center justify-between px-6 max-w-5xl">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-3 transition-transform active:scale-95">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
              <GraduationCap className="h-6 w-6 stroke-[2.5px]" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">ScolarDocs</span>
          </Link>
          
          <nav className="hidden space-x-1 md:flex bg-slate-100/50 p-1 rounded-2xl border">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl",
                  "text-slate-500 hover:text-primary hover:bg-white active:scale-95"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link to="/profile" className="transition-transform active:scale-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 border shadow-sm">
              <User className="h-5 w-5 stroke-[2.5px]" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}

