import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ClassesPage } from '@/pages/ClassesPage';
import { SubjectsPage } from '@/pages/SubjectsPage';
import { PapersPage } from '@/pages/PapersPage';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { ResourcesPage } from '@/pages/ResourcesPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ArrowRight, Zap, ShieldCheck, Sparkles, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React from 'react';

// Pages
const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col space-y-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-primary text-white shadow-2xl shadow-primary/40 active:scale-90 transition-transform">
          <GraduationCap className="h-8 w-8 stroke-[2.5px]" />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">ScolarDocs</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Réussissez vos examens</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => navigate('/classes')}
          className="group relative overflow-hidden rounded-[32px] bg-primary p-8 text-left transition-all active:scale-[0.98] shadow-xl shadow-primary/20"
        >
          <div className="relative z-10 flex flex-col space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Réviser maintenant</h2>
              <p className="text-sm font-medium text-white/70">Accédez aux épreuves par classe et matière</p>
            </div>
            <div className="flex items-center text-xs font-black uppercase tracking-widest text-white">
              Démarrer <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </div>
          <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/resources')}
            className="flex flex-col justify-between rounded-[32px] border bg-white p-6 transition-all active:scale-[0.95] shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cours</h3>
              <p className="text-[10px] font-bold text-slate-400">Notes de cours</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/profile')}
            className="flex flex-col justify-between rounded-[32px] border bg-white p-6 transition-all active:scale-[0.95] shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Premium</h3>
              <p className="text-[10px] font-bold text-slate-400">Accès illimité</p>
            </div>
          </button>
        </div>
      </div>

      <div className="rounded-[32px] bg-slate-100/50 p-6 border">
        <h4 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dernières Épreuves</h4>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl bg-white p-3 border shadow-sm opacity-50">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                  <div className="h-4 w-4 bg-slate-200 rounded-sm italic" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                  <div className="h-2 w-16 bg-slate-50 rounded" />
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300" />
            </div>
          ))}
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase py-2">
            Connectez-vous pour voir plus
          </p>
        </div>
      </div>
    </div>
  );
};
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/subject/:classId" element={<SubjectsPage />} />
          <Route path="/papers/:classId/:subjectId" element={<PapersPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


