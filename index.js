const express = require("express");
const app = express();
const cors = require("cors");
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
