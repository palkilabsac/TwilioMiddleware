const express = require('express')
const router = express.Router()
const AWS = require('aws-sdk');
const { MessagingResponse } = require('twilio').twiml;
const { setTimeout } = require("timers/promises");



const lexruntime = new AWS.LexRuntimeV2({
  credentials: new AWS.Credentials("AKIAXMKWF5MMR4J6REEI", "OwzYhtnczQd+j0utOzumCgjMRci75jPG+BmzeP1J"),
  region: 'us-east-1'
});


router.post('/', function(req, res) {
    console.log("RECIVE QUERY");
    const twiml = new MessagingResponse();
    const texts = [];
    console.log(req.body);
    let body = req.body.Body;
    let lat = req.body.Latitude;
    let lon = req.body.Longitude;
    if(lat != null && lon != null){
        body = lat + " " + lon;
    }
    const sessionId = req.body.From.substring(10);

    console.log("PARAMS");
    const params = {
        botAliasId: "TSTALIASID",
        botId: "IAHJBK8A6P",
        localeId: "es_419",
        sessionId: sessionId,
        text: body
    };

    console.log("SEND TO LEX");
    sendTextToLex(params)
    .then(async (data) => {
        let img_link = null;
        for (var idx in data.messages) {
            var message = data.messages[idx];
            if (message['contentType'] === 'PlainText' || message['contentType'] === 'CustomPayload') {
                texts.push(message['content']);
            } else if (message['contentType'] === 'ImageResponseCard') {
                img_link = message['imageResponseCard']['imageUrl'];
                console.log(img_link);
            }
        }
        if (texts[1] != null && texts[1].substring(0, 2) === 'Cu') {
            // const message_2 = twiml.message();
            const message_1 = twiml.message();
            message_1.body(texts[0] + '\n\n' + texts.slice(1).join('\n'));
            if (img_link != null) {
                message_1.media(img_link);
            }
            // message_1.body('\n\n');
            // message_1.body(texts.slice(1).join('\n'));
        } else {
            const message = twiml.message();
            message.body(texts.join('\n'));
            if (img_link != null) {
                message.media(img_link);
            }
        }
        res.type('text/xml');
        res.send(twiml.toString());
    })
    .catch((err) => {
        console.log('Error:', err);
        twiml.message('Oops! Me perdi. Vuelve a intentar.');
        res.type('text/xml');
        res.send(twiml.toString());
        });
    });

    function sendTextToLex(params) {
    return new Promise((resolve, reject) => {
        lexruntime.recognizeText(params, (err, data) => {
        if (err) {
            reject(err);
        } else {
            resolve(data);
        }
        });
    });
};

module.exports = router;