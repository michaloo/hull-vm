# Examples of VM and custom scripts usage

## Example payload:

```js
{
  "user": {
    "email": "michal@bar.io",
    "anonymous_ids": [
      "1496216086-11c5f46e-c203-4d9d-987d-3c6d993a3566"
    ],
    "example": {
      "coconuts": 12,
      "send_spam": true,
      "techstack": [
        "SAP CRM",
        "Microsoft Office 365",
        "Google Cloud",
        "Salesforce",
        "Oracle"
      ]
    },
    "created_at": "2017-10-17T14:28:11Z",
    "signup_session_initial_url": "https://hull-processor-smart-notifier.herokuapp.com/admin.html",
    "segment_ids": [
      "5aa18fffab290b2a51000047"
    ],
    "segments": [
      {
        "created_at": "2018-02-20T11:22:00Z",
        "id": "5aa18fffab290b2a51000047",
        "name": "New segment",
        "type": "users_segment",
        "updated_at": "2018-02-20T11:22:00Z"
      }
    ],
    "traits": {
      "coconut": "23",
      "testing_coconuts": 12,
      "testing_date": "2017-10-10T10:10:10+00:00",
      "testing_string": 123,
    }
  },
  "account": {
  },
  "account_segments": [
  ],
  "changes": {
    "account": {
    },
    "account_segments": {
      "entered": [],
      "left": []
    },
    "is_new": false,
    "segments": {
      "entered": [
        {
          "created_at": "2018-03-08T19:33:19Z",
          "id": "5aa18fffab290b2a51000047",
          "name": "Kraken stress 2",
          "type": "users_segment",
          "updated_at": "2018-03-08T19:33:19Z"
        }
      ],
      "left": []
    },
    "user": {
      "anonymous_ids": [
        null,
        [
          "1496216086-11c5f46e-c203-4d9d-987d-3c6d993a3566"
        ]
      ],
      "signup_session_initial_url": [
        null,
        "https://hull-processor-smart-notifier.herokuapp.com/admin.html"
      ]
    }
  },
  "events": [
    {
      "context": {
        "location": {
          "latitude": 50.0202,
          "longitude": 19.9206
        },
        "page": {
          "url": "https://hull-processor-staging.herokuapp.com/admin.html"
        }
      },
      "created_at": "2018-04-13T12:57:14Z",
      "event": "page",
      "event_source": "track",
      "event_type": "page",
      "properties": {
      }
    }
  ],
  "segments": [
    {
      "created_at": "2018-03-08T19:33:19Z",
      "id": "5aa18fffab290b2a51000047",
      "name": "Kraken stress 2",
      "type": "users_segment",
      "updated_at": "2018-03-08T19:33:19Z"
    }
  ]
};
```

## Code:

```js
if (_.get(user, "email", "n/a") !== "n/a" &&
   _.get(user, "service.id", "n/a") === "n/a") {
   const driftId = user.external_id || user.id;
   hullClient.traits({ "service/id": driftId });
}
```

## Example results:

```js
/* Touched Attributes (The one your code touches) */
{
  "user": {
    "service": {
      "id": "5908db9857b9265d4500059f"
    }
  },
  "account": {}
}

/* Changed Attributes (What actually changed) */
{
  "user": {
    "service": {
      "id": "5908db9857b9265d4500059f"
    }
  },
  "account": {}
};
```

## Async code

```js
const enrichmentRequest = new Promise((resolve, reject) => {
  // options are npm request options (including url, method etc.)
  request(options, (err, response, body) => {
    if (err) {
      console.log(err);
      return reject(err);
    }
    try {
      console.info("Request/response log",{ ip, response: body, userIdent });
      resolve(body);
    }
    catch(e) {
      reject(e)
    }
  });
});
return enrichmentRequest.then(data => hullClient.traits(data));
```

## Connector processing

```js
app.post("/notification", (req, res) => { // whole http request is timeouted at 30 seconds
  const { messages } = req.body.notification;

  // process all messages
  // decide on timeouts and concurrency
  res.json(response);
});
```
