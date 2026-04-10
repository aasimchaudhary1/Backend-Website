/**
* index.js
* Main app entry point
*/



const express = require('express');
const app = express();
const port = 3001;

const session = require('express-session');
var bodyParser = require("body-parser");

// ✅ Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// ✅ View engine
app.set('view engine', 'ejs');

// ✅ Static files
app.use(express.static(__dirname + '/public'));

// ✅ Session
app.use(session({
    secret: 'your-session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// ✅ SQLite setup
const sqlite3 = require('sqlite3').verbose();
global.db = new sqlite3.Database('./database.db', function(err){
    if(err){
        console.error(err);
        process.exit(1);
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON");
    }
});

// ✅ Middleware for site name + description
app.use((req, res, next) => {
    db.get('SELECT site_name, description FROM site_settings LIMIT 1', (err, row) => {
        if(err || !row) {
            res.locals.siteName = 'YOGA BLISS';
            res.locals.siteDescription = 'Default description';
        } else {
            res.locals.siteName = row.site_name;
            res.locals.siteDescription = row.description;
        }
        next();
    });
});

// ✅ Main page
app.get('/', (req, res) => {
    res.render('main-page');
});


// ================= ROUTES =================

// ✅ Organiser routes
const organisersRoutes = require('./routes/organiser');
app.use('/', organisersRoutes);

// ✅ Attendee routes
const attendeeRoutes = require('./routes/attendees');
app.use('/', attendeeRoutes);


// ================= START SERVER =================

// ✅ IMPORTANT: start server LAST
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});