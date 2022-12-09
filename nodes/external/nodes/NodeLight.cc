#include "NodeManager.hh"

#include <pico/stdlib.h>
#include <hardware/gpio.h>
#include <hardware/adc.h>

class NodeLight : public NodeBase
{
public:
	NodeLight() : NodeBase("light", NodeContext::Sensor)
	{
		adc_init();
		adc_gpio_init(28);
		adc_select_input(2);

        icon = "fa-regular fa-lightbulb";
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
		params["threshold"].description = "What light level should be compared";

		params["threshold"].description = "How should the light level be compared";
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
	Nodes::add <NodeLight> ();
	Nodes::run();
}
