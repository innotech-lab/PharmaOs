# PharmaOS — Brief Dancile

**Assigné à :** Dancile  
**Rôle :** Lead caisse & reporting (POS + ventes + rapports + Git/README initial)  
**Stack :** NestJS · Prisma · Next.js · shared (Zod/TS) · Postgres  
**Tracks :** Git/docs setup · Sales/POS · Rapports · Tests ventes  

---

## Objectif

Livrer le parcours démontrable du MVP : encaisser une vente (panier → paiement → ticket → déstockage) et afficher les indicateurs clés (CA du jour, top produits, stock bas).

---

## Livrables à produire

### Sprint 0 (J1–J2)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **S0-05** | Git init, branches `main` / `develop`, conventions PR, README setup | Clone → README → stack locale en &lt; 15 min |
| **S0-01 (support)** | Aider Daniel sur bootstrap si besoin | Builds OK |

### Sprint 1 (J3–J7)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **SALE-prep** | Types/validators `sale` + `report` dans `shared/` (ébauche) | Schémas Zod prêts avant Sprint 2 |
| **SYNC** | S’aligner avec Stany sur contrat produit/stock pour le checkout | Champs nécessaires documentés |

> Sprint 1 : focus support plateforme + contrats. Le gros du POS est Sprint 2.

### Sprint 2 (J8–J12)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **SALE-001** | Schema Prisma `Sale` + `SaleItem` + mode paiement (`CASH` / `CARD`) | Modèles migrés ; relations OK |
| **SALE-002** | API POS : recherche produit, checkout, annulation soft | Transaction atomique vente + `OUT` stock ; erreur si stock insuffisant |
| **SALE-003** | UI `/pos` : panier, totaux TVA, encaissement, ticket | Happy path vente complète en &lt; 30 s |
| **RPT-001** | API rapports : CA jour, top produits, alertes stock bas | Endpoints scoped tenant/pharmacy |
| **RPT-002** | UI `/reports` + widgets dashboard (avec Francis) | 3 KPI visibles après seed de ventes |

### Sprint 3 (J13–J15)

| ID | Livrable | Critères d’acceptation |
|----|----------|------------------------|
| **QA-002** | Tests API critiques vente + stock (pair avec Daniel) | Happy path + 3 edge cases verts |
| **REL-001** | Build prod + scénario démo caisse 5 min | Démo enregistrée / rejouable |

---

## Hors scope (ne pas faire)

- CRUD produits / inventaire UI (Stany) — tu **consommes** leurs APIs  
- Auth / users (Daniel)  
- Fournisseurs (Francis)  
- Tiers-payant, ordonnances, multi-devises  
- Redis  

---

## Dépendances

| Tu depends de | Qui | Pour quoi |
|---------------|-----|-----------|
| Auth JWT + guards | Daniel | Sécuriser POS |
| Produits + stock API | Stany | Recherche + déstockage |
| UI kit + layout dashboard | Francis | Page `/pos` et charts |
| Seed démo | Francis (QA-001) | Données pour KPI |

| Les autres dependent de toi | Pour quoi |
|-----------------------------|-----------|
| Francis (seed/démo) | Parcours vente à rejouer |
| Toute l’équipe | Git workflow / branches |
| Daniel (SEC) | Endpoints ventes à auditer |

---

## Contrats métier à respecter

### Sale (MVP)
- En-tête : `pharmacyId`, `userId` (caissier), `paymentMethod`, `totalHT`, `totalTVA`, `totalTTC`, `status` (`COMPLETED` | `CANCELLED`)  
- Lignes : `productId`, `qty`, `unitPrice`, `tvaRate`, `lineTotal`  
- Checkout = **une transaction DB** : créer Sale + SaleItems + mouvement stock `OUT`  

### POS UI
- Route : `/pos`  
- Recherche produit (SKU / nom)  
- Panier modifiable  
- Affichage TVA + total  
- Confirmation paiement CASH/CARD  
- Ticket récap (écran ou print-ready simple)  

### Rapports MVP
1. CA du jour  
2. Top N produits vendus  
3. Produits sous seuil de stock  

---

## Definition of Done (chaque ticket)

- [ ] Critères d’acceptation OK  
- [ ] Types/validators `shared` à jour  
- [ ] Review d’un pair  
- [ ] Stock insuffisant géré (pas de vente fantôme)  
- [ ] Scoping tenant/pharmacy vérifié  

---

## Points de sync

- **Fin Sprint 0 :** Git + README prêts pour l’équipe  
- **Fin Sprint 1 :** contrats `sale` / `report` validés avec B  
- **Milieu Sprint 2 :** SALE-002 mergeable pour UI et seed  
- **Fin Sprint 2 :** démo POS + 3 KPI  
- **Fin Sprint 3 :** tests verts + scénario démo  

---

## Contact / questions

Bloqueur (ex. annulation vente / restock, calcul TVA) → **BLOCKER** au CTO avec option recommandée.
