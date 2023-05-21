var calprocess = function() {
  let setDueDate = async function(
    t,
    dateTime,
    restDurationEvent,
    isOngoingStarted,
    card
  ) {
    let token = await t.get("board", "private", "token");
    if (!token) {
      return new Promise(async function(resolve, reject) {
        resolve()
      })
    }
    let key = "5db50da477d5b9033e479892f742bf8d";
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

  let removeDueDate = async function(t, card) {
    let token = await t.get("board", "private", "token");
    if (!token) {
      return new Promise(async function(resolve, reject) {
        resolve()
      })
    }
    let key = "5db50da477d5b9033e479892f742bf8d";
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

  let createAppointment = function(
    startDate,
    endDate,
    subject,
    cardId,
    cardName
  ) {
    return {
      startDate: startDate.format(),
      endDate: endDate.format(),
      subject: subject,
      cardId: cardId,
      cardName: cardName
    };
  };

  let filterEvents = function(events, startDate) {
    let newEvents = [];
    let currentTime = startDate;
    for (let i = 0; i < events.length; i++) {
      let event = events[i];
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

  return {
    exportCsv: function(totalAppointments) {
      let lines = "Card name; Appointment name; Date; Start time; End time \n";
      for (let j = 0; j < totalAppointments.length; j++) {
        let appointment = totalAppointments[j];
        let startDate = moment(appointment.startDate).format("YYYY[-]MM[-]DD");
        let startDateTime = moment(appointment.startDate).format("H:mm");
        let endDateTime = moment(appointment.endDate).format("H:mm");
        lines =
          lines +
          appointment.cardName +
          "; " +
          appointment.subject +
          "; " +
          startDate +
          "; " +
          startDateTime +
          "; " +
          endDateTime +
          "\n";
      }

      return lines;
    },
    exportIcs: function(totalAppointments) {
      let cal = ics();

      for (let j = 0; j < totalAppointments.length; j++) {
        let appointment = totalAppointments[j];
        let startDate = moment(appointment.startDate).format();
        let endDate = moment(appointment.endDate).format();
        cal.addEvent(appointment.cardName, "", "", startDate, endDate);
      }

      return cal;
    },
    downloadCsvData: function(csvLines) {
      var blob;
      if (navigator.userAgent.indexOf("MSIE 10") === -1) {
        // chrome or firefox
        blob = new Blob([csvLines], { type: "text/comma-separated-values" });
      } else {
        // ie
        var bb = new BlobBuilder();
        bb.append(csvLines);
        blob = bb.getBlob(
          "text/comma-separated-values;charset=" + document.characterSet
        );
      }

      saveAs(blob, "smart-deadlines.csv");
    },
    uploadIcsData: function(t, cal, exportServer, exportServerKey, exportServerName) {
      return new Promise(async function(resolve, reject) {
        let bodyFormData = new FormData();

        var blob;
        if (navigator.userAgent.indexOf("MSIE 10") === -1) {
          // chrome or firefox
          blob = new Blob([cal.calendar()], { type: "text/calendar" });
        } else {
          // ie
          var bb = new BlobBuilder();
          bb.append(cal.calendar());
          blob = bb.getBlob("text/x-vCalendar;charset=" + document.characterSet);
        }

        bodyFormData.append("ics", blob, exportServerName + ".ics");

        let that = this;
        axios({
          method: "post",
          url: exportServer + "/ics-upload",
          data: bodyFormData,
          headers: {
            "Content-Type": "multipart/form-data",
            token: exportServerKey,
            filename: exportServerName + ".ics"
          }
        })
          .then(async function(response) {
            await t.set(
              "board",
              "private",
              "exportServerName",
              exportServerName
            );
          
            resolve(exportServer + response.data.data.url);
          })
          .catch(function(error) {
            console.log("error", error);
            reject("Could not upload ics file!");
          });
      });
    },
    startDateCalculation: async function(t, listId, startDate, icsData, useIcalCalendar) {
      return new Promise(async function(resolve, reject) {
        // let token = await t.get("board", "private", "token");
        // if (!token) {
        //   reject("Please authorize Smart Deadlines (to set due dates)!");
        //   return;
        // }

        let startDateForExtract = startDate.clone();
        startDateForExtract.startOf("day");

        await calsync()
          .extractDates(t, listId, startDateForExtract, icsData, useIcalCalendar)
          .then(async function(events) {
            let endDateTmp;
            let startDateTmp;
            events = filterEvents(events, startDate);

            if (events.length === 0) {
              return;
            }

            let cards = (await t.cards("all")).filter(t => t.idList === listId);

            let currentEventIndex = 0;
            let event = events[currentEventIndex];
            let restDurationEvent = event.duration.asMinutes();

            let listIsActive = await t.get(
              "board",
              "private",
              listId + "listSettingsActive"
            );
            let isOngoing;
            if (!listIsActive) {
              isOngoing = await t.get("board", "private", "isContinuous");
            } else {
              isOngoing = await t.get(
                "board",
                "private",
                listId + "isContinuous"
              );
            }

            let lastEndDate = null;

            let totalAppointments = [];

            for (let i = 0; i < cards.length; i++) {
              let card = cards[i];
              let isOngoingStarted = false;

              let estimation = await t.get(card.id, "shared", "estimation");
              if (!estimation || estimation.estimation === 0) {
                await t.remove(card.id, "shared", "appointments");
                await removeDueDate(t, card);
                continue;
              }

              if (card.dueComplete) {
                await t.remove(card.id, "shared", "appointments");
                continue;
              }

              let appointments = [];

              let restDurationCard = estimation.estimation;
              let counter = 0;
              while (
                restDurationCard > 0 &&
                currentEventIndex + 1 <= events.length
              ) {
                if (restDurationEvent === 0) {
                  currentEventIndex = currentEventIndex + 1;
                  if (currentEventIndex + 1 > events.length) {
                    break;
                  }
                  event = events[currentEventIndex];
                  restDurationEvent = event.duration.asMinutes();
                }

                counter = counter + 1;

                if (restDurationEvent === restDurationCard) {
                  startDateTmp = event.endDate
                    .clone()
                    .subtract(moment.duration(restDurationEvent, "minutes"));

                  appointments.push(
                    createAppointment(
                      startDateTmp,
                      event.endDate,
                      event.title,
                      card.id,
                      card.name,
                      counter
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
                  startDateTmp = event.endDate
                    .clone()
                    .subtract(moment.duration(restDurationEvent, "minutes"));
                  endDateTmp = event.endDate
                    .clone()
                    .subtract(
                      moment.duration(
                        restDurationEvent - restDurationCard,
                        "minutes"
                      )
                    );
                  appointments.push(
                    createAppointment(
                      startDateTmp,
                      endDateTmp,
                      event.title,
                      card.id,
                      card.name,
                      counter
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
                  lastEndDate = endDateTmp;

                  restDurationEvent = restDurationEvent - restDurationCard;
                  restDurationCard = 0;
                } else if (restDurationEvent < restDurationCard) {
                  if (isOngoing) {
                    startDateTmp = event.endDate
                      .clone()
                      .subtract(moment.duration(restDurationEvent, "minutes"));
                    endDateTmp = event.endDate.clone();
                    appointments.push(
                      createAppointment(
                        startDateTmp,
                        endDateTmp,
                        event.title,
                        card.id,
                        card.name,
                        counter
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
                await t.remove(card.id, "shared", "appointments");
              } else {
                await t.set(card.id, "shared", "appointments", {
                  appointments: appointments,
                  counter: counter
                });
                totalAppointments.push({
                  appointments: appointments,
                  counter: counter
                });
              }
            }

            resolve({
              lastEndDate: lastEndDate,
              totalAppointments: totalAppointments
            });
          })
          .catch(errorText => {
            reject(errorText);
          });
      });
    }
  };
};
