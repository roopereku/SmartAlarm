from NodeBase import node_base
import time

class node_time(node_base):
    def check(self, params):
        #now = time.gmtime(time.time())

        now = time.localtime(time.time())
        pt = params["real"]
        cmp = params["comparison"]

        # TODO Might want to check for seconds too
        if(cmp == "equal"): return now.tm_min == pt.tm_min and now.tm_hour == pt.tm_hour
        elif(cmp == "before"): return now.tm_hour <= pt.tm_hour and now.tm_min < pt.tm_min
        elif(cmp == "after"): return now.tm_hour >= pt.tm_hour and now.tm_min > pt.tm_min

    def validate_params(self, params):
        try:
            params["real"] = time.strptime(params["time"], "%H:%M")

        except ValueError:
            return {
                "valid": False,
                "reason": "Invalid time"
            }

    def get_params_format(self):
        return {
            "time" : {
                "type" : "string",
                "default" : "12:00"
            },

            "comparison" : {
                "type" : "string",
                "strict" : True,
                "hint" : {
                    "equal" : "Trigger if the time matches",
                    "before" : "Trigger if the clock is less than specified",
                    "after" : "Trigger if the clock is more than specified"
                }
            }
        }

node = node_time("time", 1)
