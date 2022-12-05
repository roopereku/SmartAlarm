#ifndef NODE_MANAGER_HH
#define NODE_MANAGER_HH

#include "NodeBase.hh"
#include "Config.hh"

#include <vector>
#include <memory>

class Nodes
{
public:
	template <typename T>
	static void add()
	{
		nodes.emplace_back(std::make_shared <T> ());
	}

	static void setDelay(unsigned ms);
	static void run();

private:
	static void connectNodes();

	static std::vector <std::shared_ptr <NodeBase>> nodes;
	static unsigned delay;
	static Config cfg;
};

#endif
