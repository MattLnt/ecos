'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';

interface PhotoUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export default function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    // Limiter la taille à 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Image trop grande (max 5MB)');
      return;
    }

    setUploading(true);

    try {
      // Convertir en base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onChange(base64);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors du chargement de la photo');
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block font-mono text-[11px] text-[rgba(245,241,232,0.55)] uppercase tracking-wider mb-3">
        Photo
      </label>

      <div className="flex items-center gap-4">
        {/* Preview */}
        {value && (
          <div className="relative">
            <img
              src={value}
              alt="Preview"
              className="w-20 h-20 rounded-full object-cover border-2 border-[rgba(0,191,255,0.15)]"
            />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute -top-2 -right-2 w-6 h-6 bg-[#FF6B35] rounded-full flex items-center justify-center hover:bg-[#ff5520] transition-all"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        )}

        {/* Upload button */}
        <label className="flex items-center gap-2 px-4 py-3 bg-[rgba(0,191,255,0.1)] border border-[rgba(0,191,255,0.15)] rounded-lg text-[#00BFFF] cursor-pointer hover:bg-[rgba(0,191,255,0.15)] transition-all">
          <Upload size={18} />
          <span className="text-sm font-medium">
            {uploading ? 'Chargement...' : value ? 'Changer' : 'Choisir une photo'}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      <p className="text-[11px] text-[rgba(245,241,232,0.35)] mt-2">
        JPG, PNG ou WEBP • Max 5MB
      </p>
    </div>
  );
}