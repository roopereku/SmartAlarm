#include "NodeBase.hh"

#include <pico/stdlib.h>
#include <hardware/gpio.h>
#include <hardware/adc.h>

class NodeLight : public NodeBase
{
public:
	NodeLight(const char* name) : NodeBase("light", name, NodeContext::Sensor, 100)
	{
		adc_init();
		adc_gpio_init(28);
		adc_select_input(2);
	}

	bool check(Params& params) override
	{
		const float conversion_factor = 3.3f / (1 << 12);
		uint16_t result = adc_read();

		//	FIXME 26 -> 2600. The sensor gives values below this but probably should be 12-bit max value
		const uint16_t multiplier = 26;
		const uint16_t paramReal = atoi(params["threshold"].c_str()) * multiplier;

		auto& cmp = params["comparison"];
		return cmp == ">" ? result >= paramReal : result < paramReal;
	}

	void setParamFormat(ParameterList& params) override
	{
		params["threshold"].type = "range";

		params["comparison"].strictHints = true;
		params["comparison"].addHint("<", "Below the threshold");
		params["comparison"].addHint(">", "Above the threshold");
	}

	Status validateParams(Params& params) override
	{
		return Status(true);
	}
};

int main()
{
	NodeLight node("light1");
	node.run();
}