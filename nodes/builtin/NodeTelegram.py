import os
import requests
from NodeBase import node_base
from dotenv import load_dotenv

def send_to_telegram(message):
    chatID = '1999030716'
    apiURL = f'https://api.telegram.org/bot{apiToken}/sendMessage'

    try:
        response = requests.post(apiURL, json={'chat_id': chatID, 'text': message})
        print(response.text)
    except Exception as e:
        print(e)

class node_telegram(node_base):
    def activate(self, params):
        send_to_telegram(params["message"])

    def deactivate(self, params):
        pass

    def validate_params(self, params):
        pass

    def get_params_format(self):
        return {
            "message": {
                "description" : "What message to send ",
                "type": "text"
            }
        }
load_dotenv()
apiToken = os.getenv('TELEGRAM_TOKEN')
node = node_telegram("telegram", 0.5, "action", "fa-brands fa-telegram")
