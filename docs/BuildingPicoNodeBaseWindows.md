# Building NodeBase for Pico with CLion on Window 11
Setup tools to build and flash Raspberry Pi Pico W with CLion IDE. This guide partially follows instructions from Raspberry doc "Getting started with Raspberry Pi Pico". If you want to use different IDE follow instructions from the Raspberry Getting started doc.

## Setup tools for Windows 11 development
- Install Git
- Install Build Tools for Visual Studio 2022
  - Select Desktop development with C++ and install
- Install CMake
  -  Add to the system PATH for all users
- Install JetBrains CLion
  - Check Update PATH Variable option
  - Reboot after installation
- Install Arm GNU Toolchain
  - You need the filename ending with -arm-none-eabi.exe
  - Check Add path to environment variable
  - Check Add registry information

## Setup SmartAlarm repository and Build tools

### Setup SmartAlarm repository
Clone SmartAlarm and open terminal tab in CLion. Do not use CLion's integrated git clone functionality. If you do it will clone unnecessary files and further git pull/push will take forever. Instead clone the repository manually and execute the following steps.
- `cd nodes/external`
- `git submodule update --init`
- `cd pico-sdk`
- `git submodule update --init`

### Setup Build
- Open `File-->Settings-->Build, Execution, Deployment-->CMake`
- In CMake options write `-DNODE=nodename` where nodename is for example NodeTest
  - Note you need to change this every time you want to build different node 
- In Environment write `PICO_SDK_PATH=C:\..\SmartAlarm\nodes\external\pico-sdk` where .. is rest of the installation path
- Click Apply and OK
- Click `File-->Reload CMake Project`
  - First time you may need to right click CMakeLists.txt and Load it throught there
- If CMake terminal outputs `[Finished]` everything is working ok
- Now you can build by clicking the hammer button or hit `CTRL+F9`

## Setup Flash (two different ways)
Here are two different instructions how to flash the pico. The second way provides also debugging capabilities. However, debugging with pico's another core is limited and will not work if the program uses usb.

### Flash (easy way)
- Hold BOOTSEL button while plugging in the pico
  - Pico should now show up as mass storage device 
- From cmake-build-debug folder copy node.uf2 file to the pico
- Pico is now flashed

### Flash (hard way) and Debug
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
  - The file is in SmartAlarm/docs/
- Set Download to Always and Reset to Init
- Click Apply and OK

### Setup Pico for debugging
- Plug-in Pico usb while pressing BOOTSEL button
- From <https://github.com/majbthrd/pico-debug/releases> download pico-debug-gimmecache.uf2
- Copy the downloaded file to Pico
  - Pico should show as mass storage device in the file explorer 
- Now you can click Debug button to build, flash and debug
