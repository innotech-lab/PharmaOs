# Plan de correction UX

Rédigé le 12 novembre 2026, à partir d'un audit UX du dossier `web` et de l'API. L'audit repose sur la lecture du code : l'application n'a pas été lancée.

## Résultat de l'audit

1 bloquant, 4 élevés, 7 moyens, 4 faibles. Aucun procédé trompeur n'a été trouvé. Les deux problèmes principaux : un nouveau titulaire arrive sur un tableau de bord vide, sans guide, et l'écran Fournisseurs perd ce qu'il saisit.

## Méthode

- Un niveau est un lot complet : on corrige tout le niveau, on vérifie, on valide, puis on passe au suivant.
- Une branche par niveau : `ux/niveau-1-bloquant`, `ux/niveau-2-eleve`, `ux/niveau-3-moyen`, `ux/niveau-4-faible`.
- Plusieurs corrections touchent aux modules d'autres responsables (inventaire, authentification). Les prévenir avant de modifier ces fichiers.

## Niveau 1 — Bloquant : les fournisseurs perdus

**Constat.** Les fournisseurs ne vivent que dans la mémoire de la page (`web/components/module-page.tsx:18`, `:25-31`). L'API n'a aucune route fournisseurs. Un rechargement efface tout, alors que l'écran montre les données comme enregistrées. La suppression est immédiate, sans confirmation (`:33`), et les compteurs affichent « — » même quand la liste est remplie (`:38`).

| Fait | Étape | Fichiers |
|---|---|---|
| [ ] | Créer l'API fournisseurs (liste, ajout, modification, suppression), limitée à la pharmacie du compte | `api/src/modules/suppliers/`, schéma Prisma, `shared/` |
| [ ] | Brancher l'écran dessus, avec chargement, erreurs et message de succès | `web/components/module-page.tsx` |
| [ ] | Demander une confirmation avant suppression | `web/components/module-page.tsx` |
| [ ] | Afficher les vrais compteurs à la place de « — » | `web/components/module-page.tsx` |

**Décision à prendre.** Créer l'API maintenant (recommandé : le module existe déjà, vide, côté API), ou afficher « Non enregistré — démonstration » en attendant. La première option demande une migration Prisma.

## Niveau 2 — Élevé : le premier contact et le stock

| Fait | # | Constat | Correction | Fichiers |
|---|---|---|---|---|
| [ ] | 1 | Tableau de bord vide après l'inscription : quatre indicateurs à « — », deux « Aucune donnée disponible », aucune action proposée | Liste de démarrage qui commence à 1 sur 4 (compte créé, premier produit, stock saisi, collègue invité) et se coche d'après les vraies données | `web/components/dashboard-home.tsx`, nouveau composant |
| [ ] | 2 | Point de vente et Rapports affichent « Aucune vente en cours » et « Aucun rapport » alors que la fonction n'existe pas ; « Chiffre d'affaires » et « Ventes aujourd'hui » restent à « — » | Marquer « Bientôt disponible » et retirer les deux indicateurs sans données | `web/components/module-page.tsx:42`, `dashboard-home.tsx`, `dashboard-shell.tsx` |
| [ ] | 3 | L'inscription impose 800 ms d'animation à chaque étape, trois fois de suite | Transition de 200 ms au plus | `web/app/(auth)/register/page.tsx:34`, `web/app/styles.css` |
| [ ] | 4 | Ajustement de stock : champ vide, quantité actuelle non affichée, stock écrasé sans confirmation ni message de succès | Pré-remplir avec la quantité actuelle, afficher « Actuel → Nouveau », confirmer après l'enregistrement | `web/app/(dashboard)/inventory/page.tsx:34`, `:47` |
| [ ] | 4 bis | Le produit présélectionné est pris dans le catalogue complet, donc parfois un produit inactif absent de la liste | Présélectionner dans la liste des produits actifs | `web/app/(dashboard)/inventory/page.tsx:26` |

**Décision à prendre.** Pour le point 2 : afficher « Bientôt disponible » (recommandé) ou masquer ces entrées du menu.

**À mesurer.** Part des comptes qui créent un produit dans les 24 h ; taux d'abandon par étape d'inscription ; ajustements de stock corrigés dans la minute.

## Niveau 3 — Moyen : fluidité des parcours

| Fait | # | Constat | Correction | Fichiers |
|---|---|---|---|---|
| [ ] | 1 | Seuil d'alerte à 0 par défaut : un produit ne passe en « Stock bas » qu'en rupture | Seuil par défaut à la création d'un produit | `web/components/products-page.tsx:9` |
| [ ] | 2 | Après la création d'un produit, le stock est à 0 et rien ne mène à sa saisie | Message « Produit ajouté — Saisir le stock » avec lien direct | `products-page.tsx`, `inventory/page.tsx` |
| [ ] | 3 | Les lignes « Stock bas » n'offrent aucune action | Bouton « Ajuster » qui présélectionne le produit | `inventory/page.tsx:45`, `web/components/dashboard-stock-alerts.tsx:55` |
| [ ] | 4 | La cloche de notifications est toujours vide, alors que les alertes de stock existent | Y afficher les alertes de stock bas | `web/components/dashboard-shell.tsx:31` |
| [ ] | 5 | Le pays se saisit en texte libre à l'inscription | Liste déroulante, présélectionnée d'après le navigateur | `register/page.tsx:50` |
| [ ] | 6 | Le titulaire choisit le mot de passe du collègue qu'il ajoute | Mot de passe temporaire à changer à la première connexion | `web/app/(dashboard)/users/page.tsx:40`, API `auth` et `users` |
| [ ] | 7 | La connexion n'a ni « Mot de passe oublié » ni bouton pour afficher le mot de passe | Ajouter les deux | `web/app/(auth)/login/page.tsx:33`, `register/page.tsx` |

**Décisions à prendre.**

- Point 1 : quelle valeur de seuil par défaut ? C'est un choix métier.
- Point 7 : « Mot de passe oublié » demande un envoi d'e-mails, que l'API n'a pas. Soit on l'ajoute, soit le lien renvoie vers l'assistance pour l'instant.
- Point 6 : un vrai lien d'invitation dépend du même envoi d'e-mails. Le mot de passe temporaire fonctionne sans.

## Niveau 4 — Faible : finitions

| Fait | Correction | Fichiers |
|---|---|---|
| [ ] | Rôles et types de mouvements en français (« Caissier », « Entrée », « Sortie », « Ajustement ») | `users/page.tsx:34`, `inventory/page.tsx:49` |
| [ ] | Sélecteur de pharmacie non cliquable quand il n'y en a qu'une | `dashboard-shell.tsx:37` |
| [ ] | Paramètres : supprimer le doublon du nom de la pharmacie | `web/app/(dashboard)/settings/page.tsx:19-20` |
| [ ] | Devise sur les prix ; bouton « Ajouter le membre » | `products-page.tsx`, `users/page.tsx:42` |
| [ ] | Mettre à jour `docs/STATUS.md`, qui décrit encore les produits et l'inventaire comme non branchés | `docs/STATUS.md` |

**Décision à prendre.** Quelle devise afficher.

**Hors plan.** La suppression de compte : elle demande une décision d'équipe sur le sort des données.

## Vérification à chaque niveau

1. `npm run typecheck` sur le web et l'API. Le projet n'a pas de tests automatisés, c'est donc le seul contrôle automatique.
2. Lancer l'application et parcourir les écrans modifiés comme un nouvel utilisateur.
3. Repasser la checklist d'audit sur ce qui a changé.
4. Résumer : ce qui a changé, ce qui reste, ce qu'il faut mesurer.

## Ordre et dépendances

Les niveaux 1 et 2 ne dépendent pas de l'envoi d'e-mails et peuvent démarrer tout de suite. Le niveau 3 attend les décisions sur le seuil et sur le mot de passe oublié.

## À conserver

- Aucun procédé trompeur : pas de faux compteur, pas de case pré-cochée, boutons d'annulation neutres.
- Les boutons annoncent le résultat (« Créer mon espace », « Enregistrer l'ajustement »).
- La progression de l'inscription commence à « Étape 1 sur 4 ».
- L'avertissement « La nouvelle quantité saisie remplacera le stock actuel ».
- Le rôle par défaut d'un nouveau membre est le plus restreint (Caissier).
- Les écrans d'erreur proposent « Réessayer », et les chargements ont des squelettes.

## Avancement — 12 novembre 2026

Branche `ux/niveaux-1-2`, non commitée.

| Niveau | État |
|---|---|
| 1 — Bloquant | Fait : API fournisseurs persistée, confirmation de suppression, vrais compteurs |
| 2 — Élevé | Fait : liste de démarrage, inscription plus rapide, ajustement de stock pré-rempli avec aperçu et confirmation. Le point de vente et les rapports sont désormais de vrais modules (voir ci-dessous) |
| 3 — Moyen | Fait : lien « Saisir le stock » après création d'un produit, bouton « Ajuster » sur chaque ligne, alertes de stock dans la cloche, liste des pays à l'inscription, mot de passe temporaire avec changement obligatoire et boutons d'affichage des mots de passe. Restent : seuil par défaut et mot de passe oublié |
| 4 — Faible | Fait : rôles et mouvements en français, sélecteur de pharmacie non cliquable, doublon des paramètres supprimé, prix en francs burundais (FBu), mise à jour de `docs/STATUS.md` |

En plus du plan :

- **Point de vente** : API `POST /sales` (vente, lignes et sorties de stock dans une transaction), `GET /sales`, `POST /sales/:id/cancel` (titulaire ou manager, remet le stock). Écran de caisse avec recherche, panier, TVA, espèces ou carte, rendu monnaie, ticket imprimable.
- **Rapports** : API `GET /reports/summary` (chiffre d'affaires par jour dans le fuseau de l'officine, période précédente, top produits). Écran avec période 7 ou 30 jours.
- **Refonte visuelle** des 8 écrans de l'espace de travail : feuille `web/app/(dashboard)/dashboard.css`, jauge de stock avec repère de seuil sur chaque produit.
- **A — Pays à l'inscription** : liste de pays, choix initial déduit de la région navigateur et champ de saisie pour « Autre pays ».
- **B — Mot de passe temporaire** : membre forcé à changer son mot de passe après connexion, avec une page dédiée et un contrôle bcrypt côté API.
- **C — Afficher le mot de passe** : boutons accessibles sur connexion, inscription et changement de mot de passe.
- **D — Numéros de ticket** : compteur de vente par pharmacie et migration qui renumérote l'historique dans l'ordre chronologique et corrige les mouvements correspondants.
- **E — Feuille globale** : suppression des styles d'anciens écrans de travail inutilisés dans `web/app/styles.css`, conservation des styles partagés par les pages d'authentification et d'erreur.
- Migrations : `20261112091838_suppliers`, `20261112093619_sales`, `20261112101407_product_category`, `20261112113000_temporary_password`, `20261112114500_pharmacy_sale_counter` (les deux dernières sont appliquées à la base locale).
