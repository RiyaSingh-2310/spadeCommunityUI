const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const app = express();
const port = 5050;

app.use(cors());

app.get("/", (req, res) => {
  res.send("working");
});
app.use("/api/auth", authRoutes);

app.listen(port, () => {
  console.log("server is running");
});