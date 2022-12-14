#ifndef PARAMETER_INFO_HH
#define PARAMETER_INFO_HH

#include <vector>
#include <string>

class ParameterInfo
{
public:
	ParameterInfo()
	{
	}

	std::string description = "No description";
	std::string type = "text";

	bool strictHints = false;

	void addHint(const char* name, const char* description);
	std::string toJSON();

	std::vector <std::pair <std::string, std::string>> hints;
};

#endif
