from NodeBase import node_base
import time

class node_test(node_base):
    def check(self):
        now = time.gmtime(time.time())
        cmp = self.params["comparison"]
        trigger = False

        #if(cmp == "equal"): trigger = now.tm_min == pt.tm_min and now.tm_hour == pt.tm_hour
        #elif(cmp == "before"): trigger = now.tm_min < pt.tm_min and now.tm_hour < pt.tm_hour
        #elif(cmp == "after"): trigger = now.tm_min > pt.tm_min and now.tm_hour > pt.tm_hour

    def validate_params(self):
        try: self.pt = time.strptime(self.params["time"], "%H:%M")

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
