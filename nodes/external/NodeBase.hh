#ifndef NODE_BASE_HH
#define NODE_BASE_HH

#include "ParameterInfo.hh"
#include "Status.hh"
#include "Util.hh"

#include <string>
#include <vector>

class NodeBase
{
public:
	NodeBase(const char* nodeType, const char* name, unsigned delay);

	virtual bool check(Params& params) = 0;
	virtual void setParamFormat(ParamInfo& params) = 0;
	virtual Status validateParams(Params& params) = 0;

	void run();
	void handleMessage(const std::string& message);

private:
	struct Instance
	{
		Params params;
		bool ready = false;
	};

	void respondFormat();
	void respond(std::string& message);

	std::string type;
	std::string name;
	std::string ID;

	ParamInfo paramFormat;
	std::vector <Instance> instances;

	unsigned delay;

protected:
};

#endif
