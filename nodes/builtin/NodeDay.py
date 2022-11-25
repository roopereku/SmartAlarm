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
                "description" : "Which day to compare",
                "strict" : True,
                "hint" : {
                    "0" : "monday",
                    "1" : "tuesday",
                    "2" : "wednesday",
                    "3" : "thursday",
                    "4" : "friday",
                    "5" : "saturday",
                    "6" : "sunday",
                }
            },

            "comparison" : {
                "description" : "How to compare",
                "strict" : True,
                "hint" : {
                    "equal" : "Same day",
                    "before" : "Before the day",
                    "after" : "After the day"
                }
            }
        }

node = node_day("day", 1, "sensor")
