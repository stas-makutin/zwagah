import tornado.ioloop
import tornado.web
import threading
import logging
import config
import security
import webapi
    
class Application:
    _svc_name_ = "zwagah"
    _svc_display_name_ = "ZWaGaH Service"
    _svc_description_ = "Z-Wave HTTP Gateway service."
    _svc_log_backup_count_ = 3
    _svc_log_max_bytes_ = 10 * 1024 * 1024
    
    def __init__(self, logger, logFile):
        self._logger = logger
        self._logFile = logFile
        self._config = None
        self._authentication = security.Authentication()
        self._runEvent = threading.Event()
        
        self._runEvent.set()
        
        tornado.ioloop.IOLoop.configure('tornado.platform.asyncio.AsyncIOLoop')
        tornado.log.access_log.setLevel("ERROR")
    
    def run(self):
        while self._runEvent.is_set():
            self._config = config.ConfigManager.load(self._logger)
            self._tornado = tornado.web.Application(
                [
                    (r"/api/(.*)", webapi.HttpApiHandler, dict(app=self)),
                    (r"/api/(.*)", webapi.WebSocketApiHandler, dict(app=self)),
                    (r"/app/(.*)", tornado.web.StaticFileHandler, {"path" : config.ConfigManager.getAppWebDir()}),
                    (r"/(.*)", tornado.web.StaticFileHandler, {"path" : config.ConfigManager.getWebDir(self._config), "default_filename" : "index.htm"})
                ]
            )
            self._httpServer = self._tornado.listen(self._config.httpPort)
            self._logger.info(f"HTTP server started at port {self._config.httpPort}")
            tornado.ioloop.IOLoop.current().start()
            self._httpServer.stop()

    def _stop(self):
        tornado.ioloop.IOLoop.current().add_callback(lambda: tornado.ioloop.IOLoop.current().stop())

    def stop(self):
        self._runEvent.clear()
        self._stop()
        
    def restart(self):
        self._stop()
