# Contrats métier et décisions ouvertes

Les points ci-dessous consolident les briefs `docs/team/`. Ils décrivent la cible du MVP ; ils ne signifient pas que l’API ou les validateurs sont déjà implémentés. Les sources prévues dans `shared/types/` et `shared/validators/` sont vides à ce jour.

## Identité et organisation

### Tenant

Organisation cliente qui regroupe les utilisateurs, pharmacies et données métier. Les endpoints métier doivent obtenir le tenant depuis l’identité authentifiée, jamais faire confiance à un `tenantId` librement fourni par le navigateur.

### User

Rôles MVP prévus : `OWNER`, `MANAGER`, `CASHIER`. L’inscription crée un tenant, sa première pharmacie et son utilisateur `OWNER` selon le brief Daniel.

Le formulaire d’inscription demande le prénom, le nom, le nom de la pharmacie, le pays, la ville, l’adresse e-mail et un mot de passe d’au moins huit caractères. Le premier utilisateur est présenté comme administrateur : le backend devra attribuer le rôle `OWNER` côté serveur. Le formulaire est une interface préparatoire : il ne transmet ni ne conserve ces données tant que l’API d’inscription n’est pas branchée.

La configuration ultérieure de l’officine devra permettre de renseigner l’adresse complète, le téléphone, le numéro d’autorisation ou d’enregistrement et les informations fiscales pertinentes. Leur caractère obligatoire et leur validation dépendent du pays et restent à définir avec l’équipe backend. L’invitation de membres d’équipe reste également à implémenter.

### Pharmacy

Champs MVP dans le brief Francis :

| Champ | Sens |
|---|---|
| `tenantId` | Organisation propriétaire |
| `name` | Nom affiché |
| `address` | Adresse simple |
| `active` | Statut du site |

Les stocks et ventes appartiennent à une pharmacie. Le site actif choisi dans l’interface devra être envoyé au client API après authentification ; ce branchement n’existe pas encore.

## Fournisseur

Champs MVP prévus : `name`, `email`, `phone`, `notes`, `active`. Le brief précise un scope tenant et un `pharmacyId` optionnel si le métier le justifie.

**Décision encore ouverte :** le scope final du fournisseur (tenant seul ou tenant + pharmacie) n’est pas acté. Le CRUD local actuel n’est pas une référence de sécurité ou de persistance serveur.

## Produit et inventaire

Le brief Stany prévoit `sku`, `name`, prix, `tvaRate`, `stockThreshold`, `active` et rattachement à une pharmacie/tenant. Les mouvements ont le type `IN`, `OUT` ou `ADJUST`. Un mouvement `OUT` ne doit pas faire passer le stock sous zéro.

**Décision encore ouverte :** le champ produit doit représenter le prix HT ou le prix TTC. Cette décision doit être prise avec Dancile avant le modèle Prisma et les calculs POS.

## Vente et rapport

Le brief Dancile décrit une vente avec `pharmacyId`, `userId`, `paymentMethod` (`CASH` ou `CARD`), `totalHT`, `totalTVA`, `totalTTC` et statut `COMPLETED` ou `CANCELLED`. Les lignes contiennent `productId`, quantité, prix unitaire, taux TVA et total ligne.

Le checkout doit créer la vente, ses lignes et les mouvements de sortie de stock dans une transaction DB. Les rapports MVP attendus sont le chiffre d’affaires du jour, les produits les plus vendus et les produits sous seuil.

## Conventions de validation à adopter

- Définir un type TypeScript et un schéma Zod partagés par contrat.
- Distinguer les schémas d’entrée (création/mise à jour) des entités de réponse si leurs champs diffèrent.
- Valider au bord de l’API et réutiliser le même contrat côté web ; éviter les DTO/schémas dupliqués.
- Documenter les unités, devise, règles d’arrondi, nullabilité et champs calculés avant d’exposer les endpoints.
- Ne jamais confondre les données statiques de la démo avec les réponses métier validées.
