const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.onnu8qm.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set theStable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Server in running");
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const db = client.db("uni_bills");
    const monthlyBillsCollection = db.collection("monthly_bills");
    const allPaidBillsCollection = db.collection("paid_bills");

    /* Getting 6 current month data for home page */

    app.get("/home", async (req, res) => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(
        currentYear,
        currentMonth + 1,
        0,
        23,
        59,
        59,
        999
      );

      // console.log(startOfMonth, endOfMonth)

      const result = await monthlyBillsCollection
        .find({
          date: { $gte: startOfMonth, $lte: endOfMonth },
        })
        .sort({ date: -1 })
        .limit(6)
        .toArray();
      
      // console.log(result)

      res.send(result);
    });

    /* Getting all data for bills page */
    app.get("/bills", async (req, res) => {
      const category = req.query.category;
      let filter = {};

      if (category) {
        filter.category = category;
      }

      const result = await monthlyBillsCollection.find(filter).toArray();

      res.send(result);
    });

    /* Getting single data for bills details page */
    app.get("/bill-details/:id", async (req, res) => {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const result = await monthlyBillsCollection.findOne({ _id: objectId });

      res.send(result);
    });

    /* Adding paid bills data to database */
    app.post("/pay-bills", async (req, res) => {
      const data = req.body;
      const result = await allPaidBillsCollection.insertOne(data);

      res.send(result);
    });

    /* Getting paid bills data for user */
    app.get("/my-pay-bills", async (req, res) => {
      const email = req.query.email;
      const result = await allPaidBillsCollection
        .find({ email: email })
        .toArray();

      res.send(result);
    });

    /* Updating paid bills data */
    app.put("/update-bill/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };
      const update = {
        $set: data,
      };

      const result = await allPaidBillsCollection.updateOne(filter, update);
      res.send({
        success: true,
        result,
      });
    });

    /* Deleting user paid bills */
    app.delete("/delete-bill/:id", async (req, res) => {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const result = await allPaidBillsCollection.deleteOne({ _id: objectId });

      res.send({
        success: true,
        result,
      });
    });

    // Send a ping to confirm a successful connection
    /* await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    ); */
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
