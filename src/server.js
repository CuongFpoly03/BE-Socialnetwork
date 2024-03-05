const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const connnectViewEngine = require("./configs/engine");
const Routes = require("./routes/web")
const app =  express();

// connect bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// connect route
Routes(app)

// connect connnectViewEngine
connnectViewEngine(app);

const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
    console.log("run success !", PORT);
})