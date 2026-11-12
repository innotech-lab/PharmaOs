# État du projet

Mis à jour le 12 novembre 2026. Ce document décrit le dépôt tel qu’il est maintenant.

## Vue d’ensemble

| Domaine | État | Détail |
|---|---|---|
| Web | Application connectée | Next.js 15 / React 19 ; espace de travail et pages d’authentification branchés sur l’API |
| Dashboard | Données réelles | Liste de démarrage, indicateurs et alertes de stock |
| Navigation et responsive | Disponible | Menu, recherche de pages et alertes de stock par pharmacie |
| Fournisseurs | Branché | CRUD persistant, recherche, filtres et compteurs |
| Produits | Branché | Catalogue persistant, catégories, prix et statut |
| Inventaire | Branché | Niveaux, ajustements et mouvements de stock |
| Point de vente | Branché | Encaissement transactionnel, tickets et annulation avec remise en stock |
| Rapports | Branché | Résumé des ventes, comparaison de période et produits les plus vendus |
| Équipe | Branché | Membres tenant-scoped ; mot de passe temporaire imposé à la première connexion |
| Paramètres pharmacie | Disponible | Informations de la pharmacie liées au compte |
| Login / Register / Logout | Branché | Session JWT, inscription et connexion ; changement obligatoire du mot de passe temporaire |
| API | Modules métier actifs | NestJS, validation partagée Zod, AuthGuard, portées tenant et pharmacie |
| Prisma / PostgreSQL | Schéma et migrations présents | Modèles tenant, pharmacies, utilisateurs, produits, stock, fournisseurs et ventes |
| `shared/` | Contrats partagés | Types, calculs métier et validateurs Zod |
| Tests automatisés | Tests de services disponibles | Tests d’inventaire, fournisseurs, ventes et catégories de produits |
| Build de production | À valider | La compilation de production reste à confirmer séparément des vérifications TypeScript |

## Livrables par responsable

Les noms de tickets et leurs critères détaillés restent dans les [briefs de l’équipe](team/).

| Responsable | Périmètre | État dans le dépôt |
|---|---|---|
| Daniel | Monorepo, auth, users, isolation tenant, Prisma de base | Authentification et équipe implémentées ; changement de mot de passe temporaire ajouté |
| Stany | Docker/PostgreSQL, produits, inventaire | Produits avec catégorie et inventaire branchés à PostgreSQL |
| Dancile | POS, ventes, rapports, workflow Git/setup | Point de vente et rapports branchés ; numéros de tickets propres à chaque pharmacie |
| Francis | UI kit, pharmacies, fournisseurs, settings, seed, QA | UI kit et modules fournisseurs/settings branchés ; documentation actualisée |

## Routes frontend

| Route | Comportement actuel | Suite nécessaire |
|---|---|---|
| `/` | Dashboard avec données de stock et ventes | Suivre l’usage et compléter les indicateurs selon les besoins métier |
| `/suppliers` | Fournisseurs persistés avec ajout, modification, suppression et compteurs | Aucun blocage fonctionnel identifié |
| `/settings` | Informations de l’officine | Gestion multi-pharmacies si le besoin est confirmé |
| `/products` | Catalogue connecté, catégorie, création et gestion des produits | Seuil d’alerte par défaut en attente d’une décision métier |
| `/inventory` | Niveaux, ajustements, historique et accès aux produits actifs | Aucun blocage fonctionnel identifié |
| `/pos` | Panier, taxes, paiement, rendu monnaie, ticket et annulation | Aucun blocage fonctionnel identifié |
| `/reports` | Résumé sur 7 ou 30 jours et produits les plus vendus | Aucun blocage fonctionnel identifié |
| `/users` | Équipe et ajout de membres avec mot de passe temporaire | Invitation par e-mail en attente d’une décision |
| `/login`, `/register` | Authentification, pays proposés et visibilité du mot de passe | Mot de passe oublié en attente d’une décision et d’un canal d’assistance |
| `/change-password` | Changement obligatoire du mot de passe temporaire | Aucun blocage fonctionnel identifié |

## Prochaines dépendances bloquantes

1. Choisir le seuil de stock par défaut pour un nouveau produit.
2. Décider du parcours « Mot de passe oublié » et du canal d’assistance associé.
3. Décider si les invitations par e-mail sont nécessaires.
4. Terminer la QA visuelle des parcours connectés et vérifier la build de production.
