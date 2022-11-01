from NodeBase import node_base
import time

class node_test(node_base):
    def check(self):
        #now = time.gmtime(time.time())

        now = time.localtime(time.time())
        pt = self.paramtime
        cmp = self.params["comparison"]

        # TODO Might want to check for seconds too
        if(cmp == "equal"): return now.tm_min == pt.tm_min and now.tm_hour == pt.tm_hour
        elif(cmp == "before"): return now.tm_min < pt.tm_min and now.tm_hour <= pt.tm_hour
        elif(cmp == "after"): return now.tm_min > pt.tm_min and now.tm_hour >= pt.tm_hour

    def validate_params(self):
        try: self.paramtime = time.strptime(self.params["time"], "%H:%M")

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

node = node_test("time", 1)
