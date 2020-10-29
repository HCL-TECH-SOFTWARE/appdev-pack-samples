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

import deepFreeze from 'deep-freeze';
import iampkg from '@domino/node-iam-client';

import config from './config.js';

const { GRANT_TYPES: AUTHORIZATION_CODE } = iampkg;

export default deepFreeze({
  clientOptions: {
    iam_server: config.get('iam:server'),
    client_id: config.get('iam:application-id'),
    client_secret: config.get('iam:application-secret'),
    redirect_uri: config.get('iam:redirect_uri'),
    httpOptions: {
      rejectUnauthorized: true,
      ca: config.get('iam:rootCertificate'),
    },
  },

  basicContext: {
    scopes: ['openid'],
    grantType: AUTHORIZATION_CODE,
  },

  fullContext: {
    scopes: [
      'openid',
      'domino.proton.db.access',
    ],
    grantType: AUTHORIZATION_CODE,
  },
});
