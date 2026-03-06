# Debug — Intégration Ekko Pacs API (Assistant IA)

Document à transmettre au dev API pour diagnostiquer les problèmes d’appels depuis le viewer OHIF (panel Assistant IA).

---

## 1. Contexte côté front

- **Appelant** : viewer OHIF (PacsIA front), panel « Assistant IA ».
- **Base URL utilisée** :
  - En dev : `http://localhost:XXXX/ekko-pacs-api` (proxy vers l’API).
  - En prod / sans proxy : `ekkoPacsApi.baseUrl` (ex. `https://nheuze-pacsia-dev84.edreams-factory.com`).
- **Study identifiant** : on envoie le **Study Instance UID** DICOM (premier de l’étude ouverte) comme `externalId` pour « trouver ou créer » l’étude.

---

## 2. Appels effectués (dans l’ordre)

### 2.1 À l’ouverture du panel

| Étape | Méthode | URL (pattern) | Corps | Quand |
|-------|---------|----------------|-------|--------|
| 1 | `GET` | `{baseUrl}/api/study/external/{externalId}` | — | Dès que le panel s’ouvre avec une étude chargée |
| 2 | `GET` | `{baseUrl}/api/study/agents` | — | Juste après (si l’appel 1 réussit) |

- **`externalId`** : valeur du **Study Instance UID** (string DICOM, ex. `1.2.840.113619.2.290.3.3767434740.226.1600859119.501`).
- **Headers** : on n’envoie que le strict nécessaire (pas de cookie/auth custom pour l’instant).

### 2.2 À l’envoi du premier message

| Étape | Méthode | URL (pattern) | Corps | Quand |
|-------|---------|----------------|-------|--------|
| 3 | `POST` | `{baseUrl}/api/study/conversation/create` | JSON ci‑dessous | Au premier envoi d’un message par l’utilisateur |

**Corps attendu (exemple) :**

```json
{
  "study_id": 1,
  "agent_id": 3,
  "message": "Texte du message utilisateur"
}
```

- `study_id` : `id` retourné par `GET /api/study/external/{externalId}`.
- `agent_id` : `id` d’un agent retourné par `GET /api/study/agents`.
- On n’envoie pas `prompt_id` ni `image_ids` pour l’instant.

---

## 3. Ce qu’on attend en réponse

- **Content-Type** : `application/json` pour tous ces endpoints.
- **Corps** : JSON valide (pas de page HTML, pas de redirection vers une page login en corps de réponse).

Erreurs fréquentes côté front si l’API renvoie autre chose que du JSON :

- `Unexpected token '<', "<!doctype "... is not valid JSON"` → la réponse est du HTML (page d’erreur, login, etc.).
- `Failed to fetch` → souvent CORS ou réseau (connexion refusée, timeout).

---

## 4. Infos à fournir au dev API (à remplir en cas de bug)

Remplir et envoyer ce bloc au dev API.

```
--- Début copier-coller pour le dev API ---

## Environnement
- Date / heure : _______________
- Environnement : [ ] Dev local  [ ] Préprod  [ ] Prod
- Base URL appelée côté front (avant proxy si applicable) : _______________
- Utilisation d’un proxy (ex. /ekko-pacs-api) : [ ] Oui  [ ] Non

## Study Instance UID utilisé comme externalId
(ex. copié depuis l’URL du viewer ou les logs)
externalId = _______________

## Appel en erreur
- Endpoint : _______________ (ex. GET /api/study/external/1.2.840....)
- Méthode : GET / POST

## Réponse reçue (à copier depuis l’onglet Network du navigateur)
- Status HTTP : _______________
- Response Headers (au moins Content-Type) :
  _______________
- Response body (extrait ou entier, selon la taille) :
  _______________

## Message d’erreur affiché dans le panel (si applicable)
_______________

--- Fin copier-coller ---
```

---

## 5. CORS — "Failed to fetch" alors que l’URL marche dans le navigateur

Si **dans la barre d’adresse** l’URL de l’API renvoie du JSON mais que le **front reçoit "Failed to fetch"**, c’est en général un **blocage CORS**.

- En ouvrant l’URL à la main, le navigateur fait une requête **directe** (pas cross-origin) → pas de vérification CORS.
- Depuis le viewer (autre origine, ex. `http://34.245.244.17:51000`), le navigateur envoie une requête **cross-origin**. Il n’accepte la réponse que si l’API envoie des **en-têtes CORS** autorisant cette origine. Sinon il bloque la réponse côté JS → "Failed to fetch".

**À faire côté API** : ajouter sur les réponses (au moins pour les routes `/api/study/*`) :

- `Access-Control-Allow-Origin: <origine du viewer>` (ex. `http://34.245.244.17:51000` ou `https://...`)  
  **ou** pour la dev : `Access-Control-Allow-Origin: *`
- Pour les requêtes avec corps (POST) ou headers custom, répondre aussi à la **preflight** (requête `OPTIONS`) avec par exemple :
  - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type`
  - `Access-Control-Allow-Origin: ...` (même valeur que ci-dessus)

Sans ces en-têtes, le navigateur refuse de donner la réponse au JavaScript même si l’API répond correctement.

---

## 6. Vérifications utiles côté API

- **CORS** : voir section 5 ci-dessus.
- **Authentification** : si l’API exige un cookie ou un token, préciser quels headers ou cookies le front doit envoyer (on pourra les ajouter côté front).
- **Réponse en erreur** : même en 4xx/5xx, renvoyer un corps **JSON** (ex. `{"error": "Study not found"}`) et `Content-Type: application/json`, pas une page HTML.
- **Proxy** : en dev, le front appelle `http://localhost:PORT/ekko-pacs-api/api/study/...` ; le proxy doit réécrire vers `https://<api>/api/study/...` (sans le préfixe `/ekko-pacs-api`). Côté API, la requête reçue doit donc être bien `GET /api/study/external/{externalId}` etc.

---

## 7. Référence rapide des routes utilisées

| Méthode | Route | Rôle |
|---------|--------|------|
| `GET` | `/api/study/external/{externalId}` | Trouver ou créer l’étude par Study Instance UID |
| `GET` | `/api/study/agents` | Liste des agents pour les études |
| `POST` | `/api/study/conversation/create` | Créer une conversation (study_id, agent_id, message) |

Document généré pour le projet PacsIA front — panel Assistant IA.

---

## Message type à envoyer au dev API (en cas de "Failed to fetch")

```
Le front PacsIA appelle l’API en cross-origin (ex. depuis http://34.245.244.17:51000 
vers https://nheuze-pacsia-dev84.edreams-factory.com). L’URL renvoie bien du JSON 
quand on l’ouvre dans le navigateur, mais depuis le JavaScript on a "Failed to fetch".

Il faut activer CORS sur les routes /api/study/* : ajouter sur les réponses
  - Access-Control-Allow-Origin: <origine du viewer> (ex. http://34.245.244.17:51000)
    ou en dev Access-Control-Allow-Origin: *
  - Pour les requêtes OPTIONS (preflight), répondre avec Allow-Methods et Allow-Headers
    (GET, POST, OPTIONS et Content-Type par exemple).

Sans ces en-têtes, le navigateur bloque la réponse et le front ne peut pas lire le JSON.
```
