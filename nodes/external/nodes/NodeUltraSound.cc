#include "hardware/timer.h"
#include "pico/stdlib.h"
#include "hardware/gpio.h"
#include "pico/time.h"

#include "NodeManager.hh"

class NodeUltraSound : public NodeBase
{
public:
	NodeUltraSound() : NodeBase("ultrasound", NodeContext::Sensor)
	{
		gpio_init(2);
		gpio_set_dir(2, GPIO_OUT);

		gpio_init(3);
		gpio_set_dir(3, GPIO_IN);

        icon = "fa-solid fa-satellite-dish";
	}

	bool check(Params& params) override
	{
		gpio_put(2, 1);
		sleep_us(10);
		gpio_put(2, 0);

		while(gpio_get(3));
		auto start = time_us_32();

		while(!gpio_get(3));
		auto end = time_us_32();

		int duration = (end - start);
		int distance = (duration * 0.0343) / 2;

		if(distance > 400)
			return false;

		printf("distance %d\n", distance);
		char cmp = params["comparison"][0];
		char dist = atoi(params["distance"].c_str());

		switch(cmp)
		{
			case '=': return distance == dist;
			case '>': return distance > dist;
			case '<': return distance < dist;
		}

		//	Should never reach here
		return false;
	}

	void setParamFormat(ParameterList& params) override
	{
		params["distance"].type = "number";
		params["comparison"].strictHints = true;

		params["distance"].description = "What distance to compare (cm)";
		params["comparison"].description = "When to pass?";

		params["comparison"].addHint(">", "Further than");
		params["comparison"].addHint("<", "Closer than");
		params["comparison"].addHint("=", "Equal");
	}

	Status validateParams(Params& params) override
	{
		//	TODO report error when distance is > 400 or < 0
		return Status(true);
	}
};

int main()
{
	Nodes::add <NodeUltraSound> ();
	Nodes::run();
}
