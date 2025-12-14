const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

//  URI
const uri = process.env.MONGODB_URI || "mongodb+srv://tuitionAdmin:bmXxv1q03hWBUkUk@cluster0.jnj91of.mongodb.net/?appName=Cluster0";




const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


app.get("/", (req, res) => {
  res.send("Tuition server is running");
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const database = client.db("tuitionAdmin");
    const userCollection = database.collection("users");

    // save or update user
    app.post("/api/users/save", async (req, res) => {
      try {
        const { uid, email, name, role, photoURL } = req.body;

        if (!uid || !email) {
          return res.status(400).json({ error: "uid and email are required" });
        }

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

          return res.json({ message: "User updated", result });
        } 
        
        else {
          const newUser = {uid,email,name,role,photoURL,
            createdAt: new Date(),
          };

          const result = await userCollection.insertOne(newUser);
          return res.status(201).json({ message: "User created", result });
        }
      } 
      
      catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB ping successful");
  } 
  
  catch (error) {
    console.error(error);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
