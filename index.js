const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

//use middlewere
app.use(cors());
app.use(express.json());

//app is running or not check in browser

app.get("/", (req, res) => {
	res.send("running my grosery server");
});

//listening server in my local host

app.listen(port, () => {
	console.log("Server is running");
});

//uri and client create

// const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PSSWORD}@cluster0-shard-00-00.9vshs.mongodb.net:27017,cluster0-shard-00-01.9vshs.mongodb.net:27017,cluster0-shard-00-02.9vshs.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-koe3re-shard-0&authSource=admin&retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.9vshs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

//run function

async function run() {
	try {
		await client.connect();
		const groseryCollection = client
			.db("foodExpress")
			.collection("groseryItems");
		//get all items
		app.get("/products", async (req, res) => {
			const size = parseInt(req.query.size);

			const query = {};
			const cursor = groseryCollection.find(query);
			let products;
			if (size) {
				products = await cursor.limit(size).toArray();
			} else {
				products = await cursor.toArray();
			}
			res.send(products);
		});

		//get one item data
		app.get("/products/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await groseryCollection.findOne(query);
			console.log(result);
			res.send(result);
		});
		//update one item data

		app.put("/products/:id", async (req, res) => {
			const id = req.params.id;
			const updateProduct = req.body;

			const query = { _id: ObjectId(id) };
			const option = { upsert: true };
			const updateDoc = {
				$set: {
					quantity: updateProduct.quantity,
				},
			};
			const result = await groseryCollection.updateOne(
				query,
				updateDoc,
				option
			);
			res.send(result);
		});
	} finally {
		//somthing
	}
}

run().catch(console.dir);
