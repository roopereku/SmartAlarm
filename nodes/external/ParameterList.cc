#include "ParameterList.hh"

#include <cstdio>

ParameterInfo& ParameterList::operator[](const std::string& name)
{
	for(auto& p : params)
	{
		if(name == p.first)
		{
			printf("find '%s'\n", p.first.c_str());
			return p.second;
		}
	}

	printf("add '%s'\n", name.c_str());
	params.push_back(std::make_pair(name, ParameterInfo()));
	return params.back().second;
}
