const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;


app.use(cors({
  origin: [
    "https://magnificent-wisp-0ee689.netlify.app",
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



app.get("/", (req, res) => res.send("Tuition server is running"));

// Get Users by Role
app.get('/api/users/role/:role', async (req, res) => {
  try {
    const database = await getDB();
    const users = await database.collection("users").find({ role: req.params.role }).toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Save User
app.post("/api/users/save", async (req, res) => {
  try {
    const { uid, email, name, role, photoURL } = req.body;
    const database = await getDB();
    const result = await database.collection("users").updateOne(
      { uid },
      { $set: { email, name, role, photoURL, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User by UID
app.get("/api/users/:uid", async (req, res) => {
  try {
    const database = await getDB();
    const user = await database.collection("users").findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = app;


if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}