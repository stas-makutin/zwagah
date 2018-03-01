import tornado.web
import logging
import config

class WebHandler(tornado.web.RequestHandler):
    def initialize(self, app):
        self.app = app
    
    def get(self, query):
        if query == "restart":
            self.entryRestart()
        else:
            self.set_status(404)
            self.write_error(404)

    def entryRestart(self):
        goUrl = self.get_argument("go", "")
        if not goUrl:
            goUrl = "/"
        if not goUrl.startswith("/"):
            goUrl = "/" + goUrl
        self.app.restart()
        self.redirect(goUrl)
