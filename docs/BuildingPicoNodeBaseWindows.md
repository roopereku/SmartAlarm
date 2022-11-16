# Building NodeBase for Pico with CLion on Window 11
Setup tools to build and flash Raspberry Pi Pico W with CLion IDE. This guide partially follows instructions from Raspberry doc "Getting started with Raspberry Pi Pico". If you want to use different IDE follow instructions from the Raspberry Getting started doc.

## Setup tools for Windows 11 development
- Install Git
- Install CMake
  -  Add to the system PATH for all users
- Install JetBrains CLion
  - Check Update PATH Variable option
  - Reboot after installation
- Install Arm GNU Toolchain
  - You need the filename ending with -arm-none-eabi.exe
  - Check Add path to environment variable
  - Check Add registry information

## Setup SmartAlarm repository, Building and Flashing

### Setup SmartAlarm repository
Clone SmartAlarm and open terminal tab in CLion. If you clone with CLion it will do Setup SmartAlarm repository steps for you. It is still recommended to execute these steps to makse sure pico-sdk is ready to go.
- `cd nodes/external`
- `git submodule update --init`
- `cd pico-sdk`
- `git submodule update --init`

### Setup Build
- Open `File-->Settings-->Build, Execution, Deployment-->CMake`
- In CMake options write `-DNODE=nodename` where nodename is for example NodeTest
- In Environment write `PICO_SDK_PATH=C:\..\SmartAlarm\nodes\external\pico-sdk` where .. is rest of the installation path
- Click Apply and OK
- Click `File-->Reload CMake Project`
- If CMake terminal outputs `[Finished`] everything is working ok

### Setup Flash
- Download OpenOCD from <https://github.com/earlephilhower/pico-quick-toolchain/releases>
- Extract to for example `C:\Users\user`
- In CLion open settings and search OpenOCD
- Set location to openocd.exe
  - The path is `C:\..\openocd\bin\openocd.exe`
- Click Test to see everything is working ok
- Click Apply and OK
- In CLion click `Run-->Edit Configurations..-->Click +-->OpenOCD Download & Run`
- Set node as Target and Executable binary
- Set rp2040-core0.cfg as Board config file
  - The file is located in SmartAlarm/docs/
- Set Download to Always and Reset to Init
- Click Apply and OK
