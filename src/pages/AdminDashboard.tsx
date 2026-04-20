import React, { useState, useEffect } from 'react';
import { CLASSES, SUBJECTS } from '@/constants';
import { Plus, Trash2, LayoutDashboard, Loader2, FileUp, Database, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { addPaper, getAllPapers, deletePaper } from '@/services/paperService';
import { addResource, getResources, deleteResource } from '@/services/resourceService';
import { 
  getClasses, 
  addClass, 
  deleteClass, 
  getSubjects, 
  addSubject, 
  deleteSubject,
  bootstrapMetadata 
} from '@/services/metadataService';
import { uploadFile } from '@/services/storageService';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { PaperType, ExamPaper, EducationalResource, ClassLevel, Subject } from '@/types';
import { cn } from '@/lib/utils';

type AdminView = 'dashboard' | 'add-paper' | 'add-resource' | 'manage-metadata';

export function AdminDashboard() {
  const { profile, user } = useAuth();
  const isAdmin = profile?.role === 'admin' || user?.email === 'yomili999900@gmail.com';
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Papers state
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);

  // resources state
  const [resources, setResources] = useState<EducationalResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Metadata state
  const [dynamicClasses, setDynamicClasses] = useState<ClassLevel[]>([]);
  const [dynamicSubjects, setDynamicSubjects] = useState<Subject[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Form State - Class
  const [classForm, setClassForm] = useState({
    name: '',
    level: 'Collège' as ClassLevel['level']
  });

  // Form State - Subject
  const [subjectForm, setSubjectForm] = useState<{
    name: string;
    classIds: string[];
  }>({
    name: '',
    classIds: []
  });

  // Form State - Paper
  const [paperForm, setPaperForm] = useState({
    title: '',
    classId: '',
    subjectId: '',
    type: 'apprentissage' as PaperType,
  });
  const [subjectFile, setSubjectFile] = useState<File | null>(null);
  const [correctionFile, setCorrectionFile] = useState<File | null>(null);
  const [subjectUrl, setSubjectUrl] = useState('');
  const [correctionUrl, setCorrectionUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // Form State - Resource
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    type: 'exercice' as EducationalResource['type'],
    classId: '',
  });
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceUrl, setResourceUrl] = useState('');

  const fetchData = async () => {
    setLoadingMetadata(true);
    try {
      // Always fetch metadata as it's needed for forms across components
      const [classesData, subjectsData] = await Promise.all([
        getClasses(),
        getSubjects()
      ]);
      setDynamicClasses(classesData);
      setDynamicSubjects(subjectsData);

      if (activeView === 'dashboard') {
        setLoadingPapers(true);
        setLoadingResources(true);
        const [papersData, resourcesData] = await Promise.all([
          getAllPapers(),
          getResources()
        ]);
        setPapers(papersData);
        setResources(resourcesData);
        setLoadingPapers(false);
        setLoadingResources(false);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Erreur de chargement des données");
    } finally {
      setLoadingMetadata(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await bootstrapMetadata();
      
      // Auto-clear once if requested or if we're in this transition phase
      if (window.location.search.includes('force_clear=true')) {
        await handleResetDatabase();
        window.history.replaceState({}, '', window.location.pathname);
      }
      
      fetchData();
    };
    init();
  }, [activeView]);

  const handleDeletePaper = async (id: string) => {
    if (!confirm("Supprimer cette épreuve ?")) return;
    try {
      await deletePaper(id);
      toast.success("Épreuve supprimée");
      fetchData();
    } catch (error) {
      toast.error("Erreur suppression");
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Supprimer cette ressource ?")) return;
    try {
      await deleteResource(id);
      toast.success("Ressource supprimée");
      fetchData();
    } catch (error) {
      toast.error("Erreur suppression");
    }
  };

  const handlePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!paperForm.title || !paperForm.classId || !paperForm.subjectId) {
      toast.error("Veuillez remplir les informations de base");
      return;
    }

    setIsSubmitting(true);
    try {
      const sUrl = subjectUrl || (subjectFile ? await uploadFile(subjectFile, `papers/${Date.now()}_subject`, (p) => setUploadProgress(prev => ({ ...prev, subject: p }))) : '');
      const cUrl = correctionUrl || (correctionFile ? await uploadFile(correctionFile, `papers/${Date.now()}_correction`, (p) => setUploadProgress(prev => ({ ...prev, correction: p }))) : '');

      if (!sUrl || !cUrl) {
        toast.error("Veuillez fournir les fichiers ou les liens");
        setIsSubmitting(false);
        return;
      }

      await addPaper({
        ...paperForm,
        subjectUrl: sUrl,
        correctionUrl: cUrl,
        authorId: user.uid,
        createdAt: new Date().toISOString()
      });
      toast.success("Épreuve publiée !");
      setPaperForm({ title: '', classId: '', subjectId: '', type: 'apprentissage' });
      setSubjectFile(null);
      setCorrectionFile(null);
      setSubjectUrl('');
      setCorrectionUrl('');
      setActiveView('dashboard');
    } catch (error) {
      toast.error("Erreur lors de la publication");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name) return;
    setIsSubmitting(true);
    try {
      await addClass(classForm);
      toast.success("Classe ajoutée");
      setClassForm({ name: '', level: 'Collège' });
      fetchData();
    } catch (error) {
      toast.error("Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name || subjectForm.classIds.length === 0) {
      toast.error("Nom et au moins une classe requis");
      return;
    }
    setIsSubmitting(true);
    try {
      await addSubject(subjectForm);
      toast.success("Matière ajoutée");
      setSubjectForm({ name: '', classIds: [] });
      fetchData();
    } catch (error) {
      toast.error("Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!id) {
      toast.error("ID de classe manquant");
      return;
    }
    if (!window.confirm("Supprimer cette classe ?")) return;
    try {
      await deleteClass(id);
      toast.success("Classe supprimée");
      fetchData();
    } catch (error: any) {
      console.error("Delete class error:", error);
      toast.error(`Erreur: ${error.message || "Inconnue"}`);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!id) {
      toast.error("ID de matière manquant");
      return;
    }
    if (!window.confirm("Supprimer cette matière ?")) return;
    try {
      await deleteSubject(id);
      toast.success("Matière supprimée");
      fetchData();
    } catch (error: any) {
      console.error("Delete subject error:", error);
      toast.error(`Erreur: ${error.message || "Inconnue"}`);
    }
  };

  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const rUrl = resourceUrl || (resourceFile ? await uploadFile(resourceFile, `resources/${Date.now()}_res`, (p) => setUploadProgress(prev => ({ ...prev, resource: p }))) : '');

    if (!resourceForm.title || !resourceForm.classId || !rUrl) {
      toast.error("Veuillez remplir tous les champs et fournir le fichier/lien");
      return;
    }

    setIsSubmitting(true);
    try {
      await addResource({
        ...resourceForm,
        url: rUrl,
      });
      toast.success("Ressource ajoutée !");
      setResourceForm({ title: '', description: '', type: 'exercice', classId: '' });
      setResourceFile(null);
      setResourceUrl('');
      setActiveView('dashboard');
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm("ATTENTION : Cela va supprimer TOUTES les classes et TOUTES les matières. Cette action est irréversible. Continuer ?")) return;
    
    setIsSubmitting(true);
    try {
      // Delete all classes
      const classesSnap = await getDocs(collection(db, 'classes'));
      const classDeletions = classesSnap.docs.map(d => deleteClass(d.id));
      
      // Delete all subjects
      const subjectsSnap = await getDocs(collection(db, 'subjects'));
      const subjectDeletions = subjectsSnap.docs.map(d => deleteSubject(d.id));
      
      await Promise.all([...classDeletions, ...subjectDeletions]);
      
      toast.success("Base de données réinitialisée avec succès !");
      fetchData();
    } catch (error: any) {
      console.error("Reset error:", error);
      toast.error(`Erreur lors de la réinitialisation : ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Accès Refusé</h2>
        <p className="text-slate-500">Vous devez être administrateur pour accéder à cette page.</p>
        <Button onClick={() => window.location.href = '/'}>Retour à l'accueil</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter text-primary uppercase">Administration</h1>
          <p className="text-sm font-medium text-slate-400">Gestion du contenu et statistiques</p>
        </div>
        <div className="flex bg-slate-200/50 p-1 rounded-2xl w-fit flex-wrap gap-1">
          {[
            { id: 'dashboard', label: 'Stats', icon: LayoutDashboard },
            { id: 'add-paper', label: 'Épreuve', icon: Plus },
            { id: 'add-resource', label: 'Ressource', icon: BookOpen },
            { id: 'manage-metadata', label: 'Paramètres', icon: Database },
          ].map((view) => (
            <button 
              key={view.id}
              onClick={() => setActiveView(view.id as AdminView)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
                activeView === view.id ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <view.icon className="h-3.5 w-3.5" />
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {activeView === 'dashboard' ? (
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-8">
            {/* Papers List */}
            <div className="file-card">
              <div className="border-b border-slate-50 pb-4 mb-6">
                <h2 className="text-xl font-black text-slate-800">Épreuves Récentes</h2>
              </div>
              <div className="space-y-4">
                {loadingPapers ? (
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-200" />
                ) : papers.map(paper => (
                   <div key={paper.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border transition-all hover:border-slate-300">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <Plus className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{paper.title}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{paper.classId} • {paper.subjectId}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeletePaper(paper.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 className="h-5 w-5" /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources List */}
            <div className="file-card">
              <div className="border-b border-slate-50 pb-4 mb-6">
                <h2 className="text-xl font-black text-slate-800">Ressources Récentes</h2>
              </div>
              <div className="space-y-4">
                {loadingResources ? (
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-200" />
                ) : resources.map(res => (
                   <div key={res.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border transition-all hover:border-slate-300">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{res.title}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{res.classId} • {res.type}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteResource(res.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 className="h-5 w-5" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="file-card">
              <h2 className="text-xl font-black text-slate-800 border-b border-slate-50 pb-4 mb-6">Statistiques</h2>
              <div className="space-y-4">
                <StatItem label="Épreuves" value={papers.length} />
                <StatItem label="Ressources" value={resources.length} />
                <StatItem label="Matières" value={dynamicSubjects.length} />
                <StatItem label="Classes" value={dynamicClasses.length} />
              </div>
            </div>
          </div>
        </div>
      ) : activeView === 'add-paper' ? (
        <div className="file-card mx-auto max-w-2xl w-full">
          <h2 className="text-2xl font-black text-slate-800 mb-8 pb-4 border-b">Publier une Épreuve</h2>
          <form onSubmit={handlePaperSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Titre</Label>
              <Input className="rounded-xl h-12 font-bold" value={paperForm.title} onChange={e => setPaperForm({...paperForm, title: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400">Classe</Label>
                  <Select value={paperForm.classId} onValueChange={val => setPaperForm({...paperForm, classId: val})}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="CLasse" /></SelectTrigger>
                    <SelectContent>{dynamicClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
               </div>
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400">Matière</Label>
                  <Select value={paperForm.subjectId} onValueChange={val => setPaperForm({...paperForm, subjectId: val})}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Matière" /></SelectTrigger>
                    <SelectContent>
                      {dynamicSubjects
                        .filter(s => !paperForm.classId || !s.classIds || s.classIds.includes(paperForm.classId))
                        .map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
               </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <div className="grid gap-4">
                <UploadOrLink label="Sujet" file={subjectFile} setFile={setSubjectFile} url={subjectUrl} setUrl={setSubjectUrl} progress={uploadProgress.subject} />
                <UploadOrLink label="Corrigé" file={correctionFile} setFile={setCorrectionFile} url={correctionUrl} setUrl={setCorrectionUrl} progress={uploadProgress.correction} />
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl bg-primary text-sm font-black uppercase tracking-widest" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
              Publier l'épreuve
            </Button>
          </form>
        </div>
      ) : activeView === 'add-resource' ? (
        <div className="file-card mx-auto max-w-2xl w-full">
          <h2 className="text-2xl font-black text-slate-800 mb-8 pb-4 border-b">Ajouter une Ressource</h2>
          <form onSubmit={handleResourceSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Titre</Label>
              <Input className="rounded-xl h-12 font-bold" value={resourceForm.title} onChange={e => setResourceForm({...resourceForm, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Description</Label>
              <Input className="rounded-xl h-12 font-bold" value={resourceForm.description} onChange={e => setResourceForm({...resourceForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400">Classe</Label>
                  <Select value={resourceForm.classId} onValueChange={val => setResourceForm({...resourceForm, classId: val})}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Classe" /></SelectTrigger>
                    <SelectContent>{dynamicClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
               </div>
               <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400">Type</Label>
                  <Select value={resourceForm.type} onValueChange={val => setResourceForm({...resourceForm, type: val as any})}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cours">Cours</SelectItem>
                      <SelectItem value="exercice">Exercice</SelectItem>
                      <SelectItem value="annale">Annale</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
            </div>
            
            <UploadOrLink label="Ressource" file={resourceFile} setFile={setResourceFile} url={resourceUrl} setUrl={setResourceUrl} progress={uploadProgress.resource} />

            <Button type="submit" className="w-full h-14 rounded-2xl bg-primary text-sm font-black uppercase tracking-widest" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
              Ajouter la ressource
            </Button>
          </form>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          {/* Manage Classes */}
          <div className="file-card">
            <h2 className="text-2xl font-black text-slate-800 mb-6 border-b pb-4">Gestion des Classes</h2>
            <form onSubmit={handleClassSubmit} className="flex gap-2 mb-6">
              <div className="flex-1">
                <Input 
                  placeholder="Ex: 5ème" 
                  value={classForm.name} 
                  onChange={e => setClassForm({...classForm, name: e.target.value})}
                  className="rounded-xl"
                />
              </div>
              <div className="w-32">
                <Select value={classForm.level} onValueChange={val => setClassForm({...classForm, level: val as any})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Collège">Collège</SelectItem>
                    <SelectItem value="Lycée">Lycée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="icon" className="rounded-xl" disabled={isSubmitting}>
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {dynamicClasses.length > 0 ? dynamicClasses.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border">
                  <div>
                    <span className="font-bold text-slate-800">{c.name}</span>
                    <span className="ml-2 text-[10px] font-black uppercase text-slate-400">{c.level}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteClass(c.id!);
                    }} 
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )) : (
                <p className="text-center py-8 text-xs font-medium text-slate-400">Aucune classe configurée.</p>
              )}
            </div>
          </div>

          {/* Manage Subjects */}
          <div className="file-card">
            <h2 className="text-2xl font-black text-slate-800 mb-6 border-b pb-4">Gestion des Matières</h2>
            <form onSubmit={handleSubjectSubmit} className="space-y-4 mb-6">
              <Input 
                placeholder="Ex: Philosophie" 
                value={subjectForm.name} 
                onChange={e => setSubjectForm({...subjectForm, name: e.target.value})}
                className="rounded-xl"
              />
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Classes Concernées</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-xl bg-slate-50/50">
                  {dynamicClasses.map(c => (
                    <label key={c.id} className="flex items-center space-x-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={subjectForm.classIds.includes(c.id!)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSubjectForm(prev => ({
                            ...prev,
                            classIds: checked 
                              ? [...prev.classIds, c.id!]
                              : prev.classIds.filter(id => id !== c.id)
                          }));
                        }}
                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-600 group-hover:text-primary transition-colors">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full rounded-xl flex items-center gap-2" disabled={isSubmitting}>
                <Plus className="h-4 w-4" />
                Ajouter la Matière
              </Button>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {dynamicSubjects.length > 0 ? dynamicSubjects.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{s.name}</span>
                    <span className="text-[9px] text-slate-400 font-black uppercase">
                      {s.classIds?.length > 0 
                        ? dynamicClasses.filter(c => s.classIds.includes(c.id!)).map(c => c.name).join(', ') 
                        : 'Aucune classe'}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteSubject(s.id!);
                    }} 
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )) : (
                <p className="text-center py-8 text-xs font-medium text-slate-400">Aucune matière configurée.</p>
              )}
            </div>
          </div>

          {/* Extreme Reset Action */}
          <div className="md:col-span-2 mt-8 pt-8 border-t border-red-100">
            <div className="rounded-[32px] bg-red-50/50 p-8 border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-lg font-black text-red-900 uppercase tracking-tight">Zone de danger</h3>
                <p className="text-sm text-red-600/70 font-medium max-w-md">
                  Cette action supprimera instantanément toutes les classes et matières existantes pour vous permettre de repartir de zéro.
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleResetDatabase}
                disabled={isSubmitting}
                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-600/10 active:scale-95 transition-all"
              >
                <Trash2 className="mr-3 h-5 w-5" />
                Vider toute la base
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-xl font-black text-primary">{value}</span>
    </div>
  );
}

function UploadOrLink({ 
  label, 
  file, 
  setFile, 
  url, 
  setUrl, 
  progress 
}: { 
  label: string, 
  file: File | null, 
  setFile: (f: File | null) => void,
  url: string,
  setUrl: (u: string) => void,
  progress?: number
}) {
  return (
    <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        {progress && progress < 100 && (
          <span className="text-[10px] font-black text-primary">{Math.round(progress)}%</span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative group">
          <Input 
            type="file" 
            className="hidden" 
            id={`file-${label}`} 
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) {
                setFile(f);
                setUrl('');
              }
            }}
          />
          <Label 
            htmlFor={`file-${label}`}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-white font-bold text-primary transition-all hover:bg-primary/5"
          >
            <FileUp className="h-4 w-4" />
            {file ? file.name : "Uploader un fichier (DOCX)"}
          </Label>
        </div>

        <div className="flex items-center gap-2">
           <div className="h-px flex-1 bg-slate-200" />
           <span className="text-[10px] font-black text-slate-300">OU</span>
           <div className="h-px flex-1 bg-slate-200" />
        </div>

        <Input 
          placeholder="Ou coller un lien (Cloudflare, Drive...)" 
          className="rounded-xl h-10 border-slate-200"
          value={url}
          onChange={e => {
            setUrl(e.target.value);
            setFile(null);
          }}
        />
      </div>
    </div>
  );
}
