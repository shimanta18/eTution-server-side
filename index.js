const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: [
    "https://magnificent-wisp-0ee689.netlify.app",
    "https://magnificent-wisp-0ee689.netlify.app/",
    "http://localhost:5173"
  ],
  credentials: true
}));
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
    const database = client.db("tuitionDB"); 
    
    
    const userCollection = database.collection("users");
    const tuitionCollection = database.collection("tuitions"); 
    const applicationsCollection = database.collection("applications"); 
    const paymentsCollection = database.collection("payments"); 
    const studentsCollection = database.collection("students"); 

    
    app.get('/api/tuitions/:id', async (req, res) => {
      try {
        
        const tuition = await tuitionCollection.findOne({
          _id: new ObjectId(req.params.id)
        });
        if (!tuition) return res.status(404).json({ error: 'Tuition not found' });
        res.json(tuition);
      }
      
      
      catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
    })
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});
    //  tuition by ID
app.get('/api/tuitions/:id', async (req, res) => {
  try {


    const { ObjectId } = require('mongodb');
    const database = client.db("tuitionDB");
    const tuitionsCollection = database.collection("tuitions");
    
    const tuition = await tuitionsCollection.findOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (!tuition) {
      
      return res.status(404).json({ error: 'Tuition not found' });
    }
    
    res.json(tuition);
  }
  
  catch (error) {
    console.error('Error fetching tuition:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



app.get('/api/users/id/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const query = { uid: id };
        
        
        const result = await userCollection.findOne(query); 
        
        if (!result) {
            return res.status(404).send({ message: "Tutor not found" });
        }
        res.send(result);
    } 
    
    catch (error) {
        res.status(500).send({ message: "Server error", error: error.message });
    }
});



app.put('/api/users/update/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    const { subject, qualifications, experience, location } = req.body;

    const filter = { uid: uid };
    const updateDoc = {
      $set: {
        subject: subject,
        qualifications: qualifications,
        experience: experience,
        location: location,
        updatedAt: new Date()
      },
    };

    
    const result = await userCollection.updateOne(filter, updateDoc);
    
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }
    
    res.send({ success: true, message: "Profile updated" });
  } 
  
  catch (error) {
    console.error("Update Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Get all tuitions (for listing page)
app.get('/api/tuitions', async (req, res) => {
  try {
    const database = client.db("tuitionDB");
    const tuitionsCollection = database.collection("tuitions");
    
    const tuitions = await tuitionsCollection
      .find({})
      .sort({ postedAt: -1 })
      .toArray();
    
    res.json(tuitions);
  } 
  
  catch (error) {
    console.error('Error fetching tuitions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get approved tuitions only
app.get('/api/tuitions/approved', async (req, res) => {
  try {
    const database = client.db("tuitionDB");
    const tuitionsCollection = database.collection("tuitions");
    
    const tuitions = await tuitionsCollection
      .find({ status: 'APPROVED' })
      .sort({ postedAt: -1 })
      .toArray();
    
    res.json(tuitions);
  } 
  
  catch (error) {
    console.error('Error fetching approved tuitions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

    // Routes section 

    app.post("/api/users/save", async (req, res)=> {
      try {

        console.log('Received user data:', req.body)
        const { uid, email, name, role, photoURL } = req.body;

        if(!uid||!email|| !name || !role) {
          console.log('Missing required fields');
          
          
          return res.status(400).json({ error: "uid and email are required" });
          error: "Missing required fields: uid, email, name, and role are required" 
        }



        const existingUser = await userCollection.findOne({ uid });

        if (existingUser) {
          console.log(' Updating existing user:', uid);
          const result = await userCollection.updateOne(
            { uid },
            {
              $set: {
                name,
                role,
                photoURL,
                updatedAt: new Date(),
              },
            }
          );
          console.log(' User updated');
          return res.json({ message: "User updated", result });
        } else {
          console.log(' Creating new user:', uid);
          const newUser = {
            uid,
            email,
            name,
            role,
            photoURL,
            createdAt: new Date(),
          };
          const result = await userCollection.insertOne(newUser);
          console.log(' User created');
          return res.status(201).json({ message: "User created", result });
        }
      } catch (error) {
        console.error(" Error saving user:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
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

    app.get('/api/tuitions/available', async(req,res)=>{
      try{
        const database= client.db("tuitionDB")
        const tuitionsCollection = database.collection("tuitions");

        const tuitions = await tuitionsCollection
        .find({status:'PENDING'})
         .sort({ postedAt: -1 })
      .toArray();

      res.json(tuitions);
      }
      catch(error){
console.error ('Error fetching available tuitions:', error);
res.status(500).json({ error: 'Server error' });
      }
    })

    app.post('/api/applications', async (req, res) => {
  try {
    const database = client.db("tuitionDB");
    const applicationsCollection = database.collection("applications");
    
    // Check if already applied
    const existingApplication = await applicationsCollection.findOne({
      tuitionId: req.body.tuitionId,
      tutorId: req.body.tutorId
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'Already applied to this tuition' });
    }

    const result = await applicationsCollection.insertOne(req.body);
    res.status(201).json({ message: 'Application submitted', result });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

//  Tutor's applications
app.get('/api/applications/tutor/:tutorId', async (req, res) => {
  try {
    const database = client.db("tuitionDB");
    const applicationsCollection = database.collection("applications");
    
    const applications = await applicationsCollection
      .find({ tutorId: req.params.tutorId })
      .sort({ appliedAt: -1 })
      .toArray();
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// admin dashboard

app.get('/api/admin/users', async (req, res) => {
   const users = await userCollection.find().toArray();
   res.send(users);
});
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers= await userCollection.countDocuments();
    const students = await userCollection.countDocuments({ role: 'student' });
    const tutors= await userCollection.countDocuments({ role: 'tutor' });
    
    
    const paymentStats = await paymentsCollection.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).toArray();

    const totalTuitions = await tuitionCollection.countDocuments();
    const pendingTuitions = await tuitionCollection.countDocuments({ status: 'PENDING' });
    const approvedTuitions = await tuitionCollection.countDocuments({ status: 'APPROVED' });

    
    const recentTransactions = await paymentsCollection
      .find()
      .sort({ paidAt: -1 })
      .limit(5)
      .toArray();

    res.json({
      users: { total: totalUsers, students, tutors },
      earnings: { total: paymentStats[0]?.total || 0 },
      tuitions: { total: totalTuitions, pending: pendingTuitions, approved: approvedTuitions },
      recentTransactions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});



// Update User Role
app.patch('/api/admin/users/:uid/role', async (req, res) => {
  const { role } = req.body;
  const result = await userCollection.updateOne(
    { uid: req.params.uid },
    { $set: { role, updatedAt: new Date() } }
  );
  res.send(result);
});

// Delete User
app.delete('/api/admin/users/:uid', async (req, res) => {
  const result = await userCollection.deleteOne({ uid: req.params.uid });
  res.send(result);
});




app.patch('/api/admin/tuitions/:id/status', async (req, res) => {
  const { status } = req.body;
  const result = await tuitionCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { status, updatedAt: new Date() } }
  );
  res.send(result);
});

//payment system

app.post('/api/payments', async (req, res) => {
  try {
    const database = client.db("tuitionDB");
    const paymentsCollection = database.collection("payments");
    const tutorsCollection = database.collection("users");

    const paymentData = {
      ...req.body,
      paidAt: new Date().toISOString(),
      status: 'COMPLETED'
    };
const result = await paymentsCollection.insertOne(paymentData);

await tutorsCollection.updateOne(
      { uid: req.body.tutorId },
      { 
        $inc: { totalEarnings: parseFloat(req.body.amount) }
      }
    );

    res.status(201).json({ message: 'Payment recorded', result });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/earnings/tutor/:tutorId', async (req, res) => {
  try {
    const database = client.db("tuitionDB");
    const paymentsCollection = database.collection("payments");

    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // This month's earnings
    const thisMonthEarnings = await paymentsCollection.aggregate([
      {
        $match: {
          tutorId: req.params.tutorId,
          paidAt: { $gte: firstDayThisMonth.toISOString() }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]).toArray();

    // Last month's earnings
    const lastMonthEarnings = await paymentsCollection.aggregate([
      {
        $match: {
          tutorId: req.params.tutorId,
          paidAt: { 
            $gte: firstDayLastMonth.toISOString(),
            $lte: lastDayLastMonth.toISOString()
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]).toArray();

    // Total earnings
    const totalEarnings = await paymentsCollection.aggregate([
      {
        $match: { tutorId: req.params.tutorId }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]).toArray();

    // Recent transactions
    const recentTransactions = await paymentsCollection
      .find({ tutorId: req.params.tutorId })
      .sort({ paidAt: -1 })
      .limit(10)
      .toArray();

    res.json({
      thisMonth: thisMonthEarnings[0]?.total || 0,
      lastMonth: lastMonthEarnings[0]?.total || 0,
      total: totalEarnings[0]?.total || 0,
      recentTransactions
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update application status
app.patch('/api/applications/:id/status', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const database = client.db("tuitionDB");
    const applicationsCollection = database.collection("applications");
    const tuitionsCollection = database.collection("tuitions");

    const { status } = req.body;

    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: { 
          status,
          updatedAt: new Date().toISOString()
        } 
      }
    );

    // If approved then update tuition status
    if (status === 'ACCEPTED') {
      const application = await applicationsCollection.findOne({ 
        _id: new ObjectId(req.params.id) 
      });
      
      if (application) {
        await tuitionsCollection.updateOne(
          { _id: new ObjectId(application.tuitionId) },
          { $set: { status: 'APPROVED', assignedTutorId: application.tutorId } }
        );
      }
    }

    res.json({ message: 'Application status updated', result });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get tutor's ongoing tuitions approved applications
app.get('/api/tuitions/ongoing/:tutorId', async (req, res) => {
  try {
    const database = client.db("tuitionDB");
    const tuitionsCollection = database.collection("tuitions");

    const ongoingTuitions = await tuitionsCollection
      .find({ 
        assignedTutorId: req.params.tutorId,
        status: 'APPROVED'
      })
      .toArray();

    res.json(ongoingTuitions);
  } 
  
  
  catch (error) {
    console.error('Error fetching ongoing tuitions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get application by ID
app.get('/api/applications/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const database = client.db("tuitionDB");
    const applicationsCollection = database.collection("applications");

    const application = await applicationsCollection.findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(application);
  } 
  
  catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update application
app.put('/api/applications/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const database = client.db("tuitionDB");
    const applicationsCollection = database.collection("applications");

    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: { 
          ...req.body,
          updatedAt: new Date().toISOString()
        } 
      }
    );

    res.json({ message: 'Application updated', result });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete application only if pending
app.delete('/api/applications/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const database = client.db("tuitionDB");
    const applicationsCollection = database.collection("applications");

    const application = await applicationsCollection.findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({ 
        error: 'Cannot delete application that is not pending' 
      });
    }

    const result = await applicationsCollection.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    res.json({ message: 'Application deleted', result });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get applications for a tuition 
app.get('/api/applications/tuition/:tuitionId', async (req, res) => {
  try {
    const database = client.db("tuitionDB");
    const applicationsCollection = database.collection("applications");

    const applications = await applicationsCollection
      .find({ tuitionId: req.params.tuitionId })
      .sort({ appliedAt: -1 })
      .toArray();

    res.json(applications);
  } 
  
  catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});




//  Tutor's students
app.get('/api/students/tutor/:tutorId', async (req, res) => {
  try {
    const database = client.db("tuitionDB");
    const studentsCollection = database.collection("students");
    
    const students = await studentsCollection
      .find({ tutorId: req.params.tutorId })
      .toArray();
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

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

  } 
  
  catch (error) {
    console.error(" MongoDB connection error:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`); 
});

module.exports = app;