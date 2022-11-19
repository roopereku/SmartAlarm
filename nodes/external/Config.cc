#include "Config.hh"
#include "Util.hh"

#include "hardware/sync.h"
#include "pico/cyw43_arch.h"

#include <cstring>
#include <cstdio>

Config::Config()
{
	readFromFlash();
	entries = split(std::string(buf + 1), '\r');
}

const std::string& Config::get(const char* name)
{
	for(size_t i = 0; i < entries.size(); i += 2)
	{
		if(entries[i] == name)
			return entries[i + 1];
	}

	static std::string none;
	return none;
}

void Config::startReading()
{
	while(true)
	{
		char c = getchar();

		//	Receiving a newline means that we should send the current config
		if(c == '\n')
			printf("%s", buf + 1);

		//	If we receive a "backspace", start reading a new config
		else if(c == '\b')
		{
			//	The first byte of the config will be "Start of text"
			size_t index = 1;
			buf[0] = 0x02;

			//	While no "backspace" is detected, read in bytes
			while((c = getchar()) != '\b')
			{
				buf[index] = c;
				index++;
			}

			//	Terminate the string and write the config
			buf[index] = 0;
			writeToFlash();
		}
	}
}

void Config::writeToFlash()
{
	uint32_t ints = save_and_disable_interrupts();
	flash_range_erase(start, 256);
	flash_range_program(start, (uint8_t*)buf, 256);
	restore_interrupts(ints);
}

void Config::readFromFlash()
{
	/*	Because the flash memory might not contain a configuration, check if the first byte
	 *	of the flash where the config should be is "Start of text" which is the same as 0x02.
	 *	If no config is present, load in a default so that we have something */
	const char* target = (*offset == 0x02) ? offset : ".ssid\rnone\rpass\rnone\rip\rnone\rname\rnone";
	strncpy(buf, target, 256);
}
