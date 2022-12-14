#include "NodeBase.hh"

#include <cctype>

NodeBase::NodeBase(const char* nodeType, NodeContext context)
	: type(nodeType), context(context), delay(delay)
{
}

void NodeBase::handleMessage(const std::string& message)
{
	printf("Handle '%s'\n", message.c_str());

	auto p = split(message, '\r');
	if(p.empty()) return;

	for(size_t i = 1; i < p.size(); i++)
		printf("param '%s'\n", p[i].c_str());

	size_t instanceNumber = atoi(p[0].c_str());
	printf("Instance %lu\n", instanceNumber);

	bool valid = true;
	std::string reason;

	//	Ignore empty messages
	if(p.size() - 1 == 0)
		return;

	if(p[1] == "instance")
	{
		instances.emplace_back(defaultReady, instanceNumber);
		Instance& instance = instances.back();

		//	TODO Control not yet implemented
		//self.__disable_control(instance)
		printf("Added instance %lu, really %lu", instance.num, instances.size());
		return;
	}

	Instance& instance = findInstance(instanceNumber);

	if(p[1] == "removeinstance")
	{
		for(size_t i = 0; i < instances.size(); i++)
		{
			if(instances[i].num == instance.num)
			{
				printf("Remove instance %lu\n", instance.num);
				instances.erase(instances.begin() + i);
				break;
			}
		}
	}

	else if(p[1] == "activate" && context != NodeContext::Sensor)
		handleActivate(instance, true);

	else if(p[1] == "deactivate" && context != NodeContext::Sensor)
		handleActivate(instance, false);

	//	Does the parameter count match
	else if(p.size() - 1 != paramFormat.count())
	{
		reason = "Number of parameters doesn't match the format";
		valid = false;
	}

	else
	{
		//	If this node isn't a sensor, call deactivate with the old parameters
		if(context != NodeContext::Sensor)
			handleActivate(instance, false);

		for(size_t i = 1; i < p.size(); i++)
		{
			printf("Validate '%s'\n", paramFormat.key(i - 1).c_str());
			ParameterInfo& param = paramFormat[i - 1];

			//	FIXME Make sure that there are hints
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

			instance.params[paramFormat.key(i - 1)] = p[i];
		}

		if(valid)
		{
			Status s = validateParams(instance.params);
			instance.ready = true;

			if(!s.success)
			{
				valid = s.success;
				reason = s.message;
			}
		}

		if(!valid)
		{
			instance.params.clear();
			instance.ready = false;
			instance.lastResult = -1;
		}
	}

	std::string json = std::string("{\"valid\": ") + (valid ? "true" : "false") + ", \"reason\": \"" + reason +
					"\", \"instance\": " + std::to_string(instance.num) + "}";

	respond(json);
}

void NodeBase::handleActivate(Instance& instance, bool active)
{
	//	If the node is already in the given state, do nothing
	if(instance.activated == active)
		return;

	//	Do nothing if parameters aren't set
	if(!instance.ready)
		return;

	instance.activated = active;

	printf("activate %d instance %lu\n", active, instance.num);
	if(active) activate(instance.params);
	else deactivate(instance.params);

	std::string json = std::string("{\"result\": ") + (active ? "true" : "false") + ", \"instance\": " + std::to_string(instance.num) + "}";
	respond(json);
}

void NodeBase::respondFormat()
{
	std::string formatJSON;
	for(size_t i = 0; i < paramFormat.count(); i++)
		formatJSON += '"' + paramFormat.key(i) + "\": " + paramFormat[i].toJSON() + ",";

	if(formatJSON.size() > 0)
		formatJSON.pop_back();

	std::string contextString;

	switch(context)
	{
		case NodeContext::Sensor: contextString = "sensor"; break;
		case NodeContext::Action: contextString = "action"; break;
	}

	std::string json =	"{\"format\": {" + formatJSON + "}, \"context\": \"" + contextString + "\", \"id\": \"" + ID + "\", \"icon\": \"" + icon + "\", \"name\": \"" + name + "\", \"type\": \"" + type + "\"}";
	respond(json);
}

void NodeBase::respond(std::string& message)
{
	tcp.sendMessage(message + '\n');
}

NodeBase::Instance& NodeBase::findInstance(size_t num)
{
	for(auto& i : instances)
	{
		if(i.num == num)
			return i;
	}

	printf("WARNING: Instance %lu not found\n", num);
	return instances.front();
}

void NodeBase::connect(Config& cfg)
{
	while(!tcp.connect(cfg));

	tcp.onMessage = [this](const std::string& message)
	{
		auto p = split(message, '\n');

		for(auto& msg : p)
		{
			if(!msg.empty())
				handleMessage(msg);
		}
	};

	name = cfg.get("name");
	ID = type + ":" + name;

	setParamFormat(paramFormat);
	defaultReady = paramFormat.count() == 0;
	respondFormat();
}

void NodeBase::update()
{
	if(context == NodeContext::Action)
		return;

	for(size_t i = 0; i < instances.size(); i++)
	{
		if(instances[i].ready)
		{
			bool result = check(instances[i].params);

			if(result != instances[i].lastResult)
			{
				std::string json = std::string("{\"result\": ") + (result ? "true" : "false") + ", \"instance\": " + std::to_string(instances[i].num) + "}";
				respond(json);
			}

			instances[i].lastResult = result;
		}
	}
}
