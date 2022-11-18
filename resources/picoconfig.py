import asyncio
import time
import sys
import os

from sys import platform
from threading import Thread

try: import websockets

except ModuleNotFoundError:
    os.system('python -m pip install websockets')
    import websockets

try: import serial

except ModuleNotFoundError:
    os.system('python -m pip install pyserial')
    import serial

#try: import easygui
#
#except ModuleNotFoundError:
#    os.system('python -m pip install easygui')
#    import easygui

device_id = None
last_read = None
device = None

async def echo(websocket):
    async for message in websocket:
        cmd = message.split("\n")
        print(cmd)

        if(cmd[0] == "read"):
            print("Reading")

            device.write(b"\n")
            time.sleep(0.01)
            data = read_serial()
            print(data)

            config = data.decode("utf-8")
            print(config)

            await websocket.send(config)

        elif(cmd[0] == "write"):
            message = cmd[1][:-1].split("\r")
            print(message)

            # FIXME Remove quotation marks from the payload because python doesn't like them
            payload = ("\b" + cmd[1][:-1] + "\b").encode("utf-8")
            print("write", payload)
            device.write(payload)

            await websocket.close()

        elif(cmd[0] == "cancel"):
            await websocket.close()

async def start_server():
    global device
    device = serial.Serial(device_id, 9600)    #Open port with baud rate

    print("Start. Dev id", device_id)

    async with websockets.serve(echo, "0.0.0.0", 8765):
        await asyncio.Future()  # run forever

def read_serial():
    received_data = device.read()
    time.sleep(0.03)
    data_left = device.inWaiting()
    received_data += device.read(data_left)
    return received_data

if platform == "linux" or platform == "linux2":
    #easygui.msgbox("Linucks :-)", title="Platform")
    device_id = "/dev/ttyACM0"

elif platform == "darwin":
    #easygui.msgbox("MACS NOT SUPPORTED >:)", title="Platform")
    sys.exit(1)

elif platform == "win32":
    #easygui.msgbox("windoze", title="Platform")
    device_id = "COM0"

asyncio.run(start_server())
