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
      if (isEditMode || estimation) {
        let estimationBadge = {
          title: "Estimation",
          text: estimation ? estimation.text : "No estimation",
          icon: GRAY_ICON,
        };
        badges.push(estimationBadge);
      }

      let appointments = await t.get(id, "shared", "appointments");
      if (appointments && appointments.length > 1
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
    "card-back-section": function(t, options) {
      return {
        title: "Estimation",
        icon: GRAY_ICON, // Must be a gray icon, colored icons not allowed.
        content: {
          type: "iframe",
          url: t.signUrl(window.TrelloPowerUp.util.relativeUrl("./estimation-edit.html")),
          height: 115
        }
      };
    },
    "list-actions": function(t) {
      return t.list("name", "id").then(async function(list) {
        let isActive = await t.get("board", "private", list.id + "isActive");
        console.log("isActive", isActive);
        if (isActive) {
          return [
            {
              text: "Calculate smart deadlines...",
              callback: function(t1) {
                return t.modal({
                  url: "../components/calculation.html",
                  accentColor: "#CDD3D8",
                  args: { listId: list.id, listName: list.name },
                  height: 300,
                  fullscreen: false,
                  title: "Calculation of smart deadlines",
                  actions: []
                });
              }
            },
            {
              text: "Settings for list...",
              callback: function(t2) {
                return t2.popup({
                  title: "Settings for list",
                  url: "../components/settings-new.html",
                  args: { listId: list.id, listName: list.name },
                  height: 350
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
    "show-settings": function(t) {
      return t.popup({
        title: "Global Settings",
        url: "../components/settings-new.html",
        args: { isGlobalSettings: true },
        height: 340
      });
    },
    "authorization-status": function(t) {
      return t.get("board", "private", "token").then(function(token) {
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
        height: 130
      });
    }
  },
  {
    appKey: "5db50da477d5b9033e479892f742bf8d",
    appName: "Smart Deadlines"
  }
);
