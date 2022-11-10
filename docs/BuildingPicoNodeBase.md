# Building NodeBase for Pico

Clone SmartAlarm and install picotool
* `cd SmartAlarm/nodes/external`
* `git submodule update --init`
* `cd pico-sdk`
* `git submodule update --init`
* `cd ..`
* `export PICO_SDK_PATH=$(pwd)/picosdk`
* `mkdir build`
* `cd build`
* `cmake .. -DNODE=nodename` (nodename could be NodeTest) \
* `make`
* `sudo picotool load *.uf2 -x -v`

## Switching to another node
In build directory
* `rm CMakeCache.txt`
* `make clean`

Run the last 3 steps again but give some other node name to cmake
