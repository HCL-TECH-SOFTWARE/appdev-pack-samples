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

const minimist = require('minimist');
const domino = require('@domino/domino-db');
const serverConfig = require('./server-config.js');

const values = {
  FNAMES: [
    'Adam', 'Bianca', 'Cris', 'Diana', 'Edgar', 'Fiona', 'Gerard', 'Hermione', 'Isaiah', 'Julia', 'Keith', 'Linda',
    'Moses', 'Noemi', 'Orhan', 'Patricia', 'Ralph', 'Susan', 'Timothy', 'Ursala', 'Victor', 'Wanda', 'Zebulon'],
  LNAMES: [
    'Abbott', 'Adams', 'Belanger', 'Curtis', 'Delay', 'Dumont', 'Edwards', 'Foucher', 'Gilday', 'Gilmore', 'Goldberg',
    'Hegfield', 'Isaac', 'Jones', 'Joseph', 'Kwan', 'Lee', 'Loomis', 'Monroe', 'Nikopoulos', 'Noonan', 'Ormond', 'Price',
    'Quirk', 'Rao', 'Rogers', 'Stevens', 'Thomas', 'Ulman', 'Venkataraman', 'Walker', 'Young', 'Zimmerman',
  ],
  ORGS: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'],
  COMPANIES: ['Acme', 'Banko', 'Crema', 'Dogi', 'Ember', 'Falala', 'Goliath', 'Hero', 'Kalamata'],
  COUNTRIES: ['Argentina', 'Bangladesh', 'Chile', 'Denmark', 'Ecuador', 'France', 'Greece', 'Hungary', 'Ireland'],
  DEPARTMENTS: ['Administration', 'Development', 'Finance', 'Human Resources', 'Shipping and Receiving'],
  JOBS: ['Accountant', 'Director', 'Engineer', 'Vice President'],
};

const sample = array => (
  array[Math.floor(Math.random() * array.length)]
);

const firstError = documents => {
  const first = documents.find(document => document['@error']);
  if (first) {
    return first['@error'].message;
  }
  return undefined;
};

const log = message => {
  console.log(message); // eslint-disable-line
};

const usage = () => {
  log('\nUsage: npm run pnames -- <database> <options>');
  log('\nwhere <database> is the full path of the address book');
  log('on the server, and <options> include:\n');
  log('  -c <count>  create <count> person records');
  log('  -l <lname>  create or remove only people with a last name matching <lname>');
  log('  -r          remove person records');
  log('\nExamples');
  log('\nCreate 25 people in fakenames.nsf:');
  log('  npm run pnames -- fakenames.nsf -c 25');
  log('\nCreate 5 people with a last name of Abbott in fakenames.nsf:');
  log('  npm run pnames -- fakenames.nsf -c 5 -l Abbott');
  log('\nRemove ALL people in fakenames.nsf:');
  log('  npm run pnames -- fakenames.nsf -r');
  process.exit(1);
};

const removePeople = async (database, lastName) => {
  let query = "Form = 'Person'";
  if (lastName) {
    query = `Form = 'Person' and LastName = '${lastName}'`;
  }

  do {
    let results;
    results = await database.bulkDeleteDocuments({ // eslint-disable-line
      query,
      count: 200,
    });

    // Short circuit on first error
    const { count, total } = results.documentRange;
    if (results.errors) {
      log(`Removed ${count - results.errors} of ${total} documents.`);
      throw new Error(
        `Stopping because of ${results.errors} errors. First error: ${firstError(results.documents)}`, // eslint-disable-line
      );
    }

    log(`Removed ${count} of ${total} documents.`);
    if (count === total) {
      return;
    }
  } while (true); // eslint-disable-line
};

const createPeople = async (database, count, lastName) => {
  let total = 0;

  do {
    // Create an array of 25 (or fewer) documents
    const documents = [];
    for (let i = 0; i < 25; i += 1) {
      if ((total + i) === count) {
        break;
      }
      const first = sample(values.FNAMES);
      const last = lastName ? lastName : sample(values.LNAMES); // eslint-disable-line
      const company = sample(values.COMPANIES);
      documents.push({
        Form: 'Person',
        Type: 'Person',
        FirstName: first,
        LastName: last,
        FullName: `CN=${first} ${last}/O=${sample(values.ORGS)}`,
        ShortName: `${first.substring(0, 1)}${last}`,
        CompanyName: company,
        MailDomain: company,
        Department: sample(values.DEPARTMENTS),
        JobTitle: sample(values.JOBS),
        OfficeCountry: sample(values.COUNTRIES),
      });
    }

    // Stop if there are no documents in this batch
    if (!documents.length) {
      break;
    }

    // Create this batch of documents
    let results = await database.bulkCreateDocuments({ // eslint-disable-line
      documents,
    });

    // Short circuit on first error
    const len = results.documents.length;
    if (results.errors) {
      log(`Created ${total + len - results.errors} of ${count} documents.`);
      throw new Error(
        `Stopping because of ${results.errors} errors. First error: ${firstError(results.documents)}`, // eslint-disable-line
      );
    }

    total += len;
    log(`Created ${total} of ${count} documents.`);
    if (count === total) {
      return;
    }
  } while (true); // eslint-disable-line
};

const main = async () => {
  const args = minimist(process.argv.slice(2));
  const [filePath] = args._;

  if (!filePath) {
    log('\nError: Address book database path expected.');
    usage();
  }

  if (!args.c && !args.r) {
    log('\nError: Create or remove option expected.');
    usage();
  }

  if (args.c && args.r) {
    log('\nError: Create and remove options are mutually exclusive.');
    usage();
  }

  if (args.c && typeof args.c !== 'number') {
    log('\nError: Create count must be a number.');
    usage();
  }

  try {
    const server = await domino.useServer(serverConfig);
    const database = await server.useDatabase({ filePath });

    if (args.r) {
      await removePeople(database, args.l);
    } else {
      await createPeople(database, args.c, args.l);
    }

    log('Done!');
  } catch (error) {
    log(error.message);
    process.exit(1);
  }
};

// Do it
main();
