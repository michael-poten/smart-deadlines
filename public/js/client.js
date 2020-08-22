/* global TrelloPowerUp */
var Promise = TrelloPowerUp.Promise;

var GRAY_ICON =
  "https://raw.githubusercontent.com/michael-roedel/smart-deadlines/master/images/timelapse.svg";
var COUNTER_GRAY_ICON =
  "https://raw.githubusercontent.com/michael-roedel/smart-deadlines/master/images/counter.svg";

var setCardEstimation = function(t, value) {
  t.set("card", "shared", "estimation", value);
  return t.closePopup();
};

var estimationSelectionString = function(estimation, value) {
  return estimation ? (estimation.estimation === value ? " ✓" : "") : "";
};

var settingsItems = function(t, list) {
  return [
    {
      text: "Advanced calculation...",
      callback: function(t, opts) {
        t.modal({
          url: pathUrlSmartDeadlines + "calculation.html",
          accentColor: "#CDD3D8",
          args: { listId: list.id, listName: list.name },
          height: 300,
          fullscreen: false,
          title: "Advanced calculation",
          actions: []
        });
      }
    },
    {
      text: "Set settings...",
      callback: function(t2, opts) {
        return t2.popup({
          title: "Settings for list",
          url: pathUrlSmartDeadlines + "settings-new.html",
          args: { listId: list.id, listName: list.name },
          height: 420
        });
      }
    },
    {
      text: "Deactivate for list",
      callback: async function(t2, opts) {
        await t2.remove("board", "private", list.id + "isActive");
        return t2.closePopup();
      }
    }
  ];
};

var getBadges = function(t, isEditMode) {
  return t
    .card("id")
    .get("id")
    .then(async function(id) {
      if (!id) {
        return [];
      }
      var estimation = await t.get(id, "shared", "estimation");
      var badges = [];
      if (isEditMode || (estimation && estimation.estimation > 0)) {
        var estimationBadge = {
          title: "Estimation",
          text: estimation ? estimation.text : "No estimation",
          icon: GRAY_ICON,
          callback: function(context) {
            context.popup({
              title: "Estimation",
              items: [
                {
                  text:
                    "No Estimation" + estimationSelectionString(estimation, 0),
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
                  text: "45 min" + estimationSelectionString(estimation, 45),
                  callback: function(t) {
                    return setCardEstimation(t, {
                      estimation: 45,
                      text: "45 min"
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
                  text: "2 hours" + estimationSelectionString(estimation, 120),
                  callback: function(t) {
                    return setCardEstimation(t, {
                      estimation: 120,
                      text: "2 hours"
                    });
                  }
                },
                {
                  text: "3 hours" + estimationSelectionString(estimation, 180),
                  callback: function(t) {
                    return setCardEstimation(t, {
                      estimation: 180,
                      text: "3 hours"
                    });
                  }
                },
                {
                  text: "5 hours" + estimationSelectionString(estimation, 300),
                  callback: function(t) {
                    return setCardEstimation(t, {
                      estimation: 300,
                      text: "5 hours"
                    });
                  }
                },
                {
                  text: "8 hours" + estimationSelectionString(estimation, 480),
                  callback: function(t) {
                    return setCardEstimation(t, {
                      estimation: 480,
                      text: "8 hours"
                    });
                  }
                },
                {
                  text: "12 hours" + estimationSelectionString(estimation, 720),
                  callback: function(t) {
                    return setCardEstimation(t, {
                      estimation: 720,
                      text: "12 hours"
                    });
                  }
                },
                {
                  text:
                    "20 hours" + estimationSelectionString(estimation, 1200),
                  callback: function(t) {
                    return setCardEstimation(t, {
                      estimation: 1200,
                      text: "20 hours"
                    });
                  }
                },
                {
                  text:
                    "40 hours" + estimationSelectionString(estimation, 2400),
                  callback: function(t) {
                    return setCardEstimation(t, {
                      estimation: 2400,
                      text: "40 hours"
                    });
                  }
                }
              ]
            });
          }
        };
        badges.push(estimationBadge);
      }

      var appointments = await t.get(id, "shared", "appointments");
      if (
        (isEditMode && estimation && estimation.estimation > 0 && appointments) ||
        (appointments &&
          appointments.length > 1 &&
          estimation &&
          estimation.estimation > 0)
      ) {
        var appointmentTexts = [];
        for (var i = 0; i < appointments.length; i++) {
          var appointment = appointments[i];
          var startDateTmp = moment(appointment.startDate);
          var endDateTmp = moment(appointment.endDate);
          appointmentTexts.push({
            text:
              startDateTmp.format("D[.] MMMM") +
              " " +
              startDateTmp.format("H:mm") +
              " - " +
              endDateTmp.format("H:mm")
          });
        }
        var appointmentsBadge = {
          title: "Appointments",
          text: appointments.length + " Appointments",
          icon: COUNTER_GRAY_ICON,
          callback: function(context) {
            context.popup({
              title: "Appointment dates",
              items: appointmentTexts
            });
          }
        };
        badges.push(appointmentsBadge);
      }

      return badges;
    });
};

TrelloPowerUp.initialize(
  {
    "card-badges": function(t, options) {
      return getBadges(t);
    },
    "card-detail-badges": function(t, options) {
      return getBadges(t, true);
    },
    "list-actions": function(t) {
      return t.list("name", "id").then(async function(list) {
        var isActive = await t.get("board", "private", list.id + "isActive");
        console.log("isActive", isActive);
        if (isActive) {
          return [
            {
              text: "Calculate smart deadlines",
              callback: function(t1) {
                startDateCalculation(t, list.id, moment().startOf("day"));
                return t1.closePopup();
              }
            },
            {
              text: "More options...",
              callback: function(t1) {
                return t1.popup({
                  title: "Configuration for list",
                  items: settingsItems(t, list)
                });
              }
            }
          ];
        } else {
          return [
            {
              text: "Activate for list",
              callback: async function(t1) {
                await t1.set("board", "private", list.id + "isActive", true);
                return t1.closePopup();
              }
            }
          ];
        }
      });
    },

    "on-enable": function(t, options) {
      let trelloAPIKey = "5db50da477d5b9033e479892f742bf8d";
      return t.modal({
        url: pathUrlSmartDeadlines + "authorize.html",
        args: {
          apiKey: trelloAPIKey,
          isModal: true,
          pathUrlSmartDeadlines: pathUrlSmartDeadlines
        },
        accentColor: "#CDD3D8",
        height: 140,
        fullscreen: false,
        title: "Setup - Step 1",
        actions: []
      });
    },
    'show-settings': function(t, options){
      return t.popup({
          title: "Global Settings",
          url: pathUrlSmartDeadlines + "settings-new.html",
          args: { isGlobalSettings: true },
          height: 340
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
        args: {
          apiKey: trelloAPIKey,
          pathUrlSmartDeadlines: pathUrlSmartDeadlines
        },
        url: pathUrlSmartDeadlines + "authorize.html",
        height: 110
      });
    }
  },
  {
    appKey: "5db50da477d5b9033e479892f742bf8d",
    appName: "Smart Deadlines"
  }
);
