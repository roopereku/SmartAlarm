#ifndef NODE_BASE_HH
#define NODE_BASE_HH

#include "ParameterInfo.hh"
#include "ParameterList.hh"
#include "TCPClient.hh"
#include "Status.hh"
#include "Util.hh"

#include "pico/stdlib.h"

#include <unordered_map>
#include <string>
#include <vector>

typedef std::unordered_map <std::string, std::string> Params;

class NodeBase
{
public:
	NodeBase(const char* nodeType, const char* name, bool isSensor, unsigned delay = 1000);

	virtual bool check(Params& params) { return true; }
	virtual void deactivate(Params& params) {}
	virtual void activate(Params& params) {}

	virtual void setParamFormat(ParameterList& params) {}
	virtual Status validateParams(Params& params) { return Status(true); }

	void run();

	void handleMessage(const std::string& message);
	void handleActivate(size_t instance, bool active);

private:
	struct Instance
	{
		Instance(bool ready) : ready(ready)
		{
		}

		Params params;
		bool ready = false;

		bool lastResult = false;
		bool activated = false;
	};

	void respondFormat();
	void respond(std::string& message);

	TCPClient tcp;

	std::string type;
	std::string name;
	std::string ID;

	ParameterList paramFormat;
	std::vector <Instance> instances;

	bool isSensor;
	bool defaultReady;

	unsigned delay;

protected:
};

#endif
