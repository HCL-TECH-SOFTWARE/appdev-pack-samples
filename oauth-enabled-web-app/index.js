/**
 * Copyright 2020 HCL Technologies Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import http from 'http';
import https from 'https';
import express from 'express';
import session from 'express-session';
import open from 'open';
import { v4 as uuidv4 } from 'uuid';
import bodyParser from 'body-parser';
import config from './config.js';
import auth from './auth.js';
import { getMessages, sendMessage } from './domino.js';

const { urlencoded } = bodyParser;

const app = express();
app.use(session({
  secret: uuidv4(),
  resave: true,
  saveUninitialized: false,
  cookie: {
    secure: true,
    maxAge: config.get('webFrontend:sessionTTL'),
  },
}));
app.use(auth);
app.use(urlencoded({ extended: true }));
app.set('views', './views');
app.set('view engine', 'pug');
app.get('/', async (req, res) => {
  const docs = await getMessages(req.session);
  res.render('index', { session: req.session, docs });
});
app.post('/send', async (req, res) => {
  await sendMessage(req.session, req.body.to, req.body.message);
  res.redirect('/');
});

http.createServer((req, res) => {
  res.writeHead(301, { Location: `https://${config.get('webFrontend:hostname')}:${config.get('webFrontend:listenTLSPort')}${req.url}` });
  res.end();
}).listen(config.get('webFrontend:listenPort'), config.get('webFrontend:listenAddress'), () => {
  // eslint-disable-next-line no-console
  console.log(`HTTP Server running on ${config.get('webFrontend:listenAddress')}:${config.get('webFrontend:listenPort')}`);
});

const httpsServer = https.createServer({
  ca: config.get('webFrontend:rootCertificate'),
  cert: config.get('webFrontend:certificate'),
  key: config.get('webFrontend:key'),
}, app);
httpsServer.listen(config.get('webFrontend:listenTLSPort'), config.get('webFrontend:listenAddress'), () => {
  // eslint-disable-next-line no-console
  console.log(`HTTPS Server running on ${config.get('webFrontend:listenAddress')}:${config.get('webFrontend:listenTLSPort')}`);
});

open(`https://${config.get('webFrontend:hostname')}:${config.get('webFrontend:listenTLSPort')}/`);
