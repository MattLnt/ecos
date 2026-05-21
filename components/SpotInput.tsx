'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpotInputProps {
  spotId: string;
  spotLabel: string;
  distance: 'mid' | 'long';
  onComplete: (data: { made: number; freeThrowsMade: number; points: number }) => void;
  onCancel: () => void;
}

export default function SpotInput({ 
  spotId, 
  spotLabel, 
  distance,
  onComplete, 
  onCancel 
}: SpotInputProps) {
  const [made, setMade] = useState<number>(0);
  const [freeThrowsMade, setFreeThrowsMade] = useState<number | null>(null);
  const [step, setStep] = useState<'shots' | 'freethrows'>('shots');

  const handleShotsComplete = () => {
    setStep('freethrows');
  };

  const handleFreeThrowSelect = (ft: number) => {
    setFreeThrowsMade(ft);
    
    // Calcul du score avec multiplicateur
    let points = 0;
    if (ft === 0) {
      points = 0; // Spot non validé
    } else if (ft === 1) {
      points = made; // Score normal
    } else if (ft === 2) {
      points = made * 2; // Score doublé
    }
    
    setTimeout(() => {
      onComplete({ made, freeThrowsMade: ft, points });
    }, 300);
  };

  const shots = Array.from({ length: 11 }, (_, i) => i);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-md border-gradient"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl text-gradient">{spotLabel}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {distance === 'mid' ? 'Mi-distance' : '3-points'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'shots' && (
            <motion.div
              key="shots"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Paniers réussis</h3>
                <p className="text-sm text-gray-400">Sur 10 tentatives</p>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-6">
                {shots.map((num) => (
                  <motion.button
                    key={num}
                    onClick={() => setMade(num)}
                    className={`
                      relative h-16 rounded-lg font-bold text-2xl transition-all
                      ${made === num 
                        ? 'bg-gradient-to-br from-[#FF6B35] to-[#E85A28] text-white scale-105 glow-orange-strong' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {num}
                    {made === num && (
                      <motion.div
                        layoutId="selected"
                        className="absolute inset-0 rounded-lg border-2 border-white/50"
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              <button
                onClick={handleShotsComplete}
                className="btn btn-primary w-full"
                disabled={made === 0 && step === 'shots'}
              >
                Continuer vers les lancers francs →
              </button>
            </motion.div>
          )}

          {step === 'freethrows' && (
            <motion.div
              key="freethrows"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setStep('shots')}
                    className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    ← Retour
                  </button>
                  <div className="stat-card px-4 py-2">
                    <span className="text-sm text-gray-400">Paniers:</span>
                    <span className="ml-2 text-2xl font-bold text-gradient">{made}/10</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-2">Lancers francs</h3>
                <p className="text-sm text-gray-400">2 tentatives pour valider le spot</p>
              </div>

              <div className="space-y-3 mb-6">
                <motion.button
                  onClick={() => handleFreeThrowSelect(0)}
                  className={`
                    w-full p-6 rounded-lg border-2 transition-all text-left
                    ${freeThrowsMade === 0 
                      ? 'border-red-500 bg-red-500/20' 
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold mb-1">0/2</div>
                      <div className="text-sm text-gray-400">Spot non validé</div>
                    </div>
                    <div className="text-4xl font-bold text-red-500">0 pts</div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => handleFreeThrowSelect(1)}
                  className={`
                    w-full p-6 rounded-lg border-2 transition-all text-left
                    ${freeThrowsMade === 1 
                      ? 'border-yellow-500 bg-yellow-500/20' 
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold mb-1">1/2</div>
                      <div className="text-sm text-gray-400">Score normal</div>
                    </div>
                    <div className="text-4xl font-bold text-yellow-500">{made} pts</div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => handleFreeThrowSelect(2)}
                  className={`
                    w-full p-6 rounded-lg border-2 transition-all text-left
                    ${freeThrowsMade === 2 
                      ? 'border-green-500 bg-green-500/20' 
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold mb-1">2/2 🔥</div>
                      <div className="text-sm text-gray-400">Score doublé!</div>
                    </div>
                    <div className="text-4xl font-bold text-green-500">{made * 2} pts</div>
                  </div>
                </motion.button>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300">
                💡 <strong>Rappel:</strong> Les lancers francs déterminent si le spot est validé et le multiplicateur de points
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
