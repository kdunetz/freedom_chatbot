/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk

var app = express();
process.env.CONVERSATION_USERNAME = "1387d43d-ca79-4e12-917d-ef3448ce857f";
process.env.CONVERSATION_PASSWORD = "lRyRFn7UGcgJ";
process.env.WORKSPACE_ID = "6686afe8-02f7-416c-80c3-2cf2993c480a";
process.env.MICROSOFT_APP_ID = "96f9ce38-cbbc-473d-ab1e-bd3471da0a7f";
process.env.MICROSOFT_APP_PASSWORD= "lspVUH25tytqRZLN502_))[";

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());
var startConversation = true;
var x = 0;

var Client = require('node-rest-client').Client;
 
var client = new Client();

// Create the service wrapper
var conversation = new Conversation({
  // If unspecified here, the CONVERSATION_USERNAME and CONVERSATION_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  'username': process.env.CONVERSATION_USERNAME,
  'password': process.env.CONVERSATION_PASSWORD,
  'version_date': '2017-05-26'
});

app.get('/api/version', (req, res) => res.send(process.env.VERSION || 'Unknown'));

// Endpoint to be call from the client side
app.post('/api/message', function(req, res) {
  var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    });
  }
/* the first time we have no context in the payload...but after that the app maintains the context to pass back to Conversation service */

  var payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {}
  };
  if (startConversation || payload.input.text == 'restart')
  {
     console.log("STARTING CONVERSATION");
     payload = {
        workspace_id: workspace,
        context: {},
        input: {}
     };
     startConversation = false;
  }

  // Send the input to the conversation service
  conversation.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
    console.log(JSON.stringify(payload, null, 2));
    console.log(JSON.stringify(data, null, 2));
    if (payload.input.text == 'intro')
    {
       var words = data.output.text;
       client.get("https://new-node-red-demo-kad.mybluemix.net/playwords?text=" + words , function (data, response) {
           // parsed response body as js object 
           console.log(data);
           // raw response 
           console.log(response);
       });
    }

    if (payload.input.text == 'validate_user' || payload.input.text == 'add_printer' || payload.input.text == 'show_instructions') /* just for testing actions */
    {
        console.log("RECEIVED INPUT");
        performAction(payload.input.text, function(data) {
            console.log("IN HERE");
        return res.json(updateMessage(payload, data));
       });
    }
    else if (data.context.action == 'validate_user' || data.context.action == 'add_printer' || data.context.action == 'password_reset' || data.context.action == 'close_ticket' || data.context.action == 'email_instructions' || data.context.action == 'show_instructions')
    {
        console.log("RECEIVED ACTION");
        performAction(data, function(data) {
            console.log("IN HERE");
            return res.json(updateMessage(payload, data));
       });
    }
    else
        return res.json(updateMessage(payload, data));

    // ORIGINAL CODE return res.json(updateMessage(payload, data));
  });
});

function performAction(data, callback)
{
   var response = data;
   var action = data.context.action;
   var conversation = data.context.conversation;
   console.log("in performAction: " + conversation + ", action = " + action);
   response.output = {}; // intentially clear out what Watson thought to respond with
   if (action == 'validate_user')
   {
      console.log("INSERT VALIDATE USER TO ACTIVE DIRECTORY");
      var validated = false;
      if (data.context.username == 'kdunetz')
      {
         validated = true
      }
      
      if (validated == false)
      {
         response.output.text = "User name does not match account logged in. Please try again or contact Service Desk at 1-888-555-1212";
         startConversation = true;
      }
      else
      {
         response.output.text = "Great, your User Name is confirmed. ";
         if (conversation == 'reset_password') action = "password_reset";
         if (conversation == 'add_printer') response.output.text += "Enter <B>1</B> if you'd like to have the chatbot walk you through how to add a printer?, Enter <B>2</B> if you'd like to have instructions emailed to you on how to install the printer";
      }
   }
   if (action == 'close_ticket')
   {
      response.output.text = "Ticket Closed, Would you like to perform another task?";
      console.log("INSERT CLOSE TICKET CODE");
      startConversation = true;
   }
   if (action == 'show_instructions')
   {
      console.log("INSERT A DATABASE FULL OF DOCUMENTATION YOU WANT CUSTOMER TO STEP THROUGH");
      var instructions = ["1) Click the Start button, then select Devices and Printers", "2) In the menu bar, click Add a Printer",  "3) Select Add a network, wireless, or Bluetooth printer"];
      response.output.text = instructions[x];
      if ((instructions.length - 1) == x++)
      {
         //response.output.text = "No more instructions.  What else would you like to do today?";
         response.context.done = 1;
         x = 0;
         //startConversation = true;
      }
   }
   if (action == 'add_printer')
   {
      response.output.text = "Printer Added";
      console.log("INSERT CODE TO ADD PRINTER HERE");
   }
   if (action == 'email_instructions')
   {
      response.output.text = "Instructions are being sent via Email";
      console.log("INSERT CODE TO SEND EMAIL");
      startConversation = true;
   }
   if (action == 'password_reset')
   {
      if (response.output.text.length > 0) response.output.text += "<P>";
      response.output.text += "Password reset. Are you able to get in? Yes or No";
      //startConversation = true;
      console.log("INSERT CODE TO RESET PASSWORD HERE");
   }
   callback(response);
}

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Conversation service
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
  var responseText = null;
  if (!response.output) {
    response.output = {};
  } else {
    console.log("Returning with no result");
    return response;
  }
  if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent;
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }
  response.output.text = responseText;
  return response;
}

module.exports = app;
