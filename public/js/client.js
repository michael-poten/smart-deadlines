/* global TrelloPowerUp */

// we can access Bluebird Promises as follows
var Promise = TrelloPowerUp.Promise;

/*

Trello Data Access

The following methods show all allowed fields, you only need to include those you want.
They all return promises that resolve to an object with the requested fields.

Get information about the current board
t.board('id', 'name', 'url', 'shortLink', 'members')

Get information about the current list (only available when a specific list is in context)
So for example available inside 'attachment-sections' or 'card-badges' but not 'show-settings' or 'board-buttons'
t.list('id', 'name', 'cards')

Get information about all open lists on the current board
t.lists('id', 'name', 'cards')

Get information about the current card (only available when a specific card is in context)
So for example available inside 'attachment-sections' or 'card-badges' but not 'show-settings' or 'board-buttons'
t.card('id', 'name', 'desc', 'due', 'closed', 'cover', 'attachments', 'members', 'labels', 'url', 'shortLink', 'idList')

Get information about all open cards on the current board
t.cards('id', 'name', 'desc', 'due', 'closed', 'cover', 'attachments', 'members', 'labels', 'url', 'shortLink', 'idList')

Get information about the current active Trello member
t.member('id', 'fullName', 'username')

For access to the rest of Trello's data, you'll need to use the RESTful API. This will require you to ask the
user to authorize your Power-Up to access Trello on their behalf. We've included an example of how to
do this in the `🔑 Authorization Capabilities 🗝` section at the bottom.

*/

/*

Storing/Retrieving Your Own Data

Your Power-Up is afforded 4096 chars of space per scope/visibility
The following methods return Promises.

Storing data follows the format: t.set('scope', 'visibility', 'key', 'value')
With the scopes, you can only store data at the 'card' scope when a card is in scope
So for example in the context of 'card-badges' or 'attachment-sections', but not 'board-badges' or 'show-settings'
Also keep in mind storing at the 'organization' scope will only work if the active user is a member of the team

Information that is private to the current user, such as tokens should be stored using 'private' at the 'member' scope

t.set('organization', 'private', 'key', 'value');
t.set('board', 'private', 'key', 'value');
t.set('card', 'private', 'key', 'value');
t.set('member', 'private', 'key', 'value');

Information that should be available to all users of the Power-Up should be stored as 'shared'

t.set('organization', 'shared', 'key', 'value');
t.set('board', 'shared', 'key', 'value');
t.set('card', 'shared', 'key', 'value');
t.set('member', 'shared', 'key', 'value');

If you want to set multiple keys at once you can do that like so

t.set('board', 'shared', { key: value, extra: extraValue });

Reading back your data is as simple as

t.get('organization', 'shared', 'key');

Or want all in scope data at once?

t.getAll();

*/

var GRAY_ICON =
  "https://raw.githubusercontent.com/michael-roedel/smart-deadlines/master/images/timelapse.svg";
var WHITE_ICON =
  "https://cdn.hyperdev.com/us-east-1%3A3d31b21c-01a0-4da2-8827-4bc6e88b7618%2Ficon-white.svg";

var setCardEstimation = function(t, value) {
  t.set("card", "shared", "estimation", value);
  return t.closePopup();
};

var estimationSelectionString = function(estimation, value) {
  return estimation ? (estimation.estimation === value ? " ✓" : "") : "";
};

var getBadges = function(t, hidePossible) {
  let globalContext = t;

  return t
    .card("id")
    .get("id")
    .then(function(id) {
      return t.get(id, "shared", "estimation").then(function(estimation) {
        if (hidePossible && (!estimation || estimation.estimation === 0)) {
          return [];
        }

        return [
          {
            title: "Estimation", // for detail badges only
            text: estimation ? estimation.text : "No estimation",
            icon: GRAY_ICON, // for card front badges only
            callback: function(context) {
              // function to run on click
              context.popup({
                title: "Estimation",
                items: [
                  {
                    text:
                      "No Estimation" +
                      estimationSelectionString(estimation, 0),
                    callback: function(t) {
                      return setCardEstimation(t, {
                        estimation: 0,
                        text: "No estimation"
                      });
                    }
                  },
                  {
                    text: "15 min" + estimationSelectionString(estimation, 15),
                    callback: function(t) {
                      return setCardEstimation(t, {
                        estimation: 15,
                        text: "15 min"
                      });
                    }
                  },
                  {
                    text: "30 min" + estimationSelectionString(estimation, 30),
                    callback: function(t) {
                      return setCardEstimation(t, {
                        estimation: 30,
                        text: "30 min"
                      });
                    }
                  },
                  {
                    text: "1 hour" + estimationSelectionString(estimation, 60),
                    callback: function(t) {
                      return setCardEstimation(t, {
                        estimation: 60,
                        text: "1 hour"
                      });
                    }
                  },
                  {
                    text:
                      "2 hours" + estimationSelectionString(estimation, 120),
                    callback: function(t) {
                      return setCardEstimation(t, {
                        estimation: 120,
                        text: "2 hours"
                      });
                    }
                  },
                  {
                    text:
                      "3 hours" + estimationSelectionString(estimation, 180),
                    callback: function(t) {
                      return setCardEstimation(t, {
                        estimation: 180,
                        text: "3 hours"
                      });
                    }
                  },
                  {
                    text:
                      "5 hours" + estimationSelectionString(estimation, 300),
                    callback: function(t) {
                      return setCardEstimation(t, {
                        estimation: 300,
                        text: "5 hours"
                      });
                    }
                  },
                  {
                    text:
                      "8 hours" + estimationSelectionString(estimation, 480),
                    callback: function(t) {
                      return setCardEstimation(t, {
                        estimation: 480,
                        text: "8 hours"
                      });
                    }
                  },
                  {
                    text:
                      "16 hours" + estimationSelectionString(estimation, 960),
                    callback: function(t) {
                      return setCardEstimation(t, {
                        estimation: 960,
                        text: "16 hours"
                      });
                    }
                  },
                  {
                    text:
                      "24 hours" + estimationSelectionString(estimation, 1440),
                    callback: function(t) {
                      return setCardEstimation(t, {
                        estimation: 1440,
                        text: "24 hours"
                      });
                    }
                  }
                ]
              });
            }
          }
        ];
      });
    });
};

// We need to call initialize to get all of our capability handles set up and registered with Trello
TrelloPowerUp.initialize(
  {
    "card-badges": function(t, options) {
      return getBadges(t, true);
    },
    "card-detail-badges": function(t, options) {
      return getBadges(t);
    },
    "show-settings": function(t, options) {
      // when a user clicks the gear icon by your Power-Up in the Power-Ups menu
      // what should Trello show. We highly recommend the popup in this case as
      // it is the least disruptive, and fits in well with the rest of Trello's UX
      return t.popup({
        title: "Settings",
        url: "./settings.html",
        height: 184 // we can always resize later, but if we know the size in advance, its good to tell Trello
      });
    },
    "list-actions": function(t) {
      return t.list("name", "id").then(function(list) {
        return [
          {
            text: "Calculate due dates",
            callback: function(t1) {
              processDueDates(t);
              return t1.closePopup();
            }
          }
        ];
      });
    },

    "on-enable": function(t, options) {
      // This code will get triggered when a user enables your Power-Up
      let trelloAPIKey = "5db50da477d5b9033e479892f742bf8d";
      return t.modal({
        // the url to load for the iframe
        url: "./authorize.html",
        args: { apiKey: trelloAPIKey, isModal: true },
        accentColor: "#CDD3D8",
        height: 140,
        fullscreen: false,
        title: "Authorization of Smart Deadlines",
        actions: []
      });
    },
    "authorization-status": function(t, options) {
      return t.get("member", "private", "token").then(function(token) {
        if (token) {
          return { authorized: true };
        }
        return { authorized: false };
      });
    },
    "show-authorization": function(t, options) {
      let trelloAPIKey = "5db50da477d5b9033e479892f742bf8d";
      return t.popup({
        title: "Authorization",
        args: { apiKey: trelloAPIKey }, // Pass in API key to the iframe
        url: "./authorize.html", // Check out public/authorize.html to see how to ask a user to auth
        height: 110
      });
    }
  },
  {
    appKey: "5db50da477d5b9033e479892f742bf8d",
    appName: "Smart Deadlines"
  }
);
