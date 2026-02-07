const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "https://mellifluous-fairy-83b9a2.netlify.app/",
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
    const query = { studentId: req.params.uid }; 
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


app.get("/", (req, res) => res.send("Tuition server is running"));

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}