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

import { resolve } from 'path';
import nconf from 'nconf';
import ncyaml from 'nconf-yaml';
import root from './root.js'; // eslint-disable-line

const file = resolve(root, 'config.yml');

nconf.argv().env().file({ file, format: ncyaml });
nconf.defaults({
  database: 'oewa.nsf',
  dominoBackendConnection: {
    connection: {
      secure: true,
    },
  },
  webFrontend: {
    listenPort: 80,
    listenTLSPort: 443,
    listenAddress: '0.0.0.0',
  },
});

// Convert strings to buffers as the api expects.
nconf.set('dominoBackendConnection:credentials:rootCertificate', Buffer.from(nconf.get('dominoBackendConnection:credentials:rootCertificate'), 'utf8'));
nconf.set('dominoBackendConnection:credentials:clientCertificate', Buffer.from(nconf.get('dominoBackendConnection:credentials:clientCertificate'), 'utf8'));
nconf.set('dominoBackendConnection:credentials:clientKey', Buffer.from(nconf.get('dominoBackendConnection:credentials:clientKey'), 'utf8'));

export default nconf;
