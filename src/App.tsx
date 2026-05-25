import { useState } from 'react';
import { Block } from './types';
import { GameCanvas } from './components/GameCanvas';
import { Hotbar } from './components/Hotbar';

export default function App() {
  const [selectedBlock, setSelectedBlock] = useState<Block>(Block.DIRT);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-sky-400 to-sky-200">
      <GameCanvas selectedBlock={selectedBlock} />
      <Hotbar selected={selectedBlock} onSelect={setSelectedBlock} />
      
      <div className="absolute top-4 left-4 bg-black/60 text-white/90 p-4 rounded-lg backdrop-blur-md shadow-xl pointer-events-none z-50">
        <h1 className="font-bold text-xl mb-3 text-green-400 font-sans tracking-tight">MineWeb 2D Builder</h1>
        <ul className="space-y-1.5 font-mono text-sm">
          <li className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-white/20 rounded">W/A/S/D or Space</span> <span>Move & Jump</span></li>
          <li className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-white/20 rounded">F</span> <span>Toggle Fly Mode</span></li>
          <li className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-white/20 rounded">Left Click</span> <span>Place Block</span></li>
          <li className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-white/20 rounded">Right Click</span> <span>Break Block</span></li>
          <li className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-white/20 rounded">Keys 1-0</span> <span>Select Tool</span></li>
        </ul>
      </div>
    </div>
  );
}
