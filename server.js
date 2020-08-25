// server.js
// where your node app starts

const compression = require('compression');
const cors = require('cors');
const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const axios = require('axios/index')

const app = express();

app.use(compression());
app.use(cors({ origin: '*' }));

let port = 49024;
if (process.env.DEV_MODE){
  app.use(express.static('./'));
  port = process.env.PORT;
}

let envToken = process.env.TOKEN;
if (!envToken) {
  envToken = 'noToken';
}

let secretUrlString = process.env.SECRET_URL_STRING;
if (!secretUrlString) {
  secretUrlString = 'default';
}

app.use(express.static('./ics-files/' + secretUrlString ));
app.use(fileUpload({createParentPath: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const listener = app.listen(port, function () {
  console.log('Env variable SECRET_URL_STRING is ' + secretUrlString);
  console.log('Smart Deadlines Trello Power-Up listening on port ' + listener.address().port);
});

app.post('/ics-upload', async (req, res) => {
    try {
      
        let tokenKey = req.header('token')
        
        if (tokenKey !== envToken) {
          res.status(401).send({error: 'Token wrong!'});
          return;
        }
      
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            let icsFile = req.files.ics;
            let icsPath = '/ics-files/' + secretUrlString + '/' + icsFile.name;
            icsFile.mv('.' + icsPath);

            res.send({
                status: true,
                message: 'File is uploaded',
                data: {
                    name: icsFile.name,
                    mimetype: icsFile.mimetype,
                    size: icsFile.size,
                    url: icsPath
                }
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/cors', async (req, res) => {

    let tokenKey = req.header('token')

    if (tokenKey !== envToken) {
        res.status(401).send({error: 'Token wrong!'});
        return;
    }

    let url = req.query.url;

    axios.get(url)
        .then(function (response) {
            res.send(response.data);
        })
        .catch(function (error) {
            res.status(500).send(error);
        })

});
