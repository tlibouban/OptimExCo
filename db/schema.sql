-- PostgreSQL 16 schema for Delivery project
-- Run with psql or a migration tool. Adjust schemas as needed.

-- ENUM types
CREATE TYPE client_type AS ENUM ('Prospect', 'Client');
CREATE TYPE tri_state AS ENUM ('not_examined', 'rejected', 'activated');
CREATE TYPE dossier_projet AS ENUM ('separation', 'fusion', 'newlogo', 'basecollab');

-- Core tables
CREATE TABLE client (
  id            SERIAL PRIMARY KEY,
  nom           TEXT NOT NULL,
  type          client_type NOT NULL DEFAULT 'Prospect',
  erp           TEXT,
  effectif      INT,
  departement   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nom)
);

CREATE TABLE dossier (
  id                     SERIAL PRIMARY KEY,
  client_id              INT REFERENCES client(id) ON DELETE CASCADE,
  numero_dossier         TEXT,
  projet                 dossier_projet,
  logiciel_base          TEXT,
  sens                   TEXT,
  effectif_snapshot      INT,
  departement_snapshot   TEXT,
  logiciel_autre         TEXT,
  meta                   JSONB DEFAULT '{}',
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE item_meta (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  label             TEXT NOT NULL,
  section           TEXT,
  sous_section      TEXT,
  item_type         TEXT,
  default_minutes   INT,
  default_prix_ht   NUMERIC(10,2)
);

CREATE TABLE dossier_item (
  id                 SERIAL PRIMARY KEY,
  dossier_id         INT REFERENCES dossier(id) ON DELETE CASCADE,
  item_meta_id       INT REFERENCES item_meta(id) ON DELETE CASCADE,
  tri_state          tri_state DEFAULT 'not_examined',
  quantity           INT DEFAULT 1,
  minutes_override   INT,
  prix_ht_override   NUMERIC(10,2),
  extra              JSONB DEFAULT '{}'
);

CREATE TABLE profil (
  id                  SERIAL PRIMARY KEY,
  dossier_id          INT REFERENCES dossier(id) ON DELETE CASCADE,
  nom                 TEXT,
  nb_utilisateurs     INT,
  tri_state_include   tri_state,
  tri_state_modif     tri_state
);

CREATE TABLE devis (
  id            SERIAL PRIMARY KEY,
  dossier_id    INT REFERENCES dossier(id) ON DELETE CASCADE,
  total_ht      NUMERIC(10,2),
  total_ttc     NUMERIC(10,2),
  statut        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE devis_ligne (
  id                  SERIAL PRIMARY KEY,
  devis_id            INT REFERENCES devis(id) ON DELETE CASCADE,
  item_meta_id        INT REFERENCES item_meta(id) ON DELETE CASCADE,
  quantity            INT,
  prix_unitaire_ht    NUMERIC(10,2),
  montant_ht          NUMERIC(10,2)
);

CREATE TABLE equipe (
  id          SERIAL PRIMARY KEY,
  libelle     TEXT,
  type        TEXT
);

CREATE TABLE utilisateur (
  id          SERIAL PRIMARY KEY,
  nom         TEXT,
  email       TEXT,
  role        TEXT
);

CREATE TABLE membre_equipe (
  equipe_id       INT REFERENCES equipe(id) ON DELETE CASCADE,
  utilisateur_id  INT REFERENCES utilisateur(id) ON DELETE CASCADE,
  debut           DATE,
  fin             DATE,
  PRIMARY KEY (equipe_id, utilisateur_id, debut)
);

CREATE TABLE affectation (
  id          SERIAL PRIMARY KEY,
  client_id   INT REFERENCES client(id) ON DELETE CASCADE,
  equipe_id   INT REFERENCES equipe(id) ON DELETE CASCADE,
  debut       DATE,
  fin         DATE
);

CREATE TABLE facture (
  id            SERIAL PRIMARY KEY,
  devis_id      INT REFERENCES devis(id) ON DELETE CASCADE,
  total_ht      NUMERIC(10,2),
  tva           NUMERIC(10,2),
  total_ttc     NUMERIC(10,2),
  date_facture  DATE,
  statut        TEXT
);

CREATE TABLE reglement (
  id               SERIAL PRIMARY KEY,
  facture_id       INT REFERENCES facture(id) ON DELETE CASCADE,
  montant          NUMERIC(10,2),
  date_reglement   DATE,
  mode_paiement    TEXT
);

-- Indexes
CREATE INDEX idx_dossier_client ON dossier(client_id);
CREATE INDEX idx_dossier_item_dossier ON dossier_item(dossier_id);
CREATE INDEX idx_dossier_item_meta ON dossier_item(item_meta_id);
CREATE INDEX idx_item_meta_slug ON item_meta(slug); 