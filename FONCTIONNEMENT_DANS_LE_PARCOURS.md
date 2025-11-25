# 🎓 Fonctionnement dans le Parcours - Notation et Forum

## ⭐ SYSTÈME DE NOTATION

### Dans le Parcours de l'Étudiant

```
1. 📚 Étudiant suit un cours
   └─> Progression : 0% → 50% → 100%

2. ✅ Cours complété à 100%
   └─> Toutes les leçons terminées
   └─> Tous les quiz réussis
   └─> Évaluation finale réussie

3. 🎓 Étudiant demande son certificat
   └─> Clic sur "Demander le certificat"
   └─> Backend vérifie : "A-t-il noté le cours ?"
   
4. ❌ Si NON noté
   └─> Backend retourne : requires_rating = true
   └─> Modal de notation s'affiche AUTOMATIQUEMENT
   └─> Étudiant DOIT noter avant d'obtenir le certificat

5. ⭐ Étudiant note le cours
   └─> 1-5 étoiles
   └─> Commentaire (optionnel)
   └─> Points positifs (optionnel)
   └─> Points à améliorer (optionnel)
   └─> Recommandation : Oui/Non

6. ✅ Notation enregistrée
   └─> Le système réessaie AUTOMATIQUEMENT de générer le certificat
   └─> Certificat généré avec succès !

7. 📊 La notation apparaît publiquement
   └─> Visible sur la page du cours
   └─> Contribue aux statistiques (note moyenne, distribution)
```

**Résumé :** La notation est **obligatoire** avant d'obtenir le certificat. Le système guide automatiquement l'étudiant.

---

## 💬 FORUM

### Dans le Parcours de l'Étudiant

```
1. 📚 Étudiant suit un cours
   └─> Accède à la page du cours

2. 💬 Étudiant clique sur "Forum"
   └─> URL : /courses/[slug]/forum
   └─> Forum créé AUTOMATIQUEMENT si n'existe pas

3. 📋 Étudiant voit la liste des topics
   └─> Topics existants (questions, discussions)
   └─> Peut trier : Récent, Populaire, Épinglés
   └─> Peut rechercher

4. ➕ Étudiant crée un topic
   └─> Clic sur "Nouveau topic"
   └─> Remplit : Titre + Contenu
   └─> Publie

5. 👁️ Étudiant consulte un topic
   └─> Clic sur un topic
   └─> Voit : Question + Toutes les réponses
   └─> Compteurs : Vues, Réponses

6. 💬 Étudiant répond
   └─> Option A : Réponse principale (au topic)
   └─> Option B : Réponse imbriquée (à une autre réponse)
   └─> Remplit le contenu et publie

7. 👍 Étudiant vote sur les réponses
   └─> Upvote (👍) si réponse utile
   └─> Downvote (👎) si réponse inutile
   └─> Compteurs mis à jour en temps réel

8. ✅ Si auteur du topic
   └─> Peut marquer une réponse comme "Solution"
   └─> Badge vert apparaît sur la réponse
   └─> Réponse mise en évidence
```

**Résumé :** Le forum permet aux étudiants de **poser des questions**, **répondre**, **voter** et **identifier les solutions** pendant leur apprentissage.

---

## 🔄 Intégration dans le Parcours

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────┐
│         PARCOURS D'APPRENTISSAGE                │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐      ┌───────────────┐
│   COURS       │      │    FORUM      │
│               │      │               │
│ • Leçons      │      │ • Questions   │
│ • Quiz        │      │ • Réponses    │
│ • Évaluation  │      │ • Votes       │
│               │      │ • Solutions   │
│               │      │               │
│ Progression   │      │ Accessible    │
│ 0% → 100%     │      │ à tout moment │
└───────┬───────┘      └───────────────┘
        │
        │ Cours complété
        ▼
┌───────────────────────┐
│  DEMANDE CERTIFICAT   │
└───────────┬───────────┘
            │
            │ Vérification
            ▼
    ┌───────────────┐
    │ A-t-il noté ? │
    └───┬───────┬───┘
        │       │
    NON │       │ OUI
        │       │
        ▼       ▼
┌───────────┐ ┌───────────┐
│  MODAL    │ │ CERTIFICAT│
│ NOTATION  │ │  GÉNÉRÉ   │
│           │ │           │
│ ⭐⭐⭐⭐⭐ │ │   ✅      │
│ Comment   │ │           │
│ Pros/Cons │ │           │
└─────┬─────┘ └───────────┘
      │
      │ Notation soumise
      ▼
┌───────────────┐
│ CERTIFICAT    │
│ GÉNÉRÉ        │
│               │
│   ✅          │
└───────────────┘
```

---

## 📍 Points d'Accès

### Notation
- **Automatique** : Modal s'affiche lors de la demande de certificat
- **Manuel** : Page du cours → Section "Avis" → Bouton "Noter ce cours"

### Forum
- **Page du cours** : Bouton "Forum" dans la navigation
- **URL directe** : `/courses/[slug]/forum`
- **Accessible** : À tout moment pendant le cours (pas besoin d'avoir complété)

---

## 🎯 Avantages pour l'Étudiant

### Notation
- ✅ **Obligatoire mais guidée** : Le système guide automatiquement
- ✅ **Simple** : Formulaire intuitif avec étoiles
- ✅ **Complète** : Permet de donner un avis détaillé
- ✅ **Utile** : Aide les futurs étudiants à choisir

### Forum
- ✅ **Disponible 24/7** : Accessible à tout moment
- ✅ **Communautaire** : Interaction avec autres étudiants
- ✅ **Rapide** : Questions/réponses en temps réel
- ✅ **Organisé** : Solutions marquées, votes pour trier les meilleures réponses

---

## 🔑 Points Clés

1. **Notation = Obligatoire** pour obtenir le certificat
2. **Forum = Optionnel** mais toujours disponible
3. **Automatisation** : Le système gère tout (modal, création forum, etc.)
4. **Intégration** : Tout est lié au parcours d'apprentissage

**En résumé :** L'étudiant suit son cours, peut utiliser le forum à tout moment, et **doit noter le cours** avant d'obtenir son certificat. Le système guide automatiquement chaque étape.

