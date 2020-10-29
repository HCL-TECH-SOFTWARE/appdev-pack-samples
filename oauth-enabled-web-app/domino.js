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

import { getDatabase } from './connection.js';

export const getMessages = async (session) => {
  try {
    const accessToken = session.iamToken.access_token;
    const database = await getDatabase();
    const { documents = [] } = await database.bulkReadDocuments({
      query: '@all',
      queryArgs: [session.user.sub],
      itemNames: [
        'to',
        'from',
        'message',
      ],
      accessToken,
    });

    // without using a view, we get entries with noteids of docs we can't see.
    // filter them.
    const filtered = documents.filter(doc => !!doc.message);

    // clean up read messages
    const unids = filtered.map(doc => doc['@unid']);
    database.bulkDeleteDocumentsByUnid({ unids, accessToken }); // no need to wait
    return filtered;
  } catch (e) {
    // SPR JCUSBUVQB5: Databases with no data can throw error for @all DQL query.
    if (/No documents have been modified since.*/.test(e.message)) {
      return [];
    }
    throw e;
  }
};

export const sendMessage = async (session, to, message) => {
  const database = await getDatabase();
  return database.createDocument({
    document: {
      to,
      from: {
        type: 'text',
        data: session.user.sub,
      },
      message: {
        type: 'text',
        data: message,
      },
      Readers: {
        type: 'text',
        names: true,
        readers: true,
        data: [to],
      },
      Authors: {
        type: 'text',
        names: true,
        authors: true,
        data: [to],
      },
    },
    accessToken: session.iamToken.access_token,
  });
};

export default { getMessages, sendMessage };
