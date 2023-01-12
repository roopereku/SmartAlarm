# Smart Alarm
![SmartAlarm site frontpage](https://user-images.githubusercontent.com/72491928/212164460-19a65331-410b-4540-af55-65f44a509302.png)

SmartAlarm is an automation system that is highly extendable. Contrary to the project name, it is not aimed solely to be an alarm clock though it can be used as one. SmartAlarm was created as an IoT school project.

SmartAlarm has various different kinds of nodes: a sensor, action and control node. The idea behind this project is that user can chain nodes together to create flowchart style event chain. For example, you could chain an ultrasonic sensor node, a day control node and an email action node. After that, you can set parameters and get email when those parameters are met.

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
The server serves a website to port 3000. If you are hosting on the same computer which you are using to access the website, you can go to `http://localhost:3000`¨.<br>
The site will prompt you for a password which is very secret (psst... It is admin). After the website has been entered, you can start drag-and-dropping nodes from the panel on the left side of the page. Once you have at least two instances of a node, you can connect them by dragging from a sphere located on the left and right corners of the instance box. When two instances are connected, whoever has a connection on the left side depends on the connected instance, meaning that if the dependency hasn't passed, the other instance probably does nothing.
