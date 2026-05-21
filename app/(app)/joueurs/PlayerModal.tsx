'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string | null;
  number?: number | null;
  position?: string | null;
  photo?: string | null;
  avatar: string;
  nbaTeam?: string | null;
}

interface PlayerModalProps {
  player: Player | null;
  onClose: () => void;
}

const NBA_TEAMS = [
  { code: 'ATL', name: 'Atlanta Hawks', logo: 'https://cdn.nba.com/logos/nba/1610612737/global/L/logo.svg' },
  { code: 'BOS', name: 'Boston Celtics', logo: 'https://cdn.nba.com/logos/nba/1610612738/global/L/logo.svg' },
  { code: 'BKN', name: 'Brooklyn Nets', logo: 'https://cdn.nba.com/logos/nba/1610612751/global/L/logo.svg' },
  { code: 'CHO', name: 'Charlotte Hornets', logo: 'https://cdn.nba.com/logos/nba/1610612766/global/L/logo.svg' },
  { code: 'CHI', name: 'Chicago Bulls', logo: 'https://cdn.nba.com/logos/nba/1610612741/global/L/logo.svg' },
  { code: 'CLE', name: 'Cleveland Cavaliers', logo: 'https://cdn.nba.com/logos/nba/1610612739/global/L/logo.svg' },
  { code: 'DAL', name: 'Dallas Mavericks', logo: 'https://cdn.nba.com/logos/nba/1610612742/global/L/logo.svg' },
  { code: 'DEN', name: 'Denver Nuggets', logo: 'https://cdn.nba.com/logos/nba/1610612743/global/L/logo.svg' },
  { code: 'DET', name: 'Detroit Pistons', logo: 'https://cdn.nba.com/logos/nba/1610612765/global/L/logo.svg' },
  { code: 'GSW', name: 'Golden State Warriors', logo: 'https://cdn.nba.com/logos/nba/1610612744/global/L/logo.svg' },
  { code: 'HOU', name: 'Houston Rockets', logo: 'https://cdn.nba.com/logos/nba/1610612745/global/L/logo.svg' },
  { code: 'IND', name: 'Indiana Pacers', logo: 'https://cdn.nba.com/logos/nba/1610612754/global/L/logo.svg' },
  { code: 'LAC', name: 'LA Clippers', logo: 'https://cdn.nba.com/logos/nba/1610612746/global/L/logo.svg' },
  { code: 'LAL', name: 'LA Lakers', logo: 'https://cdn.nba.com/logos/nba/1610612747/global/L/logo.svg' },
  { code: 'MEM', name: 'Memphis Grizzlies', logo: 'https://cdn.nba.com/logos/nba/1610612763/global/L/logo.svg' },
  { code: 'MIA', name: 'Miami Heat', logo: 'https://cdn.nba.com/logos/nba/1610612748/global/L/logo.svg' },
  { code: 'MIL', name: 'Milwaukee Bucks', logo: 'https://cdn.nba.com/logos/nba/1610612749/global/L/logo.svg' },
  { code: 'MIN', name: 'Minnesota Timberwolves', logo: 'https://cdn.nba.com/logos/nba/1610612750/global/L/logo.svg' },
  { code: 'NOP', name: 'New Orleans Pelicans', logo: 'https://cdn.nba.com/logos/nba/1610612740/global/L/logo.svg' },
  { code: 'NYK', name: 'New York Knicks', logo: 'https://cdn.nba.com/logos/nba/1610612752/global/L/logo.svg' },
  { code: 'OKC', name: 'Oklahoma City Thunder', logo: 'https://cdn.nba.com/logos/nba/1610612760/global/L/logo.svg' },
  { code: 'ORL', name: 'Orlando Magic', logo: 'https://cdn.nba.com/logos/nba/1610612753/global/L/logo.svg' },
  { code: 'PHI', name: 'Philadelphia 76ers', logo: 'https://cdn.nba.com/logos/nba/1610612755/global/L/logo.svg' },
  { code: 'PHX', name: 'Phoenix Suns', logo: 'https://cdn.nba.com/logos/nba/1610612756/global/L/logo.svg' },
  { code: 'POR', name: 'Portland Trail Blazers', logo: 'https://cdn.nba.com/logos/nba/1610612757/global/L/logo.svg' },
  { code: 'SAC', name: 'Sacramento Kings', logo: 'https://cdn.nba.com/logos/nba/1610612758/global/L/logo.svg' },
  { code: 'SAS', name: 'San Antonio Spurs', logo: 'https://cdn.nba.com/logos/nba/1610612759/global/L/logo.svg' },
  { code: 'TOR', name: 'Toronto Raptors', logo: 'https://cdn.nba.com/logos/nba/1610612761/global/L/logo.svg' },
  { code: 'UTA', name: 'Utah Jazz', logo: 'https://cdn.nba.com/logos/nba/1610612762/global/L/logo.svg' },
  { code: 'WAS', name: 'Washington Wizards', logo: 'https://cdn.nba.com/logos/nba/1610612764/global/L/logo.svg' },
];

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
];

export default function PlayerModal({ player, onClose }: PlayerModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    number: '',
    position: '',
    photo: '',
    nbaTeam: '',
  });
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [nbaDropdownOpen, setNbaDropdownOpen] = useState(false);

  useEffect(() => {
    if (player) {
      setFormData({
        firstName: player.firstName,
        lastName: player.lastName,
        nickname: player.nickname || '',
        number: player.number?.toString() || '',
        position: player.position || '',
        photo: player.photo || '',
        nbaTeam: player.nbaTeam || '',
      });
      setAvatar(player.avatar);
    } else {
      setAvatar(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    }
  }, [player]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      alert('Prénom et nom obligatoires');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        nickname: formData.nickname || null,
        number: formData.number ? parseInt(formData.number) : null,
        position: formData.position || null,
        photo: formData.photo || null,
        avatar,
        nbaTeam: formData.nbaTeam || null,
      };

      const url = player ? `/api/joueurs/${player.id}` : '/api/joueurs';
      const method = player ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Erreur serveur');

      onClose();
    } catch (error) {
      console.error('Erreur save joueur:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const selectedTeam = NBA_TEAMS.find(t => t.code === formData.nbaTeam);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A1628] border border-[rgba(0,191,255,0.2)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(0,191,255,0.15)] sticky top-0 bg-[#0A1628] z-10">
          <h2 className="text-2xl font-bold text-[#F5F1E8]">
            {player ? 'Modifier le joueur' : 'Nouveau joueur'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-[rgba(0,191,255,0.08)] hover:bg-[rgba(0,191,255,0.15)] flex items-center justify-center transition-all"
          >
            <X size={20} className="text-[#00BFFF]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Prénom */}
            <div>
              <label className="block text-sm font-medium text-[rgba(245,241,232,0.7)] mb-2">
                Prénom *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2.5 bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl text-[#F5F1E8] focus:outline-none focus:border-[#00BFFF] transition-all"
                required
              />
            </div>

            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-[rgba(245,241,232,0.7)] mb-2">
                Nom *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2.5 bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl text-[#F5F1E8] focus:outline-none focus:border-[#00BFFF] transition-all"
                required
              />
            </div>
          </div>

          {/* Surnom */}
          <div>
            <label className="block text-sm font-medium text-[rgba(245,241,232,0.7)] mb-2">
              Surnom
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              className="w-full px-4 py-2.5 bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl text-[#F5F1E8] focus:outline-none focus:border-[#00BFFF] transition-all"
              placeholder="Optionnel"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Numéro */}
            <div>
              <label className="block text-sm font-medium text-[rgba(245,241,232,0.7)] mb-2">
                Numéro
              </label>
              <input
                type="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="w-full px-4 py-2.5 bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl text-[#F5F1E8] focus:outline-none focus:border-[#00BFFF] transition-all"
                placeholder="0-99"
                min="0"
                max="99"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-[rgba(245,241,232,0.7)] mb-2">
                Position
              </label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2.5 bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl text-[#F5F1E8] focus:outline-none focus:border-[#00BFFF] transition-all"
              >
                <option value="" className="bg-[#0A1628]">Sélectionner</option>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos} className="bg-[#0A1628]">{pos}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Équipe NBA - Dropdown Premium */}
          <div>
            <label className="block text-sm font-medium text-[rgba(245,241,232,0.7)] mb-2">
              Équipe NBA préférée
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setNbaDropdownOpen(!nbaDropdownOpen)}
                className="w-full px-4 py-2.5 bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl text-[#F5F1E8] focus:outline-none focus:border-[#00BFFF] transition-all flex items-center justify-between hover:border-[rgba(0,191,255,0.3)]"
              >
                <div className="flex items-center gap-3">
                  {selectedTeam ? (
                    <>
                      <img src={selectedTeam.logo} alt="" className="w-7 h-7 object-contain" />
                      <span>{selectedTeam.name}</span>
                    </>
                  ) : (
                    <span className="text-[rgba(245,241,232,0.4)]">Aucune équipe</span>
                  )}
                </div>
                <ChevronDown
                  size={18}
                  className={`text-[#00BFFF] transition-transform ${nbaDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown menu */}
              {nbaDropdownOpen && (
                <div className="absolute z-50 mt-2 w-full bg-[#0A1628] border border-[rgba(0,191,255,0.25)] rounded-xl shadow-2xl shadow-black/50 max-h-80 overflow-y-auto custom-scrollbar">
                  {/* Option Aucune équipe */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, nbaTeam: '' });
                      setNbaDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[rgba(0,191,255,0.08)] transition-all text-left border-b border-[rgba(0,191,255,0.1)]"
                  >
                    <div className="w-7 h-7 rounded-full bg-[rgba(245,241,232,0.05)] flex items-center justify-center">
                      <X size={14} className="text-[rgba(245,241,232,0.4)]" />
                    </div>
                    <span className="text-[rgba(245,241,232,0.6)]">Aucune équipe</span>
                  </button>

                  {/* Liste des équipes */}
                  {NBA_TEAMS.map((team) => (
                    <button
                      key={team.code}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, nbaTeam: team.code });
                        setNbaDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-[rgba(0,191,255,0.08)] transition-all text-left ${
                        formData.nbaTeam === team.code ? 'bg-[rgba(0,191,255,0.12)]' : ''
                      }`}
                    >
                      <img src={team.logo} alt={team.name} className="w-7 h-7 object-contain" />
                      <span className="text-[#F5F1E8] font-medium flex-1">{team.name}</span>
                      <span className="text-xs text-[rgba(245,241,232,0.4)] font-mono">{team.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Photo du joueur */}
          <div>
            <label className="block text-sm font-medium text-[rgba(245,241,232,0.7)] mb-2">
              Photo du joueur
            </label>
            <ImageUpload
              value={formData.photo}
              onChange={(value) => setFormData({ ...formData, photo: value })}
              maxSizeMB={2}
            />
            <p className="text-xs text-[rgba(245,241,232,0.4)] mt-2">
              💡 Astuce : Photo en cadrage portrait avec fond uni pour un meilleur rendu
            </p>
          </div>

          {/* Couleur avatar */}
          <div>
            <label className="block text-sm font-medium text-[rgba(245,241,232,0.7)] mb-2">
              Couleur d'avatar
            </label>
            <div className="flex gap-3 flex-wrap">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatar(color)}
                  className={`w-12 h-12 rounded-lg transition-all ${
                    avatar === color
                      ? 'ring-2 ring-[#00BFFF] ring-offset-2 ring-offset-[#0A1628] scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-[rgba(0,191,255,0.08)] text-[rgba(245,241,232,0.7)] rounded-xl font-medium hover:bg-[rgba(0,191,255,0.15)] transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[#00BFFF] text-[#0A1628] rounded-xl font-bold hover:bg-[#00A8E8] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : player ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}