
import React from 'react';
import { Button } from '../components/Button';
import { Play, Sparkles, Code, Star } from 'lucide-react';
import { SparkyLogo } from '../components/SparkyLogo';

interface HomeScreenProps {
  onStart: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-500 to-indigo-600 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
      
      {/* Background Patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2px)', backgroundSize: '30px 30px' }}>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 text-yellow-300 animate-bounce delay-700 opacity-60"><Code size={48} /></div>
      <div className="absolute bottom-20 right-10 text-blue-200 animate-pulse delay-300 opacity-60"><Star size={64} /></div>
      <div className="absolute top-1/3 right-10 text-white animate-spin-slow opacity-20"><Sparkles size={80} /></div>

      <div className="bg-white/95 backdrop-blur-xl p-8 md:p-16 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-8 border-white max-w-2xl w-full relative z-10 transform hover:scale-[1.01] transition-transform duration-500">
        
        {/* Logo Section */}
        <div className="mb-10 animate-float flex justify-center">
            <SparkyLogo size="xl" />
        </div>

        <div className="space-y-6">
            <h2 className="text-xl md:text-2xl text-slate-500 font-bold uppercase tracking-widest">
              Aprenda Lógica Brincando
            </h2>

            <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
              Junte-se ao robô <strong className="text-blue-600">Sparky</strong> e conecte blocos para resolver desafios incríveis no espaço e na floresta!
            </p>

            <div className="pt-4 flex flex-col items-center gap-4">
              <Button onClick={onStart} size="lg" variant="primary" className="w-full md:w-auto px-12 py-5 text-2xl shadow-blue-300 shadow-xl hover:shadow-2xl scale-110 hover:scale-115 transition-all">
                <Play fill="currentColor" className="mr-2" /> COMEÇAR
              </Button>
              
              <p className="text-xs text-slate-400 font-bold mt-2">
                Ideal para crianças de 7 a 14 anos
              </p>
            </div>
        </div>
      </div>
      
      <footer className="absolute bottom-4 text-blue-100 text-xs font-medium opacity-60">
        © 2024 Sparky Educação Digital
      </footer>
    </div>
  );
};
