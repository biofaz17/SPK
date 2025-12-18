
import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '../types';
import { SparkyLogo } from '../components/SparkyLogo';
import { Play, Lock, Star, Calculator, BookOpen, FlaskConical, Globe2, Settings, LogOut, ArrowRight, UserCircle, Instagram, ShieldCheck, Mail, Brain, Music, Shapes, Puzzle } from 'lucide-react';
import { Button } from '../components/Button';
import { StatusIndicator } from '../components/StatusIndicator';

interface PlatformHubProps {
  user: UserProfile;
  onSelectGame: (gameId: string) => void;
  onLogout: () => void;
  onOpenParents: () => void;
}

const Tag: React.FC<{ text: string }> = ({ text }) => (
  <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] md:text-xs font-bold border border-white/10 backdrop-blur-sm">
    {text}
  </span>
);

export const PlatformHub: React.FC<PlatformHubProps> = ({ user, onSelectGame, onLogout, onOpenParents }) => {
  
  const currentYear = new Date().getFullYear();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden relative font-sans selection:bg-purple-500 selection:text-white flex flex-col">
      
      {/* Dynamic Space Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/30 rounded-full blur-[100px] animate-float"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navbar */}
      <header className="relative z-20 px-6 py-4 flex justify-between items-center bg-slate-900/50 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
              <Globe2 className="text-white" size={24} />
           </div>
           <div>
              <h1 className="font-heading text-xl leading-none tracking-wide">Universo do Aprender</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Plataforma Educativa</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Status de Sincronização */}
           <StatusIndicator className="hidden md:flex" />

           <div className="hidden md:flex items-center gap-3 bg-slate-800/50 px-4 py-1.5 rounded-full border border-white/10">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white shadow-inner">
                 {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                 <span className="opacity-60 text-xs block">Olá, explorador</span>
                 <span className="font-bold text-indigo-200">{user.name}</span>
              </div>
           </div>

           <button 
             onClick={onOpenParents}
             className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white border border-white/10"
             title="Área dos Pais"
           >
              <Settings size={20} />
           </button>
           
           <button 
             onClick={onLogout}
             className="p-2.5 bg-slate-800 hover:bg-red-900/50 rounded-xl transition text-slate-300 hover:text-red-400 border border-white/10"
             title="Sair"
           >
              <LogOut size={20} />
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 flex-1 w-full flex flex-col gap-8">
        
        {/* Header Text */}
        <div className="text-center md:text-left">
           <h2 className="text-2xl md:text-4xl font-heading mb-2">
             Pronto para a próxima missão?
           </h2>
           <p className="text-slate-400 text-sm md:text-base max-w-2xl">
             Escolha um mundo para explorar. Comece pela Aventura Principal ou pratique habilidades nos mini-jogos!
           </p>
        </div>

        {/* HERO BANNER: SPARKY ADVENTURE */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
            <div 
              onClick={() => onSelectGame('sparky')}
              className="
                group relative w-full
                bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900
                rounded-[2rem] p-8 md:p-10 overflow-hidden cursor-pointer 
                shadow-[0_0_40px_rgba(59,130,246,0.25)] hover:shadow-[0_0_60px_rgba(234,179,8,0.3)]
                border-4 border-yellow-500/40 hover:border-yellow-400 
                transition-all duration-300 hover:scale-[1.01]
              "
            >
                {/* Premium Shine Effect */}
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-yellow-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                
                {/* Background Elements */}
                <div className="absolute right-[-50px] top-[-50px] w-[400px] h-[400px] bg-blue-500 opacity-10 rounded-full blur-[80px] group-hover:opacity-20 transition duration-500"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 text-center md:text-left space-y-4">
                      <div className="inline-flex items-center gap-2 bg-yellow-500/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-yellow-500/50 text-yellow-200 animate-pulse shadow-lg">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" /> Aventura Principal
                      </div>
                      
                      <h3 className="text-4xl md:text-6xl font-heading leading-tight text-white drop-shadow-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                        Aventura do Sparky
                      </h3>
                      <p className="text-indigo-200 text-base md:text-xl font-medium leading-relaxed max-w-2xl">
                        Aprenda lógica de programação ajudando um robô simpático a superar obstáculos. A jornada completa do iniciante ao mestre!
                      </p>
                      
                      <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                        <Tag text="Lógica Pura" />
                        <Tag text="Sequência" />
                        <Tag text="Loops & Condicionais" />
                        <Tag text="BNCC: Computação" />
                      </div>

                      <div className="pt-4">
                        <Button variant="primary" size="lg" className="shadow-xl shadow-yellow-900/30 w-full md:w-auto px-10 py-4 text-xl bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-none hover:brightness-110 ring-2 ring-yellow-400/50">
                            <Play fill="currentColor" className="mr-3" size={24} /> JOGAR AGORA
                        </Button>
                      </div>
                  </div>

                  <div className="flex-shrink-0 relative">
                      <div className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full scale-75 animate-pulse"></div>
                      <div className="transform group-hover:scale-110 group-hover:rotate-6 transition duration-500 drop-shadow-2xl filter brightness-110 relative z-10">
                        <SparkyLogo size="xl" showText={false} />
                      </div>
                  </div>
                </div>
            </div>
        </motion.div>

        {/* MINI GAMES GRID */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
           {/* GAME 2: MATH */}
           <GameCard 
              id="math"
              title="Matemática"
              description="Feitiços numéricos."
              icon={<Calculator size={28} />}
              color="from-emerald-500 to-teal-600"
              tags={['Soma', 'Subtração']}
              onSelect={() => onSelectGame('math')}
           />

           {/* GAME 3: LANGUAGE */}
           <GameCard 
              id="words"
              title="Palavras"
              description="Complete frases."
              icon={<BookOpen size={28} />}
              color="from-orange-500 to-red-500"
              tags={['Leitura']}
              onSelect={() => onSelectGame('words')}
           />

           {/* GAME 4: SCIENCE */}
           <GameCard 
              id="science"
              title="Ciências"
              description="Laboratório Dino."
              icon={<FlaskConical size={28} />}
              color="from-purple-500 to-pink-600"
              tags={['Natureza']}
              onSelect={() => onSelectGame('science')}
           />

           {/* GAME 5: MEMORY */}
           <GameCard 
              id="memory"
              title="Memória"
              description="Ache os pares."
              icon={<Brain size={28} />}
              color="from-cyan-500 to-blue-600"
              tags={['Foco']}
              onSelect={() => onSelectGame('memory')}
           />

           {/* GAME 6: RHYTHM */}
           <GameCard 
              id="rhythm"
              title="Ritmo"
              description="Repita o som."
              icon={<Music size={28} />}
              color="from-pink-500 to-rose-600"
              tags={['Padrões']}
              onSelect={() => onSelectGame('rhythm')}
           />

           {/* GAME 7: GEOMETRY */}
           <GameCard 
              id="geometry"
              title="Geometria"
              description="Formas espaciais."
              icon={<Shapes size={28} />}
              color="from-yellow-500 to-orange-600"
              tags={['Formas']}
              onSelect={() => onSelectGame('geometry')}
           />

           {/* GAME 8: LOGIC */}
           <GameCard 
              id="logic"
              title="Lógica"
              description="Siga a sequência."
              icon={<Puzzle size={28} />}
              color="from-indigo-500 to-violet-600"
              tags={['Raciocínio']}
              onSelect={() => onSelectGame('logic')}
           />
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-slate-900 text-slate-400 text-center z-10 border-t border-white/10 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-y-3 gap-x-6 text-[10px] md:text-xs font-bold px-4">
           
           <div className="flex items-center gap-1">
             <span>© {currentYear} TekTok TI.</span>
           </div>
           
           <span className="hidden md:inline text-slate-700">|</span>

           <div className="flex items-center gap-1">
             <span>Criado por: Prof. Fabio Gouvêa Cabral T.</span>
           </div>

           <span className="hidden md:inline text-slate-700">|</span>
           
           <a 
             href="https://instagram.com/sparky.aventura" 
             target="_blank" 
             rel="noreferrer"
             className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
           >
             <Instagram size={14} className="text-pink-500" />
             <span>@sparky.aventura</span>
           </a>

           <span className="hidden md:inline text-slate-700">|</span>

           <div className="flex items-center gap-1.5">
             <ShieldCheck size={14} className="text-blue-500" />
             <span>CNPJ 14.773.860/0001-72</span>
           </div>
           
           <span className="hidden md:inline text-slate-700">|</span>
           
           <a 
             href="mailto:robotix28@gmail.com?subject=Suporte%20Sparky" 
             className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
           >
             <Mail size={14} className="text-indigo-400" />
             <span>Suporte</span>
           </a>
        </div>
      </footer>
    </div>
  );
};

const GameCard = ({ id, title, description, icon, color, tags, onSelect }: any) => (
  <motion.div 
    onClick={onSelect}
    variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
    className="
      relative h-full bg-slate-800/60 backdrop-blur-sm rounded-[1.5rem] p-6 
      border border-slate-700/50 flex flex-col overflow-hidden group 
      hover:border-white/30 hover:bg-slate-800/90 transition-all cursor-pointer 
      hover:scale-[1.05] shadow-lg hover:shadow-xl
    "
  >
      <div className={`absolute top-0 right-0 p-3 bg-gradient-to-bl ${color} rounded-bl-[1.5rem] text-white/90 shadow-md group-hover:scale-110 transition-transform`}>
         {icon}
      </div>
      
      <div className="mb-4 pt-1">
         <div className="inline-flex items-center gap-1.5 bg-green-500/10 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-green-400 border border-green-500/20">
            <Play size={8} fill="currentColor" /> Play
         </div>
      </div>

      <h3 className="text-xl font-heading text-slate-100 mb-1 group-hover:text-white transition-colors">{title}</h3>
      <p className="text-slate-400 text-xs font-medium mb-4 leading-relaxed flex-1">
         {description}
      </p>

      <div className="flex flex-wrap gap-1.5 mt-auto opacity-70 group-hover:opacity-100 transition-opacity">
         {tags.map((t: string) => <Tag key={t} text={t} />)}
      </div>
  </motion.div>
);
