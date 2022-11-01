from NodeBase import node_base
import datetime

class node_day(node_base):
    def check(self, params):
        now = datetime.datetime.today().weekday()
        cmp = params["comparison"]
        day = params["index"]

        if(cmp == "before"): return now < day
        elif(cmp == "equal"): return now == day
        elif(cmp == "after"): return now > day

    def validate_params(self, params):
        params["index"] = int(params["day"])

    def get_params_format(self):
        return {
            "day" : {
                "type" : "string",
                "default" : "monday",
                "strict" : True,
                "hint" : {
                    "0" : "monday",
                    "1" : "tuesday",
                    "2" : "friday",
                    "3" : "wednesday",
                    "4" : "friday",
                    "5" : "saturday",
                    "6" : "sunday",
                }
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

node = node_day("day", 1)
