const express= require('express');
const router= express.Router();
const bcrypt= require('bcrypt');

//Middleware to ensure that only authenticated organizer can access routes
function requireOrganiserAuth(req,res,next)
{
    if(req.session && req.session.isOrganiserAuthenticated)
    {
        return next();
    }
    else{
        return res.redirect('/');
    }
}

router.post('/organiser/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM organisers WHERE email=?';

    db.get(query, [email], async (err, row) => {

        if (err) {
            return res.status(500).send("DB_ERROR");
        }

        if (!row) {
            return res.status(404).send("WRONG_EMAIL");
        }

        const match = await bcrypt.compare(password, row.password);

        if (!match) {
            return res.status(401).send("WRONG_PASSWORD");
        }

        // ✅ success
        req.session.isOrganiserAuthenticated = true;
        req.session.organiser_email = email;
        req.session.organiser_name = row.name;

        return res.status(200).json({ name: row.name });
    });
});

router.post('/organiser/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const hashedpassword = await bcrypt.hash(password, 10);

        const query = 'INSERT INTO organisers (name, email, password) VALUES (?,?,?)';

        db.run(query, [name, email, hashedpassword], function(err) {
            if (err) {
                if (err.message.includes("UNIQUE")) {
                    return res.status(409).send("EMAIL_EXISTS");
                }
                return res.status(500).send("REGISTRATION_ERROR");
            }

            req.session.organiserName = name;
            return res.status(200).send("SUCCESS");
        });

    } catch (error) {
        return res.status(500).send("ERROR");
    }
});

//route to show site setting form prefilled with details
router.get('/organiser/site-settings',requireOrganiserAuth,(req,res)=>{
    const sitequery=`SELECT site_name,description FROM site_settings LIMIT 1`;
    const orgquery=`SELECT name FROM organisers WHERE email=?`;
    const saved= req.query.saved == '1';
    db.get(sitequery,[],(err,siterow)=>{
        if(err||!siterow)
        {
            return res.status(500).send("SETTINGS_LOAD_ERROR");
        }
        db.get(orgquery,[req.session.organiser_email],(err,orgRow)=>{
            if(err)
            {
                console.error("Error fetching organiser name:",err);
                return res.status(500).send("ORGANISER_LOAD_ERROR");
            }
            const organiserName=(orgRow && orgRow.name) ? orgRow.name: req.session.organiser_name || "Organiser";
            res.render('site-settings',{
                siteName: siterow.site_name,
                siteDescription: siterow.description,
                organiserName,saved
        });
    });
});
});

//route to update site settings
router.post('/organiser/site-settings',(req,res)=>
{
    const {site_name,site_description,organiser_name}=req.body;
    if(!site_name || !site_description || !organiser_name)
    {
        return res.status(400).send("FIELDS_REQUIRED");
    }
    const updatesitequery=`UPDATE site_settings SET site_name=? , description= ?,updated_at=datetime('now','+3 hours') WHERE id=1`;
    const updateorgquery=`UPDATE organisers SET name=? WHERE email=?`;
    db.run(updatesitequery,[site_name,site_description],function(err)
{
    if(err)
    {
        console.error("DB ERROR:",err);
        return res.status(500).send("UPDATE_ERROR");
    }
    db.run(updateorgquery,[organiser_name,req.session.organiser_email],function(err){
        if(err)
        {
            console.error("ORG NAME UPDATE ERROR",err);
            return res.status(500).send("ORG_NAME_UPDATE_ERROR");
        }
        req.session.organiser_name=organiser_name;
        res.redirect('/organiser/site-settings?saved=1');
    });
});
});

//route to render orgainser details
router.get('/organiser',requireOrganiserAuth,(req,res)=>
{
    const name=req.session.organiser_name || "Organiser";
    const query =`SELECT site_name,description,updated_at FROM site_settings  WHERE id=1`;
    const draftquery=`SELECT *  FROM events WHERE status='draft' ORDER BY creationdate DESC`;
    const publishedquery=`SELECT * FROM events WHERE status='published' ORDER BY creationdate DESC`;

    db.get(query,[],(err,row)=>
    {
        if(err || !row)
        {
            return res.render('organiser',{
                name,
                siteName: 'YOGA BLISS',
                siteDescription: 'Default description',
                updatedAt: 'Not available',
                draftEvents:[],
                publishedEvents:[]
            });
        }
        db.all(draftquery,[],(err,drafts)=>
        {
            if(err)
            {
                draftEvents=[];
            }
            db.all(publishedquery,[],(err,published)=>
            {
                if(err)
                {
                    publishedEvents=[];
                }
                res.render('organiser',{
                    name,
                    siteName:row.site_name,
                    siteDescription:row.description,
                    updatedAt:row.updated_at,
                    draftEvents:drafts,
                    publishedEvents:published
                });
            });
         });
    });
});

//route to render empty edit event page
router.get('/organiser/edit-event',requireOrganiserAuth,(req,res)=>{
    const newevent=
    {
        title:'',
        description:'',
        price_count:0,
        price_amount:0,
        concession_count:0,
        concession_amount:0,
        creationdate:new Date().toISOString(),
        id:null
    }
  
    res.render('edit-event',{event:newevent});
});

//route to insert new event details
router.get('/organiser/create-event',(req,res)=>{
    const now = new Date().toISOString();
    const query = `
        INSERT INTO events 
        (title, description, creationdate, modifieddate, price_count, price_amount, concession_count, concession_amount, status,eventdate)
        VALUES ('Untitled Event', '', ?, ?, 0, 0, 0, 0, 'draft',NULL)
    `;
    db.run(query, [now, now], function(err) {
        if (err) {
            console.error("Error creating event", err);
            return res.redirect('/organiser');
        }
        // Redirect to edit page with the newly inserted ID
        res.redirect(`/organiser/edit-event/${this.lastID}`);
    });
})

//route to save new event details on edit page
router.post('/organiser/edit-event',requireOrganiserAuth,(req,res)=>
{
    const {title,description,eventdate,price_count,price_amount,concession_count,concession_amount}=req.body;
    const creationdate=new Date().toISOString();
    const query= `INSERT INTO events (title,description,price_count,price_amount,concession_count,concession_amount,creationdate,modifieddate,status,eventdate) VALUES(?,?,?,?,?,?,?,?,?,?)`;
    db.run(query,[title,description,price_count,price_amount,concession_count,concession_amount,creationdate,creationdate,'draft',eventdate],function(err)
{
    if(err)
    {
        console.error('Failed to save event:',err);
        return res.status(500).send("SAVE_ERROR");
    }
    res.redirect('/organiser');
});
});

//route to mark draft event a published event
router.get('/organiser/publish/:id',requireOrganiserAuth,(req,res)=>{
    const eventid=req.params.id;
    const query=`UPDATE events SET status = 'published',publisheddate=datetime('now','+3 hours') WHERE id= ?`;
    db.run(query,[eventid],function(err)
{
    if(err)
    {
        console.error("Publish Error:",err);
        return res.status(500).send("PUBLISH_ERROR");
    }
    res.redirect('/organiser');
});
});

//route to delete an event by id
router.get('/organiser/delete/:id',requireOrganiserAuth,(req,res)=>{
    const eventid=req.params.id;
    const deletequery=`DELETE FROM events WHERE id=?`;
    db.run(deletequery,[eventid],function(err)
{
    if(err)
    {
        console.error("Delete Error",err);
        return res.status(500).send("DELETE_ERROR");
    }
    res.redirect('/organiser');
});
});

//route to render the edit event page with the existing event data
router.get('/organiser/edit-event/:id',requireOrganiserAuth,(req,res)=>
{
    const eventid=req.params.id;
    const query=`SELECT * FROM events WHERE id=?`;
    const saved=req.query.saved == '1';
    db.get(query,[eventid],(err,row)=>{
        if(err||!row)
        {
            return res.status(404).send("EVENT_NOT_FOUND");
        }
        res.render('edit-event',{event:row,saved});
    })
})

//route to handle update submision for an existing event by id
router.post('/organiser/edit-event/:id',requireOrganiserAuth,(req,res)=>{
    const {title,description,eventdate,price_count,price_amount,concession_count,concession_amount}=req.body;
    const id=req.params.id;
    const modifieddate=new Date().toISOString();
    const updatequery=`UPDATE events SET title=?,description=?,price_count=?,price_amount=?,concession_count=?,concession_amount=?,modifieddate=?,eventdate=? WHERE id=?`;
    db.run(updatequery,[title,description,price_count,price_amount,concession_count,concession_amount,modifieddate,eventdate,id],function(err){
        if(err)
        {
            console.error('Failed to update event',err);
            return res.status(500).send("UPDATE_ERROR");
        }
        if(!title || !description)
        {
            return res.status(400).send("FIELDS_REQUIRED");
        }
        res.redirect(`/organiser/edit-event/${id}?saved=1`);
    })
})
module.exports=router;