const express = require('express');
require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());



// mongoDB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xz3kocr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const serviceCollection = client.db("cypherTechDB").collection("services");
    const reviewCollection = client.db("cypherTechDB").collection("testimonials");
    const userCollection = client.db("cypherTechDB").collection("users");
    const dummyCollection = client.db("cypherTechDB").collection("dummy");
    const workSheetCollection = client.db("cypherTechDB").collection("sheets");


    // jwt related
    app.post('/jwt', async(req, res)=> {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "1h"})
        res.send({token})
      })

    // middlewares 
    const verifyToken = (req, res, next) => {
        // console.log('inside verify token',req.headers.authorization);
        if (!req.headers.authorization) {
          return res.status(401).send({message: 'Forbidden Access'})
        }
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=> {
          if (err) {
            return res.status(401).send({message: 'Forbidden Access'})
          }
          req.decoded = decoded;
          next();
        })
        
      }

    //   admin 
    app.get('/users/admin/:email',verifyToken, async (req, res) => {
        const email = req.params.email;
  
        if (email !== req.decoded.email) {
          return res.status(403).send({ message: 'forbidden access' })
        }
  
        const query = { email: email };
        const user = await userCollection.findOne(query);
        let admin = false;
        if (user) {
          admin = user?.role === 'Admin';
        }
        res.send({ admin });
      })
    //   is hr
    app.get('/users/hr/:email',verifyToken, async (req, res) => {
        const email = req.params.email;
  
        if (email !== req.decoded.email) {
          return res.status(403).send({ message: 'forbidden access' })
        }
  
        const query = { email: email };
        const user = await userCollection.findOne(query);
        let hr = false;
        if (user) {
          hr = user?.role === 'HR';
        }
        res.send({ hr });
      })

    // work-sheet 
    app.get('/work-sheet',verifyToken, async(req, res)=> {
        const result = await workSheetCollection.find().toArray();
        res.send(result)
    })


    app.post('/work-sheet',verifyToken, async(req, res)=> {
        const data = req.body;
        const result = await workSheetCollection.insertOne(data)
        res.send(result)
    })

    // dummy location
    app.get('/dummy', async(req, res)=> {
        const result = await dummyCollection.find().toArray()
        res.send(result)
    })

    //   verify 
    app.patch('/users/verify/:id', async(req, res)=> {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const updatedDoc = {
            $set: {
                isVerify: true
            }
        }
        const result = await userCollection.updateOne(filter, updatedDoc)
        res.send(result)
    })
    // unVerify
    app.patch('/users/unVerify/:id', async(req, res)=> {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const updatedDoc = {
            $set: {
                isVerify: false
            }
        }
        const result = await userCollection.updateOne(filter, updatedDoc)
        res.send(result)
    })

    //   HR
    app.patch('/users/hr/:id', async(req, res)=> {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const updatedDoc = {
            $set: {
                role: 'HR'
            }
        }
        const result = await userCollection.updateOne(filter, updatedDoc)
        res.send(result)
    })
    //   Employee
    app.patch('/users/em/:id', async(req, res)=> {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const updatedDoc = {
            $set: {
                role: 'Employee'
            }
        }
        const result = await userCollection.updateOne(filter, updatedDoc)
        res.send(result)
    })
     

    // user related 
    // make users secure
    app.get('/users',verifyToken, async(req, res)=>{
        const result = await userCollection.find().toArray()
        res.send(result)
    })
    app.post('/users', async(req, res)=> {
        const user = req.body;
  
        const query = {email: user.email}
        const existingUser = await userCollection.findOne(query);
        if (existingUser) {
          return res.send({message: 'user exist', insertedId: null})
        }
        const result = await userCollection.insertOne(user)
        res.send(result);
      })


    // testimonials
    app.get('/testimonials', async(req, res)=> {
        const result = await reviewCollection.find().toArray()
        res.send(result);
    })
    // service related
    app.get('/services', async(req, res)=> {
        const result = await serviceCollection.find().toArray()
        res.send(result)
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res)=> {
    res.send('Cypher Tech is On...')
});

app.listen(port, ()=> {
    console.log(`Server running on: ${port}`);
})