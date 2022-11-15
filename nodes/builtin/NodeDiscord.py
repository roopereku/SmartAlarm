import os
from dotenv import load_dotenv
from NodeBase import node_base
import threading
import discord
from discord.ext import tasks, commands

message_queue = []

class node_discord(node_base):
    def activate(self, params):
        global message_queue
        message_queue.append(params["message"])

    def deactivate(self, params):
        pass

    def validate_params(self, params):
        pass

    def get_params_format(self):
        return {
            "message": {
              "type": "text"

            }
        }

class message_watcher(commands.Cog):
    def __init__(self, client):
        self.client = client
        self.loop.start()

    @tasks.loop(seconds = 1)
    async def loop(self):
        global message_queue
        print(message_queue)

def run_bot():
    load_dotenv()
    TOKEN = os.getenv('DISCORD_TOKEN')


    intents = discord.Intents.default()
    client = discord.Bot(intents = intents)
    @client.event
    async def on_ready():
        print("connected")

    client.add_cog(message_watcher(client))
    client.run(TOKEN)



def run_node():
    node = node_discord("discord", 0.5, "action")

node_thread = threading.Thread(target = run_node)
node_thread.start()

run_bot()