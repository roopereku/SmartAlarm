#include "Util.hh"

std::vector <std::string> split(const std::string& str, char delim)
{
	std::vector <std::string> result;

	size_t delimiterAt;
	size_t offset = 0;

	while((delimiterAt = str.find(delim, offset)) != std::string::npos)
	{
		result.emplace_back(str.begin() + offset, str.begin() + delimiterAt);
		offset = delimiterAt + 1;
	}

	result.emplace_back(str.begin() + offset, str.end());
	return result;
}
