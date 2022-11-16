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

## Setup SmartAlarm repository and Building and Flashing with CLion
Clone SmartAlarm and open terminal tab in CLion. If you clone with CLion it will do Setup SmartAlarm repository steps for you. It is still recommended to execute these steps to makse sure pico-sdk is ready to go.

### Setup SmartAlarm repository
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
- Extract ..
- In CLion click `Run-->Edit Configurations..-->Click +-->OpenOCD Download & Run->`
- Set node as Target and Executable binary
- 
