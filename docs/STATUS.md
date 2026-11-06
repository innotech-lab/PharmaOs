# État du projet

Mis à jour le 6 novembre 2026. Ce document décrit le dépôt tel qu’il est, pas uniquement la cible des briefs.

## Vue d’ensemble

| Domaine | État | Détail |
|---|---|---|
| Web | Démo locale | Next.js 15 / React 19 ; `npm run typecheck` passe |
| Dashboard | Interface sans données | Indicateurs vides ; en attente des endpoints de rapport et de stock |
| Navigation et responsive | Interface disponible | Menu, recherche de pages, notifications vides, menu pharmacie vide |
| Fournisseurs | Interface sans données | Liste vide ; formulaire frontend sans persistance serveur |
| Produits | Interface sans données | Catalogue vide ; ajout de produits en mémoire, sans persistance serveur |
| Paramètres pharmacie | États vides | En attente de l’API pharmacies |
| Login / Register / Logout | Pages et action de déconnexion disponibles | Formulaires sans endpoint ; logout local redirige vers `/login`, sans session serveur |
| API | Fondation disponible | NestJS, validation globale, auth JWT et users tenant-scoped |
| Prisma / PostgreSQL | Schéma et seed prêts | `Tenant`, `Pharmacy`, `User`, rôles MVP et seed admin ; migration à générer avec PostgreSQL |
| `shared/` | Auth initialisée | Workspace TypeScript, types et validateurs Zod auth |
| Tests automatisés | Non configurés | Aucun script de test dans le frontend |
| Build de production | À valider | La compilation a commencé précédemment, mais le build complet n’a pas été confirmé |

## Livrables par responsable

Les noms de tickets et leurs critères détaillés restent dans les [briefs de l’équipe](team/).

| Responsable | Périmètre | État dans le dépôt |
|---|---|---|
| Daniel | Monorepo, auth, users, isolation tenant, Prisma de base | Implémenté ; revue croisée et branchement des modules métier restent à faire |
| Stany | Docker/PostgreSQL, produits, inventaire | À implémenter ; sources API/UI métier et Compose absents ou vides |
| Dancile | POS, ventes, rapports, workflow Git/setup | POS et rapports UI sont des états vides ; aucun flux de vente ni API |
| Francis | UI kit, pharmacies, fournisseurs, settings, seed, QA | Shell et états vides disponibles ; contrats/API/seed/checklist restent à faire |

## Routes frontend

| Route | Comportement actuel | Suite nécessaire |
|---|---|---|
| `/` | Dashboard vide | Brancher les endpoints de rapports et de stock |
| `/suppliers` | Liste vide, recherche, filtre et formulaire frontend | API CRUD tenant-scoped et contrats partagés |
| `/settings` | États vides | API pharmacies et propagation de la pharmacie active au client API |
| `/products` | Liste vide et formulaire d’ajout en mémoire | CRUD API, validation partagée, édition/désactivation selon le brief Stany |
| `/inventory` | État vide | Niveaux, ajustements et historique selon le brief Stany |
| `/pos` | État vide | Checkout transactionnel selon le brief Dancile |
| `/reports` | État vide | Rapports API/UI et widgets liés aux ventes |
| `/users` | État vide | CRUD/invitations protégés selon le brief Daniel |
| `/login`, `/register` | Pages/formulaires ; déconnexion accessible depuis la navigation | Auth API, session serveur, validation partagée et protection des routes |

## Prochaines dépendances bloquantes

1. Ajouter les migrations Prisma au dépôt après validation de PostgreSQL par Stany.
2. Valider les contrats métier ouverts dans [`CONTRACTS.md`](CONTRACTS.md).
3. Brancher les modules métier sur `AuthGuard` et les scopes `tenantId` / `pharmacyId`.
4. Connecter le client web aux endpoints authentifiés et scoper chaque requête.
5. Ajouter un seed backend explicite pour le scénario de démonstration, sans réintroduire de fixtures dans l’interface.
6. Rejouer le scénario auth et compléter la checklist QA avec Dancile.
