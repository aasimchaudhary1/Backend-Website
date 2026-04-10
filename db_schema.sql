
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

--create table for attendee
CREATE TABLE IF NOT EXISTS attendees (
    attendee_id INTEGER PRIMARY KEY AUTOINCREMENT, --unique id for attendees
    name TEXT NOT NULL, --attendees name
    email TEXT NOT NULL UNIQUE, -- email must be unique
    password TEXT NOT NULL --hashed password

);

CREATE TABLE organisers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT
);
--create table for events
CREATE TABLE IF NOT EXISTS events (
   id INTEGER PRIMARY KEY AUTOINCREMENT,--unique id for events
   title TEXT NOT NULL,--event title
   description TEXT NOT NULL,--event description
   creationdate TEXT NOT NULL,--creationdate
   modifieddate TEXT,--modifieddate
   price_count INTEGER NOT NULL,--full price tickets availability
   price_amount REAL NOT NULL,--full price ticket amount
   concession_count INTEGER NOT NULL,--concession price tickets availability
   concession_amount REAL NOT NULL,--concession tickets amount
   status TEXT NOT NULL,--'draft' or 'published event'
   publisheddate TEXT,--published date
   eventdate TEXT--event date

);

--create table to store site settings
CREATE TABLE IF NOT EXISTS site_settings(
    id INTEGER PRIMARY KEY,--always set to 1
    site_name TEXT NOT NULL,--name of site
    description TEXT,--site descripotion
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP--last update time stamp
);

--insert default site settings 
INSERT INTO site_settings(id,site_name,description)
SELECT 1,'YOGA BLISS','Breath.Stretch.Connect.Your yoga journey starts here'
WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE id=1);
COMMIT;

