#include "NodeBase.hh"

#include <cctype>

NodeBase::NodeBase(const char* nodeType, const char* name, bool isSensor, unsigned delay)
	: type(nodeType), name(name), ID(std::string(nodeType) + ":" + name), delay(delay), isSensor(isSensor)
{
    stdio_init_all();

    if(cyw43_arch_init())
        printf("failed to initialise\n");
}

void NodeBase::handleMessage(const std::string& message)
{
	printf("Handle '%s'\n", message.c_str());

	auto p = split(message, ' ');
	if(p.empty()) return;

	size_t instance = atoi(p[0].c_str());
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
					", instance: " + std::to_string(instance) + "}";

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

	std::string json = std::string("{ result: ") + (active ? "true" : "false") + ", instance: " + std::to_string(instance) + "}";
	respond(json);
}

void NodeBase::respondFormat()
{
	std::string formatJSON;
	for(size_t i = 0; i < paramFormat.count(); i++)
		formatJSON += std::string(paramFormat.key(i)) + ": " + paramFormat[i].toJSON() + ",";

	formatJSON.pop_back();
	std::string json =	"{format: {" + formatJSON + "}, sensor: " + (isSensor ? "true" : "false") + "id: " + ID + "}";
	respond(json);
}

void NodeBase::respond(std::string& message)
{
	tcp.sendMessage(message);
}

void NodeBase::run()
{
	sleep_ms(3000);
	printf("run\n");

	cyw43_arch_enable_sta_mode();

	cyw43_arch_gpio_put(CYW43_WL_GPIO_LED_PIN, 1);
	tcp.connect();
	cyw43_arch_gpio_put(CYW43_WL_GPIO_LED_PIN, 0);

	tcp.onMessage = [this](const std::string& message)
	{
		handleMessage(message);
	};

	setParamFormat(paramFormat);
	defaultReady = paramFormat.count() == 0;

	instances.push_back(Instance(defaultReady));
	respondFormat();

	while(true)
	{
		tcp.update();

		if(!isSensor)
		{
			sleep_ms(1);
			continue;
		}

		bool shouldSleep = false;

		for(size_t i = 0; i < instances.size(); i++)
		{
			if(instances[i].ready)
			{
				bool result = check(instances[i].params);

				if(result != instances[i].lastResult)
				{
					std::string json = std::string("{ result: ") + (result ? "true" : "false") + ", instance: " + std::to_string(i) + "}";
					respond(json);
				}

				instances[i].lastResult = result;
				shouldSleep = true;
			}
		}

		if(shouldSleep)
			sleep_ms(delay);

		else sleep_ms(1);
	}
}
