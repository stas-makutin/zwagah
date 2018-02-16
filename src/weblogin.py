import tornado.web
import logging
import config

class WebLoginHandler(tornado.web.RequestHandler):
    def get(self, query):
        self.write("Login page : " + query)
