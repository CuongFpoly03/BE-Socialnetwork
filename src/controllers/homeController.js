
require("dotenv").config();
const homeService = require("../services/homeService");
const chatbotService = require("../services/chatbotService");
const templateMessage = require("../services/templateMessage");

const MY_VERIFY_TOKEN = process.env.MY_VERIFY_TOKEN;

const getHome = (req, res) => {
    let facebookAppId = process.env.FACEBOOK_APP_ID;
    return res.render("home.ejs", {
        facebookAppId: facebookAppId
    })
};

const getWebhook = (req, res) => {
    let VERIFY_TOKEN = MY_VERIFY_TOKEN;
    let mode = req.query['hub.mode'];
    let token = req.query['hub.virify_token'];
    let challenge = req.query['hub_challenge'];
    if(mode && token) {
        if(mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        }else {
            res.sendStatus(403);
        }
    }
}

let postWebhook = (req, res) => {
    let body = req.body;
    if(body.object === 'page') {
        body.entry.forEach(function(entry) {
            if(entry.standby) {
                let weebhook_standby = entry.standby[0];
                if(weebhook_standby && weebhook_standby.message) {
                    if(weebhook_standby.message.text === 'back' || weebhook_standby.message.text === 'exit'){
                        chatbotService.takeControlConversation(weebhook_standby.sender.id);
                    }
                }
                return ;
            }
            let weebhook_event = entry.messaging[0];
            console.log(weebhook_event);
            let sender_psid = weebhook_event.sender.id;
            if(weebhook_event.message) {
                handleMessage(sender_psid, weebhook_event.message);
            }else {
                handlePostback(sender_psid, weebhook_event.postback);
            }
        });
        res.status(200).send("EVENT_RECEIVED");
    }else {
        res.sendStatus(404);
    }
}


// Handles messages events
let handleMessage = async (sender_psid, received_message) => {
    if (received_message && received_message.quick_reply && received_message.quick_reply.payload) {
        let payload = received_message.quick_reply.payload;
        if (payload === "CATEGORIES") {
            await chatbotService.sendCategories(sender_psid);

        } else if (payload === "LOOKUP_ORDER") {
            await chatbotService.sendLookupOrder(sender_psid);

        } else if (payload === "TALK_AGENT") {
            await chatbotService.requestTalkToAgent(sender_psid);
        }

        return;
    }


    let response;

    if (received_message.text) {
        response = {
            "text": `You sent the message: "${received_message.text}". Now send me an image!`
        }
    } else if (received_message.attachments) {
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Is this the right picture?",
                        "subtitle": "Tap a button to answer.",
                        "image_url": attachment_url,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Yes!",
                                "payload": "yes",
                            },
                            {
                                "type": "postback",
                                "title": "No!",
                                "payload": "no",
                            }
                        ],
                    }]
                }
            }
        }
    }
    await chatbotService.sendMessage(sender_psid, response);
};

let handlePostback = async (sender_psid, received_postback) => {
    let payload = received_postback.payload;
    switch (payload) {
        case "GET_STARTED":
        case "RESTART_CONVERSATION":
            await chatbotService.sendMessageWelcomeNewUser(sender_psid);
            break;
        case "TALK_AGENT":
            await chatbotService.requestTalkToAgent(sender_psid);
            break;
        case "SHOW_HEADPHONES":
            await chatbotService.showHeadphones(sender_psid);
            break;
        case "SHOW_TV":
            await chatbotService.showTVs(sender_psid);
            break;
        case "SHOW_PLAYSTATION":
            await chatbotService.showPlaystation(sender_psid);
            break;
        case "BACK_TO_CATEGORIES":
            await chatbotService.backToCategories(sender_psid);
            break;
        case "BACK_TO_MAIN_MENU":
            await chatbotService.backToMainMenu(sender_psid);
            break;
        default:
            console.log("run default switch case")

    }
};

let handleSetupProfile = async (req, res) => {
    try {
        await homeService.handleSetupProfileAPI();
        return res.redirect("/");
    } catch (e) {
        console.log(e);
    }
};

let getSetupProfilePage = (req, res) => {
    return res.render("profile.ejs");
};

let getInfoOrderPage = (req, res) => {
    let facebookAppId = process.env.FACEBOOK_APP_ID;
    return res.render("infoOrder.ejs", {
        facebookAppId: facebookAppId
    });
};

let setInfoOrder = async (req, res) => {
    try {
        let customerName = "";
        if (req.body.customerName === "") {
            customerName = "Empty";
        } else customerName = req.body.customerName;

        let response1 = {
            "text": `---Info about your lookup order---
            \nCustomer name: ${customerName}
            \nEmail address: ${req.body.email}
            \nOrder number: ${req.body.orderNumber}
            `
        };

        let response2 = templateMessage.setInfoOrderTemplate();

        await chatbotService.sendMessage(req.body.psid, response1);
        await chatbotService.sendMessage(req.body.psid, response2);

        return res.status(200).json({
            message: "ok"
        });
    } catch (e) {
        console.log(e);
    }
};

module.exports = {
    getHome: getHome,
    getWebhook: getWebhook,
    postWebhook: postWebhook,
    handleSetupProfile: handleSetupProfile,
    getSetupProfilePage: getSetupProfilePage,
    getInfoOrderPage: getInfoOrderPage,
    setInfoOrder: setInfoOrder
}; 