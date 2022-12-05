#include "NodeManager.hh"
#include "pico/time.h"

class NodeGPIO : public NodeBase {
public:
    NodeGPIO(const char* type, NodeContext ctx) : NodeBase(type, ctx)
	{
		pinDir = ctx == NodeContext::Sensor ? GPIO_IN : GPIO_OUT;
	}

    virtual void setParamFormat(ParameterList& params) override
	{
        params["which"].strictHints = true;
        params["state"].strictHints = true;

        params["which"].addHint("2", "GP2");
        params["which"].addHint("3", "GP3");
        params["which"].addHint("4", "GP4");
        params["which"].addHint("5", "GP5");
        params["which"].addHint("6", "GP6");
        params["which"].addHint("7", "GP7");
        params["which"].addHint("8", "GP8");
        params["which"].addHint("9", "GP9");
        params["which"].addHint("10", "GP10");
        params["which"].addHint("11", "GP11");
        params["which"].addHint("12", "GP12");
        params["which"].addHint("13", "GP13");
        params["which"].addHint("14", "GP14");
        params["which"].addHint("15", "GP15");
        params["which"].addHint("16", "GP16");
        params["which"].addHint("17", "GP17");
        params["which"].addHint("18", "GP18");
        params["which"].addHint("19", "GP19");
        params["which"].addHint("20", "GP20");
        params["which"].addHint("21", "GP21");
        params["which"].addHint("22", "GP22");
        params["which"].addHint("23", "GP23");
        params["which"].addHint("24", "GP24");
        params["which"].addHint("25", "GP25");
        params["which"].addHint("26", "GP26");
        params["which"].addHint("27", "GP27");
        params["which"].addHint("28", "GP28");

        params["state"].addHint("1", "High");
        params["state"].addHint("0", "Low");
    }

    Status validateParams(Params& params) override
	{
		int pin = atoi(params["which"].c_str());
		gpio_set_dir(pin, pinDir);
        return Status(true);
    }

private:
	int pinDir;
};

class NodeGPIOIn : public NodeGPIO
{
public:
	NodeGPIOIn() : NodeGPIO("GPIO In", NodeContext::Sensor)
	{
	}

    void setParamFormat(ParameterList& params) override
	{
		NodeGPIO::setParamFormat(params);

        params["which"].description = "Which GPIO pin to check";
        params["state"].description = "Which GPIO state to check?";
	}

    bool check(Params& params) override
	{
		bool high = atoi(params["state"].c_str());
		int pin = atoi(params["which"].c_str());

		return gpio_get(pin) == high;
	}
};

class NodeGPIOOut : public NodeGPIO
{
public:
	NodeGPIOOut() : NodeGPIO("GPIO Out", NodeContext::Action)
	{
	}

    void setParamFormat(ParameterList& params) override
	{
		NodeGPIO::setParamFormat(params);

        params["which"].description = "Which GPIO pin to set";
        params["state"].description = "Which state to set the GPIO pin to";
	}

    void activate(Params& params) override
	{
        gpio_put(atoi(params["which"].c_str()), atoi(params["state"].c_str()));

	}

    void deactivate(Params& params) override
	{
        gpio_put(atoi(params["which"].c_str()), 0);
    }
};


int main()
{
	for(int i = 2; i <= 28; i++)
		gpio_init(i);

	sleep_ms(3000);

	Nodes::add <NodeGPIOIn> ();
	Nodes::add <NodeGPIOOut> ();

	Nodes::run();
}
