from NodeBase import node_base
import time

class node_time(node_base):
    def check(self, params):
        now = time.localtime(time.time())
        pt = params["real"]
        cmp = params["comparison"]

        print("now", now.tm_hour, now.tm_min)
        print("pt", pt.tm_hour, pt.tm_min)

        if(cmp == "<"):
            if(pt.tm_min > now.tm_min): return now.tm_hour <= pt.tm_hour
            else: return pt.tm_min < now.tm_min

        elif(cmp == ">"): return now.tm_hour >= pt.tm_hour and now.tm_min > pt.tm_min
        elif(cmp == "="): return now.tm_min == pt.tm_min and now.tm_hour == pt.tm_hour

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
                "description" : "Time to compare",
                "type" : "time",
                "default" : "12:00"
            },

            "comparison" : {
                "description" : "How to compare",
                "strict" : True,
                "hint" : {
                    "=" : "Equal",
                    "<" : "Before",
                    ">" : "After"
                }
            }
        }

node = node_time("time", 1, "sensor", "fa-regular fa-clock")
