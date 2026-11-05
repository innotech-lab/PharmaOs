# PharmaOS — Brief Stany

**Assigné à :** Stany  
**Rôle :** Lead catalogue & stock (produits + inventaire)  
**Stack :** NestJS · Prisma · Next.js · shared (Zod/TS) · Postgres  
**Tracks :** Docker · Produits · Inventaire · Alertes stock  

---

## Objectif

Permettre à une pharmacie de gérer son catalogue produits et son stock (niveaux, mouvements, ajustements), prêt à être consommé par la caisse (Dancile).

---

## Livrables à produire

### Sprint 0 (J1–J2)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **S0-04** | `docker-compose` Postgres (Redis optionnel, off par défaut) | DB up ; `DATABASE_URL` utilisable par Prisma |
| **S0-01 (support)** | Aider Daniel sur le bootstrap monorepo si besoin | Builds locaux OK |

### Sprint 1 (J3–J7)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **PROD-001** | Schema `Product` + CRUD API (SKU, nom, prix, TVA, seuil stock) | CRUD + validation Zod |
| **PROD-002** | UI produits (liste, filtre, formulaire créer/éditer) | Créer / éditer / désactiver un produit |
| **INV-001** | Schema Stock + mouvements (`IN` / `OUT` / `ADJUST`) API | Stock cohérent après chaque mouvement |
| **SHARED-001** | Types + validators `product` + `inventory` dans `shared/` (avec Francis) | Importables api + web ; alignés Prisma |

### Sprint 2 (J8–J12)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **INV-002** | UI `/inventory` : niveaux, ajustement, historique mouvements | Ajustement visible immédiatement en stock |
| **SALE-support** | Exposer / stabiliser endpoints stock pour déstockage POS (Dancile) | API `OUT` atomique ; erreur si stock insuffisant |

### Sprint 3 (J13–J15)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **INV-003** | Alertes stock bas (seuil produit) — *Should* | Badge / liste dashboard si stock ≤ seuil |
| **REL-001** | Participation build prod + checklist release | Module produits/stock inclus dans la démo |

---

## Hors scope (ne pas faire)

- Module POS / encaissement (Dancile)  
- Auth / users (Daniel)  
- Fournisseurs / pharmacies (Francis)  
- Lots & dates de péremption (sauf décision CTO contraire — *Should* plus tard)  
- Redis  

---

## Dépendances

| Tu depends de | Qui | Pour quoi |
|---------------|-----|-----------|
| Monorepo + Prisma de base | Daniel | Modules Nest + migrate |
| Guards JWT + scoping | Daniel | Sécuriser CRUD |
| UI kit (Table, Form, Modal) | Francis | Pages produits / inventaire |
| Contrat `shared` pharmacy/auth | Francis | IDs tenant / pharmacy |

| Les autres dependent de toi | Pour quoi |
|-----------------------------|-----------|
| Dancile (POS) | Produits + stock pour checkout |
| Dancile (rapports) | Stock bas / niveaux |
| Francis (seed) | Données produits pour démo |

---

## Contrats métier à respecter

### Product (MVP)
- `sku`, `name`, `priceHT` ou `priceTTC` (trancher avec l’équipe, documenter), `tvaRate`, `stockThreshold`, `active`, `pharmacyId` / `tenantId`

### Stock movement
- Types : `IN` | `OUT` | `ADJUST`  
- Toute vente POS doit passer par un mouvement `OUT` (idéalement même transaction DB)  
- Refuser `OUT` si quantité &gt; stock disponible  

### UI
- Route produits : à créer (ex. `/products` ou section dans inventaire — aligner avec Francis sur la nav)  
- Route inventaire : `/inventory`  

---

## Definition of Done (chaque ticket)

- [ ] Critères d’acceptation OK  
- [ ] Types/validators `shared` à jour  
- [ ] Review d’un pair  
- [ ] Scoping tenant/pharmacy vérifié  
- [ ] Cas stock insuffisant testé  

---

## Points de sync

- **Fin Sprint 0 :** Postgres disponible pour toute l’équipe  
- **Milieu Sprint 1 :** PROD-001 mergeable pour que C démarre le schema Sale  
- **Début Sprint 2 :** INV-001 stable avant SALE-001 de C  
- **Fin Sprint 2 :** INV-002 prêt pour la démo  

---

## Contact / questions

Bloqueur (ex. conflit prix HT/TTC, modèle stock multi-emplacement) → **BLOCKER** au CTO avec option recommandée.
