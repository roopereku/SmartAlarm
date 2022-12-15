import os
from dotenv import load_dotenv
from NodeBase import node_base
import threading
import discord
from discord.ext import tasks, commands
import time

message_queue = []

runnable = {}

class node_discord_messages(node_base):
    def activate(self, params):
        global message_queue
        message_queue.append({"msg": params["message"], "id": params["id"]})

    def deactivate(self, params):
        pass

    def validate_params(self, params):
        pass

    def get_params_format(self):
        return {
            "message": {
              "description": "What message to send",
              "type": "text"
            },
            "id": {
                "description": "Discord channel ID",
                "type": "text"
            }
        }

class node_discord_commands(node_base):
    def check(self, params):
        global runnable

        now = time.time()
        triggered = runnable[params["command"]]

        return now < triggered + 1

    def validate_params(self, params):
        global runnable
        runnable[params["command"]] = 0

    def get_params_format(self):
        return {
            "command": {
              "description": "What command activates (.run name)",
              "type": "text"
            }
        }

def run_node_messages():
    node = node_discord_messages("Discord messages", 1, "action", "fa-brands fa-discord")

def run_node_commands():
    node = node_discord_commands("Discord commands", 1, "sensor", "fa-brands fa-discord")

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

            channel = client.get_channel(int(message["id"]))
            await channel.send(message["msg"])

class node_bot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True

        commands.Bot.__init__(self, command_prefix=".", intents=intents)

    async def on_ready(self):
        print("Connected")
        await self.add_cog(message_watcher(self))

messages_thread = threading.Thread(target = run_node_messages)
messages_thread.start()

commands_thread = threading.Thread(target = run_node_commands)
commands_thread.start()

load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')

client = node_bot()

@client.command(name="run")
async def run(ctx, *, arg):
    print(arg)
    if arg in runnable:
        runnable[arg] = time.time()

client.run(TOKEN)
