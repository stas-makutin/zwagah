from sys import modules, executable
import os.path
import json

class Config:

    def load(self):
        pass
    
    def save(self):
        pass

    @staticmethod
    def __getModuleFile():
        try:
            moduleFile = modules[Config.__module__].__file__
        except AttributeError:
            moduleFile = executable
        return os.path.abspath(moduleFile)
    
    @staticmethod
    def getBaseDir():
        return os.path.dirname(Config.__getModuleFile())

    @staticmethod
    def getConfigDir():
        return os.path.join(Config.getBaseDir(), "../etc")

    @staticmethod
    def getLogDir():
        return os.path.join(Config.getBaseDir(), "../log")
    
    @staticmethod
    def registerArguments(argParser):
        argParser.add_argument('-p', '--port', action='store', type=int, default=8888, help='HTTP port')

    @staticmethod
    def processArguments(args):
        pass

