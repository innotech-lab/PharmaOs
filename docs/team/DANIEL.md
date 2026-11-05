# PharmaOS — Brief Daniel

**Assigné à :** Daniel  
**Rôle :** Lead plateforme (fondation + auth + users + sécurité)  
**Stack :** NestJS · Prisma · Next.js · shared (Zod/TS) · Postgres  
**Tracks :** Sprint 0 lead · Auth · Users · Sécurité multi-tenant · Docs release  

---

## Objectif

Rendre le monorepo démarrable, authentifier les utilisateurs, protéger les routes API/UI, et garantir l’isolation des données par tenant.

---

## Livrables à produire

### Sprint 0 (J1–J2)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **S0-01** | Monorepo initialisé (`api` NestJS, `web` Next.js, `shared` TS) | `api` :3001, `web` :3000, builds OK |
| **S0-02** | Prisma : modèles `Tenant`, `User`, `Pharmacy`, `Role` + migrate + seed admin | Seed loginable en local |
| **DOC-part** | Coordonner avec Dancile pour le README setup | Clone → stack up en &lt; 15 min |

### Sprint 1 (J3–J7)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **AUTH-001** | Register : tenant + 1ère pharmacie + user `OWNER` | POST register crée les 3 entités liées |
| **AUTH-002** | Login / refresh / logout + guards JWT | Routes protégées ; refresh token OK |
| **AUTH-003** | UI `/login` + `/register` + middleware protection routes | Redirection login ↔ dashboard |
| **USER-001** | CRUD users + rôles (`OWNER` invite `MANAGER` / `CASHIER`) | UI `/users` ; scoping tenant |

### Sprint 2 (J8–J12)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **SEC-001** | Scoping tenant/pharmacy sur tous les endpoints + tests e2e auth | Impossible de lire les données d’un autre tenant |

### Sprint 3 (J13–J15)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **QA-002** | Tests API critiques auth (pair avec Dancile) | Suite de tests verte (happy path + edge cases) |
| **DOC-001** | `README.md` + `docs/ARCHITECTURE.md` + `docs/STATUS.md` | Setup et architecture à jour |
| **REL-001** | Build prod + participation checklist release | `api` et `web` build OK |

---

## Hors scope (ne pas faire)

- Modules produits, inventaire, POS, fournisseurs, rapports métier  
- Redis (reporté hors MVP)  
- Ordonnances / tiers-payant / app mobile  

---

## Dépendances

| Tu depends de | Qui | Pour quoi |
|---------------|-----|-----------|
| Docker Postgres | Stany (S0-04) | Migrations Prisma |
| UI kit / layout | Francis (S0-06) | Pages auth & users cohérentes |
| Types auth/pharmacy | Francis (S0-03) | Contrats partagés |

| Les autres dependent de toi | Pour quoi |
|-----------------------------|-----------|
| Toute l’équipe | Auth JWT + guards |
| Francis | Modèles Tenant / Pharmacy / User |
| Stany & Dancile | Headers auth + `pharmacyId` pour scoping |

---

## Contrats à respecter

- Source de vérité des DTO : package `shared/`  
- Rôles MVP : `OWNER` \| `MANAGER` \| `CASHIER`  
- Secrets uniquement via `.env` (jamais commités)  
- Chaque PR : review d’**un autre** Dev  

---

## Definition of Done (chaque ticket)

- [ ] Critères d’acceptation OK  
- [ ] Types/validators `shared` à jour si contrat touché  
- [ ] Review d’un pair  
- [ ] Scoping tenant vérifié  
- [ ] Pas de secret dans le code  

---

## Points de sync

- **Fin Sprint 0 :** monorepo + seed demoent  
- **Milieu Sprint 1 :** login UI utilisable par B/C/D  
- **Fin Sprint 2 :** SEC-001 validé avant démo POS  
- **Fin Sprint 3 :** docs + release  

---

## Contact / questions

Bloqueur technique ou décision d’archi → remonter au CTO avec le label **BLOCKER** + impact + option recommandée.
