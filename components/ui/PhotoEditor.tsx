'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Loader2, RotateCcw, Scissors, X, ZoomIn } from 'lucide-react';
import { removeBackground } from '@/lib/removeBackground';

interface PhotoEditorProps {
  /** L'image choisie, en data URL. */
  source: string;
  onCancel: () => void;
  onValidate: (dataUrl: string) => void;
}

/** Côté de la photo enregistrée. Les cartes n'affichent jamais plus grand. */
const OUTPUT_SIZE = 500;

/** Côté du cadre de réglage à l'écran. */
const FRAME_SIZE = 280;

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface Offset {
  x: number;
  y: number;
}

/**
 * Dessine la photo recadrée dans un canevas carré.
 *
 * Le décalage est exprimé en fraction du cadre, pas en pixels : le même
 * réglage vaut pour l'aperçu à 280px et pour le rendu final à 500px.
 */
function drawCrop(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  zoom: number,
  offset: Offset,
  size: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = size;
  canvas.height = size;
  ctx.clearRect(0, 0, size, size);

  // Échelle « couverture » : le plus petit côté remplit le cadre.
  const base = size / Math.min(image.naturalWidth, image.naturalHeight);
  const drawnWidth = image.naturalWidth * base * zoom;
  const drawnHeight = image.naturalHeight * base * zoom;

  const x = (size - drawnWidth) / 2 + offset.x * size;
  const y = (size - drawnHeight) / 2 + offset.y * size;

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, x, y, drawnWidth, drawnHeight);
}

/** Empêche de sortir la photo du cadre : elle doit toujours le couvrir. */
function clampOffset(image: HTMLImageElement, zoom: number, offset: Offset): Offset {
  const base = 1 / Math.min(image.naturalWidth, image.naturalHeight);
  const width = image.naturalWidth * base * zoom;
  const height = image.naturalHeight * base * zoom;

  const maxX = Math.max(0, (width - 1) / 2);
  const maxY = Math.max(0, (height - 1) / 2);

  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

export default function PhotoEditor({ source, onCancel, onValidate }: PhotoEditorProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1.2);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });

  const [step, setStep] = useState<'crop' | 'result'>('crop');
  const [working, setWorking] = useState(false);
  const [cropped, setCropped] = useState<string | null>(null);
  const [cutout, setCutout] = useState<string | null>(null);
  const [useCutout, setUseCutout] = useState(true);
  const [notice, setNotice] = useState('');

  const frameRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number; offset: Offset } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = source;
  }, [source]);

  // Aperçu : redessiné à chaque réglage.
  useEffect(() => {
    if (!image || !frameRef.current) return;
    const ratio = window.devicePixelRatio || 1;
    drawCrop(frameRef.current, image, zoom, offset, FRAME_SIZE * ratio);
  }, [image, zoom, offset]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!image) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, offset };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag || !image) return;

    const next = {
      x: drag.offset.x + (e.clientX - drag.x) / FRAME_SIZE,
      y: drag.offset.y + (e.clientY - drag.y) / FRAME_SIZE,
    };
    setOffset(clampOffset(image, zoom, next));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleZoom = (value: number) => {
    if (!image) return;
    setZoom(value);
    setOffset((current) => clampOffset(image, value, current));
  };

  /** Recadre, puis tente le détourage. */
  const handleCrop = useCallback(async () => {
    if (!image) return;

    setWorking(true);
    setNotice('');

    const canvas = document.createElement('canvas');
    drawCrop(canvas, image, zoom, offset, OUTPUT_SIZE);
    const croppedUrl = canvas.toDataURL('image/png');
    setCropped(croppedUrl);

    try {
      const result = await removeBackground(canvas);

      /*
        Un détourage qui ne garde presque rien, ou presque tout, s'est trompé :
        on propose alors la photo entière par défaut plutôt qu'un fantôme.
      */
      if (result.coverage < 0.05 || result.coverage > 0.95) {
        setCutout(result.dataUrl);
        setUseCutout(false);
        setNotice('Détourage incertain sur cette photo — compare les deux avant de valider.');
      } else {
        setCutout(result.dataUrl);
        setUseCutout(true);
      }
    } catch (error) {
      console.error('Erreur détourage:', error);
      setCutout(null);
      setUseCutout(false);
      setNotice('Détourage indisponible (connexion ?). La photo est gardée telle quelle.');
    } finally {
      setWorking(false);
      setStep('result');
    }
  }, [image, zoom, offset]);

  const chosen = useCutout && cutout ? cutout : cropped;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 mobile:p-3">
      <div className="w-full max-w-md bg-[#0A1628] border border-[rgba(0,191,255,0.25)] rounded-2xl overflow-hidden max-h-[92dvh] flex flex-col">
        {/* En-tête */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-[rgba(0,191,255,0.15)]">
          <h3 className="text-lg font-bold text-[#F5F1E8]">
            {step === 'crop' ? 'Cadrer le visage' : 'Aperçu'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 shrink-0 rounded-lg bg-[rgba(245,241,232,0.06)] text-[rgba(245,241,232,0.6)] hover:bg-[rgba(245,241,232,0.12)] flex items-center justify-center active:scale-90 transition-all"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="scroll-area p-5 mobile:p-4">
          {step === 'crop' ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div
                  className="relative rounded-2xl overflow-hidden border-2 border-[rgba(0,191,255,0.35)] bg-[#06101f]"
                  style={{ width: FRAME_SIZE, height: FRAME_SIZE }}
                >
                  <canvas
                    ref={frameRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
                  />

                  {/* Repère du visage : le cercle montre ce que verront les
                      pastilles rondes de l'application. */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-[76%] h-[76%] rounded-full border border-dashed border-[rgba(245,241,232,0.35)]" />
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-[rgba(245,241,232,0.45)]">
                Glisse la photo pour la déplacer, et place le visage dans le cercle.
              </p>

              <div className="flex items-center gap-3">
                <ZoomIn size={16} className="shrink-0 text-[#00BFFF]" />
                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => handleZoom(parseFloat(e.target.value))}
                  className="w-full accent-[#00BFFF]"
                  aria-label="Zoom"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                {/* Pastille ronde */}
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden relative bg-[#06101f] border border-[rgba(0,191,255,0.2)]">
                    {chosen && (
                      <img
                        src={chosen}
                        alt=""
                        className="absolute w-[130%] h-[130%] max-w-none left-[-15%] top-[-10%] object-cover"
                      />
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-[rgba(245,241,232,0.4)] mt-2">PASTILLE</div>
                </div>

                {/* Vignette carte */}
                <div className="text-center">
                  <div className="w-24 h-28 rounded-xl overflow-hidden relative bg-gradient-to-b from-[#123a5c] to-[#0A1628] border border-[rgba(255,215,0,0.35)]">
                    {chosen && (
                      <img
                        src={chosen}
                        alt=""
                        className="absolute left-1/2 -translate-x-1/2 top-[-9%] w-[116%] max-w-none"
                        style={{
                          maskImage:
                            'radial-gradient(ellipse 82% 86% at 50% 46%, #000 66%, transparent 100%), linear-gradient(to bottom, #000 0%, #000 72%, transparent 100%)',
                          maskComposite: 'intersect',
                          WebkitMaskImage:
                            'radial-gradient(ellipse 82% 86% at 50% 46%, #000 66%, transparent 100%), linear-gradient(to bottom, #000 0%, #000 72%, transparent 100%)',
                          WebkitMaskComposite: 'source-in',
                        }}
                      />
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-[rgba(245,241,232,0.4)] mt-2">CARTE</div>
                </div>
              </div>

              {/* Choix fond retiré / fond gardé */}
              {cutout && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUseCutout(true)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                      useCutout
                        ? 'bg-[#00BFFF] text-[#0A1628] border-[#00BFFF]'
                        : 'bg-[rgba(0,191,255,0.06)] text-[rgba(245,241,232,0.7)] border-[rgba(0,191,255,0.2)]'
                    }`}
                  >
                    Fond retiré
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseCutout(false)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                      !useCutout
                        ? 'bg-[#00BFFF] text-[#0A1628] border-[#00BFFF]'
                        : 'bg-[rgba(0,191,255,0.06)] text-[rgba(245,241,232,0.7)] border-[rgba(0,191,255,0.2)]'
                    }`}
                  >
                    Garder le fond
                  </button>
                </div>
              )}

              {notice && (
                <p className="text-xs text-[#FFB400] bg-[rgba(255,180,0,0.08)] border border-[rgba(255,180,0,0.25)] rounded-lg px-3 py-2">
                  {notice}
                </p>
              )}

              <button
                type="button"
                onClick={() => setStep('crop')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(245,241,232,0.06)] text-[rgba(245,241,232,0.7)] text-sm font-bold hover:bg-[rgba(245,241,232,0.12)] active:scale-95 transition-all"
              >
                <RotateCcw size={15} />
                Revenir au cadrage
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex gap-3 px-5 py-4 border-t border-[rgba(0,191,255,0.12)] bg-[rgba(245,241,232,0.02)]">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[rgba(245,241,232,0.08)] text-[#F5F1E8] font-bold text-sm hover:bg-[rgba(245,241,232,0.15)] active:scale-95 transition-all"
          >
            Annuler
          </button>

          {step === 'crop' ? (
            <button
              type="button"
              onClick={handleCrop}
              disabled={!image || working}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00BFFF] text-[#0A1628] font-bold text-sm hover:bg-[#00A8E8] active:scale-95 transition-all disabled:opacity-50"
            >
              {working ? <Loader2 size={16} className="animate-spin" /> : <Scissors size={16} />}
              {working ? 'Détourage…' : 'Détourer'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => chosen && onValidate(chosen)}
              disabled={!chosen}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00BFFF] text-[#0A1628] font-bold text-sm hover:bg-[#00A8E8] active:scale-95 transition-all disabled:opacity-50"
            >
              <Check size={16} />
              Valider
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
