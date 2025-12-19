
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import LectureCard from './components/LectureCard';
import DetailView from './components/DetailView';
import { Lecture, View } from './types';
import { processLectureAudio } from './services/geminiService';

const INITIAL_LECTURES: Lecture[] = [
  {
    id: '1',
    title: 'Introducción a la Psicología - Semana 3',
    processedAt: 'Hace 2 horas',
    duration: '45 mins',
    fileName: 'psico_clase_03.mp3',
    fileSize: 45000000,
    transcript: "Bienvenidos a clase. Hoy vamos a sumergirnos en la historia de la psicología conductista...",
    summary: "### Conclusiones Clave\n- Enfoque en Pavlov y Skinner\n- Condicionamiento clásico vs Condicionamiento operante\n- Contexto histórico de la psicología del siglo XX"
  },
  {
    id: '2',
    title: 'Macroeconomía Avanzada - Clase 05',
    processedAt: 'Ayer',
    duration: '1h 12m',
    fileName: 'macro_05.wav',
    fileSize: 120000000,
    transcript: "Comencemos revisando el modelo IS-LM que discutimos en la última sesión...",
    summary: "### Resumen\n1. Revisión del modelo IS-LM\n2. Cambio hacia la macroeconomía de economía abierta\n3. Impactos de los tipos de cambio flotantes en la política nacional"
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.HOME);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('lectures');
    if (saved) {
      setLectures(JSON.parse(saved));
    } else {
      setLectures(INITIAL_LECTURES);
    }
  }, []);

  useEffect(() => {
    if (lectures.length > 0) {
      localStorage.setItem('lectures', JSON.stringify(lectures));
    }
  }, [lectures]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.endsWith('.m4a')) {
      setError("Por favor, sube un archivo de audio válido (MP3, WAV, M4A).");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setView(View.LOADING);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(file);
      const base64Audio = await base64Promise;

      const { transcript, summary } = await processLectureAudio(
        file.name,
        base64Audio,
        file.type || 'audio/mpeg'
      );

      const newLecture: Lecture = {
        id: Date.now().toString(),
        title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' '),
        processedAt: 'Recién subido',
        duration: 'Estimando...', 
        fileName: file.name,
        fileSize: file.size,
        transcript,
        summary
      };

      setLectures(prev => [newLecture, ...prev]);
      setSelectedLecture(newLecture);
      setView(View.DETAIL);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado durante el procesamiento.");
      setView(View.HOME);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const renderHome = () => (
    <div className="flex flex-col w-full max-w-[800px] gap-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col gap-4 text-center items-center">
        <h1 className="text-slate-900 dark:text-white text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">
          Transcribe tus Clases
        </h1>
        <h2 className="text-slate-500 dark:text-[#92adc9] text-base md:text-lg font-normal leading-normal max-w-xl">
          Transcripción impulsada por IA para estudiantes. Arrastra y suelta la grabación de tu clase abajo para obtener un resumen instantáneo.
        </h2>
      </div>

      <div className="bg-white dark:bg-[#182635] rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-[#233648]">
        <div 
          className="group relative flex flex-col items-center justify-center gap-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-[#324d67] px-6 py-16 transition-all hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-[#1e2f42] cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4 text-center z-10 pointer-events-none">
            <div className="size-16 rounded-full bg-blue-50 dark:bg-[#233648] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl text-primary">cloud_upload</span>
            </div>
            <div>
              <p className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">Arrastra y suelta archivos de audio aquí</p>
              <p className="text-slate-500 dark:text-[#92adc9] text-sm font-normal mt-2">Soporta MP3, WAV, M4A hasta 200MB</p>
            </div>
          </div>
          <button className="relative z-10 flex min-w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary hover:bg-blue-600 transition-all text-white text-base font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/20 active:scale-95">
            <span className="mr-2 material-symbols-outlined text-[20px]">folder_open</span>
            <span className="truncate">Explorar Ordenador</span>
          </button>
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept="audio/*,.m4a"
            onChange={handleFileChange}
          />
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Subidas Recientes</h3>
          <button className="text-primary text-sm font-semibold hover:text-blue-400">Ver Todas</button>
        </div>
        <div className="flex flex-col gap-3">
          {lectures.map(lec => (
            <LectureCard 
              key={lec.id} 
              lecture={lec} 
              onClick={(l) => {
                setSelectedLecture(l);
                setView(View.DETAIL);
              }} 
            />
          ))}
          {lectures.length === 0 && (
            <div className="text-center py-10 text-slate-500 border border-dashed border-slate-200 dark:border-border-dark rounded-xl">
              No hay subidas recientes. Sube tu primera clase para comenzar.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in duration-700">
      <div className="relative">
        <div className="size-24 rounded-full border-4 border-slate-200 dark:border-border-dark border-t-primary animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-3xl animate-pulse">graphic_eq</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold">Procesando tu Clase</h2>
        <p className="text-slate-500 dark:text-[#92adc9] max-w-sm">
          Gemini está transcribiendo el audio y generando un resumen completo para ti. Esto suele tardar menos de un minuto.
        </p>
      </div>
      <div className="flex gap-1 mt-4">
        {[0, 1, 2].map(i => (
          <div key={i} className={`size-2 rounded-full bg-primary animate-bounce`} style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen flex flex-col font-display selection:bg-primary selection:text-white">
      <Header onGoHome={() => { setView(View.HOME); setSelectedLecture(null); setError(null); }} />
      
      <main className="flex-1 w-full flex justify-center py-8 md:py-12 px-4 md:px-6">
        {view === View.HOME && renderHome()}
        {view === View.LOADING && renderLoading()}
        {view === View.DETAIL && selectedLecture && (
          <DetailView 
            lecture={selectedLecture} 
            onBack={() => { setView(View.HOME); setSelectedLecture(null); }} 
          />
        )}
      </main>

      <footer className="py-8 text-center text-slate-400 dark:text-[#536d85] text-sm border-t border-slate-200 dark:border-[#233648] mt-auto">
        <p>© {new Date().getFullYear()} AulaIA - Impulsado por Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;
