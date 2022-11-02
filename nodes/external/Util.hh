#ifndef UTIL_HH
#define UTIL_HH

#include "ParameterInfo.hh"

#include <string>
#include <unordered_map>

typedef std::unordered_map <std::string, std::string> Params;
typedef std::unordered_map <std::string, ParameterInfo> ParamInfo;

std::vector <std::string> split(const std::string& str, char delim);

#endif
