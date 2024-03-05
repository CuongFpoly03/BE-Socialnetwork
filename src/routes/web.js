const express = require("express");
const {getHome, getWebhook, postWebhook, handleSetupProfile, getSetupProfilePage, getInfoOrderPage, setInfoOrder} = require("../controllers/homeController")
const route =  express.Router();

let viewRoutes = (app) => {
    route.get("/", getHome);
    route.get("/webhook", getWebhook);
    route.post("/webhook", postWebhook);
    route.post("/setup-profile", handleSetupProfile);
    route.get("/setup-profile", getSetupProfilePage);
    route.get("/info-order", getInfoOrderPage);
    route.post("/setinfo-order", setInfoOrder);
    return app.use("/api", route)
}
module.exports = viewRoutes;