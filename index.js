const express = require('express');
const cors = require('cors');
const jwt =require("jsonwebtoken");
const app=express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port=process.env.PORT || 5000;


//middleware
app.use(cors())
app.use(express.json())



//code from mongodb to connect mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8w6slpa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();
    //service related collection
    const serviceCollection=client.db("carDoctor").collection("services");
    //booking related collection
    const bookingsCollection =client.db("carDoctor").collection("bookings")


    //auth related api start for jwt

    app.post("/jwt", async(req,res)=>{
      const user = req.body;
      console.log(user)
      const token =jwt.sign(user,process.env.ACCESS_TOKEN_SECRET, {expiresIn:"1h"})

      res
      .cookie("token",token, {
        httpOnly:true,
        secure:false,
        sameSite:'none'
      })
      .send({success:true})
    })



    //auth related api end for jwt


    //service related api start
    app.get("/services", async(req,res)=>{
        const cursor=serviceCollection.find()
        const result=await cursor.toArray()
        res.send(result)
    }),


    app.get("/services/:id", async(req,res)=>{
        const id=req.params.id
        const query = {_id: new ObjectId(id)}
        const options = {
            projection: {  title: 1, price: 1, service_id:1,img:1 },
          };
        const result=await serviceCollection.findOne(query,options)
        res.send(result)
    })
    //service related api end

    //bookings related api start


    // get some bookings by using query and email
    app.get("/bookings", async(req,res)=>{
      let query={};
      if(req.query?.email){
        query={email:req.query.email}
      }
      const result = await bookingsCollection.find(query).toArray();
      res.send(result)
    });


   // get all bookings
    app.post("/bookings", async(req,res)=>{
        const booking=req.body;
        const result=await bookingsCollection.insertOne(booking)
        res.send(result)
 

    });


    //delete specific bookings by using id
    app.delete("/bookings/:id",async(req,res)=>{
      const id =req.params.id;
      const query={_id: new ObjectId(id)}
      const result = await bookingsCollection.deleteOne(query)
      res.send(result)
    });

    //update a specific bookings by using patch api
    app.patch("/bookings/:id", async(req,res)=>{
      const id = req.params.id;
      const updatedBookings=req.body;
      const filter = {_id: new ObjectId(id)}
      console.log(updatedBookings)
      const updateDoc = {
        $set: {
          status: updatedBookings.status
        },
      };
      const result = await bookingsCollection.updateOne(filter,updateDoc);
      res.send(result)
      
    })


    //bookings related api end






    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/",(req,res)=>{
    res.send("car doctor is running")
})

app.listen(port, ()=>{
    console.log(`car doctor is running on port${port}`)
})