var setDueDate = async function(
  t,
  dateTime,
  restDurationEvent,
  isOngoingStarted,
  card
) {
  var token = await t.get("member", "private", "token");
  var key = "5db50da477d5b9033e479892f742bf8d";
  return axios.put(
    "https://api.trello.com/1/cards/" +
      card.id +
      "?key=" +
      key +
      "&token=" +
      token +
      "&due=" +
      dateTime.format()
  );
};

var getListById = async function(t, listId) {
  var token = await t.get("member", "private", "token");
  var key = "5db50da477d5b9033e479892f742bf8d";
  return await $.get(
    "https://api.trello.com/1/lists/" +
      listId +
      "/cards?key=" +
      key +
      "&token=" +
      token
  );
};

var removeDueDate = async function(t, card) {
  var token = await t.get("member", "private", "token");
  var key = "5db50da477d5b9033e479892f742bf8d";
  return $.ajax({
    url:
      "https://api.trello.com/1/cards/" +
      card.id +
      "?key=" +
      key +
      "&token=" +
      token +
      "&due=",
    type: "PUT"
  });
};

var createAppointment = function(startDate, endDate, subject, cardId) {
  return {
    startDate: startDate.format(),
    endDate: endDate.format(),
    subject: subject,
    cardId: cardId
  };
};

var filterEvents = function(events, startDate) {
  var newEvents = [];
  var currentTime = startDate;
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    if (currentTime.isBetween(event.startDate, event.endDate)) {
      event.startDate = currentTime;
      event.duration = moment.duration(event.endDate.diff(event.startDate));
      newEvents.push(event);
    } else if (event.startDate.isAfter(currentTime)) {
      newEvents.push(event);
    }
  }
  return newEvents;
};

var startDateCalculationWithDependencies = function(t, lists, startDate) {
  return new Promise(async function(resolve, reject) {
    var lastEndDate = startDate;
    for (var i = lists.length - 1; i >= 0; i--) {
      lastEndDate = await startDateCalculation(t, lists[i].id, lastEndDate);
    }
    resolve();
  });
};

var startDateCalculation = async function(t, listId, startDate) {
  return new Promise(async function(resolve, reject) {
    var token = await t.get("member", "private", "token");
    if (!token) {
      t.alert({
        message: "Please authorize Smart Deadlines (to set due dates)!",
        duration: 6,
        display: "error"
      });

      return;
    }

    var startDateForExtract = startDate.clone();
    startDateForExtract.startOf("day");

    extractDates(t, listId, startDateForExtract).then(async function(events) {
      events = filterEvents(events, startDate);

      console.log("events1", events);
      if (events.length === 0) {
        return;
      }

      var cards = await getListById(t, listId);

      console.log("cards", cards);

      var currentEventIndex = 0;
      var event = events[currentEventIndex];
      var restDurationEvent = event.duration.asMinutes();

      var listIsActive = await t.get("board", "private", listId + "listSettingsActive");
      var isOngoing;
      if (!listIsActive) {
          isOngoing = await t.get("board", "private", "isContinuous");
      } else {
          isOngoing = await t.get("board", "private", listId + "isContinuous");
      }

      var lastEndDate = null;

      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var isOngoingStarted = false;

        var estimation = await t.get(card.id, "shared", "estimation");
        if (!estimation || estimation.estimation === 0) {
          await removeDueDate(t, card);
          continue;
        }

        if (card.dueComplete) {
          continue;
        }

        var appointments = [];

        var restDurationCard = estimation.estimation;
        while (restDurationCard > 0 && currentEventIndex + 1 <= events.length) {
          if (restDurationEvent === 0) {
            currentEventIndex = currentEventIndex + 1;
            if (currentEventIndex + 1 > events.length) {
              break;
            }
            event = events[currentEventIndex];
            restDurationEvent = event.duration.asMinutes();
          }

          if (restDurationEvent === restDurationCard) {
            var startDateTmp = event.endDate
              .clone()
              .subtract(moment.duration(restDurationEvent, "minutes"));

            appointments.push(
              createAppointment(
                startDateTmp,
                event.endDate,
                event.title,
                card.id
              )
            );

            if (!isOngoingStarted) {
              await setDueDate(
                t,
                startDateTmp,
                restDurationEvent,
                isOngoingStarted,
                card
              );
            }

            isOngoingStarted = true;
            lastEndDate = event.endDate;

            restDurationCard = 0;
            restDurationEvent = 0;
          } else if (restDurationEvent > restDurationCard) {
            var startDateTmp = event.endDate
              .clone()
              .subtract(moment.duration(restDurationEvent, "minutes"));
            var endDateTmp = event.endDate
              .clone()
              .subtract(
                moment.duration(restDurationEvent - restDurationCard, "minutes")
              );
            appointments.push(
              createAppointment(startDateTmp, endDateTmp, event.title, card.id)
            );

            if (!isOngoingStarted) {
              await setDueDate(
                t,
                startDateTmp,
                restDurationEvent,
                isOngoingStarted,
                card
              );
            }

            isOngoingStarted = true;
            lastEndDate = endDateTmp;

            restDurationEvent = restDurationEvent - restDurationCard;
            restDurationCard = 0;
          } else if (restDurationEvent < restDurationCard) {
            if (isOngoing) {
              var startDateTmp = event.endDate
                .clone()
                .subtract(moment.duration(restDurationEvent, "minutes"));
              var endDateTmp = event.endDate.clone();
              appointments.push(
                createAppointment(
                  startDateTmp,
                  endDateTmp,
                  event.title,
                  card.id
                )
              );

              lastEndDate = endDateTmp;

              restDurationCard = restDurationCard - restDurationEvent;
              if (currentEventIndex + 1 === events.length) {
                if (restDurationCard === 0) {
                  if (!isOngoingStarted) {
                    await setDueDate(
                      t,
                      startDateTmp,
                      restDurationEvent,
                      isOngoingStarted,
                      card
                    );
                  }
                  isOngoingStarted = true;
                }
              } else {
                if (!isOngoingStarted) {
                  await setDueDate(
                    t,
                    startDateTmp,
                    restDurationEvent,
                    isOngoingStarted,
                    card
                  );
                }
                isOngoingStarted = true;
              }
            }
            restDurationEvent = 0;
          }
        }
        if (restDurationCard > 0) {
          await removeDueDate(t, card);
          await t.remove(card.id, "shared", "appointments", appointments);
        } else {
          await t.set(card.id, "shared", "appointments", appointments);
        }
      }

      t.alert({
        message: "All due dates in list calculated!",
        duration: 6,
        display: "success"
      });

      resolve(lastEndDate);
    });
  });
};
