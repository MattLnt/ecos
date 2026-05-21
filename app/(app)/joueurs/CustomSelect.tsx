'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

export default function CustomSelect({ value, onChange, options, placeholder = 'Sélectionner' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-lg text-[#F5F1E8] focus:outline-none focus:border-[#00BFFF] transition-all flex items-center justify-between"
      >
        <span className={!selectedOption ? 'text-[rgba(245,241,232,0.35)]' : ''}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`text-[rgba(245,241,232,0.55)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#0d1f38] border border-[rgba(0,191,255,0.15)] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="max-h-[240px] overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left transition-all ${
                  value === option.value
                    ? 'bg-[#00BFFF] text-[#0A1628] font-semibold'
                    : 'text-[#F5F1E8] hover:bg-[rgba(0,191,255,0.1)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}