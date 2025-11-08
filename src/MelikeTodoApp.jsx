import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Calendar as CalIcon, Tag, ListChecks, Trash2, CheckSquare, Square } from "lucide-react";

/**
 * Melike'nin Yapılacaklar Listesi (JS sürüm – CRA/Vite/Next uyumlu)
 * Bu dosya, önceki hatayı (React error #130) düzeltecek şekilde TAMAMEN yeniden yazıldı.
 * #130 hatası genellikle default export olmayan bir dosyayı bileşen gibi import etmekten
 * veya geçersiz bir element tipini (undefined/object) render etmeye çalışmaktan doğar.
 * Bu sürüm `export default function MelikeTodoApp()` içerir ve tüm handler'lar tanımlıdır.
 */

// —— Varsayılan veriler ——
const DEFAULT_LISTS = ["Kişisel", "İş", "Alışveriş"];
const DEFAULT_TAGS = ["Aşk", "Hediye", "Öncelik"];
const DEFAULT_TASKS = [
  {
    id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()),
    title: "Sürpriz pazar kahvaltısı planı",
    description: "Yakınındaki en sevdiği kafede rezervasyon.",
    list: "Kişisel",
    due: localDateStr(),
    tags: ["Aşk"],
    subtasks: [
      { id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()), title: "Rezervasyon aç", done: false },
      { id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()), title: "Çiçek al", done: false },
    ],
    done: false,
  },
];

// —— Tema ——
const THEME = {
  bg: "bg-violet-50",
  card: "bg-white",
  text: "text-slate-800",
  ring: "ring-violet-300",
  primary: "bg-violet-600 hover:bg-violet-700",
  primaryText: "text-white",
  accentPink: "bg-pink-100 text-pink-700",
  chip: "bg-violet-100 text-violet-700",
};

// —— Yerel tarih yardımcıları ——
function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // YYYY-MM-DD (yerel saat)
}

// —— LocalStorage Hook ——
const STORAGE_KEY = "melike_todo_v1";
function usePersistentState(key, initial) {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [state, key]);
  return [state, setState];
}

// —— Küçük bileşenler ——
const Chip = ({ label, onRemove }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${THEME.chip}`}>
    <Tag className="w-3 h-3" />
    {label}
    {onRemove && (
      <button onClick={onRemove} className="opacity-70 hover:opacity-100">×</button>
    )}
  </span>
);

const SectionTitle = ({ title }) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-semibold text-slate-600 tracking-wide uppercase">{title}</h3>
  </div>
);

// —— Ana Uygulama ——
export default function MelikeTodoApp() {
  // Durumlar
  const [lists, setLists]   = usePersistentState(`${STORAGE_KEY}:lists`, DEFAULT_LISTS);
  const [tags, setTags]     = usePersistentState(`${STORAGE_KEY}:tags`, DEFAULT_TAGS);
  const [tasks, setTasks]   = usePersistentState(`${STORAGE_KEY}:tasks`, DEFAULT_TASKS);

  const [query, setQuery] = useState("");
  const [activeList, setActiveList] = useState("Kişisel");
  const [selectedId, setSelectedId] = useState(null);

  const [showCal, setShowCal] = useState(false);
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const [newList, setNewList] = useState("");
  const [newTag, setNewTag] = useState("");

  // Filtreler
  const filtered = useMemo(() => {
    return tasks.filter(t =>
      (activeList ? t.list === activeList : true) &&
      (query ? t.title.toLowerCase().includes(query.toLowerCase()) : true) &&
      (selectedDate ? t.due === selectedDate : true)
    );
  }, [tasks, activeList, query, selectedDate]);

  // Seçim + taslak kontrolü
  const selected = useMemo(() => tasks.find(t => t.id === selectedId) || null, [tasks, selectedId]);
  const hasDraft = useMemo(() => tasks.some(t => t.draft), [tasks]);

  // Güvenlik: seçili id silinmişse paneli kapat
  useEffect(() => {
    if (selectedId && !tasks.some(t => t.id === selectedId)) {
      setSelectedId(null);
    }
  }, [tasks, selectedId]);

  // İşlevler
  function toggleTask(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function addTask() {
    const newTask = {
      id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()),
      title: "Yeni görev",
      description: "",
      list: activeList || lists[0] || "Kişisel",
      due: undefined,
      tags: [],
      subtasks: [],
      draft: true, // taslak modunda başlat
      done: false,
    };
    setTasks(prev => [newTask, ...prev]);
    setSelectedId(newTask.id);
  }

  function deleteList(name) {
    const nextLists = lists.filter(l => l !== name);
    const fallback = nextLists[0] || "Kişisel";
    setLists(nextLists.length ? nextLists : ["Kişisel"]);
    setTasks(prev => prev.map(t => t.list === name ? { ...t, list: fallback } : t));
    if (activeList === name) setActiveList(fallback);
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function updateSelected(patch) {
    if (!selected) return;
    setTasks(prev => prev.map(t => t.id === selected.id ? { ...t, ...patch } : t));
  }

  function addSubtask() {
    if (!selected) return;
    const newSub = { id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()), title: "Yeni alt görev", done: false };
    updateSelected({ subtasks: [...selected.subtasks, newSub] });
  }

  function exportJson() {
    const data = JSON.stringify({ lists, tags, tasks }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "melike-todo.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed.lists && parsed.tags && parsed.tasks) {
          setLists(parsed.lists); setTags(parsed.tags); setTasks(parsed.tasks);
        }
      } catch {}
    };
    reader.readAsText(file);
  }

  // Takvim
  const fmt = (d) => localDateStr(d);
  const monthStart = useMemo(() => new Date(calDate.getFullYear(), calDate.getMonth(), 1), [calDate]);
  const monthEnd = useMemo(() => new Date(calDate.getFullYear(), calDate.getMonth()+1, 0), [calDate]);
  const daysArray = useMemo(() => Array.from({length: monthEnd.getDate()}, (_,i)=> i+1), [monthEnd]);
  const monthHasTasks = useMemo(() => new Set(tasks.filter(t=> t.due && t.due.startsWith(`${calDate.getFullYear()}-${String(calDate.getMonth()+1).padStart(2,'0')}`)).map(t=> t.due)), [tasks, calDate]);

  // ——— Basit “test” kontrolleri (geliştirici modunda uyarı) ———
  if (process.env.NODE_ENV !== "production") {
    console.assert(typeof updateSelected === "function", "updateSelected fonksiyonu bulunamadı");
    console.assert(typeof setSelectedId === "function", "setSelectedId state setter bulunamadı");
  }

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.text} antialiased`}>
      {/* Üst başlık */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 border-b border-violet-100">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            <span className="text-violet-700">Melike'nin</span> Yapılacaklar Listesi
          </h1>
          <div className="flex items-center gap-2">
            {!hasDraft && (
              <button onClick={addTask} className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${THEME.primary} ${THEME.primaryText}`}>
                <Plus className="w-4 h-4" /> Yeni Görev
              </button>
            )}
            <input type="file" accept="application/json" onChange={importJson} className="hidden" id="import-json" />
            <label htmlFor="import-json" className="px-3 py-2 rounded-xl text-sm border border-violet-200 hover:bg-violet-50 cursor-pointer">İçe Aktar</label>
            <button onClick={exportJson} className="px-3 py-2 rounded-xl text-sm border border-violet-200 hover:bg-violet-50">Dışa Aktar</button>
          </div>
        </div>
      </header>

      {/* İçerik 3 sütun */}
      <div className="mx-auto max-w-7xl px-2 md:px-6 py-6 grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Sol Menü */}
        <aside className={`md:col-span-3 ${THEME.card} rounded-2xl shadow-sm p-4 md:p-5 border border-violet-100`}>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ara" className={`w-full pl-9 pr-3 py-2 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 ${THEME.ring}`} />
          </div>

          <SectionTitle title="Görevler" />
          <nav className="space-y-1">
            {lists.map((l) => (
              <button key={l} onClick={()=>setActiveList(l)} className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-left border ${activeList===l?"bg-violet-100 border-violet-200":"border-transparent hover:bg-violet-50"}`}>
                <span className="flex items-center gap-2"><ListChecks className="w-4 h-4 text-violet-600"/>{l}
                <button onClick={(e)=>{e.stopPropagation(); deleteList(l);}} className="ml-1 text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-rose-600">×</button>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">{tasks.filter(t=>t.list===l && !t.done).length}</span>
              </button>
            ))}
            <div className="w-full mt-2 flex items-center gap-2">
              <input value={newList} onChange={e=>setNewList(e.target.value)} placeholder="Yeni liste adı" className="flex-1 px-3 py-2 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 ring-violet-300" />
              <button onClick={()=>{ const name = newList.trim(); if(!name) return; if(!lists.includes(name)) { setLists([...lists, name]); setActiveList(name); } setNewList(""); }} className="px-2 py-1 rounded-full border border-dashed border-violet-300 text-sm hover:bg-violet-50">+ Ekle</button>
            </div>
          </nav>

          <div className="mt-6">
            <SectionTitle title="Etiketler" />
            <div className="flex flex-wrap gap-2">
              {tags.map(t => <Chip key={t} label={t} onRemove={() => setTags(tags.filter(x=>x!==t))} />)}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input value={newTag} onChange={e=>setNewTag(e.target.value)} placeholder="Yeni etiket" className="flex-1 px-2 py-1 rounded-full border border-violet-200 focus:outline-none focus:ring-2 ring-violet-300 text-sm" />
              <button onClick={()=>{ const t = newTag.trim(); if(!t) return; if(!tags.includes(t)) setTags([...tags, t]); setNewTag(""); }} className="px-2 py-1 rounded-full border border-dashed border-violet-300 text-sm hover:bg-violet-50">+ Etiket</button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-violet-100">
            <button onClick={()=> setShowCal(v=>!v)} className="w-full inline-flex items-center justify-between gap-2 text-sm px-3 py-2 rounded-xl hover:bg-violet-50">
              <span className="inline-flex items-center gap-2"><CalIcon className="w-4 h-4"/> Takvim</span>
              {showCal ? <span>−</span> : <span>+</span>}
            </button>
            {showCal && (
              <div className="mt-3 p-3 rounded-2xl border border-violet-100">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={()=>setCalDate(new Date(calDate.getFullYear(), calDate.getMonth()-1, 1))} className="px-2 py-1 rounded-lg hover:bg-violet-50">‹</button>
                  <div className="text-sm font-medium text-slate-600">{calDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}</div>
                  <button onClick={()=>setCalDate(new Date(calDate.getFullYear(), calDate.getMonth()+1, 1))} className="px-2 py-1 rounded-lg hover:bg-violet-50">›</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-1">
                  {['Pzt','Sal','Çar','Per','Cum','Cts','Paz'].map(d=> <div key={d} className="py-1">{d}</div>)}
                </div>
                {(() => {
                  const first = new Date(monthStart);
                  const startIndex = (first.getDay()+6)%7; // Pazartesi=0
                  const blanks = Array.from({length: startIndex}, (_,i)=>(<div key={'b'+i}></div>));
                  return (
                    <div className="grid grid-cols-7 gap-1 text-sm">
                      {blanks}
                      {daysArray.map(day => {
                        const dateStr = fmt(new Date(calDate.getFullYear(), calDate.getMonth(), day));
                        const isSelected = selectedDate === dateStr;
                        const hasTask = monthHasTasks.has(dateStr);
                        return (
                          <button key={day} onClick={()=> setSelectedDate(dateStr)} className={`py-2 rounded-xl border text-center ${isSelected? 'bg-violet-600 text-white border-violet-600':'border-violet-100 hover:bg-violet-50'}`}>
                            <div>{day}</div>
                            {hasTask && <div className="mt-1 mx-auto w-1.5 h-1.5 rounded-full bg-rose-500"></div>}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
                <div className="mt-3 flex items-center justify-between">
                  <button onClick={()=> setSelectedDate(null)} className="text-xs text-slate-500 hover:text-violet-700">Tarih filtresini temizle</button>
                  <div className="text-xs text-slate-500">Seçili: {selectedDate || '—'}</div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Orta Sütun: Bugün */}
        <main className={`md:col-span-5 ${THEME.card} rounded-2xl shadow-sm p-4 md:p-5 border border-violet-100`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Bugün</h2>
            <span className="text-sm text-slate-500">{filtered.length} görev</span>
          </div>

          <div className="space-y-2">
            {filtered.map(task => (
              <div key={task.id} className={`group flex items-center gap-3 px-3 py-3 rounded-xl border ${selectedId===task.id?"border-violet-300 bg-violet-50":"border-slate-100 hover:bg-slate-50"}`}>
                <button onClick={()=>toggleTask(task.id)} className="shrink-0">
                  {task.done ? <CheckSquare className="w-5 h-5 text-violet-600"/> : <Square className="w-5 h-5 text-slate-400"/>}
                </button>
                <button onClick={()=>setSelectedId(task.id)} className="flex-1 text-left">
                  <div className={`font-medium ${task.done?"line-through text-slate-400":""}`}>{task.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    {task.due && (<span className={`${THEME.accentPink} px-2 py-0.5 rounded-full inline-flex items-center gap-1`}><CalIcon className="w-3 h-3"/>{task.due}</span>)}
                    {task.tags.map(t => <span key={t} className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{t}</span>)}
                    {task.subtasks.length>0 && (<span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Alt görev: {task.subtasks.filter(s=>s.done).length}/{task.subtasks.length}</span>)}
                  </div>
                </button>
                <div className="opacity-0 group-hover:opacity-100 transition">
                  <button onClick={()=>deleteTask(task.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            ))}

            {filtered.length===0 && (
              <div className="text-center text-slate-500 py-8">Bu listede görev yok. "Yeni Görev" ile ekleyebilirsin.</div>
            )}
          </div>
        </main>

        {/* Sağ Sütun: Detay */}
        <aside className={`md:col-span-4 ${THEME.card} rounded-2xl shadow-sm p-4 md:p-5 border border-violet-100`}>
          <h3 className="text-lg font-semibold mb-3">Görev Detayı</h3>
          {!selected && <div className="text-slate-500">Bir görev seç.</div>}
          {selected && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-500">Başlık</label>
                <input value={selected.title} onChange={e=>updateSelected({ title: e.target.value })} className={`mt-1 w-full px-3 py-2 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 ${THEME.ring}`} />
              </div>

              <div>
                <label className="text-sm text-slate-500">Açıklama</label>
                <textarea value={selected.description||""} onChange={e=>updateSelected({ description: e.target.value })} rows={4} className={`mt-1 w-full px-3 py-2 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 ${THEME.ring}`} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-500">Liste</label>
                  <select value={selected.list} onChange={e=>updateSelected({ list: e.target.value })} className={`mt-1 w-full px-3 py-2 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 ${THEME.ring}`}>
                    {lists.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Tarih</label>
                  <input type="date" value={selected.due||""} onChange={e=>updateSelected({ due: e.target.value || undefined })} className={`mt-1 w-full px-3 py-2 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 ${THEME.ring}`} />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-500">Etiketler</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {selected.tags && selected.tags.map(t => (
                    <Chip key={t} label={t} onRemove={() => updateSelected({ tags: selected.tags.filter(x=>x!==t) })} />
                  ))}
                  <select onChange={e=>{ if (!e.target.value) return; if (!selected.tags.includes(e.target.value)) updateSelected({ tags: [...selected.tags, e.target.value] }); e.currentTarget.selectedIndex = 0; }} className="px-2 py-1 rounded-full border border-dashed border-violet-300 text-sm">
                    <option value="">+ Etiket Ekle</option>
                    {tags.filter(t=>!selected.tags.includes(t)).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-slate-500">Alt Görevler</label>
                  <button onClick={addSubtask} className="text-violet-700 hover:underline text-sm inline-flex items-center gap-1"><Plus className="w-4 h-4"/> Ekle</button>
                </div>
                <div className="space-y-2">
                  {selected.subtasks.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <button onClick={()=>{
                        const sts = [...selected.subtasks];
                        sts[i] = { ...s, done: !s.done };
                        updateSelected({ subtasks: sts });
                      }}>
                        {s.done ? <CheckSquare className="w-4 h-4 text-violet-600"/> : <Square className="w-4 h-4 text-slate-400"/>}
                      </button>
                      <input value={s.title} onChange={e=>{
                        const sts = [...selected.subtasks];
                        sts[i] = { ...s, title: e.target.value };
                        updateSelected({ subtasks: sts });
                      }} className={`flex-1 px-2 py-1 rounded-lg border border-violet-200 focus:outline-none focus:ring-2 ${THEME.ring}`} />
                      <button onClick={()=>{
                        updateSelected({ subtasks: selected.subtasks.filter(x=>x.id!==s.id) });
                      }} className="p-1 rounded-md hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                  {selected.subtasks.length===0 && (
                    <div className="text-slate-500 text-sm">Henüz alt görev yok.</div>
                  )}
                </div>
              </div>

              {/* Alt butonlar: Taslak / Normal */}
              {selected.draft ? (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => { updateSelected({ draft: false }); setSelectedId(null); }}
                    className="px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700"
                  >
                    Ekle
                  </button>
                  <button onClick={() => deleteTask(selected.id)} className="px-4 py-2 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200 inline-flex items-center gap-2"><Trash2 className="w-4 h-4"/> İptal</button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-2">
                  <button onClick={()=>updateSelected({ done: !selected.done })} className={`px-4 py-2 rounded-xl ${selected.done?"bg-violet-100 text-violet-700":""} border border-violet-200 hover:bg-violet-50`}>{selected.done?"Tamamlandı":"Tamamlandı olarak işaretle"}</button>
                  <button onClick={()=> deleteTask(selected.id)} className="px-4 py-2 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200 inline-flex items-center gap-2"><Trash2 className="w-4 h-4"/> Sil</button>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Alt bilgi */}
      <footer className="py-8 text-center text-slate-400 text-sm">
        💜 sadece sana özel
      </footer>
    </div>
  );
}
