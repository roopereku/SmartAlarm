#ifndef STATUS_HH
#define STATUS_HH

class Status
{
public:
	Status(bool success, const char* message = "")
		: success(success), message(message)
	{
	}

	const bool success;
	const char* message;
};

#endif
