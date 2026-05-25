import { useEffect, useRef } from 'react';
import { GameEngine } from '../game/GameEngine';
import { Block } from '../types';

interface GameCanvasProps {
    selectedBlock: Block;
}

export function GameCanvas({ selectedBlock }: GameCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        
        const engine = new GameEngine(canvasRef.current);
        engineRef.current = engine;
        engine.start();

        return () => {
            engine.stop();
            engineRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (engineRef.current) {
            engineRef.current.selectedBlock = selectedBlock;
        }
    }, [selectedBlock]);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none" 
        />
    );
}
