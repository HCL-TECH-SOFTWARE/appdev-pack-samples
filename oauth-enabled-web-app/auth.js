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

import Promise from 'bluebird';
import iampkg from '@domino/node-iam-client';
import jwtpkg from 'jsonwebtoken';
import iam from './iam.js';
import config from './config.js';

const { IAMClient } = iampkg;
const { decode } = jwtpkg;

const cleanSession = (session) => {
  delete session.iamCtx; // eslint-disable-line no-param-reassign
  delete session.iamToken; // eslint-disable-line no-param-reassign
  delete session.authorizationUrl; // eslint-disable-line no-param-reassign
  delete session.user; // eslint-disable-line no-param-reassign
  return Promise.promisify(session.save, { context: session })();
};

const ldapToDomino = (ldapdn) => {
  return ldapdn.replace(/([^\\]),/g, '$1/').replace(/\\,/, ',');
};

export default async (req, res, next) => {
  const { session } = req;

  if (req.path === config.get('webFrontend:callbackPath')) { // Handle IAM response.
    const { iamCtx } = session;
    await cleanSession(session);

    if (req.query.error) {
      res.type('text/plain').send(`${JSON.stringify(req.query, undefined, '  ')}`);
    } else {
      try {
        const client = await IAMClient.createInstance(iam.clientOptions);
        client.client.CLOCK_TOLERANCE = 1000;
        const iamToken = await client.getToken(req, iamCtx);
        const user = await decode(iamToken.id_token);
        session.user = user;
        user.sub = ldapToDomino(user.sub);

        // this is only our authentication request
        // we need to let the authorization for proton happen
        if (iamToken.scope !== 'openid') {
          // for demo only, store this more securely.
          session.iamToken = iamToken;
        }
        res.redirect('/');
        return;
      } catch (e) {
        res.type('text/plain').send(e.stack);
      }
    }
    next();
    return;
  }

  try {
    if (session.iamCtx && session.authorizationUrl) {
      // dance not finished. Bail
      res.redirect(session.authorizationUrl);
      return;
    }
    if (session.iamCtx) {
      await cleanSession(session);
      res.redirect('/');
      return;
    }

    // Who is the user?
    if (!session.user) {
      const client = await IAMClient.createInstance(iam.clientOptions);
      client.client.CLOCK_TOLERANCE = 1000;
      const {
        authorizationUrl,
        secureCtx,
      } = client.createAuthorizationCtx(iam.basicContext);

      session.iamCtx = secureCtx;
      session.authorizationUrl = authorizationUrl;
      res.redirect(session.authorizationUrl);
      return;
    }

    // Ask user to authorize
    if (!session.iamToken) {
      const client = await IAMClient.createInstance(iam.clientOptions);
      client.client.CLOCK_TOLERANCE = 1000;
      const {
        authorizationUrl,
        secureCtx,
      } = client.createAuthorizationCtx(iam.fullContext);

      session.iamCtx = secureCtx;
      session.authorizationUrl = authorizationUrl;
      res.redirect(session.authorizationUrl);
      return;
    }

    if (!session.iamToken) {
      delete session.iamToken;
      await Promise.promisify(session.save, { context: session })();
      res.redirect('/');
      return;
    }

    if (session.iamToken) {
      const { expires_at: expires } = session.iamToken; // seconds
      if (expires < new Date().getTime() / 1000) { // milliseconds
        delete session.iamToken;
        await Promise.promisify(session.save, { context: session })();
        res.redirect('/');
        return;
      }
    }

    next();
  } catch (e) {
    console.error(e); // eslint-disable-line no-console
    await Promise.promisify(session.destroy, { context: session })();
    res.redirect('/');
  }
};
