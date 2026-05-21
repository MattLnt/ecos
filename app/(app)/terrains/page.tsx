'use client';

import { useState, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';

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

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setEditedSpots(prev =>
      prev.map(spot =>
        spot.num === draggedSpot ? { ...spot, x, y } : spot
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-[#F5F1E8] tracking-tight mobile:text-3xl">
            Configuration du terrain
          </h1>
          <p className="text-[rgba(245,241,232,0.55)] mt-2">
            {isEditing ? 'Déplacez les spots sur le terrain' : 'Visualisez et modifiez les positions des spots'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl text-red-400 font-bold hover:bg-[rgba(239,68,68,0.15)] transition-all flex items-center gap-2"
              >
                <X size={18} />
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 bg-[#00BFFF] rounded-xl text-[#0A1628] font-bold hover:bg-[#00A8E8] transition-all flex items-center gap-2 shadow-lg shadow-[rgba(0,191,255,0.3)]"
              >
                <Save size={18} />
                Enregistrer
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 bg-[#00BFFF] rounded-xl text-[#0A1628] font-bold hover:bg-[#00A8E8] transition-all flex items-center gap-2 shadow-lg shadow-[rgba(0,191,255,0.3)]"
            >
              <Edit2 size={18} />
              Modifier
            </button>
          )}
        </div>
      </div>

      {/* Terrain */}
      <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-8">
        <div
          className="relative w-full h-[600px] bg-[#1a2942] rounded-2xl overflow-hidden"
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
          {spotsToDisplay.map((spot) => (
            <div
              key={spot.num}
              className={`absolute ${isEditing ? 'cursor-move' : 'cursor-default'}`}
              style={{
                left: `${spot.x}px`,
                top: `${spot.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              draggable={isEditing}
              onDragStart={() => handleDragStart(spot.num)}
            >
              <div className="relative">
                {/* Spot circle */}
                <div className="w-16 h-16 bg-gradient-to-br from-[rgba(0,191,255,0.25)] to-[rgba(0,191,255,0.15)] border-2 border-[#00BFFF] rounded-full flex items-center justify-center shadow-lg shadow-[rgba(0,191,255,0.2)]">
                  <span className="text-xl font-black text-[#00BFFF]">{spot.num}</span>
                </div>

                {/* Label */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap">
                  <div className="text-xs font-bold text-[#00BFFF] text-center">{spot.label}</div>
                  <div className="text-[10px] text-[rgba(245,241,232,0.5)] text-center">{spot.sub}</div>
                </div>
              </div>
            </div>
          ))}
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