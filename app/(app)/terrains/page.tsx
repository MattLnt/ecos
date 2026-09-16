'use client';

import { useState, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { COURT_W, COURT_H } from '@/components/shooting/constants';

interface SpotConfig {
  num: number;
  x: number;
  y: number;
  label: string;
  sub: string;
}

interface CourtConfig {
  id: string;
  name: string;
  spots: SpotConfig[];
}

export default function TerrainsPage() {
  const [court, setCourt] = useState<CourtConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSpots, setEditedSpots] = useState<SpotConfig[]>([]);
  const [draggedSpot, setDraggedSpot] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourt();
  }, []);

  const fetchCourt = async () => {
    try {
      const res = await fetch('/api/terrains/default');
      const data = await res.json();
      setCourt(data);
      setEditedSpots(data.spots);
    } catch (error) {
      console.error('Erreur fetch terrain:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/terrains/default', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spots: editedSpots }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCourt(updated);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Erreur save terrain:', error);
    }
  };

  const handleCancel = () => {
    setEditedSpots(court?.spots || []);
    setIsEditing(false);
  };

  const handleDragStart = (spotNum: number) => {
    setDraggedSpot(spotNum);
  };

  const handleDrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedSpot === null) return;

    // Les spots sont stockés en coordonnées terrain (0..COURT_W / 0..COURT_H),
    // pas en pixels : on reconvertit la position du clic, sinon on écrit des
    // pixels dans la config que la page de session relit ensuite.
    const rect = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number, max: number) => Math.min(max, Math.max(0, v));
    const x = clamp(((e.clientX - rect.left) / rect.width) * COURT_W, COURT_W);
    const y = clamp(((e.clientY - rect.top) / rect.height) * COURT_H, COURT_H);

    setEditedSpots(prev =>
      prev.map(spot =>
        spot.num === draggedSpot
          ? { ...spot, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
          : spot
      )
    );

    setDraggedSpot(null);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
      </div>
    );
  }

  const spotsToDisplay = isEditing ? editedSpots : court?.spots || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mobile:flex-col mobile:items-stretch">
        <div>
          <h1 className="text-4xl font-extrabold text-[#F5F1E8] tracking-tight mobile:text-2xl">
            Configuration du terrain
          </h1>
          <p className="text-[rgba(245,241,232,0.55)] mt-2 mobile:mt-1 mobile:text-sm">
            {isEditing ? 'Déplacez les spots sur le terrain' : 'Visualisez et modifiez les positions des spots'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex-1 px-5 py-2.5 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl text-red-400 font-bold hover:bg-[rgba(239,68,68,0.15)] active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <X size={18} />
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-5 py-2.5 bg-[#00BFFF] rounded-xl text-[#0A1628] font-bold hover:bg-[#00A8E8] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[rgba(0,191,255,0.3)] whitespace-nowrap"
              >
                <Save size={18} />
                Enregistrer
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 px-5 py-2.5 bg-[#00BFFF] rounded-xl text-[#0A1628] font-bold hover:bg-[#00A8E8] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[rgba(0,191,255,0.3)] whitespace-nowrap"
            >
              <Edit2 size={18} />
              Modifier
            </button>
          )}
        </div>
      </div>

      {/* Terrain — ratio fixe plutôt qu'une hauteur figée, sinon la moitié de
          l'écran d'un téléphone est occupée par une zone quasi vide. */}
      <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-8 mobile:p-3">
        <div
          className="relative w-full max-w-[720px] mx-auto aspect-[50/47] bg-[#1a2942] rounded-2xl overflow-hidden"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 191, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 191, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
          onClick={isEditing ? handleDrop : undefined}
        >
          {/* Demi-cercle central */}
          <div
            className="absolute border-2 border-[rgba(0,191,255,0.15)] rounded-full"
            style={{
              width: '180px',
              height: '180px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Ligne centrale */}
          <div
            className="absolute w-full h-0.5 bg-[rgba(0,191,255,0.15)]"
            style={{ top: '50%' }}
          />

          {/* Spots */}
          {spotsToDisplay.map((spot) => {
            const isSelected = draggedSpot === spot.num;
            return (
              <div
                key={spot.num}
                className={`absolute ${isEditing ? 'cursor-move' : 'cursor-default'}`}
                style={{
                  // Positionnement proportionnel : le terrain garde ses
                  // proportions quelle que soit la largeur de l'écran.
                  left: `${(spot.x / COURT_W) * 100}%`,
                  top: `${(spot.y / COURT_H) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                draggable={isEditing}
                onDragStart={() => handleDragStart(spot.num)}
                // Le drag HTML5 n'existe pas au doigt : en édition, un appui
                // sélectionne le spot, l'appui suivant sur le terrain le place.
                onClick={(e) => {
                  if (!isEditing) return;
                  e.stopPropagation();
                  setDraggedSpot(isSelected ? null : spot.num);
                }}
              >
                <div className="relative">
                  {/* Spot circle */}
                  <div
                    className={`w-12 h-12 mobile:w-9 mobile:h-9 bg-gradient-to-br from-[rgba(0,191,255,0.25)] to-[rgba(0,191,255,0.15)] border-2 rounded-full flex items-center justify-center shadow-lg shadow-[rgba(0,191,255,0.2)] transition-all ${
                      isSelected ? 'border-[#FFB400] scale-110 shadow-[0_0_20px_rgba(255,180,0,0.5)]' : 'border-[#00BFFF]'
                    }`}
                  >
                    <span className={`text-lg mobile:text-sm font-black ${isSelected ? 'text-[#FFB400]' : 'text-[#00BFFF]'}`}>
                      {spot.num}
                    </span>
                  </div>

                  {/* Label — masqué en mobile, les 10 pastilles se chevauchent */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap mobile:hidden">
                    <div className="text-xs font-bold text-[#00BFFF] text-center">{spot.label}</div>
                    <div className="text-[10px] text-[rgba(245,241,232,0.5)] text-center">{spot.sub}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions en mode édition */}
      {isEditing && (
        <div className="bg-gradient-to-br from-[rgba(0,191,255,0.08)] to-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.2)] rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#00BFFF] rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-[#0A1628] font-bold text-sm">💡</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F5F1E8] mb-2">Mode édition</h3>
              <ul className="space-y-1 text-sm text-[rgba(245,241,232,0.7)]">
                <li>• Cliquez et maintenez un spot pour le déplacer</li>
                <li>• Relâchez pour positionner le spot</li>
                <li>• Les modifications seront appliquées aux prochaines sessions</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}