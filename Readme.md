# Perfyll

Perfyll is a lightweight JavaScript library designed to empower developers in tracking performance and user actions from an end-to-end (E2E) perspective. This library allows you to seamlessly gather and display performance data either on the cloud platform [perfyll.com](https://perfyll.com) or for local debugging purposes.

## Installation

To start using Perfyll, run the follow command:

```shell
npm install perfyll
```

or

```shell
yarn add perfyll
```

## Usage Example (Dev mode)

### Tracking blocking code

```javascript
import { startMark, endMark } from "perfyll";

async function myApiRoute() {
  const databaseQuery = async () => {
    startMark("database");
    await wait(100);
    endMark("database");
  };

  const registerUser = async () => {
    startMark("registerUser");
    await wait(20);
    await databaseQuery();
    await wait(100);
    // Having a second argument with the subMarks will conclude the event and record the outcome.
    endMark("registerUser", ["database"]);
  };

  await registerUser();
}
```

This will display in the console.

![console result](https://github.com/claudivanfilho/perfyll-js/raw/main/images/console.png)

### Tracking nonblocking code

```javascript
import { startMark, endMark, startMarkAsync, endMarkAsync } from "perfyll";

const sendEmail = async () => {
  await wait(500);
  return "email sent";
};

async function myApiRoute() {
  startMark("syncAction");
  await wait(100);
  const ref = startMarkAsync("sendEmail", "syncAction");
  sendEmail().finally(() => endMarkAsync(ref));
  // Having a second argument with the subMarks will conclude the event and record the outcome.
  endMark("syncAction", ["sendEmail"]);
}
```

This will display in the console.

![console2 result](https://github.com/claudivanfilho/perfyll-js/raw/main/images/console2.png)

## [WIP] Usage Example ([With Perfyll Cloud](https://perfyll.com))

Here's a brief example of how you can use Perfyll to track an API route's performance:

```javascript
import {init, startMark, endMark} from 'perfyll'

init({
  url: "<apiurl>",
  apiKey: "<apikey>",
  // secret must be provided only in the server environment
  secret: "<secret>",
  log: false
})

function myApiRoute() {
  startMark('apiRoute')
  await dataBaseTransaction()
  endMark('apiRoute', [])
}
```
