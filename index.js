/**
* index.js
* Main app entry point
*/

const express = require('express');
const app = express();

// ✅ REQUIRED for Render
const PORT = process.env.PORT || 3002;

const session = require('express-session');
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

// ================= MIDDLEWARE =================

// ✅ Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Static files
app.use(express.static("public"));

// ✅ View engine
app.set('view engine', 'ejs');

// ================= SESSION =================

app.use(session({
    secret: 'your-session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// ================= DATABASE =================

const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, "database.db");

global.db = new sqlite3.Database(dbPath, function(err){
    if(err){
        console.error("Database error:", err);
        process.exit(1);
    } else {
        console.log("✅ Database connected");

        // 🔥 VERY IMPORTANT: Run SQL file to create tables
        const sqlFile = path.join(__dirname, "db_schema.sql");

        if (fs.existsSync(sqlFile)) {
            const initSql = fs.readFileSync(sqlFile, "utf-8");

            db.exec(initSql, (err) => {
                if (err) {
                    console.error("❌ Error running SQL:", err);
                } else {
                    console.log("✅ Database initialized (tables created)");
                }
            });
        } else {
            console.log("⚠️ database.sql file not found");
        }

        global.db.run("PRAGMA foreign_keys=ON");
    }
});

// ================= GLOBAL DATA =================

// ✅ Prevent crash if DB fails
app.use((req, res, next) => {
    db.get('SELECT site_name, description FROM site_settings LIMIT 1', (err, row) => {
        if(err || !row) {
            res.locals.siteName = 'YOGA BLISS';
            res.locals.siteDescription = 'Breathe. Your yoga Journey starts here';
        } else {
            res.locals.siteName = row.site_name;
            res.locals.siteDescription = row.description;
        }
        next();
    });
});

// ================= ROUTES =================

// ✅ Main page
app.get('/', (req, res) => {
    res.render('main-page');
});

// ✅ Organiser routes
const organisersRoutes = require('./routes/organiser');
app.use('/', organisersRoutes);

// ✅ Attendee routes
const attendeeRoutes = require('./routes/attendees');
app.use('/', attendeeRoutes);

// ================= START SERVER =================

// ✅ Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});