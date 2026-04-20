import { User, Shield, CreditCard, ChevronRight, LogOut, Mail, Star, LogIn, Loader2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PREMIUM_PRICE_FCFA } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { loginWithGoogle, logout } from '@/services/authService';
import { initiatePayment } from '@/services/paymentService';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isInitiating, setIsInitiating] = useState(false);

  const isAdmin = profile?.role === 'admin' || user?.email === 'yomili999900@gmail.com';

  const handlePay = async () => {
    if (!user || !phoneNumber) return;
    
    setIsInitiating(true);
    try {
      const response = await initiatePayment({
        userId: user.uid,
        amount: PREMIUM_PRICE_FCFA,
        phoneNumber,
        customerName: user.displayName || undefined,
        planId: 'premium_annual'
      });

      if (response.url) {
        toast.success("Redirection vers la page de paiement...");
        window.location.href = response.url;
      } else {
        throw new Error("URL de paiement non reçue");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur d'initialisation");
      setIsInitiating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-xl shadow-black/5 ring-8 ring-slate-100">
          <User className="h-16 w-16 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-primary uppercase">Accès Membre</h1>
          <p className="text-slate-400 font-medium max-w-xs mx-auto">
            Connectez-vous pour gérer votre abonnement et accéder à l'intégralité des ressources.
          </p>
        </div>
        <Button size="lg" className="h-14 rounded-2xl bg-primary px-8 text-lg font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={loginWithGoogle}>
          <LogIn className="mr-3 h-6 w-6" />
          Continuer avec Google
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center space-y-6 text-center px-2">
        <div className="relative group">
          <div className="flex h-28 w-28 items-center justify-center rounded-[40px] border-4 border-white bg-primary text-4xl font-black text-white shadow-2xl transition-transform group-active:scale-95">
            {user.displayName?.charAt(0)}
          </div>
          <div className="absolute -bottom-1 -right-1 h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 border-4 border-white text-white flex shadow-lg">
            <Shield className="h-4 w-4 stroke-[3px]" />
          </div>
        </div>
        
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">{user.displayName}</h1>
          <div className="flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            <span>{user.email}</span>
          </div>
        </div>
        
        <div className={cn(
          "px-6 py-2 text-[10px] font-black uppercase rounded-full shadow-sm border tracking-[0.2em]",
          profile?.isPremium ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-white text-slate-400 border-slate-100"
        )}>
          {profile?.isPremium ? 'Membre Premium' : 'Accès Gratuit'}
        </div>
      </div>

      <div className="grid gap-8 px-2">
        {!profile?.isPremium && (
          <div className="premium-gradient rounded-[40px] p-8 text-white shadow-2xl shadow-primary/30 overflow-hidden relative group active:scale-[0.98] transition-transform cursor-pointer" onClick={() => setIsPaymentDialogOpen(true)}>
            <div className="relative z-10 space-y-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Pass Premium</h2>
                </div>
                <p className="text-3xl font-black leading-none tracking-tighter uppercase">
                  Accès Illimité à tous nos corrigés
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-black">{PREMIUM_PRICE_FCFA}</span>
                  <span className="font-black text-white/40 text-sm uppercase tracking-widest leading-none">CFA / AN</span>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-xl">
                   <ChevronRight className="h-6 w-6 stroke-[3px]" />
                </div>
              </div>
            </div>
            
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-white/5 blur-3xl opacity-50" />
          </div>
        )}

        {isAdmin && (
          <section className="space-y-4">
            <h2 className="px-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Outils Admin</h2>
            <button 
              onClick={() => window.location.href = '/admin'}
              className="file-card group flex w-full items-center justify-between border-primary/10 bg-primary/5"
            >
               <div className="flex items-center space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                     <Shield className="h-6 w-6 stroke-[2px]" />
                  </div>
                  <div className="text-left">
                     <h3 className="text-base font-black text-slate-900 group-hover:text-primary transition-colors uppercase tracking-tight">Dashboard Admin</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gérer ScolarDocs</p>
                  </div>
               </div>
               <ChevronRight className="h-5 w-5 text-slate-300" />
            </button>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="px-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Paramètres</h2>
          <div className="grid gap-4">
            {[
              { icon: CreditCard, color: "text-blue-500", label: "Historique de paiement" },
              { icon: Shield, color: "text-emerald-500", label: "Protection des données" }
            ].map((item, idx) => (
              <button key={idx} className="file-card group flex w-full items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 transition-colors group-hover:bg-white border border-transparent group-hover:border-slate-100", item.color)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{item.label}</span>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all group-hover:bg-primary group-hover:text-white group-active:scale-90">
                  <ChevronRight className="h-5 w-5 stroke-[2.5px]" />
                </div>
              </button>
            ))}
          </div>
        </section>

        <Button 
          variant="ghost" 
          className="h-16 w-full rounded-2xl text-destructive font-black uppercase text-xs tracking-[0.2em] hover:bg-destructive/5 active:scale-[0.98] transition-all" 
          onClick={logout}
        >
          <LogOut className="mr-3 h-5 w-5 " />
          Quitter l'application
        </Button>
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="rounded-[40px] sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-white p-10 space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-amber-50 text-amber-500 shadow-inner ring-4 ring-amber-50/50">
                <Star className="h-10 w-10 fill-amber-400" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Adhésion Premium</DialogTitle>
                <DialogDescription className="text-xs font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  Activez votre accès complet
                </DialogDescription>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Numéro MoneyFusion</Label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="phone" 
                    placeholder="229 XXXX XXXX" 
                    className="h-16 pl-14 rounded-3xl border-slate-100 font-black bg-slate-50/50 focus:bg-white focus:ring-primary/10 transition-all text-lg placeholder:text-slate-200"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">12 Mois d'Accès</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-primary tracking-tighter">{PREMIUM_PRICE_FCFA}</span>
                  <span className="ml-1 text-sm font-black text-primary/50 uppercase tracking-widest">CFA</span>
                </div>
              </div>
            </div>

            <Button 
               className="w-full h-16 rounded-[24px] bg-primary text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
               onClick={handlePay}
               disabled={!phoneNumber || isInitiating}
            >
              {isInitiating ? <Loader2 className="h-6 w-6 animate-spin" /> : "Payer Maintenant"}
            </Button>
            
            <div className="flex items-center justify-center gap-2 opacity-30">
               <Shield className="h-3 w-3" />
               <p className="text-[9px] font-black uppercase tracking-widest">Transactions Sécurisées</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

