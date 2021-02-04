<!-- ------------------------------------------------------------------------ -->
<!-- Copyright 2019 HCL Technologies Ltd.                                     -->
<!--                                                                          -->
<!-- Licensed under the Apache License, Version 2.0 (the "License");          -->
<!-- you may not use this file except in compliance with the License.         -->
<!-- You may obtain a copy of the License at                                  -->
<!--                                                                          -->
<!--     http://www.apache.org/licenses/LICENSE-2.0                           -->
<!--                                                                          -->
<!-- Unless required by applicable law or agreed to in writing, software      -->
<!-- distributed under the License is distributed on an "AS IS" BASIS,        -->
<!-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. -->
<!-- See the License for the specific language governing permissions and      -->
<!-- limitations under the License.                                           -->
<!-- ------------------------------------------------------------------------ -->

# populate-names

Populate a Domino address book with fake names.

This project is a sample command line interface (CLI) built using the **domino-db**
package from the Domino AppDev Pack. It is intended to demonstrate features of
the Domino AppDev Pack. It is not meant to be used with a production address book.

## Prerequisties

- Node.js and npm.
- The **domino-db** archive from the Domino AppDev Pack. The archive file
  name is **domino-domino-db-1.x.x.tgz** (where **x.x** is the minor and
  patch version of the archive).
- A Domino server with the Proton add-in. Proton is part of the Domino AppDev
  Pack.
- A test database created from the Domino Directory template (pubnames.ntf).

## Installation

Now clone the **populate-names** repository and install it. Let's assume your
clone is in a folder called *-->samples/populate-names** and the **domino-db**
archive is in your home directory.

To install **populate-names**:

```text
cd /samples/populate-names
npm install
npm install ~/domino-domino-db-1.x.x.tgz
```

The first npm command installs all the dependencies named in **package.json**.
The second npm command _adds_ **domino-db** to the list of dependencies. You should
substitute the actual name of the **domino-db** archive in the second command.

## Configuration

**populate-names** expects to load a server configuration from a file called
**server-config.js**. Since actual configurations vary, you must first
copy [sample-server-config.js](sample-server-config.js) to a new file called
**server-config.js**. Then edit the `serverConfig` object in the _new file_ to
match your environment.

```js
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
```

When you are done:

- `hostName` must be the fully qualified host name or IP address of your
   Domino server.
- `connection.port` must be the Proton port.
- `connection.secure` must be `true` unless Proton in listening for INSECURE
   connections.
- The `credentials` object is required only for secure connections. If
  `connection.secure` is `true`, each string passed to `readFile()` must
  refer to valid certificate or key file in your environment.

## Usage

```text
Usage: npm run pnames -- <database> <options>

where <database> is the full path of the address book
on the server, and <options> include:

  -c <count>  create <count> person records
  -l <lname>  create or remove only people with a last name matching <lname>
  -r          remove person records
```

For example, to create 25 random people in fakenames.nsf:

```text
npm run pnames -- fakenames.nsf -c 25
```

Create 5 people with a last name of Abbott in fakenames.nsf:

```text
npm run pnames -- fakenames.nsf -c 5 -l Abbott
```

Remove people with a last name of Abbott in fakenames.nsf:

```text
npm run pnames -- fakenames.nsf -r -l Abbott
```
Remove ALL people in fakenames.nsf:

```text
npm run pnames -- fakenames.nsf -r
```
