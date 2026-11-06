# PharmaOS

**La plateforme de gestion de pharmacie, de bout en bout.**

PharmaOS est un système d’exploitation métier pour pharmacies modernes : caisse, stock, catalogue, fournisseurs, équipe et pilotage — dans une seule plateforme multi-tenant, sécurisée et pensée pour le terrain.

[![Status](https://img.shields.io/badge/status-MVP%20en%20construction-amber)](#)
[![Stack](https://img.shields.io/badge/stack-NestJS%20%7C%20Next.js%20%7C%20Prisma-0A7C66)](#stack-technique)
[![License](https://img.shields.io/badge/license-Proprietary-slate)](#)
[![Repo](https://img.shields.io/badge/github-innotech--lab%2FPharmaOs-181717?logo=github)](https://github.com/innotech-lab/PharmaOs)

---

## Vision

Les pharmacies jonglent encore entre cahiers, Excel, logiciels fragmentés et outils de caisse isolés.  
**PharmaOS unifie l’opérationnel** : du rayon à la caisse, du fournisseur au tableau de bord.

| Pour qui | Ce que PharmaOS change |
|----------|-------------------------|
| **Titulaires / owners** | Visibilité CA, stock, équipe — multi-sites |
| **Managers** | Catalogue, inventaire, fournisseurs sous contrôle |
| **Caissiers** | Encaissement rapide, fiable, traçable |
| **Réseaux / groupes** | Isolation multi-tenant, une plateforme, N pharmacies |

---

## Fonctionnalités

### Cœur métier

| Module | Capacité |
|--------|----------|
| **Authentification & accès** | Inscription organisation, JWT + refresh, rôles `OWNER` · `MANAGER` · `CASHIER` |
| **Multi-tenant / multi-pharmacies** | Une organisation, plusieurs officines, données isolées |
| **Catalogue produits** | SKU, prix, TVA, activation, seuils d’alerte |
| **Inventaire** | Niveaux de stock, mouvements `IN` / `OUT` / `ADJUST`, historique |
| **Point de vente (POS)** | Recherche produit, panier, TVA, paiement espèces/carte, ticket |
| **Fournisseurs** | Annuaire et suivi des partenaires d’approvisionnement |
| **Équipe** | Invitation utilisateurs, droits par rôle |
| **Pilotage** | CA du jour, top produits, alertes stock bas |

### Principes produit

- **MVP démontrable** avant features secondaires  
- **Isolation stricte** tenant / pharmacie  
- **Transaction atomique** vente → déstockage (pas de stock fantôme)  
- **Contrats partagés** (`shared/`) entre API et front — une seule source de vérité  

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                               │
│              Next.js  ·  App Router  ·  :3000                 │
└────────────────────────────┬────────────────────────────────┘
                             │  HTTPS / JSON
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     API NestJS  ·  :3001                      │
│  Auth · Users · Tenants · Pharmacies · Products · Inventory │
│              Sales · Suppliers · Reports                     │
└─────────────┬───────────────────────────────┬───────────────┘
              │                               │
              ▼                               ▼
       PostgreSQL                      Redis (prévu)
         Prisma
```

```
PharmaOS/
├── api/                 # Backend NestJS + Prisma
│   ├── prisma/          # Schema & migrations
│   └── src/modules/     # Domaines métier
├── web/                 # Frontend Next.js (App Router)
│   ├── app/(auth)/      # Login / Register
│   ├── app/(dashboard)/ # POS, stock, reports…
│   └── lib/             # Client API
├── shared/              # Types & validators (Zod) partagés
└── docs/team/           # Briefs livraison par développeur
```

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | **Next.js** (App Router), TypeScript |
| Backend | **NestJS**, TypeScript |
| ORM / DB | **Prisma** · **PostgreSQL** |
| Contrats | Package **`shared/`** (types + validators Zod) |
| Auth | **JWT** + refresh token |
| Cache | **Redis** (prévu ; hors chemin critique MVP) |
| Infra locale | Docker Compose (Postgres) |

---

## Démarrage rapide

> Le dépôt est en phase **scaffold → MVP**. Les étapes ci-dessous décrivent la cible d’installation une fois le bootstrap Sprint 0 terminé.

### Prérequis

- Node.js 20+
- pnpm (recommandé) ou npm
- Docker (PostgreSQL)
- Git + accès SSH au repo privé `innotech-lab/PharmaOs`

### Clone

```bash
git clone git@github-pharmaos:innotech-lab/PharmaOs.git
cd PharmaOs
```

> Si vous n’utilisez pas l’alias SSH `github-pharmaos`, adaptez le remote / la clé selon votre config.

### Variables d’environnement

```bash
cp api/.env.example api/.env
cp web/.env.example web/.env
```

| Service | Port par défaut |
|---------|-----------------|
| Web | `http://localhost:3000` |
| API | `http://localhost:3001` |
| Postgres | `localhost:5432` · DB `pharmaos` |

### Lancer (cible)

```bash
# 1. Base de données
docker compose up -d

# 2. Dépendances (monorepo)
pnpm install

# 3. Migrations + seed
cd api && pnpm prisma migrate dev && pnpm prisma db seed

# 4. API
pnpm start:dev

# 5. Web (autre terminal)
cd web && pnpm dev
```

---

## Roadmap MVP

| Sprint | Objectif | Statut |
|--------|----------|--------|
| **0** | Monorepo, Prisma de base, Docker, UI kit, Git | En cours |
| **1** | Auth, users, pharmacies, produits, stock API, fournisseurs | Planifié |
| **2** | POS, inventaire UI, rapports, sécurité multi-tenant, seed démo | Planifié |
| **3** | Tests critiques, polish UX, docs, release démo | Planifié |

### Hors scope MVP (volontairement)

Ordonnances avancées · tiers-payant · app mobile · microservices · transferts inter-sites

---

## Équipe

| Dev | Périmètre |
|-----|-----------|
| **Daniel** | Fondation, auth, users, sécurité multi-tenant |
| **Stany** | Produits, inventaire, Docker Postgres |
| **Dancile** | POS / ventes, rapports, Git & setup docs |
| **Francis** | Pharmacies, fournisseurs, UI kit, seed & settings |

Briefs détaillés : [`docs/team/`](./docs/team/)

---

## Sécurité

- Secrets uniquement via `.env` (jamais commités — voir `.gitignore`)
- Scoping **tenant / pharmacy** sur chaque endpoint métier
- Rôles minimaux : `OWNER` · `MANAGER` · `CASHIER`
- Review pair obligatoire avant merge sur les tickets critiques

---

## Contribution (équipe)

1. Brancher depuis `develop` (ou `main` selon la convention d’équipe)  
2. Nommer : `feature/AUTH-001-registration`, `fix/…`, `docs/…`  
3. Respecter les contrats `shared/`  
4. PR + review d’un autre développeur  
5. Critères d’acceptation du brief = Definition of Done  

---

## Mise à jour — fondation API et authentification

Le travail de Daniel ajoute une première API NestJS avec Prisma et PostgreSQL, ainsi que les types et validateurs d’authentification dans `shared/` :

- Inscription multi-tenant : création de l’organisation, de sa première pharmacie et d’un utilisateur `OWNER`.
- Connexion, renouvellement et déconnexion avec JWT et cookies HTTP-only.
- CRUD utilisateurs et protection des routes côté web par middleware.
- Formulaires de connexion et d’inscription reliés à l’API.

Les modules métier listés plus haut décrivent la cible du MVP ; ils restent à implémenter ou à relier au frontend. Les étapes « Lancer (cible) » ci-dessus restent la vision initiale. Pour lancer la fondation actuellement présente, utiliser les commandes npm ci-dessous depuis la racine, après avoir démarré PostgreSQL et configuré `DATABASE_URL` dans `api/.env` :

```powershell
npm install
Copy-Item api/.env.example api/.env
npm --workspace api run prisma:generate
npm --workspace api run prisma:migrate -- --name init
# Facultatif : créer les données locales de démonstration
npm --workspace api run prisma:seed
```

Le seed crée le compte local `admin@pharmaos.local`, avec `ChangeMe123!` par défaut. Définir `SEED_ADMIN_PASSWORD` avant le seed pour changer ce mot de passe et remplacer les secrets JWT avant tout usage partagé. Ensuite, démarrer les deux services dans des terminaux distincts :

```powershell
npm run dev:api
npm run dev:web
```

Le frontend est accessible sur `http://localhost:3000` et l’API sur `http://localhost:3001`. Les formulaires d’authentification nécessitent l’API et la base de données. Les informations de configuration détaillées se trouvent dans [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

---

## Licence

**Proprietary** — © InnoTech Lab. Tous droits réservés.  
Accès réservé aux collaborateurs autorisés du dépôt privé.

---

<p align="center">
  <strong>PharmaOS</strong> — Une pharmacie. Une plateforme. Le contrôle total.
</p>
