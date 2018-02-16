import tornado.web
import logging
import config

class WebHandler(tornado.web.RequestHandler):
    def get(self, query):
        self.write("Config page : " + query)
