#ifndef CONFIG_HH
#define CONFIG_HH

#include "hardware/flash.h"

#include <string>
#include <vector>

class Config
{
public:
	Config();

	const std::string& get(const char* name);
	void startReading();

private:
	void readFromFlash();
	void writeToFlash();

	char buf[256];
	std::vector <std::string> entries;

	const int start = PICO_FLASH_SIZE_BYTES - 256;
	const char* offset = (char*)(XIP_BASE + start);
};

#endif
