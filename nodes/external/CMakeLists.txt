# Set minimum required version of CMake
cmake_minimum_required(VERSION 3.12)

message(STATUS ${NODE})
if(NODE)
	if(NOT EXISTS ${CMAKE_CURRENT_LIST_DIR}/nodes/${NODE}.cc)
		message(FATAL_ERROR "No such node")
	endif()
else()
	message(FATAL_ERROR "No node specified. Run cmake with -DNODE=nodename")
endif()

# Include build functions from Pico SDK
set(PICO_BOARD pico_w)
set(CMAKE_BUILD_TYPE Debug)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

include($ENV{PICO_SDK_PATH}/external/pico_sdk_import.cmake)

# Set name of project (as PROJECT_NAME) and C/C++ standards
project(node C CXX ASM)
set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 11)

# Creates a pico-sdk subdirectory in our project for the libraries
pico_sdk_init()

# Tell CMake where to find the executable source file
FILE(GLOB Sources *.cc)
add_executable(${PROJECT_NAME} 
	${Sources}
)

# Create map/bin/hex/uf2 files
pico_add_extra_outputs(${PROJECT_NAME})

target_include_directories(${PROJECT_NAME} PRIVATE
	${CMAKE_CURRENT_LIST_DIR}
	${CMAKE_CURRENT_LIST_DIR}/.. # for our common lwipopts
)

# Link to pico_stdlib (gpio, time, etc. functions)
target_link_libraries(${PROJECT_NAME} 
    pico_stdlib
	pico_cyw43_arch_lwip_poll
)

# Enable usb output, disable uart output
pico_enable_stdio_usb(${PROJECT_NAME} 1)
pico_enable_stdio_uart(${PROJECT_NAME} 0)
