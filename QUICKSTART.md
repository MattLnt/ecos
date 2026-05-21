# 🚀 Guide de démarrage rapide - ECOS Shoots

## Étape 1: Installation des dépendances ✅
```bash
npm install
```
✅ **Déjà fait!** Toutes les dépendances sont installées.

## Étape 2: Configuration de la base de données 📊

### Option A: Railway (Recommandé - Gratuit)

1. Créer un compte sur https://railway.app
2. Cliquer sur "New Project" > "Provision PostgreSQL"
3. Aller dans l'onglet "Variables"
4. Copier la valeur de `DATABASE_URL`
5. Créer un fichier `.env` à la racine du projet:

```env
DATABASE_URL="postgresql://postgres:MOT_DE_PASSE@HOST:PORT/railway"
```

### Option B: Supabase (Alternative gratuite)

1. Créer un compte sur https://supabase.com
2. Créer un nouveau projet
3. Aller dans Settings > Database
4. Copier l'URI Connection String (mode Session pooling)
5. Mettre dans `.env`:

```env
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

## Étape 3: Créer les tables 🗄️

```bash
npx prisma generate
npx prisma db push
```

Cela va créer automatiquement toutes les tables dans votre base de données.

## Étape 4: Lancer l'application 🏀

```bash
npm run dev
```

Ouvrir http://localhost:3000 dans votre navigateur.

## 🎯 Premier test

1. **Entrer un nom de joueur** (ex: "Mathieu")
2. **Cliquer sur "Commencer la session"**
3. **Cliquer sur un spot bleu** (mi-distance) ou orange (3-points)
4. **Sélectionner le nombre de paniers réussis** (ex: 7/10)
5. **Sélectionner les lancers francs**:
   - 0/2 = 0 points ❌
   - 1/2 = 7 points ✅
   - 2/2 = 14 points 🔥
6. **Répéter pour les 10 spots**
7. **Faire les 10 lancers francs finaux**
8. **Terminer la session**

## 📱 Utilisation sur mobile

L'app est conçue pour mobile! Ouvrir sur votre téléphone:

1. **Trouver l'IP locale de votre PC**:
   ```bash
   # Sur Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Sur Windows
   ipconfig
   ```

2. **Ouvrir sur mobile**: `http://IP_DE_VOTRE_PC:3000`
   
   Exemple: `http://192.168.1.45:3000`

## 🎨 Couleurs ECOS

Les couleurs officielles sont déjà configurées:
- Orange principal: `#FF6B35`
- Orange foncé: `#E85A28`
- Noir: `#0A0A0A`
- Gris: `#1A1A1A`

## ⚠️ Troubleshooting

### Prisma ne génère pas le client
```bash
# Arrêter le serveur Next.js (Ctrl+C)
npx prisma generate
npm run dev
```

### Erreur de connexion à la DB
- Vérifier que le `.env` existe et contient `DATABASE_URL`
- Vérifier que l'URL est correcte (copier-coller depuis Railway/Supabase)
- S'assurer que la DB est bien active

### Le design ne s'affiche pas correctement
```bash
# Supprimer le cache et relancer
rm -rf .next
npm run dev
```

## 🔥 Astuces

### Tester rapidement sans DB
L'app fonctionne sans DB! Les données sont affichées en alerte à la fin de la session. Pour tester le design et le workflow, pas besoin de DB.

### Modifier les couleurs
Éditer `app/globals.css` et changer les valeurs dans `:root { ... }`

### Ajouter des spots
Éditer `components/BasketballCourt.tsx` et ajouter des entrées dans le tableau `SPOTS`

## 📦 Structure des fichiers

```
ecos-shoots/
├── app/
│   ├── globals.css          # Styles ECOS
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Page principale
├── components/
│   ├── BasketballCourt.tsx  # Terrain SVG interactif
│   └── SpotInput.tsx        # Modal de saisie
├── lib/
│   └── prisma.ts            # Client Prisma
├── prisma/
│   └── schema.prisma        # Schéma de DB
├── .env                     # Variables d'environnement
└── README.md                # Documentation complète
```

## 🚀 Prochaines étapes

Une fois que l'app fonctionne:

1. **Créer les API routes** pour sauvegarder en DB
2. **Dashboard** avec historique des sessions
3. **Statistiques** par joueur
4. **Mode multi-joueurs**
5. **Déployer sur Vercel**

---

Besoin d'aide? Consulter le README.md principal pour plus de détails!
