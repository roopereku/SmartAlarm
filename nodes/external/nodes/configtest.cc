#include <pico/stdlib.h>
#include "pico/cyw43_arch.h"

#include <Util.hh>

int main()
{
    stdio_init_all();
    cyw43_arch_init();

	char buf[512];
	size_t index = 0;

	std::string config = "ssid\rnot set\rpass\rnot set\rip\r127.0.0.1\rname\rtestname";
	bool foundStart = false;

	while(true)
	{
		char c = getchar();

		if(c == '\n')
			printf("%s", config.c_str());

		else
		{
			if(!foundStart)
			{
				if(c == '\b')
				{
					foundStart = true;
					index = 0;
				}
			}

			else
			{
				if(c == '\b')
				{
					config = std::string(buf, index);
					foundStart = false;

					continue;
				}

				buf[index] = c;
				index++;
			}
		}
	}
}
