// server.js
// where your node app starts

const compression = require('compression');
const cors = require('cors');
const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');

const app = express();

app.use(compression());
app.use(cors({ origin: 'trello.com' }));
app.use(express.static('./'));
app.use(express.static('./ics-files/' + process.env.UGLIFY_URL_STRING ));
app.use(fileUpload({createParentPath: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const listener = app.listen(process.env.PORT, function () {
  console.log('Smart Deadlines Trello Power-Up listening on port ' + listener.address().port);
});

app.post('/ics-upload', async (req, res) => {
    try {
      
        let tokenKey = req.header('token')
        
        if (tokenKey !== process.env.TOKEN) {
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
            let icsPath = '/ics-files/' + process.env.UGLIFY_URL_STRING + '/' + icsFile.name;
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
