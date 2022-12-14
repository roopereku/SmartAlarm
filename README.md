# SmartAlarm

SmartAlarm is an automation system that's highly extendable. Contrary to the project name, it's not aimed solely to be an alarm clock, though it can be used as one. SmartAlarm was created as an IoT school project.

## Installation
Make sure that you have NodeJS, NPM and Python3 installed
- `https://github.com/roopereku/SmartAlarm.git`

### To start the server
- `cd SmartAlarm/server`
- `npm i`
- `node main.js`

### To start nodes which the server doesn't automatically start
- `cd SmartAlarm/nodes/builtin`
- `python3 nodefile "Name visible on the website"`

Nodes which are not started by the server include `NodeDiscord.py`, `NodeTelegram.py` and `NodeEmail.py`.
All of these require API tokens which should be stored in `SmartAlarm/nodes/builtin/.env`, for an example
```
DISCORD_TOKEN=yourtoken
TELEGRAM_TOKEN=yourtoken
```

## Using the website
The server serves a website to port 3000. If you're hosting on the same computer which you're using to access the website, you can go to `http://localhost:3000`¨. The site will prompt you for a passcode which is very secret (psst.. It's admin). After the website has been entered, you can start drag-and-dropping nodes from the panel on the left side of the page. Once you have at least 2 instances of a node, you can connect them by dragging from a sphere located on the left and right corners of the instance box. When 2 instances are connected, whoever has a connection on the left side depends on the connected instance, meaning that if the dependency hasn't passed, the other instance probably does nothing.
