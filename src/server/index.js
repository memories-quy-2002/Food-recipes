const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const PORT = process.env.PORT || 8080;

const app = express();
var corOptions = {
	origin: "https://localhost:8081",
};

app.use(cors(corOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
	res.send({ message: "Welcome to my application." });
});
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}.`);
});
