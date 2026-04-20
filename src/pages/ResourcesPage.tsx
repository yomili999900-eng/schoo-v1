import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getResources } from '@/services/resourceService';
import { getClasses } from '@/services/metadataService';
import { EducationalResource, ClassLevel } from '@/types';
import { toast } from 'sonner';

export function ResourcesPage() {
  const [filter, setFilter] = useState<string>('all');
  const [resources, setResources] = useState<EducationalResource[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [resourcesData, classesData] = await Promise.all([
          getResources(filter === 'all' ? undefined : filter),
          getClasses()
        ]);
        setResources(resourcesData);
        setClasses(classesData);
      } catch (error) {
        console.error("Load failed:", error);
        toast.error("Échec du chargement");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [filter]);

  return (
    <div className="flex flex-col space-y-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1 px-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Ressources</h1>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Annales & Cours</p>
      </div>

      <div className="px-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full h-14 rounded-3xl border-slate-100 bg-white font-black text-[10px] uppercase tracking-[0.2em] shadow-sm">
            <div className="flex items-center">
               <Filter className="mr-3 h-4 w-4 text-slate-400" />
               <SelectValue placeholder="Filtrer par classe" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
            <SelectItem value="all" className="text-[10px] font-black uppercase py-4">Toutes les classes</SelectItem>
            {classes.map(c => (
              <SelectItem key={c.id} value={c.id} className="text-[10px] font-black uppercase py-4">{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 px-2">
          {resources.map((res) => (
            <div key={res.id} className="file-card group relative p-6">
              <div className="flex items-center justify-between mb-6">
                <Badge className="text-[9px] uppercase font-black bg-primary/5 text-primary border-none px-3 py-1 rounded-full tracking-widest">
                  {res.type}
                </Badge>
                <div className="flex items-center gap-1.5 text-slate-300">
                   <div className="h-1 w-1 rounded-full bg-slate-200" />
                   <span className="text-[9px] font-black uppercase tracking-tighter">{res.size || 'N/A'}</span>
                </div>
              </div>
              
              <div className="space-y-2 mb-8">
                <h3 className="text-lg font-black text-slate-900 leading-none tracking-tight uppercase group-hover:text-primary transition-colors">{res.title}</h3>
                <div className="flex items-center gap-2">
                   <div className="h-1 w-3 rounded-full bg-slate-100" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Niveau {classes.find(c => c.id === res.classId)?.name}
                   </p>
                </div>
              </div>

              <button 
                onClick={() => window.open(res.url, '_blank')}
                className="flex w-full items-center justify-center rounded-[20px] bg-slate-50 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 transition-all hover:bg-primary hover:text-white group-active:scale-[0.98] shadow-sm"
              >
                <Download className="mr-3 h-4 w-4 stroke-[2.5px]" />
                Télécharger
              </button>
            </div>
          ))}
          
          {resources.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-300">
               <div className="mb-6 mx-auto w-20 h-20 rounded-[32px] bg-slate-50 flex items-center justify-center">
                  <Filter className="h-10 w-10 opacity-50" />
               </div>
               <p className="text-xs font-black uppercase tracking-widest">Aucune ressource disponible</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
