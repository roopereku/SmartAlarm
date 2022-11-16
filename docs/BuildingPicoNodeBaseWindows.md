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

## Setup CLion
Clone SmartAlarm and open terminal tab in CLion
- `cd nodes/external`
- `git submodule update --init`
- `cd pico-sdk`
- `git submodule update --init`
