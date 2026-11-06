# Développement et travail d’équipe

Ce guide décrit comment contribuer à l’état actuel du dépôt. Les procédures d’API, de base de données et de déploiement seront complétées lorsque ces composants seront initialisés.

## Prérequis et lancement

- Node.js 20.9 ou plus récent
- npm
- Git
- PostgreSQL 15+ accessible via `api/.env` (`DATABASE_URL`)

```powershell
npm install
copy api\.env.example api\.env
npm --workspace api run prisma:generate
npm --workspace api run prisma:migrate -- --name init
npm --workspace api run prisma:seed
npm run dev:api
npm run dev:web
```

Le serveur web écoute sur le port `3000` et l’API sur `3001`. Pour vérifier les types :

```powershell
npm run typecheck
```

`npm run build` et `npm run typecheck` à la racine vérifient `shared`, `api` et `web`.

## Où intervenir

| Besoin | Emplacement |
|---|---|
| Layout, navigation, recherche, notifications | `web/components/dashboard-shell.tsx` |
| Dashboard et widgets | `web/components/dashboard-home.tsx` |
| Liste et formulaire d’ajout produit | `web/components/products-page.tsx` |
| Icônes SVG | `web/components/icons.tsx` |
| Logo PharmaOS détouré (PNG transparent) | `web/public/pharmaos-logo.png` |
| Fournisseurs et états vides des modules | `web/components/module-page.tsx` |
| Pages et feuilles de style | `web/app/` |
| Client HTTP et auth UI | `web/lib/api.ts`, `web/app/(auth)/` |
| Auth, guard et users API | `api/src/modules/auth/`, `api/src/modules/users/` |
| Prisma et seed | `api/prisma/` |
| Contrats partagés | `shared/types/` et `shared/validators/` |
| Critères par responsable | `docs/team/<NOM>.md` |

Les styles globaux sont actuellement regroupés dans `web/app/styles.css`. Les nouveaux éléments d’interface doivent réutiliser les composants, couleurs et rayons définis ici plutôt que créer une variation isolée.

## Règles de contribution

1. Lire le brief du ticket et ses dépendances dans `docs/team/`.
2. Décrire les champs et comportements attendus dans le contrat partagé avant de les dupliquer dans le frontend et l’API.
3. Vérifier le périmètre de données : `tenantId` pour l’organisation et `pharmacyId` pour toute donnée propre à une officine.
4. Ne pas ajouter de données métier codées en dur à l’interface. Les fixtures de démonstration, si elles sont nécessaires aux tests futurs, devront vivre dans un seed explicite.
5. Ajouter ou mettre à jour la documentation et `docs/STATUS.md` avec chaque changement de périmètre ou d’état.
6. Faire relire le changement par un autre membre de l’équipe avant de le considérer terminé, conformément aux briefs.

La branche active observée lors de la rédaction est `main`. Aucun nom de branche de développement ni processus de pull request n’est configuré dans le dépôt ; l’équipe doit convenir de cette convention avant de l’inscrire comme règle.

## Données locales

- Le frontend ne charge ni ne persiste de données métier pour le moment. Les ajouts produits/fournisseurs sont en mémoire uniquement et disparaissent au rechargement.
- Au premier chargement après le nettoyage, les anciennes clés `pharmaos:suppliers`, `pharmaos:pharmacies` et `pharmaos:active-pharmacy` sont supprimées du navigateur. Un marqueur de migration empêche de répéter ce nettoyage.
- Le dashboard, les notifications, l’annuaire et les paramètres affichent des états vides jusqu’au branchement de l’API.
- Les formulaires `/login` et `/register` n’appellent aucun endpoint. Le bouton « Se déconnecter » nettoie les clés locales de jetons prévues et ouvre `/login`; la révocation côté serveur reste à intégrer avec l’API d’authentification.

Le seed backend crée `PharmaOS Demo`, `Pharmacie Demo` et `admin@pharmaos.local`. Le mot de passe provient de `SEED_ADMIN_PASSWORD` et ne doit jamais être utilisé en production.

### Contrat d’authentification

`POST /auth/register` crée atomiquement un tenant, sa première pharmacie et son OWNER. `POST /auth/login` et `POST /auth/refresh` posent des cookies HttpOnly ; `POST /auth/logout` révoque le refresh token. `GET /users` et `POST /users` filtrent toujours par le `tenantId` du JWT ; seul `OWNER` peut créer un `MANAGER` ou un `CASHIER`.

## Secrets et configuration

Ne jamais committer de secrets. Les fichiers `.env` et `.env.local` sont ignorés par Git. Les exemples de configuration se trouvent dans `api/.env.example` et `web/.env.example`; les valeurs JWT de l’exemple API sont des placeholders de développement et ne doivent jamais être utilisées en production.

## Avant de déclarer un livrable terminé

- Vérifier les critères d’acceptation du brief associé.
- Mettre à jour les types/validateurs partagés dès qu’un contrat métier change.
- Documenter les choix non évidents et les limites restantes.
- Pour l’API : vérifier l’isolation tenant/pharmacie et les erreurs de validation.
- Faire la revue croisée prévue par l’équipe.
