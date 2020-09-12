Private projects are difficult: free time is irregularly distributed throughout the week.

This is exactly where Smart Deadlines comes in: 

Place placeholder-appointments in your iCal-calendar. Smart Deadlines reads out these appointments and can determine when which cards needs to be done - based on the estimates you make per card.

![](https://raw.githubusercontent.com/michael-roedel/smart-deadlines/master/images/lists.PNG)

## What happens there exactly?

After entering the URL to your iCal calendar in the preferences and setting estimates per card, you can calculate the due dates and card appointments for a list. First, all dates (with the previously defined title) for the next months are read from your iCal calendar URL. Afterwards, the next possible date is determined for each card in sequence according to the estimate.

## Configuration

First, you need to add the link to your iCal calendar. After you have activated a list, you can give an estimate for each card.
![](https://raw.githubusercontent.com/michael-roedel/smart-deadlines/master/images/card_estimation.PNG)

Finally, click on "Calculate Smart Deadlines..." in the context menu of a desired list. In the new window click on "Run" to start the calculation.
![](https://raw.githubusercontent.com/michael-roedel/smart-deadlines/master/images/calculation.PNG)

The generated appointments are displayed by clicking on a card or the board button.
![](https://raw.githubusercontent.com/michael-roedel/smart-deadlines/master/images/card_appointments.PNG)

### Upload and Download of .ics files with your own server

You can also run a (very small) NodeJs service on your own server. An ics file with the calculated appointments can be uploaded automatically. You can then import the URL to this ics in your calendar. The download of the ics file is also done via this service.

To do so, please go to the public [GitHub repository](https://github.com/michael-roedel/smart-deadlines) and copy the package.json and server.js to your server. After installing NodeJs and running "npm install" in your command console, you can start the application with "node server.js". More detailed instructions would unfortunately go beyond this scope.

There is also an official Docker image available on DockerHub. Please go to [https://hub.docker.com/r/nicknamenuck/smart-deadlines](https://hub.docker.com/r/nicknamenuck/smart-deadlines).

## Open Source

This project is OpenSource and cooperation is highly desired. Feel free to share your ideas with me or develop a feature yourself! You can find more information on the [GitHub page](https://github.com/michael-roedel/smart-deadlines) of the repository.
 