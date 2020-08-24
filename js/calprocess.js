let setDueDate = async function (
    t,
    dateTime,
    restDurationEvent,
    isOngoingStarted,
    card
) {
    let token = await t.get("member", "private", "token");
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

let getListById = async function (t, listId) {
    let token = await t.get("member", "private", "token");
    let key = "5db50da477d5b9033e479892f742bf8d";
    return await $.get(
        "https://api.trello.com/1/lists/" +
        listId +
        "/cards?key=" +
        key +
        "&token=" +
        token
    );
};

let removeDueDate = async function (t, card) {
    let token = await t.get("member", "private", "token");
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

let createAppointment = function (startDate, endDate, subject, cardId, cardName) {
    return {
        startDate: startDate.format(),
        endDate: endDate.format(),
        subject: subject,
        cardId: cardId,
        cardName: cardName
    };
};

let filterEvents = function (events, startDate) {
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

let startDateCalculation = async function (t, listId, startDate) {
    return new Promise(async function (resolve) {
        let token = await t.get("member", "private", "token");
        if (!token) {
            t.alert({
                message: "Please authorize Smart Deadlines (to set due dates)!",
                duration: 6,
                display: "error"
            });

            return;
        }

        let startDateForExtract = startDate.clone();
        startDateForExtract.startOf("day");

        extractDates(t, listId, startDateForExtract).then(async function (events) {
            let endDateTmp;
            let startDateTmp;
            events = filterEvents(events, startDate);

            if (events.length === 0) {
                return;
            }

            let cards = await getListById(t, listId);

            let currentEventIndex = 0;
            let event = events[currentEventIndex];
            let restDurationEvent = event.duration.asMinutes();

            let listIsActive = await t.get("member", "private", listId + "listSettingsActive");
            let isOngoing;
            if (!listIsActive) {
                isOngoing = await t.get("member", "private", "isContinuous");
            } else {
                isOngoing = await t.get("member", "private", listId + "isContinuous");
            }

            let lastEndDate = null;
          
            let totalAppointments = [];

            for (let i = 0; i < cards.length; i++) {
                let card = cards[i];
                let isOngoingStarted = false;

                let estimation = await t.get(card.id, "shared", "estimation");
                if (!estimation || estimation.estimation === 0) {
                    await removeDueDate(t, card);
                    continue;
                }

                if (card.dueComplete) {
                    continue;
                }

                let appointments = [];

                let restDurationCard = estimation.estimation;
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
                        startDateTmp = event.endDate
                            .clone()
                            .subtract(moment.duration(restDurationEvent, "minutes"));

                        appointments.push(
                            createAppointment(
                                startDateTmp,
                                event.endDate,
                                event.title,
                                card.id,
                                card.name
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
                                moment.duration(restDurationEvent - restDurationCard, "minutes")
                            );
                        appointments.push(
                            createAppointment(startDateTmp, endDateTmp, event.title, card.id, card.name)
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
                                    card.name
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
                    for (let k = 0; k < appointments.length; k++) {
                      totalAppointments.push(appointments[k]);
                    }
                    
                }
            }

            t.alert({
                message: "All due dates in list calculated!",
                duration: 6,
                display: "success"
            });

            resolve({
              lastEndDate: lastEndDate,
              totalAppointments: totalAppointments
            });
        });
    });
};
