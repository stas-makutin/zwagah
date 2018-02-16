from sys import modules, executable
import traceback
import os.path
import json
import logging

class Config:
    _default_httpPort = 8888
    
    def __init__(self):
        self.httpPort = self._default_httpPort
        self.webDir = ""
    
    @property
    def httpPort(self): return self._httpPort
    @httpPort.setter
    def httpPort(self, value): self._httpPort = value
    @staticmethod
    def httpPortValid(value): return value is not None and value > 0 and value < 65536
    
    @property
    def webDir(self): return self._webDir
    @webDir.setter
    def webDir(self, value): self._webDir = value
    @staticmethod
    def webDirValid(value): return isinstance(value, str)
    

class ConfigManager:
    _config_file_ = "zwagah"

    @classmethod
    def load(cls, logger):
        configFile = cls.getConfigFile()
        config = Config()
        if os.path.isfile(configFile):
            try:
                data = None
                with open(configFile, "r", encoding="utf-8") as cf:
                    data = json.load(cf)
                
                cls.testAndAssign(config, int(data.get('httpPort',0)), lambda v: Config.httpPortValid(v), lambda c, v: setattr(c, 'httpPort', v))
                cls.testAndAssign(config, data.get('webDir', None), lambda v: Config.webDirValid(v), lambda c, v: setattr(c, 'webDir', v))
                                
            except OSError:
                logger.error(f"Unable to open configuration file {configFile}:\n{traceback.format_exc()}")
            except  json.JSONDecodeError:
                logger.error(f"Unable to parse JSON configuration file {configFile}:\n{traceback.format_exc()}")
        return config
    
    @classmethod
    def save(cls, config, logger):
        data = {}
        
        data['httpPort'] = config.httpPort
        data['webDir'] = config.webDir
        
        configFile = cls.getConfigFile()
        try:
            with open(configFile, "w", encoding="utf-8") as cf:
                json.dump(data, cf, indent=4)
        except OSError:
            logger.error(f"Unable to open configuration file {configFile}:\n{traceback.format_exc()}")
        except:
            logger.error(f"Unable to save JSON configuration file {configFile}:\n{traceback.format_exc()}")

    @staticmethod
    def registerArguments(argParser):
        argParser.add_argument('-p', '--port', action='store', type=int, help=f"HTTP port, default is {Config._default_httpPort}")

    @staticmethod
    def processArguments(args):
        log = logging.getLogger(ConfigManager._config_file_)
        log.propagate = False
        log.setLevel(logging.INFO)
        lh = logging.StreamHandler()
        log.addHandler(lh)
        
        config = None 
        modified = False
        
        config, modified = ConfigManager.loadAndAssign(config, modified, log, args, 
                                lambda a: Config.httpPortValid(a.port), lambda c, a: c.httpPort != a.port, lambda c, a: setattr(c, 'httpPort', a.port) )
        
        if config is not None and modified:
            ConfigManager.save(config, log)
        log.removeHandler(lh)

    @staticmethod
    def testAndAssign(config, value, validate, assign):
        if validate(value):
            assign(config, value)

    @staticmethod
    def loadAndAssign(config, modified, logger, args, validate, difference, assign):
        if validate(args):
            if config is None:
                config = ConfigManager.load(logger)
            if difference(config, args):
                assign(config, args)
                modified = True
        return [config, modified]

    @staticmethod
    def __getModuleFile():
        try:
            moduleFile = modules[ConfigManager.__module__].__file__
        except AttributeError:
            moduleFile = executable
        return os.path.abspath(moduleFile)
    
    @staticmethod
    def getBaseDir():
        return os.path.dirname(ConfigManager.__getModuleFile())

    @staticmethod
    def getDefaultWebDir():
        return os.path.join(ConfigManager.getBaseDir(), "../www")

    @staticmethod
    def getConfigDir():
        return os.path.join(ConfigManager.getBaseDir(), "../etc")
    
    @classmethod
    def getConfigFile(cls):
        return os.path.join(ConfigManager.getConfigDir(), cls._config_file_)

    @staticmethod
    def getLogDir():
        return os.path.join(ConfigManager.getBaseDir(), "../log")
