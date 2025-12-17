const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// URI
const uri = process.env.MONGODB_URI || "mongodb+srv://tuitionAdmin:bmXxv1q03hWBUkUk@cluster0.jnj91of.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Tuition server is running ");
});

async function run() {
  try {
    await client.connect();
    console.log(" Connected to MongoDB");

    const database = client.db("tuitionDB"); 
    const userCollection = database.collection("users");
    const tuitionCollection = database.collection("tutions")

    // Routes section 

    app.post("/api/users/save", async (req, res)=> {
      try {
        const { uid, email, name, role, photoURL } = req.body;

        if(!uid||!email) {
          
          
          return res.status(400).json({ error: "uid and email are required" });
        }

        console.log("Saving user:", { uid, email, name, role });

        const existingUser = await userCollection.findOne({ uid });

        if (existingUser) {
          const result = await userCollection.updateOne(
            { uid },
            {
              $set: {name,role,photoURL,
                updatedAt: new Date(),
              },
            }
          );


          console.log(" User updated");
          return res.json({ message: "User updated", result });
        } else {
          const newUser = {
            uid,
            email,
            name,
            role,
            photoURL,
            createdAt: new Date(),
          };
          const result = await userCollection.updateOne(query, updateDoc, options);
          
          return res.status(201).json({ message: "User created", result });
        }
      } 
      
      catch (error) {
        console.error(" Error saving user:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    
    app.get("/api/users/:uid", async (req, res) => { 
      try {
        const user = await userCollection.findOne({ uid: req.params.uid }); 
        
        
        if (!user) {
          console.log(" User not found:", req.params.uid);
          return res.status(404).json({ error: 'User not found' }); 
        }
        
        console.log(" User fetched:", user);
        res.json(user); 
      } 
      
      catch (error) {
        console.error(" Error fetching user:", error);
        res.status(500).json({ error: "Server error" });
      }
    }); 

    //Tution
    app.post("/api/tuitions", async(req,res)=>{
      try{
        const tuitionData = req.body 
        const result = await tuitionCollection.insertOne(tuitionData)
        res.status(201).json(result)
      }

      catch(error){
        console.log("Error posting tuition:", error);
        res.status(500).json({error:"Failed to post tuition"})
        
      }
    })

    app.get("/api/tuitions/student/:uid", async(req,res)=>{
      try{
        const query = {studentId:req.params.uid}
        const result = await tuitionCollection.find(query).toArray()
        res.json(result)
      }

      catch(error){
        res.status(500).json({ error: "Failed to fetch tuitions" });
      }
    })

    // Delete a Tuition

    app.delete("/api/tuitions/:id", async(req,res)=>{
      try{
        const id= req.params.id
        if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid tuition ID format" });
    }
        const query = { _id: new ObjectId(id) };
        const result = await tuitionCollection.deleteOne(query);
        res.send(result);
      }
      catch(error){
        console.error("Delete error:",error);
        
        res.status(500).json({ error: "Failed to delete tuition" });
      }
    })

    // Get All Users
    app.get('/api/users', async (req, res) => {
      try {
        const users = await userCollection.find().toArray();
        console.log(" Fetched all users:", users.length);
        res.json(users);
      } catch (error) {
        console.error(' Error fetching users:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Get Users by Role
    app.get('/api/users/role/:role', async (req, res) => {
      try {
        const users = await userCollection.find({ role: req.params.role }).toArray();
        console.log(` Fetched ${users.length} users with role: ${req.params.role}`);
        res.json(users);
      } catch (error) {
        console.error(' Error fetching users by role:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(" MongoDB ping successful");

  } catch (error) {
    console.error(" MongoDB connection error:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`); 
});