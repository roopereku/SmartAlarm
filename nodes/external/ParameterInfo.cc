#include "ParameterInfo.hh"

void ParameterInfo::addHint(const char* name, const char* description)
{
	hints.emplace_back(name, description);
}

std::string ParameterInfo::toJSON()
{
	std::string json =
		"{default: \"" + defaultValue + "\", type: \"" + type +
		"\", strict: " + (strictHints ? "true" : "false") + ", hint: {";

	for(size_t i = 0; i < hints.size(); i++)
	{
		json += hints[i].first + ": \"" + hints[i].second + '"';

		if(i + 1 < hints.size())
			json += ", ";
	}

	return json + '}';
}
