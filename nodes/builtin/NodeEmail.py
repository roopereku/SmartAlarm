import os
import smtplib
import ssl
from email.message import EmailMessage

from dotenv import load_dotenv

from NodeBase import node_base


class NodeEmail(node_base):
    """
    Node that can send emails
    """

    def __init__(self, node_type, delay, context):
        super().__init__(node_type, delay, context)

        self.__port = 465  # For SSL
        self.__smtp_server = "smtp.gmail.com"
        self.__sender_email = "smarttiaalarmia@gmail.com"  # Enter your address
        load_dotenv()
        self.__password = os.getenv('EMAIL_PASSWORD')

    def activate(self, params):
        """
        Sends an email when activated
        """

        msg = EmailMessage()
        msg.set_content(params["body"])
        msg['Subject'] = params["header"]
        msg['From'] = self.__sender_email
        msg['To'] = params["receiver"]

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(self.__smtp_server, self.__port, context=context) as server:
            server.login(self.__sender_email, self.__password)
            server.send_message(msg, from_addr=self.__sender_email, to_addrs=params["receiver"])

    def validate_params(self, params):
        pass

    def get_params_format(self):
        return {
            "receiver": {
                "description": "Who to send the email to",
                "type": "text"
            },
            "header": {
                "description": "Header of the email",
                "type": "text"
            },
            "body": {
                "description": "What message to send",
                "type": "text"
            }
        }


node = NodeEmail("email", 1, "action")
