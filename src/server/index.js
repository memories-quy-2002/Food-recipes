const express = require("express");
const app = express();
const PORT = 3000;

app.get("/about/hello", (req, res) => {
	res.send("Hello World!");
});

app.listen(PORT, () =>
	console.log(`Server is connected to http://localhost:${PORT}`)
);
