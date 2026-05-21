'use client';

import { motion } from 'framer-motion';

interface SpotData {
  id: string;
  label: string;
  x: number;
  y: number;
  distance: 'mid' | 'long';
}

interface BasketballCourtProps {
  onSpotClick: (spotId: string, distance: 'mid' | 'long') => void;
  activeSpot?: string;
  completedSpots?: string[];
}

const SPOTS: SpotData[] = [
  // Mid-distance spots (5)
  { id: 'mid-0-left', label: '0° Mi-distance Gauche', x: 380, y: 140, distance: 'mid' },
  { id: 'mid-0-right', label: '0° Mi-distance Droite', x: 1136, y: 140, distance: 'mid' },
  { id: 'mid-45-left', label: '45° Mi-distance Gauche', x: 380, y: 500, distance: 'mid' },
  { id: 'mid-45-right', label: '45° Mi-distance Droite', x: 1136, y: 500, distance: 'mid' },
  { id: 'mid-front', label: 'Face Mi-distance', x: 758, y: 580, distance: 'mid' },
  
  // Long-distance spots (5) - 3-points
  { id: 'long-0-left', label: '0° 3-points Gauche', x: 200, y: 140, distance: 'long' },
  { id: 'long-0-right', label: '0° 3-points Droite', x: 1316, y: 140, distance: 'long' },
  { id: 'long-45-left', label: '45° 3-points Gauche', x: 220, y: 750, distance: 'long' },
  { id: 'long-45-right', label: '45° 3-points Droite', x: 1296, y: 750, distance: 'long' },
  { id: 'long-front', label: 'Face 3-points', x: 758, y: 900, distance: 'long' },
];

export default function BasketballCourt({ 
  onSpotClick, 
  activeSpot,
  completedSpots = []
}: BasketballCourtProps) {
  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <svg 
        viewBox="0 0 1516 1036" 
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
      >
        <defs>
          {/* Glow effect pour spots actifs */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Gradient pour les spots */}
          <linearGradient id="spotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
        </defs>
        
        {/* Fond noir du terrain */}
        <rect 
          x="0" 
          y="0" 
          width="1516" 
          height="1036" 
          fill="#2A2A2A"
        />
        
        {/* Zone rouge (paint) - gauche */}
        <path
          d="M 0 0 L 0 1036 L 480 1036 Q 480 518, 758 360 L 758 0 Z"
          fill="#DC143C"
        />
        
        {/* Zone rouge (paint) - droite */}
        <path
          d="M 1516 0 L 1516 1036 L 1036 1036 Q 1036 518, 758 360 L 758 0 Z"
          fill="#DC143C"
        />
        
        {/* Lignes blanches */}
        <g stroke="#FFFFFF" strokeWidth="4" fill="none">
          {/* Ligne de fond (baseline) */}
          <line x1="0" y1="1036" x2="1516" y2="1036" />
          
          {/* Arc 3-points */}
          <path d="M 0 1036 Q 0 518, 758 360 Q 1516 518, 1516 1036" />
          
          {/* Raquette (key) */}
          <rect x="503" y="690" width="510" height="346" />
          
          {/* Arc lancers francs - haut (solide) */}
          <path d="M 503 690 A 255 255 0 0 1 1013 690" />
          
          {/* Arc lancers francs - bas (pointillés) */}
          <path d="M 503 690 A 255 255 0 0 0 1013 690" strokeDasharray="15,15" />
          
          {/* Ligne médiane */}
          <line x1="0" y1="0" x2="1516" y2="0" />
          
          {/* Cercle central (demi) */}
          <path d="M 503 0 A 255 255 0 0 1 1013 0" />
          
          {/* Petit cercle central */}
          <circle cx="758" cy="0" r="60" />
        </g>
        
        {/* Panier */}
        <circle 
          cx="758" 
          cy="1020" 
          r="18" 
          fill="none" 
          stroke="#FF6B35" 
          strokeWidth="5"
        />
        <circle 
          cx="758" 
          cy="1020" 
          r="9" 
          fill="#FF6B35"
        />
        
        {/* SPOTS DE TIR - Positions exactes de l'image */}
        
        {/* 0° long - coin gauche haut */}
        <g className="court-spot" onClick={() => onSpotClick('long-0-left', 'long')}>
          <circle cx="200" cy="140" r="70" fill="url(#spotGradient)" stroke="#FFFFFF" strokeWidth="3" 
            style={{ cursor: 'pointer', filter: activeSpot === 'long-0-left' ? 'url(#glow)' : 'none' }} />
          <text x="200" y="135" textAnchor="middle" fill="#1A1A1A" fontSize="28" fontWeight="700" fontFamily="Archivo">0°</text>
          <text x="200" y="160" textAnchor="middle" fill="#1A1A1A" fontSize="24" fontWeight="600" fontFamily="Archivo">long</text>
        </g>
        
        {/* 0° mid - gauche */}
        <g className="court-spot" onClick={() => onSpotClick('mid-0-left', 'mid')}>
          <circle cx="380" cy="140" r="70" fill="url(#spotGradient)" stroke="#FFFFFF" strokeWidth="3"
            style={{ cursor: 'pointer', filter: activeSpot === 'mid-0-left' ? 'url(#glow)' : 'none' }} />
          <text x="380" y="135" textAnchor="middle" fill="#1A1A1A" fontSize="28" fontWeight="700" fontFamily="Archivo">0°</text>
          <text x="380" y="160" textAnchor="middle" fill="#1A1A1A" fontSize="24" fontWeight="600" fontFamily="Archivo">mid</text>
        </g>
        
        {/* 0° mid - droite */}
        <g className="court-spot" onClick={() => onSpotClick('mid-0-right', 'mid')}>
          <circle cx="1136" cy="140" r="70" fill="url(#spotGradient)" stroke="#FFFFFF" strokeWidth="3"
            style={{ cursor: 'pointer', filter: activeSpot === 'mid-0-right' ? 'url(#glow)' : 'none' }} />
          <text x="1136" y="135" textAnchor="middle" fill="#1A1A1A" fontSize="28" fontWeight="700" fontFamily="Archivo">0°</text>
          <text x="1136" y="160" textAnchor="middle" fill="#1A1A1A" fontSize="24" fontWeight="600" fontFamily="Archivo">mid</text>
        </g>
        
        {/* 0° long - coin droit haut */}
        <g className="court-spot" onClick={() => onSpotClick('long-0-right', 'long')}>
          <circle cx="1316" cy="140" r="70" fill="url(#spotGradient)" stroke="#FFFFFF" strokeWidth="3"
            style={{ cursor: 'pointer', filter: activeSpot === 'long-0-right' ? 'url(#glow)' : 'none' }} />
          <text x="1316" y="135" textAnchor="middle" fill="#1A1A1A" fontSize="28" fontWeight="700" fontFamily="Archivo">0°</text>
          <text x="1316" y="160" textAnchor="middle" fill="#1A1A1A" fontSize="24" fontWeight="600" fontFamily="Archivo">long</text>
        </g>
        
        {/* 45° mid - aile gauche */}
        <g className="court-spot" onClick={() => onSpotClick('mid-45-left', 'mid')}>
          <circle cx="380" cy="500" r="70" fill="url(#spotGradient)" stroke="#FFFFFF" strokeWidth="3"
            style={{ cursor: 'pointer', filter: activeSpot === 'mid-45-left' ? 'url(#glow)' : 'none' }} />
          <text x="380" y="495" textAnchor="middle" fill="#1A1A1A" fontSize="28" fontWeight="700" fontFamily="Archivo">45°</text>
          <text x="380" y="520" textAnchor="middle" fill="#1A1A1A" fontSize="24" fontWeight="600" fontFamily="Archivo">mid</text>
        </g>
        
        {/* face mid - centre ligne LF */}
        <g className="court-spot" onClick={() => onSpotClick('mid-front', 'mid')}>
          <circle cx="758" cy="580" r="70" fill="url(#spotGradient)" stroke="#FFFFFF" strokeWidth="3"
            style={{ cursor: 'pointer', filter: activeSpot === 'mid-front' ? 'url(#glow)' : 'none' }} />
          <text x="758" y="575" textAnchor="middle" fill="#1A1A1A" fontSize="28" fontWeight="700" fontFamily="Archivo">face</text>
          <text x="758" y="600" textAnchor="middle" fill="#1A1A1A" fontSize="24" fontWeight="600" fontFamily="Archivo">mid</text>
        </g>
        
        {/* 45° mid - aile droite */}
        <g className="court-spot" onClick={() => onSpotClick('mid-45-right', 'mid')}>
          <circle cx="1136" cy="500" r="70" fill="url(#spotGradient)" stroke="#FFFFFF" strokeWidth="3"
            style={{ cursor: 'pointer', filter: activeSpot === 'mid-45-right' ? 'url(#glow)' : 'none' }} />
          <text x="1136" y="495" textAnchor="middle" fill="#1A1A1A" fontSize="28" fontWeight="700" fontFamily="Archivo">45°</text>
          <text x="1136" y="520" textAnchor="middle" fill="#1A1A1A" fontSize="24" fontWeight="600" fontFamily="Archivo">mid</text>
        </g>
        
        {/* 45° long - coin gauche bas */}
        <g className="court-spot" onClick={() => onSpotClick('long-45-left', 'long')}>
          <circle cx="220" cy="750" r="70" fill="url(#spotGradient)" stroke="#FFFFFF" strokeWidth="3"
            style={{ cursor: 'pointer', filter: activeSpot === 'long-45-left' ? 'url(#glow)' : 'none' }} />
          <text x="220" y="745" textAnchor="middle" fill="#1A1A1A" fontSize="28" fontWeight="700" fontFamily="Archivo">45°</text>
          <text x="220" y="770" textAnchor="middle" fill="#1A1A1A" fontSize="24" fontWeight="600" fontFamily="Archivo">long</text>
        </g>
        
        {/* 45° long - coin droit bas */}
        <g className="court-spot" onClick={() => onSpotClick('long-45-right', 'long')}>
          <circle cx="1296" cy="750" r="70" fill="url(#spotGradient)" stroke="#FFFFFF" strokeWidth="3"
            style={{ cursor: 'pointer', filter: activeSpot === 'long-45-right' ? 'url(#glow)' : 'none' }} />
          <text x="1296" y="745" textAnchor="middle" fill="#1A1A1A" fontSize="28" fontWeight="700" fontFamily="Archivo">45°</text>
          <text x="1296" y="770" textAnchor="middle" fill="#1A1A1A" fontSize="24" fontWeight="600" fontFamily="Archivo">long</text>
        </g>
        
        {/* face long - bas centre */}
        <g className="court-spot" onClick={() => onSpotClick('long-front', 'long')}>
          <circle cx="758" cy="900" r="70" fill="url(#spotGradient)" stroke="#FFFFFF" strokeWidth="3"
            style={{ cursor: 'pointer', filter: activeSpot === 'long-front' ? 'url(#glow)' : 'none' }} />
          <text x="758" y="895" textAnchor="middle" fill="#1A1A1A" fontSize="28" fontWeight="700" fontFamily="Archivo">face</text>
          <text x="758" y="920" textAnchor="middle" fill="#1A1A1A" fontSize="24" fontWeight="600" fontFamily="Archivo">long</text>
        </g>
      </svg>
      
      {/* Légende */}
      <div className="flex justify-center gap-6 mt-6 text-sm font-medium">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-white"></div>
          <span>Mi-distance (5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-white"></div>
          <span>3-points (5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#4CAF50] border-2 border-white"></div>
          <span>Validé</span>
        </div>
      </div>
    </div>
  );
}