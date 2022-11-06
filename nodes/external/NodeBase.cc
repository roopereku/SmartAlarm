#include "NodeBase.hh"

#include <cctype>

NodeBase::NodeBase(const char* nodeType, const char* name, bool isSensor, unsigned delay)
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
		instances.resize(instance, Instance(defaultReady));

	bool valid = true;
	std::string reason;

	for(size_t i = 1; i < p.size(); i++)
		printf("param '%s'\n", p[i].c_str());

	//	Ignore empty messages
	if(p.size() - 1 == 0)
		return;

	else if(p[1] == "activate" && !isSensor)
		handleActivate(instance, true);

	else if(p[1] == "deactivate" && !isSensor)
		handleActivate(instance, true);

	//	Does the parameter count match
	else if(p.size() - 1 != paramFormat.count())
	{
		reason = "Number of parameters doesn't match the format";
		valid = false;
	}

	else
	{
		//	If this node isn't a sensor, call deactivate with the old parameters
		if(!isSensor) handleActivate(instance, false);

		for(size_t i = 1; i < p.size(); i++)
		{
			printf("Validate '%s'\n", paramFormat.key(i - 1).c_str());
			ParameterInfo& param = paramFormat[i - 1];

			printf("s %d\n", param.strictHints);

			//	TODO Implement type checking

			if(param.strictHints)
			{
				printf("'%s' strict\n", paramFormat.key(i - 1).c_str());
				size_t matches = 0;

				for(auto& h : param.hints)
					matches += p[i] == h.first;

				if(matches == 0)
				{
					valid = false;
					reason = std::string("Parameter ") + paramFormat.key(i - 1) + " doesn't match hints";
					break;
				}
			}

			instances[instance].params[paramFormat.key(i - 1)] = p[i];
		}

		if(valid)
		{
			Status s = validateParams(instances[instance].params);
			instances[instance].ready = true;

			if(!s.success)
			{
				valid = s.success;
				reason = s.message;
			}
		}

		if(!valid)
		{
			instances[instance].params.clear();
			instances[instance].ready = false;
			instances[instance].lastResult = false;
		}
	}

	std::string json = std::string("{valid: ") + (valid ? "true" : "false") + ", reason: \"" + reason + "\"" + 
					", instance: " + std::to_string(instance) + ", from: \"" + ID + "\"}";

	respond(json);
}

void NodeBase::handleActivate(size_t instance, bool active)
{
	//	If the node is already in the given state, do nothing
	if(instances[instance].activated == active)
		return;

	//	Do nothing if parameters aren't set
	if(!instances[instance].ready)
		return;

	instances[instance].activated = active;
	if(active) activate(instances[instance].params);
	else deactivate(instances[instance].params);

	std::string json = std::string("{ result: ") + (active ? "true" : "false") +
					", instance: " + std::to_string(instance) + ", from: \"" + ID + "\"}";

	respond(json);
}

void NodeBase::respondFormat()
{
	std::string formatJSON;
	for(size_t i = 0; i < paramFormat.count(); i++)
		formatJSON += std::string(paramFormat.key(i)) + ": " + paramFormat[i].toJSON() + ",";

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
	defaultReady = paramFormat.count() == 0;

	instances.push_back(Instance(defaultReady));
	respondFormat();
}
