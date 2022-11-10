#ifdef TEST

#include "NodeBase.hh"

class NodeTest : public NodeBase
{
public:
	NodeTest(const char* name) : NodeBase("test", name, true, 0)
	{
	}

	bool check(Params& params) override
	{
		return params["param1"] == "1";
	}

	void setParamFormat(ParameterList& params) override
	{
		params["param1"];
		params["param3"];
		params["param2"];

		params[0].type = "int";
		//params[0].strictHints = true;

		params[0].addHint("hint1", "test hint 1");
		params[0].addHint("hint2", "test hint 2");
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

#endif
