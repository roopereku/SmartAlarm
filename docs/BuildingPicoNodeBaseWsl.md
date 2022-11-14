# Build Pico Node with WSL

Install WSL
* Open Settings>System>About and check that OS build is 22000 or higher
* Check that Virtal Machine Platform optional feature is enabled
* Open Terminal
* `wsl -install`
* Open Microsoft store
* Install Windows Subsystem for Linux Preview
* Install Ubuntu (The app without version number is fine)

Ubuntu app
* Start Ubuntu app and create user
* `sudo apt update'
* `sudo apt full-upgrade`
* `sudo apt install git`
* `sudo apt install build-essential`
* `sudo apt install cmake gcc-arm-none-eabi libnewlib-arm-none-eabi libstdc++-arm-none-eabi-newlib`

Install pico-sdk and build node
* `cd ~/`
* `mkdir pico`
* `cd pico`
* `git clone -b master https://github.com/raspberrypi/pico-sdk.git`
* `cd pico-sdk`
* `git submodule update --init`
* `cd ..`
* `export PICO_SDK_PATH=~/pico/pico-sdk`
* `mkdir build`
* `cd build`
* `cmake ~/SmartAlarm/nodes/external/ -DNODE=nodename` (nodename could be NodeTest, make sure your path is correct)
* `make`

Flash Pico Node
* Connect the pico to usb while pressing the button down
* Navigate in windows file explorer to `\\wsl.localhost\Ubuntu\home\ussak\pico\build`
* Drag and drop node.uf2 to Pico mass storage that should be visible in the file explorer

## Switching to another node
In build directory
* `rm CMakeCache.txt`
* `make clean`
* `cmake ~/SmartAlarm/nodes/external/ -DNODE=nodename` (nodename could be NodeTest, make sure your path is correct)
* `make`
