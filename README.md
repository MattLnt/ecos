# 🏀 ECOS Shoots Tracker

Application Next.js pour tracker les sessions de shoots du club ECOS Eguilles Basketball.

## ✨ Fonctionnalités

- 🎯 **Demi-terrain interactif** avec 10 spots (5 mi-distance + 5 3-points)
- 📊 **Système de points avec multiplicateur** basé sur les lancers francs
  - 0/2 LF = 0 points (spot non validé)
  - 1/2 LF = score normal
  - 2/2 LF = score doublé 🔥
- 📈 **Tracking en temps réel** du score et de la progression
- 💾 **Base de données PostgreSQL** pour historiser toutes les sessions
- 🎨 **Design aux couleurs ECOS** (orange/noir/blanc)
- 📱 **Interface mobile-first** pour saisie pendant les entraînements

## 🚀 Installation

### Prérequis

- Node.js 18+
- PostgreSQL (local ou Railway/Supabase)
- npm ou yarn

### Étapes

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer la base de données**

Créer un compte gratuit sur [Railway](https://railway.app) et créer une base PostgreSQL.

Copier l'URL de connexion et la mettre dans `.env`:

```bash
DATABASE_URL="postgresql://postgres:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

3. **Générer Prisma Client et créer les tables**

```bash
npx prisma generate
npx prisma db push
```

4. **Lancer le serveur de développement**

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## 📖 Utilisation

### Démarrer une session

1. Entrer le nom du joueur
2. Cliquer sur "Commencer la session"

### Enregistrer les résultats

1. Cliquer sur un spot (bleu = mi-distance, orange = 3-points)
2. Sélectionner le nombre de paniers réussis (0-10)
3. Sélectionner les lancers francs (0/2, 1/2, ou 2/2)
4. Le score est calculé automatiquement avec le multiplicateur
5. Répéter pour les 10 spots

### Terminer la session

1. Une fois les 10 spots complétés, faire les 10 lancers francs finaux
2. Cliquer sur "Terminer la session"
3. Les données sont sauvegardées en base de données

## 🗄️ Structure de la base de données

### Tables

**players**
- `id`: Identifiant unique
- `name`: Nom du joueur
- `createdAt`: Date de création

**sessions**
- `id`: Identifiant unique
- `date`: Date de la session
- Relations: `players`, `results`

**session_players**
- Jointure many-to-many entre sessions et joueurs
- Permet de gérer les sessions avec plusieurs joueurs

**spot_results**
- `spotType`: Type de spot (ex: "mid-0", "long-45-left")
- `made`: Nombre de paniers réussis sur 10
- `freeThrowsMade`: Lancers francs (0, 1, ou 2)
- `points`: Score calculé avec multiplicateur

## 🎨 Personnalisation

### Couleurs ECOS

Les couleurs sont définies dans `app/globals.css`:

```css
:root {
  --ecos-orange: #FF6B35;
  --ecos-orange-dark: #E85A28;
  --ecos-black: #0A0A0A;
  --ecos-gray: #1A1A1A;
}
```

### Règles de scoring

Le calcul du score se fait dans `components/SpotInput.tsx`:

```typescript
let points = 0;
if (freeThrowsMade === 0) {
  points = 0; // Spot non validé
} else if (freeThrowsMade === 1) {
  points = made; // Score normal
} else if (freeThrowsMade === 2) {
  points = made * 2; // Score doublé
}
```

## 🔧 Technologies utilisées

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion** (animations)
- **Prisma** (ORM)
- **PostgreSQL** (base de données)

## 📱 Déploiement

### Vercel (recommandé pour Next.js)

1. Pusher le code sur GitHub
2. Connecter le repo sur [Vercel](https://vercel.com)
3. Ajouter la variable `DATABASE_URL` dans les settings
4. Deploy automatique!

### Variables d'environnement

```
DATABASE_URL=postgresql://...
```

## 🚧 Prochaines fonctionnalités

- [ ] API routes pour sauvegarder en DB (actuellement en local)
- [ ] Dashboard avec historique des sessions
- [ ] Statistiques par joueur (moyenne, meilleur score, évolution)
- [ ] Mode multi-joueurs (plusieurs joueurs dans une session)
- [ ] Export PDF des résultats
- [ ] Graphiques de progression
- [ ] Comparaison entre joueurs
- [ ] Leaderboard

## 📝 Notes

- Les données sont actuellement affichées en alerte (TODO: implémenter les API routes)
- Le système est conçu pour être utilisé sur mobile pendant les entraînements
- Les lancers francs finaux ne comptent pas dans le score total (ils sont informatifs)

## 🤝 Contribution

Pour contribuer au projet:
1. Fork le repo
2. Créer une branche feature
3. Commit les changements
4. Push et créer une PR

---

Développé avec ❤️ pour l'ECOS Eguilles Basketball
