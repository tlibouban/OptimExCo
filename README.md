# Questionnaire Export Compta

Cette petite application web permet :

1. De proposer un formulaire à vos clients afin de recueillir les informations nécessaires à la mise en place de l’export comptable (inspiré du document « Questionnaire Export Compta » joint).
2. De stocker automatiquement les réponses dans un fichier JSON nommé à partir du _Nom du cabinet_.
3. De retrouver à tout moment les informations via une requête GET.

## Prérequis

- Node.js >= 18 (ou version LTS récente)

## Installation

```bash
npm install
```

## Lancer l’application

```bash
npm start
```

Puis ouvrez votre navigateur à l’adresse : <http://localhost:3000>

## Points d’extension

- **Structure du formulaire** : le fichier `public/index.html` peut être adapté pour refléter exactement toutes les questions du document PDF / DOCX (sections, champs, listes déroulantes…).
- **Validation avancée** : Bootstrap propose déjà une validation de base, mais vous pouvez ajouter des règles JavaScript ou côté serveur dans `server.js`.
- **Sécurité & Authentification** : si les informations sont sensibles, pensez à protéger l’accès aux routes API (JWT, Basic Auth…).
- **Persistance** : un simple JSON sur le disque est suffisant pour un POC ; pour un usage en production, envisagez une base (SQLite, PostgreSQL…).

## Exemples d’appels API

- **Enregistrer**

  ```http
  POST /api/questionnaire HTTP/1.1
  Content-Type: application/json

  {
    "cabinetName": "MonCabinet",
    "contactName": "Jean Dupont",
    "email": "j.dupont@example.com",
    "address": "1 rue des Lilas",
    "accountingSoftware": "Sage",
    "exportFormat": "CSV",
    "additionalNotes": "RAS"
  }
  ```

- **Récupérer**

  ```http
  GET /api/questionnaire/MonCabinet HTTP/1.1
  ```

---

_N’hésitez pas à personnaliser le projet pour coller au plus près de vos besoins._