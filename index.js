const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

//use middlewere
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).send({ message: "unauthorized access" });
	}
	const token = authHeader.split(" ")[1];
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
		if (err) {
			return res.status(403).send({ message: "Forbidden access" });
		}
		//console.log("decoded", decoded);
		req.decoded = decoded;
		next();
	});
	//console.log("inside verifyJWT", authHeader);
}

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
		const sellCollection = client
			.db("foodExpress")
			.collection("sellProducts");
		const soldCollection = client
			.db("foodExpress")
			.collection("soldProductsUniq");

		//AUTH

		app.post("/login", async (req, res) => {
			const user = req.body;
			const accessToken = jwt.sign(
				user,
				process.env.ACCESS_TOKEN_SECRET,
				{
					expiresIn: "1d",
				}
			);

			res.send({ accessToken });
		});

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

		//sell item update

		app.put("/sellProducts", async (req, res) => {
			//const id = req.params.id;
			const updateProduct = req.body;
			const query = { productId: updateProduct.productId };
			const option = { upsert: true };
			const result = await sellCollection.findOne(query);
			let updateDoc;
			if (result) {
				updateDoc = {
					$set: {
						productId: updateProduct.productId,
						productName: updateProduct.productName,
						quantity:
							parseInt(result.quantity) +
							parseInt(updateProduct.quantity),
						deliverUser: updateProduct.deliverUser,
					},
				};
			} else {
				updateDoc = {
					$set: {
						productId: updateProduct.productId,
						productName: updateProduct.productName,
						quantity: parseInt(updateProduct.quantity),
						deliverUser: updateProduct.deliverUser,
					},
				};
			}
			const resultSend = await sellCollection.updateOne(
				query,
				updateDoc,
				option
			);
			res.send(resultSend);
		});

		//sold post api

		app.post("/soldProducts", async (req, res) => {
			const newProduct = req.body;
			const result = soldCollection.insertOne(newProduct);

			res.send(result);
		});

		//sold get api

		app.get("/soldProducts", async (req, res) => {
			const query = {};
			const cursor = soldCollection.find(query);
			const products = await cursor.toArray();

			res.send(products);
		});

		//sold one item delete

		app.delete("/soldProducts/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await soldCollection.deleteOne(query);
			res.send(result);
		});

		//sell get result

		app.get("/sellProducts", async (req, res) => {
			const query = {};
			const cursor = sellCollection.find(query);
			const products = await cursor.toArray();
			res.send(products);
		});

		//delete on item api

		app.delete("/products/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await groseryCollection.deleteOne(query);
			res.send(result);
		});

		// add one item api

		app.post("/products", async (req, res) => {
			const newProduct = req.body;
			const result = groseryCollection.insertOne(newProduct);
			res.send(result);
		});

		app.get("/addedProducts/:email", verifyJWT, async (req, res) => {
			const email = req.params.email;
			const decodedEmail = req.decoded.email;
			if (email === decodedEmail) {
				const query = { email: email };
				const cursor = groseryCollection.find(query);
				const result = await cursor.toArray();
				res.send(result);
			} else {
				res.status(403).send({ message: "forbbiden access" });
			}
		});
	} finally {
		//somthing
	}
}

run().catch(console.dir);
