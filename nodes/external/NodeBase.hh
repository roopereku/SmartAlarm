#ifndef NODE_BASE_HH
#define NODE_BASE_HH

#include "ParameterInfo.hh"
#include "ParameterList.hh"
#include "TCPClient.hh"
#include "Status.hh"
#include "Config.hh"
#include "Util.hh"

#include "pico/stdlib.h"

#include <unordered_map>
#include <string>
#include <vector>

typedef std::unordered_map <std::string, std::string> Params;

enum class NodeContext
{
	Sensor,
	Action
};

class NodeBase
{
public:
	NodeBase(const char* nodeType, NodeContext context, unsigned delay = 1000);

	virtual bool check(Params& params) { return true; }
	virtual void deactivate(Params& params) {}
	virtual void activate(Params& params) {}

	virtual void setParamFormat(ParameterList& params) {}
	virtual Status validateParams(Params& params) { return Status(true); }

	void run();

private:
	struct Instance
	{
		Instance(bool ready, size_t num) : ready(ready), num(num)
		{
		}

		Params params;
		bool ready = false;

		int lastResult = -1;
		bool activated = false;

		size_t num;
	};

	void handleMessage(const std::string& message);
	void handleActivate(Instance& instance, bool active);

	Instance& findInstance(size_t num);

	void respondFormat();
	void respond(std::string& message);

	Config cfg;
	TCPClient tcp;

	std::string type;
	std::string name;
	std::string ID;

	ParameterList paramFormat;
	std::vector <Instance> instances;

	NodeContext context;
	bool defaultReady;
	unsigned delay;

protected:
	const char* icon = "fa-solid fa-question";
};

#endif
