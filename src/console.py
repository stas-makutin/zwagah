from sys import modules, executable
import traceback
import os.path
import errno
import signal
import logging
import threading
import application
import config

class AppThread(threading.Thread):
    def __init__(self, logger, logFile):
        threading.Thread.__init__(self)
        self.logger = logger
        self.logFile = logFile
        self.stoppedEvent = threading.Event()
        self.stoppedEvent.clear()
        self.app = None
        
    def run(self):
        self.logger.info(f"{application.Application._svc_name_} started")
        try:
            self.app = application.Application(self.logger, self.logFile)
            self.app.run()
        except:
            self.logger.error(f"{application.Application._svc_name_} failed:\n{traceback.format_exc()}", )
        self.logger.info(f"{application.Application._svc_name_} stopped")
        self.stoppedEvent.set()
    
    def stop(self):
        if self.app is not None:
            self.app.stop()

def signalHandler(signal_number, stack_frame):
    del signal_number, stack_frame
    global appThread
    appThread.stop()

def run():
    global appThread
    
    log = logging.getLogger(application.Application._svc_name_)
    log.propagate = False
    log.setLevel(logging.INFO)
    
    lf = logging.Formatter('%(asctime)s %(levelno)s %(message)s')
    
    lh = logging.StreamHandler()
    lh.setFormatter(lf)
    log.addHandler(lh)
    
    logDir = config.ConfigManager.getLogDir()
    try:
        os.makedirs(logDir)
    except OSError as err:
        if err.errno != errno.EEXIST:
            raise
    logFile = os.path.join(logDir, f"{application.Application._svc_name_}.log")
    lh = logging.FileHandler(filename=logFile, encoding="utf-8")
    lh.setFormatter(lf)
    log.addHandler(lh)
    
    appThread = AppThread(log, logFile)
    signal.signal(signal.SIGINT, signalHandler)
    if hasattr(signal, "SIGBREAK"):
        signal.signal(signal.SIGBREAK, signalHandler)
    appThread.start()
    while not appThread.stoppedEvent.wait(0.3): # unable to use just wait() method because on Windows it prevents from SIGBREAK signal handling
        pass
