import os
import json
import requests
import response
from NodeBase import node_base
from dotenv import load_dotenv

def receive_telegram(message):
    chatID = '1999030716'
    apiURL = f'https://api.telegram.org/bot{apiToken}/sendMessage'

    try:
        response = requests.get(apiURL, json={'chat_id': chatID, 'text': message})
        print(response.text)
    except Exception as e:
        print(e)'


def get_url(url):
    response = requests.get(url)
    content = response.content.decode("utf8")
    return content

def get_json_from_url(url):
    content = get_url(url)
    js = json.loads(content)
    return js

def get_updates():
    url = f'https://api.telegram.org/bot{apiToken}/getUpdates'
    js = get_json_from_url(url)
    return js

def get_last_chat_id_and_text(updates):
    num_updates = len(updates["result"])
    last_update = num_updates - 1
    text = updates["result"][last_update]["message"]["text"]
    chat_id = updates["result"][last_update]["message"]["chat"]["id"]
    return (text, chat_id)

class node_telegram_get(node_base):
    def check(self, params):
        updates = get_updates()
        [text, char_id] = get_last_chat_id_and_text(updates)

        if (text == "light"):
            return True

    def activate(self, params):
        pass

    def deactivate(self, params):
        pass

    def validate_params(self, params):
        pass

    def get_params_format(self):
        return {
            "message" : {
                "description" : "Message to compare",
                "type" : "text",
                "default" : "light"
            },

            "comparison" : {
                "description" : "How to compare",
                "strict" : True,
                "hint" : {
                    "=" : "Equal"
                }
            }
        }

load_dotenv()
apiToken = os.getenv('TELEGRAM_TOKEN')
node = node_telegram_get("telegram_get", 0.5, "sensor", "fa-brands fa-telegram")



