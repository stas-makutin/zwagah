import tornado.web
import logging
import config
import application

class WebHandler(tornado.web.RequestHandler):
    def get(self, query):
        if self.get_argument("restart", None) is not None:
            query = "!restart!"
#             self.redirect("/config", True)
#             application.Application.restart()
#             return
        self.write("Config page : " + query)
