/* global TrelloPowerUp */

let GRAY_ICON =
  "https://raw.githubusercontent.com/michael-roedel/smart-deadlines/master/images/timelapse.svg";
let COUNTER_GRAY_ICON =
  "https://raw.githubusercontent.com/michael-roedel/smart-deadlines/master/images/counter.svg";

let setCardEstimation = function(t, value) {
  t.set("card", "shared", "estimation", value);
  return t.closePopup();
};

let estimationSelectionString = function(estimation, value) {
  return estimation ? (estimation.estimation === value ? " ✓" : "") : "";
};

let settingsItems = function(t, list) {
  return [
    {
      text: "Advanced calculation...",
      callback: function(t) {
        t.modal({
          url: "../components/calculation.html",
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
      callback: function(t2) {
        return t2.popup({
          title: "Settings for list",
          url: "../components/settings-new.html",
          args: { listId: list.id, listName: list.name },
          height: 420
        });
      }
    },
    {
      text: "Deactivate for list",
      callback: async function(t2) {
        await t2.remove("board", "private", list.id + "isActive");
        return t2.closePopup();
      }
    }
  ];
};

let getBadges = function(t, isEditMode) {
  return t
    .card("id")
    .get("id")
    .then(async function(id) {
      if (!id) {
        return [];
      }
      let estimation = await t.get(id, "shared", "estimation");
      let badges = [];
      if (isEditMode || (estimation && estimation.estimation > 0)) {
        let estimationBadge = {
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

      let appointments = await t.get(id, "shared", "appointments");
      if (
        (isEditMode && estimation && estimation.estimation > 0 && appointments) ||
        (appointments &&
          appointments.length > 1 &&
          estimation &&
          estimation.estimation > 0)
      ) {
        let appointmentTexts = [];
        for (let i = 0; i < appointments.length; i++) {
          let appointment = appointments[i];
          let startDateTmp = moment(appointment.startDate);
          let endDateTmp = moment(appointment.endDate);
          appointmentTexts.push({
            text:
              startDateTmp.format("D[.] MMMM") +
              " " +
              startDateTmp.format("H:mm") +
              " - " +
              endDateTmp.format("H:mm")
          });
        }
        let appointmentsBadge = {
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
    "card-badges": function(t) {
      return getBadges(t);
    },
    "card-detail-badges": function(t) {
      return getBadges(t, true);
    },
    "list-actions": function(t) {
      return t.list("name", "id").then(async function(list) {
        let isActive = await t.get("board", "private", list.id + "isActive");
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

    "on-enable": function(t) {
      let trelloAPIKey = "5db50da477d5b9033e479892f742bf8d";
      return t.modal({
        url: "../components/authorize.html",
        args: {
          apiKey: trelloAPIKey,
          isModal: true
        },
        accentColor: "#CDD3D8",
        height: 140,
        fullscreen: false,
        title: "Setup - Step 1",
        actions: []
      });
    },
    'show-settings': function(t){
      return t.popup({
          title: "Global Settings",
          url: "../components/settings-new.html",
          args: { isGlobalSettings: true },
          height: 340
      });
    },
    "authorization-status": function(t) {
      return t.get("member", "private", "token").then(function(token) {
        if (token) {
          return { authorized: true };
        }
        return { authorized: false };
      });
    },
    "show-authorization": function(t) {
      let trelloAPIKey = "5db50da477d5b9033e479892f742bf8d";
      return t.popup({
        title: "Authorization",
        args: {
          apiKey: trelloAPIKey
        },
        url: "../components/authorize.html",
        height: 110
      });
    }
  },
  {
    appKey: "5db50da477d5b9033e479892f742bf8d",
    appName: "Smart Deadlines"
  }
);
