'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  maxSizeMB?: number;
}

export default function ImageUpload({ value, onChange, maxSizeMB = 2 }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Seules les images sont acceptées');
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`Image trop lourde (max ${maxSizeMB}MB)`);
      return;
    }

    setLoading(true);

    try {
      const compressedBase64 = await compressImage(file);
      onChange(compressedBase64);
    } catch (err) {
      console.error('Erreur upload:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

    const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            
            let width = img.width;
            let height = img.height;

            if (width > height) {
            if (width > MAX_WIDTH) {
                height = (height * MAX_WIDTH) / width;
                width = MAX_WIDTH;
            }
            } else {
            if (height > MAX_HEIGHT) {
                width = (width * MAX_HEIGHT) / height;
                height = MAX_HEIGHT;
            }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
            reject('Erreur canvas');
            return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // ✅ DÉTECTION INTELLIGENTE DU FORMAT
            const isPng = file.type === 'image/png';
            const hasTransparency = isPng && checkTransparency(ctx, width, height);

            let compressedDataUrl: string;
            if (hasTransparency) {
            // Garde le PNG pour la transparence
            compressedDataUrl = canvas.toDataURL('image/png');
            } else {
            // JPEG plus léger pour les photos opaques
            compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            }

            resolve(compressedDataUrl);
        };
        img.onerror = () => reject('Erreur image');
        img.src = e.target?.result as string;
        };
        reader.onerror = () => reject('Erreur lecture');
        reader.readAsDataURL(file);
    });
    };

    // Vérifie si l'image a des pixels transparents
    const checkTransparency = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
    ): boolean => {
    try {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Échantillonnage : on check 1 pixel sur 100 pour la perf
        const step = 4 * 100;
        for (let i = 3; i < data.length; i += step) {
        if (data[i] < 255) {
            return true; // Pixel transparent trouvé
        }
        }
        
        // Check les coins en plus (souvent transparents)
        const corners = [
        0, 3, // top-left alpha
        (width - 1) * 4 + 3, // top-right alpha
        (height - 1) * width * 4 + 3, // bottom-left alpha
        ((height - 1) * width + (width - 1)) * 4 + 3, // bottom-right alpha
        ];
        
        for (const idx of corners) {
        if (data[idx] < 255) return true;
        }
        
        return false;
    } catch {
        // Si on peut pas lire (CORS, etc.), on assume PNG par sécurité
        return true;
    }
    };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        // Preview avec image
        <div className="relative group">
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)]">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {/* Overlay au hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleClick}
                className="flex items-center gap-2 px-4 py-2 bg-[#00BFFF] text-[#0A1628] rounded-lg font-bold hover:bg-[#00A8E8] transition-all"
              >
                <Upload size={16} />
                Changer
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-all"
              >
                <X size={16} />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Zone de drop / upload
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="w-full h-48 rounded-xl border-2 border-dashed border-[rgba(0,191,255,0.25)] bg-[rgba(0,191,255,0.04)] hover:bg-[rgba(0,191,255,0.08)] hover:border-[#00BFFF] transition-all flex flex-col items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={32} className="text-[#00BFFF] animate-spin" />
              <span className="text-sm text-[rgba(245,241,232,0.7)] font-medium">
                Chargement...
              </span>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-[rgba(0,191,255,0.1)] flex items-center justify-center group-hover:bg-[rgba(0,191,255,0.2)] transition-all">
                <Upload size={24} className="text-[#00BFFF]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#F5F1E8]">
                  Cliquez pour uploader
                </p>
                <p className="text-xs text-[rgba(245,241,232,0.4)] mt-1">
                  JPG, PNG, WEBP · Max {maxSizeMB}MB
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs text-red-400 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}