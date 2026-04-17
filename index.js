const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "https://etuition.netlify.app",
    "http://localhost:5173"
  ],

  credentials: true
}));
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

let db;
async function getDB() {
  if (!db) {
    await client.connect();
    db = client.db("tuitionDB");
  }
  return db;
}

// TUITION ROUTES 

app.post("/api/tuitions", async (req, res) => {
  try {
    const database = await getDB();
    const tuitionData = {
      ...req.body,
      status: req.body.status || 'PENDING',
      postedAt: new Date().toISOString()
    };
    const result = await database.collection("tuitions").insertOne(tuitionData);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error posting tuition:", error);
    res.status(500).json({ error: "Failed to post tuition" });
  }
});


app.get('/api/tuitions/available', async (req, res) => {
  try {
    const database = await getDB();
    const tuitions = await database.collection("tuitions")
      .find({ status: 'PENDING' })
      .sort({ postedAt: -1 })
      .toArray();
    res.json(tuitions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


app.get("/api/tuitions/student/:uid", async (req, res) => {
  try {
    const database = await getDB();
    const query = { studentId: req.params.uid };
    const result = await database.collection("tuitions").find(query).toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tuitions" });
  }
});


app.get("/api/tuitions/:id", async (req, res) => {
  try {
    const database = await getDB();
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await database.collection("tuitions").findOne(query);
    
    if (!result) {
      return res.status(404).json({ error: "Tuition not found" });
    }
    res.json(result);
  } catch (error) {
    console.error("Error fetching single tuition:", error);
    res.status(500).json({ error: "Invalid ID format or server error" });
  }
});



app.get("/api/applications/student/:uid", async (req, res) => {
  try {
    const database = await getDB();

    
    const tuitions = await database.collection("tuitions")
      .find({ studentId: req.params.uid })
      .toArray();

    const tuitionIds = tuitions.map(t => t._id.toString());

    if (tuitionIds.length === 0) return res.json([]);
console.log("Student UID:", req.params.uid);
    console.log("Found tuitions:", tuitionIds);

        const allApps = await database.collection("applications").find().toArray();
    console.log("All applications tuitionIds:", allApps.map(a => a.tuitionId));

    if (tuitionIds.length === 0) return res.json([]);

    const applications = await database.collection("applications")
      .find({ tuitionId: { $in: tuitionIds } })
      .sort({ appliedAt: -1 })
      .toArray();

console.log("Matched applications:", applications.length)

    res.json(applications);
  } catch (error) {
    console.error("Error fetching student applications:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});


app.patch("/api/applications/:id/status",async(req,res)=>{
  try{
    const{id}= req.params
    const{status}=req.body

   if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const database=await getDB()
    const result= await database.collection("applications").updateOne(
      { _id : new ObjectId(id)},
      {$set:{status, updatedAt:new Date().toISOString()}}
    )

    if(result.matchedCount===0){
      return res.json(500).json({error:"application not found"})
    }

    res.json({success:true, message:`Application ${status.toLowerCase()}`})
  }

  catch(error){
    console.error("Error updating application status:",error)
    res.json(500).json({error: "failed to update application"})
  }
})

//  APPLICATION ROUTES 


app.post("/api/applications", async(req,res)=>{
  try{
    const database = await getDB()
    const application={
      ...req.body,
      createdAt:new Date().toISOString()
    }

    const result = await database.collection("applications").insertOne(application)
  res.status(201).json({
success:true,
message: "Application submitted successfully",
      applicationId: result.insertedId 
  })

}
catch(error){
    console.error("Error submitting application:", error);
    res.status(500).json({ error: "Failed to submit application" })
  }
  
})


app.get("/api/applications/tutor/:uid", async (req, res) => {
  try {
    const database = await getDB();
    const query = { tutorId: req.params.uid }; 
    const result = await database.collection("applications").find(query).toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

app.post("/api/applications/tutor/:id", async (req, res) => {
  try {
    const database = await getDB();
    const application = {
      ...req.body,
      appliedAt: new Date()
    };
    const result = await database.collection("applications").insertOne(application);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit application" });
  }
});


app.get('/api/users/role/:role', async (req, res) => {
  try {
    const database = await getDB();
    const users = await database.collection("users").find({ role: req.params.role }).toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


app.post("/api/users/save", async (req, res) => {
  try {
    const { uid, email, name, role, photoURL } = req.body;
if(!uid||!email){
  return res.status(400).json({error:"UID and email are required"})
}

    const database = await getDB();
    const result = await database.collection("users").updateOne(
      { uid },
      {  $set: { 
          email, 
          name: name || email.split('@')[0], 
          role: role || 'student', 
          photoURL: photoURL || null,
          updatedAt: new Date() 
        }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  res.status(200).json({ 
      success: true, 
      message: "User saved successfully",
      result 
    });
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:uid", async (req, res) => {
  try {
    const database = await getDB();
    const user = await database.collection("users").findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } 
  catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});


//DASHBOARD STATS

app.get("/api/stats",async(req,res)=>{
  try{
    const database= await getDB()

    const allUsers=await database.collection("users").find().toArray()
    const students = allUsers.filter(u=>u.role==='student').length
    const tutors= allUsers.filter(u=>u.role==='tutor').length


    //count tuitions

    const allTuitions= await database.collection("tuitions").find().toArray()
    const pending=allTuitions.filter(t=>t.status==="PENDING").length
    const approved=allTuitions.filter(t=>t.status==="APPROVED").length

    //transaction

    const recentTransaction=[]

    const stats={
      users:{
        total:allUsers.length,
        students:students,
        tutors:tutors
      },

      tuitions:{
        total:allTuitions.length,
        approved:approved,
        pending:pending
      },

      earnings:{
        total:0
      },

      recentTransaction:recentTransaction
    };

    res.json(stats)
  }
  catch(error){
    console.error("Error fetching stats:",error)
    res.status(500).json({error:"Failed to fetch stats"})
  };
  
})

//get all users (ADMIN)

app.get("/api/admin/users",async(req,res)=>{
  try{
    const database= await getDB()
    const users = await database.collection("users")
    .find()
    .sort({postedAt:-1})
    .toArray()
    res.json(users)
  }
  catch(error){
    console.error("Error fetching users:",error)
    res.status(500).json({error:"FAiled to fetch Users"})
  };
  
})

//update User role (Admin)
app.patch("/api/admin/users/:uid/role",async(req,res)=>{
  try{
   const{uid}=req.params;
   const {role}=req.body;
  
if (!['student', 'tutor', 'admin'].includes(role)){
  return res.status(400 ).json({error:"Invalid role"})
}

const database= await getDB()
const result = await database.collection("users").updateOne(
  {uid},
  {$set:{role,updatedAt:new Date()}}
);

if(result.matchedCount===0){
  return res.status(404).json({error:"User not found"})
}

res.json({success:true,message:"Role updated succeessfully"});
}
  catch(error){
    console.error("Error fetching users:",error)

    res.status(500).json ({error: "Failed to update role"})
  }
})


app.delete("/api/admin/users/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const database = await getDB();
    
    const result = await database.collection("users").deleteOne({ uid });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Get All Tuitions (Admin)
app.get("/api/admin/tuitions", async (req, res) => {
  try {
    const database = await getDB();
    const tuitions = await database.collection("tuitions")
      .find()
      .sort({ postedAt: -1 })
      .toArray();
    res.json(tuitions);
  } catch (error) {
    console.error("Error fetching tuitions:", error);
    res.status(500).json({ error: "Failed to fetch tuitions" });
  }
});

// Update Tuition Status (Admin)
app.patch("/api/admin/tuitions/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const database = await getDB();
    const result = await database.collection("tuitions").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date().toISOString() } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Tuition not found" });
    }
    
    res.json({ success: true, message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating tuition status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

//delete tuitions 
app.delete("/api/tuitions/:id", async (req, res) => {
  try {
    const database = await getDB();
    const result = await database.collection("tuitions")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Tution not found" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete tution" });
  }
});

// Get All Transactions (Admin) 
app.get("/api/admin/transactions", async (req, res) => {
  try {
    // unreal transaction
    const mockTransactions = [
      {
        studentName: "John Doe",
        tutorName: "Jane Smith",
        amount: 5000,
        paidAt: new Date().toISOString()
      }
    ];
    
    res.json(mockTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});


//Get Payments for student
app.get("/api/payments/student/:uid",async(req,res)=>{
  try{
    const database=await getDB()
    const payments=await database.collection("payments")

    .find({studentId:req.params.uid})
    .sort({paidAt:-1})
    .toArray()
    res.json(payments)
  }

  catch(error){
console.error("Error fetching student payments:", error)
res.status(500).json({error:"Failed to fetch payments"})
  }
})

//Get Payment received
app.get("/api/payments/tutor/:uid",async(req,res)=>{
  try{
    const database= await getDB()
    const payments=await database.collection("payments")

    .find({tutorId:req.params.uid})
    .sort({paidAt:-1})
    .toArray()
    res.json(payments)
  }

  catch(error){
    console.error("Error fetching tutor payments:",error)
    res.status(500).json({})
  }
})

//create payment

app.post("/api/payments",async(req,res)=>{
  try{
    const database= await getDB()
    const payment={
      ...req.body,
      status:'completed',
      paidAt:new Date().toISOString(),
      createdAt:new Date().toISOString()
    };

    const result=await database.collection("payments").insertOne(payment)
    res.status(201).json({
      success:true,
      message:"Payment recorded successfully",
      paymentId:result.insertedId
    })

  }catch(error){
      console.error("Error Creating Payment",error)
      res.status(500).json({error:"Failed to create payment"})
    }
  })

  //Get All payments (ADMIN PANEL)
  app.get("/api/admin/payments",async(req,res)=>{
    try{
      const database= await getDB()
      const payments=await database.collection("payments")
      .find()
      .sort({paidAt:-1})
      .toArray()
      res.json(payments)
    }

    catch(error){
      console.error("Error fetching all payments:",error)
      res.status(500).json({error:"Failed to fetch payments"})
    }
  })

app.get("/", (req, res) => res.send("Tuition server is running"));

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}