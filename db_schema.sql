-- Enable foreign keys
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- ================= ATTENDEES =================
CREATE TABLE IF NOT EXISTS attendees (
    attendee_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- ================= ORGANISERS =================
CREATE TABLE IF NOT EXISTS organisers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT
);

-- ================= EVENTS =================
CREATE TABLE IF NOT EXISTS events (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   title TEXT NOT NULL,
   description TEXT NOT NULL,
   creationdate TEXT NOT NULL,
   modifieddate TEXT,
   price_count INTEGER NOT NULL,
   price_amount REAL NOT NULL,
   concession_count INTEGER NOT NULL,
   concession_amount REAL NOT NULL,
   status TEXT NOT NULL,
   publisheddate TEXT,
   eventdate TEXT
);

-- ================= SITE SETTINGS =================
CREATE TABLE IF NOT EXISTS site_settings(
    id INTEGER PRIMARY KEY,
    site_name TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ================= DEFAULT DATA =================
INSERT INTO site_settings(id, site_name, description)
SELECT 1, 'YOGA BLISS', 'Breath.Stretch.Connect.Your yoga journey starts here'
WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE id = 1);

COMMIT;