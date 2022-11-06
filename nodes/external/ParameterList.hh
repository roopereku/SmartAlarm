#ifndef PARAMETER_LIST_HH
#define PARAMETER_LIST_HH

#include "ParameterInfo.hh"

#include <string>
#include <vector>

class ParameterList
{
public:
	ParameterInfo& operator[](const std::string& name);
	ParameterInfo& operator[](size_t index) { return params[index].second; }

	const std::string& key(size_t index) { return params[index].first; }
	size_t count() { return params.size(); }

private:
	std::vector <std::pair <std::string, ParameterInfo>> params;
};

#endif
