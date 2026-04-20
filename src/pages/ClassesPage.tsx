import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronRight, GraduationCap, School, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getClasses } from '@/services/metadataService';
import { ClassLevel } from '@/types';
import { useState, useEffect } from 'react';

export function ClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const data = await getClasses();
        setClasses(data);
      } catch (error) {
        console.error("Fetch classes failed:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchClasses();
  }, []);

  const collegeClasses = classes.filter(c => c.level === 'Collège');
  const lyceeClasses = classes.filter(c => c.level === 'Lycée');

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const ClassButton = ({ id, name, level }: { id: string, name: string, level: string, key?: string }) => (
    <button
      onClick={() => navigate(`/subject/${id}`)}
      className="file-card group flex w-full items-center justify-between"
    >
      <div className="flex items-center space-x-4">
        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-[20px] transition-all duration-300 shadow-sm",
          level === 'Lycée' ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-slate-50 text-slate-400 group-hover:bg-primary/5 hover:text-primary"
        )}>
          <School className="h-6 w-6 stroke-[2px]" />
        </div>
        <div className="text-left">
          <span className="block text-xl font-black tracking-tighter text-slate-900 group-hover:text-primary transition-colors">{name}</span>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">{level}</span>
        </div>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-300 transition-all group-hover:bg-primary group-hover:text-white group-active:scale-90">
        <ChevronRight className="h-5 w-5 stroke-[3px]" />
      </div>
    </button>
  );

  return (
    <div className="flex flex-col space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1 px-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Ma Classe</h1>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Choisissez votre niveau</p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="mb-6 flex items-center px-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            <GraduationCap className="mr-3 h-4 w-4" />
            Collège
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {collegeClasses.map(c => (
              <ClassButton key={c.id} id={c.id} name={c.name} level={c.level} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-6 flex items-center px-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            <School className="mr-3 h-4 w-4" />
            Lycée
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {lyceeClasses.map(c => (
              <ClassButton key={c.id} id={c.id} name={c.name} level={c.level} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
