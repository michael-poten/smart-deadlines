/* global TrelloPowerUp */
var Promise = TrelloPowerUp.Promise;

var GRAY_ICON = "https://raw.githubusercontent.com/michael-roedel/smart-deadlines/master/images/timelapse.svg";

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
            title: "Estimation",
            text: estimation ? estimation.text : "No estimation",
            icon: GRAY_ICON,
            callback: function(context) {
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

TrelloPowerUp.initialize(
  {
    "card-badges": function(t, options) {
      return getBadges(t, true);
    },
    "card-detail-badges": function(t, options) {
      return getBadges(t);
    },
    "show-settings": function(t, options) {
      return t.popup({
        title: "Settings",
        url: "/smart-deadlines/public/settings.html",
        height: 184
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
      let trelloAPIKey = "5db50da477d5b9033e479892f742bf8d";
      return t.modal({
        url: "/smart-deadlines/public/authorize.html",
        args: { apiKey: trelloAPIKey, isModal: true },
        accentColor: "#CDD3D8",
        height: 400,
        fullscreen: false,
        title: "Setup - Step 1",
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
        args: { apiKey: trelloAPIKey },
        url: "/smart-deadlines/public/authorize.html",
        height: 110
      });
    }
  },
  {
    appKey: "5db50da477d5b9033e479892f742bf8d",
    appName: "Smart Deadlines"
  }
);
