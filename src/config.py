from sys import modules, executable
import traceback
import os.path
import json
import logging

class ConfigEntry(object):
    def __init__(self, name, default, convert, isDefault, isValid, isDifferent):
        self._name = name
        self.default = default
        self._convert = convert
        self._isDefault = isDefault
        self._isValid = isValid
        self._isDifferent = isDifferent
    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__[self._name] 
    def __set__(self, instance, value):
        instance.__dict__[self._name] = self._convert(value)
    def isDefault(self, value):
        return self._isDefault(self._convert(value))
    def isValid(self, value):
        return self._isValid(self._convert(value))
    def isDifferent(self, value1, value2):
        return self._isDifferent(self._convert(value1), self._convert(value2))

class Config:
    httpPort = ConfigEntry("httpPort", 8888, lambda x: None if x is None else x, lambda x: x == Config.httpPort.default, lambda x: x is not None and x > 0 and x < 65536, lambda x,y: x != y)
    webDir = ConfigEntry("webDir", "", lambda x: x, lambda x: x == Config.webDir.default, lambda x: isinstance(x, str), lambda x,y: x != y)
    
    def __init__(self):
        self.httpPort = Config.httpPort.default
        self.webDir = Config.webDir.default

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
                
                cls.testAndSet(config, data.get('httpPort', 0), Config.httpPort)
                cls.testAndSet(config, data.get('webDir', None), Config.webDir)
                                
            except OSError:
                logger.error(f"Unable to open configuration file {configFile}:\n{traceback.format_exc()}")
            except  json.JSONDecodeError:
                logger.error(f"Unable to parse JSON configuration file {configFile}:\n{traceback.format_exc()}")
        return config
    
    @classmethod
    def save(cls, config, logger):
        data = {}
        
        cls.dumpIfNotDefault(config, Config.httpPort, data, "httpPort", lambda x: x)
        cls.dumpIfNotDefault(config, Config.webDir, data, "webDir", lambda x: x)
        
        if data:
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
        argParser.add_argument('-p', '--port', action='store', type=int, help=f"HTTP port, default is {Config.httpPort.default}")

    @staticmethod
    def processArguments(args):
        log = logging.getLogger(ConfigManager._config_file_)
        log.propagate = False
        log.setLevel(logging.INFO)
        lh = logging.StreamHandler()
        log.addHandler(lh)
        
        config = None 
        modified = False
        
        config, modified = ConfigManager.loadAndSet(config, modified, log, args.port, Config.httpPort) 
        
        if config is not None and modified:
            ConfigManager.save(config, log)
        log.removeHandler(lh)

    @staticmethod
    def dumpIfNotDefault(config, entry, dict, name, convert):
        value = entry.__get__(config, Config);
        if not entry.isDefault(value):
            dict[name] = convert(value)
        
        if entry.isValid(value):
            entry.__set__(config, value)

    @staticmethod
    def testAndSet(config, value, entry):
        if entry.isValid(value):
            entry.__set__(config, value)

    @staticmethod
    def loadAndSet(config, modified, logger, value, entry):
        if entry.isValid(value):
            if config is None:
                config = ConfigManager.load(logger)
            if entry.isDifferent(entry.__get__(config, Config), value):
                entry.__set__(config, value)
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
    def getWebDir(config):
        return config.webDir if config.webDir else ConfigManager.getDefaultWebDir()

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
