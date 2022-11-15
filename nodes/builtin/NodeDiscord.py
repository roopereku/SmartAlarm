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

def run_node():
    node = node_discord("discord", 0.5, "action")

class message_watcher(commands.Cog):
    def __init__(self, client):
        self.client = client
        self.loop.start()

    @tasks.loop(seconds = 1)
    async def loop(self):
        global message_queue
        if(len(message_queue) > 0):
            message = message_queue[0]
            message_queue.pop(0)

            channel = client.get_channel(1042017018825678878)
            await channel.send(message)

class node_bot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        commands.Bot.__init__(self, command_prefix=".", intents=intents)

    async def on_ready(self):
        print("Connected")
        await self.add_cog(message_watcher(self))

node_thread = threading.Thread(target = run_node)
node_thread.start()

load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')

client = node_bot()
client.run(TOKEN)
