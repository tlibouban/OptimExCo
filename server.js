const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const db = require("./db/index.js");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Serve static files (front-end)
app.use(express.static(path.join(__dirname, "public")));

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to sanitize cabinet name to safe filename
const sanitizeFileName = (name) => {
  return name.replace(/[^a-zA-Z0-9-_]/g, "_");
};

// API: Save questionnaire
app.post("/api/questionnaire", (req, res) => {
  const data = req.body;
  if (!data || !data.cabinetName) {
    return res
      .status(400)
      .json({ error: 'Le champ "cabinetName" est requis.' });
  }

  const fileName = sanitizeFileName(data.cabinetName) + ".json";
  const filePath = path.join(DATA_DIR, fileName);

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return res.json({ message: "Questionnaire sauvegardé.", file: fileName });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur lors de la sauvegarde." });
  }
});

// API: Retrieve questionnaire by cabinet name
app.get("/api/questionnaire/:cabinetName", (req, res) => {
  const cabinetName = req.params.cabinetName;
  const fileName = sanitizeFileName(cabinetName) + ".json";
  const filePath = path.join(DATA_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return res
      .status(404)
      .json({ error: "Aucune donnée trouvée pour ce cabinet." });
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return res.json(JSON.parse(content));
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Erreur lors de la lecture du fichier." });
  }
});

// GET: List all questionnaires (with optional ?search= query string)
app.get("/api/questionnaires", (req, res) => {
  try {
    const search = (req.query.search || "").toString().toLowerCase();

    // Read all JSON files in data directory
    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));

    const list = files
      .map((file) => {
        try {
          const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
          const json = JSON.parse(raw);
          return {
            cabinetName: json.cabinetName || path.parse(file).name,
            contactName: json.contactName || "",
            timestamp: json.timestamp || null,
            file,
          };
        } catch (_) {
          // Ignore malformed file but log once
          console.warn(`Cannot parse questionnaire file ${file}`);
          return null;
        }
      })
      .filter((item) => item !== null)
      .filter((item) =>
        search ? item.cabinetName.toLowerCase().includes(search) : true
      );

    return res.json(list);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Erreur lors de la lecture des questionnaires." });
  }
});

// PUT: Update an existing questionnaire (identified by current cabinetName in URL)
app.put("/api/questionnaire/:cabinetName", (req, res) => {
  const originalCabinetName = req.params.cabinetName;
  const originalFile = sanitizeFileName(originalCabinetName) + ".json";
  const originalPath = path.join(DATA_DIR, originalFile);

  if (!fs.existsSync(originalPath)) {
    return res.status(404).json({ error: "Questionnaire introuvable." });
  }

  const updatedData = req.body;
  if (!updatedData || !updatedData.cabinetName) {
    return res
      .status(400)
      .json({ error: 'Le champ "cabinetName" est requis.' });
  }

  try {
    // If cabinetName changed, we may need to rename the file
    const newFile = sanitizeFileName(updatedData.cabinetName) + ".json";
    const newPath = path.join(DATA_DIR, newFile);

    // Write updated content first (to newPath if different)
    fs.writeFileSync(newPath, JSON.stringify(updatedData, null, 2), "utf-8");

    // Remove old file if name changed
    if (newPath !== originalPath && fs.existsSync(originalPath)) {
      fs.unlinkSync(originalPath);
    }

    return res.json({ message: "Questionnaire mis à jour.", file: newFile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur lors de la mise à jour." });
  }
});

// --- New API: créer un dossier ------------------------
app.post("/api/dossier", async (req, res) => {
  try {
    const payload = req.body;

    // Validation minimale
    if (!payload || !payload.client || !payload.numeroDossier) {
      return res
        .status(400)
        .json({ error: "Champs 'client' et 'numeroDossier' requis." });
    }

    // 1) upsert client
    const clientResult = await db.query(
      `INSERT INTO client(nom, type, erp, effectif, departement)
       VALUES ($1, 'Prospect', $2, $3, $4)
       ON CONFLICT (nom) DO UPDATE SET erp = EXCLUDED.erp RETURNING id`,
      [
        payload.client,
        payload.logiciel || null,
        payload.effectif || null,
        payload.departement || null,
      ]
    );
    const clientId = clientResult.rows[0].id;

    // 2) create dossier
    const dossierResult = await db.query(
      `INSERT INTO dossier(client_id, numero_dossier, projet, logiciel_base, sens, effectif_snapshot, departement_snapshot, logiciel_autre, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id`,
      [
        clientId,
        payload.numeroDossier,
        payload.projet || null,
        payload.logiciel || null,
        payload.sens || null,
        payload.effectif || null,
        payload.departement || null,
        payload.logicielAutre || null,
        payload, // store full form as JSON meta for simplicité
      ]
    );

    const dossierId = dossierResult.rows[0].id;

    return res.json({ id: dossierId, message: "Dossier créé." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur en base de données." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
