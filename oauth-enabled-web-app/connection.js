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

import dominodb from '@domino/domino-db';
import config from './config.js';

// Types
import Database from '@domino/domino-db/src/database.js'; // eslint-disable-line no-unused-vars, import/order

const { useServer } = dominodb;
/** @type {Database} */
let database;

const getServer = async () => useServer(config.get('dominoBackendConnection'));

export const getDatabase = async () => {
  if (database) return database;
  const server = await getServer();
  database = await server.useDatabase({ filePath: config.get('database') });
  return database;
};

export default { getDatabase };
