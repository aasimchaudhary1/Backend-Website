const express=require('express');
const router=express.Router();
const bcrypt=require('bcrypt');

//POST route to registers  a new attendee with hashed password
router.post('/attendees/register',async(req,res)=>{
    const{name,email,password}=req.body;
    const hashedpassword=await bcrypt.hash(password,10);//hashing the password securely

    const query='INSERT INTO attendees (name, email, password) VALUES (?,?,?)';
    db.run(query,[name,email,hashedpassword],function(err)
{
    if(err)
    {
        //check if email already exist
        if(err.message.includes("UNIQUE"))
        {
            return res.status(409).json({error:"EMAIL_EXISTS"});
        }
        return res.status(500).send("REGISTRATION_ERROR");
    }
    req.session.attendeeName=name;
    return res.status(200).json({success: true,name});//registration successful
});
});

//POST route to login attendee
router.post('/attendees/login',(req,res)=>
{
    const{email,password}=req.body;
    const query='SELECT * FROM attendees WHERE email=?';
    db.get(query,[email],async(err,row)=>{

        if(err)
        {
            return res.status(500).send("DB_ERROR");//database error
        }
        if(!row)
        {
            return res.status(404).send("NO_USER");//no user found with that emal
        }
        const match = await bcrypt.compare(password,row.password);//comparing password
        if(!match)
        {
            return res.status(401).send("WRONG_PASSWORD");//incorrect password
        }
        req.session.attendeeName=row.name;//store name
        return res.status(200).json({name:row.name});//sucessful login
 
    });
});

//booking event tickets
router.post('/attendee/book',(req,res)=>{

    const{event_id,full_count,concession_count}=req.body;
    const full=parseInt(full_count);
    const concession=parseInt(concession_count);

    //update ticket availability
    const updatequery= `UPDATE events SET price_count=price_count-?,concession_count=concession_count-? WHERE id=? AND price_count>=? and concession_count>=?;`;
    db.run(updatequery,[full,concession,event_id,full,concession],function(err){
        if(err)
        {

            console.error(err);
            return res.status(500).send("Booking error");
        }
        if(this.changes==0)
        {
            return res.status(400).send("Not enought tickets available");
        }

        //redirect to event page with booking confirmation
        res.redirect(`/event/${event_id}?booked=1`);
    });
});

//shows details for the event
router.get('/event/:id',(req,res)=>{

    const eventid=req.params.id;
    const shared=req.query.shared=='true';//true if organiser shared link is clicked
    const name=req.session.attendeeName || "Attendee";
    const booked=req.query.booked=='1';//true if event pag eisopeneed from attendee page
    const query=`SELECT * FROM events WHERE id=? AND status='published' `;
    db.get(query,[eventid],(err,event)=>{
        if(err || !event)
        {
            return res.status(404).send("Event not found");
        }
        //render the event bookinh page
        res.render('attendee-event',{event,shared,name,booked});
    });
});

//Displays list of all upcoming published events
router.get('/attendee',(req,res)=>
{
    const name=req.session.attendeeName || "Attendee";
    const query=`SELECT * FROM events WHERE status='published' ORDER BY eventdate ASC`;
    db.all(query,[],(err,events)=>{
        if(err){
            return res.status(500).send("Database Error");
        }
    res.render('attendee',{name,events});
    })

})

module.exports=router;
