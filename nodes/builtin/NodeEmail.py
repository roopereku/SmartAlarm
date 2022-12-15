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

    def check(self, params):
        """
        No need to check anything
        """
        pass

    def activate(self, params):
        """
        Sends an email when activated
        """

        port = 465  # For SSL
        smtp_server = "smtp.gmail.com"
        sender_email = "smarttiaalarmia@gmail.com"
        # Password is read from .env file
        load_dotenv()
        password = os.getenv('EMAIL_PASSWORD')

        msg = EmailMessage()
        msg.set_content(params["body"])
        msg['Subject'] = params["header"]
        msg['From'] = sender_email
        msg['To'] = params["receiver"]

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
            server.login(sender_email, password)
            server.send_message(msg, from_addr=sender_email, to_addrs=params["receiver"])

    def deactivate(self, params):
        """
        No need to deactivate
        """
        pass

    def validate_params(self, params):
        """
        No need to validate
        """
        pass

    def get_params_format(self):
        return {
            "receiver": {
                "description": "Receiver email address",
                "type": "text"
            },
            "header": {
                "description": "Subject of the email",
                "type": "text"
            },
            "body": {
                "description": "Body of the email",
                "type": "text"
            }
        }


node = NodeEmail("email", 1, "action", "fa-regular fa-envelope")
