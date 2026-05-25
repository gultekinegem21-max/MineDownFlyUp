import { useEffect } from 'react';
import { Block } from '../types';
import { Pickaxe } from 'lucide-react';

const BlockIcon = ({ block }: { block: Block }) => {
    switch (block) {
        case Block.AIR:
            return <Pickaxe size={24} className="text-gray-300 drop-shadow-md" />;
        case Block.DIRT:
            return <div className="w-6 h-6 md:w-8 md:h-8 bg-[#79553A] border border-[#5A3F2A] shadow-sm pointer-events-none" />;
        case Block.GRASS:
            return (
                <div className="w-6 h-6 md:w-8 md:h-8 bg-[#79553A] relative border border-[#5A3F2A] overflow-hidden shadow-sm pointer-events-none">
                    <div className="absolute top-0 inset-x-0 h-[30%] bg-[#597D27]" />
                </div>
            );
        case Block.STONE:
            return <div className="w-6 h-6 md:w-8 md:h-8 bg-[#7D7D7D] border border-[#5A5A5A] shadow-sm pointer-events-none" />;
        case Block.WOOD:
            return (
                <div className="w-6 h-6 md:w-8 md:h-8 flex bg-[#5C4A3D] border border-[#3A2B1C] shadow-sm pointer-events-none">
                    <div className="flex-1 border-x border-[#4A3B2C]" />
                </div>
            );
        case Block.LEAVES:
            return <div className="w-6 h-6 md:w-8 md:h-8 bg-[#4A7C29] opacity-90 border border-[#3A5C19] shadow-sm pointer-events-none" />;
        case Block.SAND:
            return <div className="w-6 h-6 md:w-8 md:h-8 bg-[#D2C18A] border border-[#C1B079] shadow-sm pointer-events-none" />;
        case Block.WATER:
            return <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-500/70 border border-blue-600/50 shadow-sm pointer-events-none" />;
        case Block.BRICK:
            return (
                <div className="w-6 h-6 md:w-8 md:h-8 bg-[#9C4A36] flex flex-col justify-around border border-[#7A3A26] shadow-sm p-[1px] pointer-events-none">
                    <div className="h-[2px] w-full bg-[#D4D4D4]" />
                    <div className="h-[2px] w-full bg-[#D4D4D4]" />
                </div>
            );
        case Block.GLASS:
            return <div className="w-6 h-6 md:w-8 md:h-8 bg-white/20 border-2 border-white/60 shadow-sm pointer-events-none" />;
        default:
            return null;
    }
};

const INVENTORY_ITEMS = [
    Block.AIR,
    Block.DIRT,
    Block.GRASS,
    Block.STONE,
    Block.WOOD,
    Block.LEAVES,
    Block.SAND,
    Block.WATER,
    Block.BRICK,
    Block.GLASS
];

interface HotbarProps {
    selected: Block;
    onSelect: (block: Block) => void;
}

export function Hotbar({ selected, onSelect }: HotbarProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const num = parseInt(e.key);
            if (!isNaN(num)) {
                // 1 -> index 0, 2 -> index 1, 0 -> index 9
                const index = num === 0 ? 9 : num - 1;
                const blockKey = INVENTORY_ITEMS[index];
                if (blockKey !== undefined) {
                    onSelect(blockKey);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSelect]);

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/40 p-2 rounded-lg backdrop-blur-sm border-2 border-slate-700/50 shadow-2xl z-50">
            {INVENTORY_ITEMS.map((block, i) => (
                <button
                    key={i}
                    onClick={() => onSelect(block)}
                    className={`relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center border-[3px] 
                        ${selected === block ? 'border-white/90 scale-105 z-10' : 'border-gray-500/80'} 
                        bg-gray-800/80 shadow-inner hover:bg-gray-700 transition-all rounded`}
                >
                    <span className="absolute top-0.5 left-1 text-[10px] text-white/80 font-mono font-bold drop-shadow-md pointer-events-none">
                        {(i + 1) % 10}
                    </span>
                    <BlockIcon block={block} />
                </button>
            ))}
        </div>
    );
}
