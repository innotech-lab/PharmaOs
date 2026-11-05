# PharmaOS — Brief Francis

**Assigné à :** Francis  
**Rôle :** Lead organisation & supply (pharmacies + fournisseurs + UI kit + seed/settings)  
**Stack :** NestJS · Prisma · Next.js · shared (Zod/TS) · Postgres  
**Tracks :** Shared contracts · UI kit · Pharmacies · Fournisseurs · Settings · Seed démo  

---

## Objectif

Fournir le socle UI commun, le modèle multi-pharmacie, la gestion fournisseurs, et un jeu de données démo pour que l’équipe puisse démontrer le MVP de bout en bout.

---

## Livrables à produire

### Sprint 0 (J1–J2)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **S0-02 (pair)** | Avec Daniel : schema Tenant / User / Pharmacy / Role | Migrate + seed admin OK |
| **S0-03** | Types + validators Zod de base (`auth`, `pharmacy`, `user`) dans `shared/` | Importables depuis `api` et `web` |
| **S0-06** | UI kit minimal : Button, Input, Table, Modal + layout sidebar dashboard | Navigation vers toutes les routes stub |

### Sprint 1 (J3–J7)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **PHARM-001** | CRUD pharmacies (API + UI dans `/settings` multi-site) | Isolation données par `pharmacyId` |
| **SUP-001** | Schema `Supplier` + CRUD API + UI `/suppliers` | CRUD scoped tenant |
| **SHARED-001** | Types/validators `supplier` (+ aide `product`/`inventory` avec Stany) | Alignés Prisma |
| **NAV-001** | Finaliser menu sidebar : products, inventory, pos, suppliers, reports, users, settings | Routes cohérentes, pas de lien mort |

### Sprint 2 (J8–J12)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **RPT-002 (pair)** | Widgets dashboard / charts avec Dancile | 3 KPI branchés |
| **QA-001** | Seed démo riche + checklist manuelle MVP (scénario 5 min) | Script seed + scénario écrit rejouable |
| **SET-001** | UI `/settings` : infos pharmacie active, bascule multi-site si N pharmacies | Changement de pharmacie active pris en compte par l’API client |

### Sprint 3 (J13–J15)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **UX-001** | Polish UI : empty states, erreurs API, loading | Parcours démo sans erreur console |
| **REL-001** | Participation release + validation checklist manuelle | Scénario démo validé une dernière fois |

---

## Hors scope (ne pas faire)

- Auth JWT / guards (Daniel) — tu consommes les endpoints  
- Logique stock / mouvements (Stany)  
- Checkout POS (Dancile)  
- Redis, ordonnances, tiers-payant  

---

## Dépendances

| Tu depends de | Qui | Pour quoi |
|---------------|-----|-----------|
| Bootstrap monorepo | Daniel | Packages `shared` / `web` |
| Auth + users | Daniel | Pages settings/users protégées |
| Produits (pour seed) | Stany | Seed catalogue |
| Ventes (pour seed KPI) | Dancile | Seed CA / top produits |

| Les autres dependent de toi | Pour quoi |
|-----------------------------|-----------|
| Toute l’équipe | UI kit + layout |
| Daniel | Types auth/pharmacy |
| Stany & Dancile | Nav + composants Table/Form |
| Démo finale | Seed + checklist QA-001 |

---

## Contrats métier à respecter

### Pharmacy
- Liée à un `tenantId`  
- Champs MVP : `name`, `address` (simple), `active`  
- L’utilisateur travaille dans une **pharmacie active** (header ou store front)

### Supplier
- Scoped `tenantId` (et optionnellement `pharmacyId` si besoin — documenter le choix)  
- Champs MVP : `name`, `email`, `phone`, `notes`, `active`  

### Shared package
- Tout nouveau DTO/écran doit passer par `shared/types` + `shared/validators`  
- Pas de duplication de schémas Zod dans `api` et `web`  

### Routes UI à couvrir (nav)
- `/login`, `/register`  
- `/` (dashboard)  
- `/products` (coordonner avec B — créer la route si absente)  
- `/inventory`, `/pos`, `/suppliers`, `/reports`, `/users`, `/settings`  

---

## Scénario démo (QA-001) — à livrer

1. Login OWNER seed  
2. Voir dashboard (KPI)  
3. Ouvrir un produit / vérifier stock  
4. Encaisser 1 vente au POS  
5. Vérifier stock décrémenté + CA jour mis à jour  
6. Lister un fournisseur  
7. (Optionnel) Inviter / voir un user CASHIER  

Livrer : script seed + fichier `docs/DEMO_CHECKLIST.md`.

---

## Definition of Done (chaque ticket)

- [ ] Critères d’acceptation OK  
- [ ] Types/validators `shared` à jour  
- [ ] Review d’un pair  
- [ ] Scoping tenant/pharmacy vérifié  
- [ ] Composants UI réutilisables (pas de one-off non documenté)  

---

## Points de sync

- **Fin Sprint 0 :** UI kit + types auth/pharmacy disponibles  
- **Fin Sprint 1 :** pharmacies + fournisseurs utilisables  
- **Fin Sprint 2 :** seed + checklist démo prêts  
- **Fin Sprint 3 :** polish UX validé sur parcours démo  

---

## Contact / questions

Bloqueur (ex. pharmacie active vs header multi-site, scope supplier) → **BLOCKER** au CTO avec option recommandée.
