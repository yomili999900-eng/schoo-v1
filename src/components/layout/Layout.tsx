import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

export function Layout() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className={cn(
      "flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300",
      isAdminPath && "pb-0"
    )}>
      {!isAdminPath && <Navbar />}
      <main className={cn(
        "container mx-auto flex-1 px-4 max-w-5xl transition-all duration-500",
        isAdminPath ? "pt-0 pb-0" : "pt-6 pb-[100px] md:pb-12"
      )}>
        <Outlet />
      </main>
      {!isAdminPath && <MobileNav />}
      <Toaster position="top-center" richColors />
    </div>
  );
}

