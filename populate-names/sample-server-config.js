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

const fs = require('fs');
const path = require('path');

const readFile = fileName => {
  try {
    return fs.readFileSync(path.resolve(fileName));
  } catch (error) {
    return undefined;
  }
};

const serverConfig = {
  hostName: 'your.server.org',
  connection: {
    port: '3002',
    secure: true,
  },
  credentials: {
    rootCertificate: readFile('/path/root.crt'),
    clientCertificate: readFile('/path/client.crt'),
    clientKey: readFile('/path/client.key'),
  },
};

module.exports = serverConfig;
