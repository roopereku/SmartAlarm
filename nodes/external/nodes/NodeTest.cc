#include "NodeBase.hh"

class NodeTest : public NodeBase
{
public:
	NodeTest(const char* name) : NodeBase("blink", name, NodeContext::Action, 0)
	{
		for(int i = 2; i <= 4; i++)
		{
			gpio_init(i);
			gpio_set_dir(i, GPIO_OUT);
		}
	}

	void activate(Params& params) override
	{
		printf("Activate\n");
        gpio_put(atoi(params["which"].c_str()), 1);
	}

	void deactivate(Params& params) override
	{
		printf("Deactivate\n");
        gpio_put(atoi(params["which"].c_str()), 0);
	}

	void setParamFormat(ParameterList& params) override
	{
		params["which"].strictHints = true;

		params["which"].addHint("2", "Red");
		params["which"].addHint("3", "Green");
		params["which"].addHint("4", "Blue");
	}

	Status validateParams(Params& params) override
	{
		return Status(true);
	}
};

int main()
{
	NodeTest node("1");
	node.run();
}
