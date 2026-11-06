# PharmaOS

PharmaOS est une plateforme de gestion d’officine : produits, stock, ventes, fournisseurs, équipe et pilotage multi-pharmacies.

> **État actuel : interface web sans données métier.** Le frontend fonctionne en local. L’API NestJS, Prisma, la base de données et les contrats partagés sont encore des squelettes vides. Les écrans et formulaires sont prêts à être branchés ; les créations de produits/fournisseurs restent temporaires en mémoire. L’authentification n’est pas connectée. L’application n’est pas prête pour des données réelles.

## Démarrer l’interface

Prérequis : Node.js 20.9 ou plus récent et npm.

```powershell
cd web
npm ci
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Aucun compte ni serveur API n’est requis pour parcourir la démo.

Commandes disponibles depuis `web/` :

```powershell
npm run dev        # serveur local
npm run typecheck  # vérification TypeScript
npm run build      # compilation de production
npm run start      # serveur de production après le build
```

`web/.env.example` indique l’URL API prévue (`NEXT_PUBLIC_API_URL`). Le client API n’est pas encore implémenté ; cette variable n’est donc pas requise pour la démo actuelle.

## Documentation

- [Démarrage et conventions d’équipe](docs/DEVELOPMENT.md)
- [Architecture actuelle et cible](docs/ARCHITECTURE.md)
- [État des livrables](docs/STATUS.md)
- [Contrats métier et décisions ouvertes](docs/CONTRACTS.md)
- [Briefs par personne](docs/team/)

## Organisation du dépôt

| Dossier | Rôle | État actuel |
|---|---|---|
| `web/` | Interface Next.js App Router | Interface disponible, sans données métier |
| `api/` | API NestJS et Prisma | Fichiers présents, sans implémentation ni manifeste npm |
| `shared/` | Types et validateurs partagés | Fichiers présents, sans implémentation ni configuration de package |
| `docs/` | Conception, contrats, suivi et briefs d’équipe | Documentation de travail |

## Routes web

| Route | État |
|---|---|
| `/` | Dashboard avec états vides, prêt pour les endpoints de rapport |
| `/suppliers` | Annuaire vide, formulaire frontend sans persistance serveur |
| `/products` | Catalogue vide, formulaire d’ajout sans persistance serveur |
| `/settings` | États vides, prêt pour les données pharmacies |
| `/inventory`, `/pos`, `/reports`, `/users` | Navigation et états vides ; modules métier à implémenter |
| `/login`, `/register` | Pages et formulaires présents ; authentification non connectée |

Les anciennes clés de démonstration du navigateur sont supprimées au premier chargement après cette mise à jour. Aucune donnée métier n’est actuellement chargée ou persistée par le frontend. Le bouton de déconnexion nettoie les clés de jetons PharmaOS prévues et renvoie vers `/login` ; il n’existe pas encore de session authentifiée à révoquer côté serveur.

Le logo officiel détouré est dans [`web/public/pharmaos-logo.png`](web/public/pharmaos-logo.png) et est affiché dans la navigation et les pages d’authentification.

## Équipe

Les responsabilités et critères d’acceptation sont définis dans [`docs/team/`](docs/team/). Avant de commencer un ticket, consulter le brief correspondant et mettre à jour [`docs/STATUS.md`](docs/STATUS.md) lors d’un changement de statut.
