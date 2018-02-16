import tornado.ioloop
import tornado.web
import threading
import logging
import config
import webapi
import webconfig
    
class WebHandler(tornado.web.RequestHandler):
    def get(self, query):
        self.write("Hello, world : " + query)
  
class Application:
    _svc_name_ = "zwagah"
    _svc_display_name_ = "ZWaGaH Service"
    _svc_description_ = "Z-Wave HTTP Gateway service."
    _svc_log_backup_count_ = 3
    _svc_log_max_bytes_ = 10 * 1024 * 1024
    
    def __init__(self, logger, logFile):
        self._logger = logger
        self._logFile = logFile
        
        tornado.ioloop.IOLoop.configure('tornado.platform.asyncio.AsyncIOLoop')
        tornado.log.access_log.setLevel("ERROR")
        
        
        
        
    
    def run(self):
        self._config = config.ConfigManager.load(self._logger)
        self._app = tornado.web.Application(
            [
                (r"/api/(.*)", webapi.WebHandler),
                (r"/config(.*)", webconfig.WebHandler),
                (r"/(.*)", tornado.web.StaticFileHandler, {"path" : self._config.webDir if self._config.webDir else config.ConfigManager.getDefaultWebDir()})
            ]
        )
        self._app.listen(self._config.httpPort)
        self._logger.info("Test!")
        
        tornado.ioloop.IOLoop.current().start()

    def stop(self):
        tornado.ioloop.IOLoop.current().add_callback(lambda: tornado.ioloop.IOLoop.current().stop())
