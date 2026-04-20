import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getClasses, getSubjects } from '@/services/metadataService';
import { ClassLevel, Subject } from '@/types';

export function SubjectsPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const currentClass = classes.find(c => c.id === classId);
  const filteredSubjects = subjects.filter(s => 
    (s.classIds?.includes(classId || '') || !s.classIds) && // Handle legacy or matched classes
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentClass) return <div className="py-20 text-center font-bold text-slate-400">Classe non trouvée</div>;

  return (
    <div className="flex flex-col space-y-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 px-2">
        <button 
          onClick={() => navigate('/classes')}
          className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white text-slate-400 border border-slate-100 transition-all hover:text-primary active:scale-95 shadow-sm"
        >
          <ChevronLeft className="h-6 w-6 stroke-[3px]" />
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sélection Matières</span>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{currentClass.name}</h1>
        </div>
      </div>

      <div className="relative px-2">
        <Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input 
          placeholder="Rechercher une matière..." 
          className="h-14 pl-14 rounded-3xl border-slate-100 bg-white font-bold shadow-sm placeholder:text-slate-300 transition-all focus:ring-primary/10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 px-2">
        {filteredSubjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => navigate(`/papers/${classId}/${subject.id}`)}
            className="file-card group flex flex-col items-center justify-center space-y-6 pt-10 pb-8 transition-all"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-50 text-slate-400 transition-all group-hover:bg-primary group-hover:text-white shadow-sm ring-4 ring-slate-100/50 group-hover:ring-primary/10 group-hover:shadow-lg group-hover:shadow-primary/20">
              <span className="text-2xl font-black">{subject.name.charAt(0)}</span>
            </div>
            <div className="space-y-1">
               <h3 className="text-center text-xs font-black uppercase text-slate-900 tracking-tight group-hover:text-primary transition-colors">{subject.name}</h3>
               <div className="mx-auto h-0.5 w-4 rounded-full bg-slate-100 group-hover:bg-primary/20 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
          <div className="mb-6 rounded-[32px] bg-slate-50 p-8">
            <Search className="h-12 w-12 opacity-50 stroke-[2px]" />
          </div>
          <p className="text-sm font-black uppercase tracking-widest">Désolé, rien trouvé !</p>
        </div>
      )}
    </div>
  );
}
