![jest workflow](https://github.com/claudivanfilho/perfyll-js/actions/workflows/tests.yaml/badge.svg)
[![npm version](https://img.shields.io/npm/v/perfyll.svg?color=green)](https://www.npmjs.com/package/perfyll)

# Perfyll (VERSION 2 IS NOW AVAILABLE 🎉)

## Get started by signing up at [perfyll.com](https://perfyll.com) and create your account

Perfyll is a lightweight JavaScript library designed to empower developers in tracking performance and user actions from an end-to-end (E2E) perspective. This library allows you to seamlessly gather and display performance data either on the cloud platform [perfyll.com](https://perfyll.com) or for local debugging purposes.

## Installation

To start using Perfyll, run the follow command on terminal:

```shell
npm install --save perfyll
```

or

```shell
yarn add perfyll
```

## Usage

### init

Must be included in the the root of the project, you can access your apikeys [here](https://perfyll.com/app/api-keys)

```javascript
import { init } from "perfyll";

init({ publicKey: "<publicKey>" });
```

### log

```javascript
import { init, log } from "perfyll";

init({ publicKey: "<publicKey>" });

function myFunction() {
  log("My Log Example", { myExtraArg: 1 });
}
```

### logError

```javascript
import { init, logError } from "perfyll";

init({ publicKey: "<publicKey>" });

function myFunction() {
  logError(new Error("My Error"), { myExtraArg: 1 });
}
```

### mark()

```javascript
import { init, mark } from "perfyll";

init({ publicKey: "<publicKey>" });

export default function MyComponent() {
  function onCheckoutButtonClicked() {
    mark("checkoutButtonClicked", {extra: {buttonColor:  "blue"}}).send()
  }

  return ...
}
```

### startMark & endMark

Simple example

```javascript
import { startMark, endMark, init } from "perfyll";

init({ publicKey: "<publicKey>" });

async function onProductClicked() {
  const registerUser = async () => {
    startMark("productClick");
    // ...
    endMark("productClick").send();
  };
}
```

Example with subMark

```javascript
import { startMark, endMark, init } from "perfyll";

init({ publicKey: "<publicKey>" });

async function myApiRoute() {
  const databaseQuery = async () => {
    startMark("databaseQuery");
    // ...
    endMark("databaseQuery");
  };

  const registerUser = async () => {
    startMark("registerUser");
    // ...
    await databaseQuery();
    // ...
    endMark("registerUser").send(["databaseQuery"]);
  };

  await registerUser();
}
```

### startMarkAsync & endMarkAsync

```javascript
import { init, startMarkAsync, endMarkAsync } from "perfyll";

init({ publicKey: "<publicKey>" });

const sendEmail = async () => {
  // ...
};

async function myApiRoute() {
  const ref = startMarkAsync("sendEmail");
  // ...
  sendEmail().finally(() => endMarkAsync(ref));
}
```

## Use Cases

### E2E Marking

Tracking performance in an end to end transaction (client and server).

```javascript
// In Your Client Component
import { init, getHeaders, startMark, endMark } from "perfyll";

init({ publicKey: "<publicKey>" });

export function MyCompoennt() {
  ...

  const onSubmit = () => {
    startMark("registerUserRequest");
    fetch(
      "/api/<resource>",
      {headers: getHeaders("registerUserRequest")}
    ).finally(
      () => endMark("registerUserRequest").send([])
    );
  }
}
```

```javascript
// In Your Server
import { init, startMark, endMark } from "perfyll";

init({publicKey: "..."})

export function reqisterUserApiRoute(req: Request) {
  startMark("reqisterUserRoute", {headers: req.headers});
  ...
  endMark("registerUserRequest").send([]);
}
```

### Using Extra arguments

You can pass extra properties to your marks:

```javascript
// In Your Client Component
import { init, startMark, endMark } from "perfyll";

init({publicKey: "..."})

export function MyCompoennt() {
  ...
  const onClickHandler = () => {
    startMark("productClick", {extra: {productType: "TV"}});
    ...
    endMark("productClick").send([])
  }
}
```

## Config

#### forceHttp (boolean, default = false)

You should set to true when in a serverless backend environment, because by default perfyll tries to use websocket in the backend environment.

#### serviceName (string, default = "")

You can name your service in your backend environment.
