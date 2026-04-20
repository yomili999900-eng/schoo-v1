import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronLeft, Download, FileText, CheckCircle2, Lock, Loader2, X, Eye, ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ExamPaper, ClassLevel, Subject } from '@/types';
import { getPapers } from '@/services/paperService';
import { getClasses, getSubjects } from '@/services/metadataService';
import { useAuth } from '@/contexts/AuthContext';
import { loginWithGoogle } from '@/services/authService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export function PapersPage() {
  const { classId, subjectId } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  
  const [filter, setFilter] = useState<'apprentissage' | 'examen'>('apprentissage');
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState<ExamPaper | null>(null);
  const [previewTab, setPreviewTab] = useState<'subject' | 'correction'>('subject');

  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [classesData, subjectsData] = await Promise.all([
          getClasses(),
          getSubjects()
        ]);
        setClasses(classesData);
        setSubjects(subjectsData);
      } catch (error) {
        console.error("Fetch metadata failed:", error);
      }
    }
    fetchData();
  }, []);

  const currentClass = classes.find(c => c.id === classId);
  const currentSubject = subjects.find(s => s.id === subjectId);
  
  const showFilter = ['3eme', '1ere', 'terminale'].includes(classId || '');

  useEffect(() => {
    async function loadPapers() {
      if (!classId || !subjectId) return;
      setLoading(true);
      try {
        const fetchedPapers = await getPapers(classId, subjectId, showFilter ? filter : undefined);
        setPapers(fetchedPapers);
      } catch (error) {
        console.error("Failed to load papers:", error);
        toast.error("Erreur lors du chargement des épreuves");
      } finally {
        setLoading(false);
      }
    }
    loadPapers();
  }, [classId, subjectId, filter, showFilter]);

  const handleConsult = (paper: ExamPaper, index: number) => {
    if (!user) {
      toast("Connexion requise", {
        description: "Veuillez vous connecter pour voir les épreuves.",
        action: {
          label: "Connexion",
          onClick: () => loginWithGoogle(),
        }
      });
      return;
    }

    const isLocked = !profile?.isPremium && index > 0;
    if (isLocked) {
      toast.error("Version Premium requise", {
        description: "Cet exercice est réservé aux membres premium."
      });
      return;
    }

    setSelectedPaper(paper);
    setPreviewTab('subject');
  };

  if (loading && papers.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentClass || !currentSubject) return <div className="py-20 text-center font-bold text-slate-400">Contenu non trouvé</div>;

  return (
    <div className="flex flex-col space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center space-x-4 px-2">
        <button 
          onClick={() => navigate(`/subject/${classId}`)}
          className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white text-slate-400 border border-slate-100 transition-all hover:text-primary active:scale-95 shadow-sm"
        >
          <ChevronLeft className="h-6 w-6 stroke-[3px]" />
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{currentClass.name} • {currentSubject.name}</span>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Épreuves</h1>
        </div>
      </div>

      {/* Filter / Toggle Bar */}
      <div className="sticky top-[64px] z-30 -mx-4 ios-blur px-4 py-3 shadow-sm md:mx-0 md:rounded-3xl">
        <div className="flex flex-col space-y-3">
          {showFilter && (
            <div className="flex rounded-2xl bg-slate-100/50 p-1 border">
               <button 
                onClick={() => setFilter('apprentissage')}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
                  filter === 'apprentissage' ? "bg-white text-primary shadow-sm" : "text-slate-400"
                )}
               >
                Apprentissage
               </button>
               <button 
                onClick={() => setFilter('examen')}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
                  filter === 'examen' ? "bg-white text-primary shadow-sm" : "text-slate-400"
                )}
               >
                Examen
               </button>
            </div>
          )}
          
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Documents Disponibles</h2>
            {!loading && <span className="text-[10px] font-bold text-primary">{papers.length} fichiers</span>}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="grid gap-4 px-2">
        {loading && papers.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
          </div>
        ) : papers.map((paper, index) => (
          <PaperCard 
            key={paper.id} 
            paper={paper} 
            isLocked={!profile?.isPremium && index > 0} 
            onConsult={() => handleConsult(paper, index)}
          />
        ))}
        
        {!loading && papers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-300">
            <div className="mb-6 rounded-[32px] bg-slate-50 p-8">
               <FileText className="h-12 w-12 opacity-50 stroke-[2.5px]" />
            </div>
            <p className="text-sm font-black uppercase tracking-widest">Aucune épreuve trouvée</p>
          </div>
        )}
      </div>

      {/* Detail Modal Overlay */}
      <AnimatePresence>
        {selectedPaper && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-lg overflow-hidden rounded-t-[40px] bg-white p-8 shadow-2xl sm:rounded-[32px]"
            >
              <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-200" />
              
              <button 
                onClick={() => setSelectedPaper(null)}
                className="absolute right-8 top-8 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="h-5 w-5 stroke-[2.5px]" />
              </button>

              <div className="mb-8 space-y-3">
                <div className="flex items-center gap-2">
                   <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">{selectedPaper.type}</Badge>
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{currentClass.name}</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 leading-none tracking-tighter uppercase">{selectedPaper.title}</h3>
              </div>

              <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 mb-8">
                <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-slate-200/50 p-1 mb-8">
                    <TabsTrigger value="subject" className="rounded-xl text-[10px] font-black uppercase tracking-widest py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Sujet
                    </TabsTrigger>
                    <TabsTrigger value="correction" className="rounded-xl text-[10px] font-black uppercase tracking-widest py-3 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Corrigé
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className={cn(
                      "h-24 w-24 rounded-[32px] flex items-center justify-center transition-all shadow-lg",
                      previewTab === 'subject' ? "bg-blue-50 text-blue-600 shadow-blue-600/10" : "bg-emerald-50 text-emerald-600 shadow-emerald-600/10"
                    )}>
                      {previewTab === 'subject' ? <FileText className="h-12 w-12 stroke-[2px]" /> : <CheckCircle2 className="h-12 w-12 stroke-[2px]" />}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-900 uppercase">Document DOCX disponible</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest underline decoration-slate-200 underline-offset-4">Ouvrir dans un nouvel onglet</p>
                    </div>

                    <Button 
                      className={cn(
                        "w-full h-16 rounded-[24px] text-base font-black uppercase tracking-widest shadow-xl transition-all active:scale-[0.98]",
                        previewTab === 'subject' ? "bg-primary shadow-primary/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                      )}
                      onClick={() => window.open(previewTab === 'subject' ? selectedPaper.subjectUrl : selectedPaper.correctionUrl, '_blank')}
                    >
                      <Eye className="mr-3 h-6 w-6 stroke-[2.5px]" />
                      {previewTab === 'subject' ? "Ouvrir le sujet" : "Ouvrir le corrigé"}
                    </Button>
                  </div>
                </Tabs>
              </div>

              <div className="text-center pb-2">
                <Button variant="ghost" className="text-slate-400 text-[10px] font-black uppercase tracking-widest h-12" onClick={() => setSelectedPaper(null)}>
                  X Fermer l'aperçu
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaperCard({ paper, isLocked, onConsult }: { 
  paper: ExamPaper, 
  isLocked: boolean,
  onConsult: () => void,
  key?: string 
}) {
  return (
    <div 
      onClick={onConsult}
      className={cn(
        "file-card group relative p-6 transition-all hover:shadow-xl hover:shadow-primary/5 active:scale-[0.98] cursor-pointer",
        isLocked && "opacity-80 bg-slate-50 border-dashed"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 min-w-0">
          <div className={cn(
            "flex h-14 w-14 items-center justify-center rounded-[20px] transition-all shrink-0 shadow-sm",
            isLocked ? "bg-slate-200 text-slate-400" : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
          )}>
            <FileText className="h-6 w-6 stroke-[2px]" />
          </div>
          
          <div className="min-w-0 space-y-1">
            <h4 className="text-base font-black text-slate-900 group-hover:text-primary transition-colors leading-tight truncate uppercase tracking-tight">{paper.title}</h4>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {paper.createdAt ? new Date((paper.createdAt as any)?.seconds * 1000 || paper.createdAt).toLocaleDateString('fr-FR') : 'Archives'}
               </span>
               <div className="h-1 w-1 rounded-full bg-slate-200" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DOCX</span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          {isLocked ? (
            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-2xl ring-4 ring-amber-100/50">
              <Lock className="h-5 w-5 stroke-[2.5px]" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-300 group-hover:border-primary/20 group-hover:text-primary transition-all border border-transparent">
               <ChevronRight className="h-5 w-5 stroke-[3px]" />
            </div>
          )}
        </div>
      </div>
      
      {isLocked && (
        <div className="absolute right-4 top-4">
           <Badge className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg border-none shadow-sm">Premium</Badge>
        </div>
      )}
    </div>
  );
}

