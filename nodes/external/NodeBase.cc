#include "NodeBase.hh"

NodeBase::NodeBase(const char* nodeType, const char* name, unsigned delay, bool isSensor)
	: type(nodeType), name(name), ID(std::string(nodeType) + ":" + name), delay(delay), isSensor(isSensor)
{
}

void NodeBase::handleMessage(const std::string& message)
{
	auto p = split(message, ' ');
	if(p.empty()) return;

	auto msg_id = split(p[0], ':');
	if(msg_id.size() != 3) return;

	//	Ignore messages not meant for this node
	if(msg_id[0] != type || msg_id[1] != name)
		return;

	//	Do nothing if only msg_id is present
	if(p.size() <= 1)
		return;

	size_t instance = atoi(msg_id[2].c_str());
	printf("Instance %lu\n", instance);

	//	If there's not enough instances, add more
	if(instance >= instances.size())
		instances.resize(instance);

	bool valid = true;
	const char* reason = "";

	for(size_t i = 1; i < p.size(); i++)
	{
		printf("param '%s'\n", p[i].c_str());
	}

	if(p[1] == "info")
	{
		respondFormat();
		return;
	}
}

void NodeBase::respondFormat()
{
	std::string formatJSON;
	for(auto& entry : paramFormat)
		formatJSON += entry.first + ": " + entry.second.toJSON() + ",";

	formatJSON.pop_back();
	std::string json =	"{valid: true, reason: \"\", format: {" + formatJSON + "}, sensor: " + (isSensor ? "true" : "false") + ", from: \"" + ID + "\"}";

	respond(json);
}

void NodeBase::respond(std::string& message)
{
	printf("respond '%s'\n", message.c_str());
}

void NodeBase::run()
{
	setParamFormat(paramFormat);
}
