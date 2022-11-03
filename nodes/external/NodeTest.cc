#include "NodeBase.hh"

class NodeTest : public NodeBase
{
public:
	NodeTest(const char* name) : NodeBase("test", name, 1, true)
	{
	}

	bool check(Params& params) override
	{
		return params["param1"] == "1";
	}

	void setParamFormat(ParamInfo& params) override
	{
		auto& param1 = params["param1"];
		auto& param3 = params["param3"];
		auto& param2 = params["param2"];

		param1.type = "int";
		param1.strictHints = true;

		param1.addHint("hint1", "test hint 1");
		param1.addHint("hint2", "test hint 2");
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

	node.handleMessage("test:1:0 paramsformat");
}
