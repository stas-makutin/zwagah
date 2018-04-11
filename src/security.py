import sys
import os
from collections import OrderedDict
import threading
import datetime
import struct
import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

class User:
    def __init__(self, name):
        self.name = name
        self.password = None
        self.salt = None
    
    def toDict(self):
        userDict = {}
        if self.password:
            userDict["password"] = self.password
            userDict["salt"] = self.salt
        if userDict:
            return userDict
        return None
    
    @staticmethod
    def fromDict(name, userDict):
        user = User(name)
        if userDict:
            user.password = userDict.get("password", "")
            user.salt = userDict.get("salt", None)
            if user.salt is None:
                user.salt = os.urandom(32)
        return user

class Users:
    special_Administrator = "admin"
    special_Anonymous = "anonymous"
    
    def __init__(self):
        self._users = { self.special_Administrator : User(self.special_Administrator) }

    def get(self, name):
        name = str(name).lower()
        return self._users.get(name)
    
    def getAdmin(self):
        return self.get(self.special_Administrator)
    
    def needSetupAdmin(self):
        return self.getAdmin().password is not None

    def createOrUpdate(self, user):
        if isinstance(user, user) and user.name:
            self._users[user.name] = user
        
    @classmethod
    def load(cls, configDict):
        users = Users()
        if not configDict:
            return users
        for name, userDict in configDict.items():
            if name:
                name = str(name).lower()
                users.createOrUpdate(User.fromDict(name, userDict))
        return users
        
    @classmethod
    def save(cls, users):
        if len(users) == 1:
            user = next(iter(users._users.values()))
            if not user.password:
                return None
        usersDict = {}
        for user in users._users.values():
            usersDict[user.name] = user.toDict()

class AuthenticationSession:
    def __init__(self, id, userName, clientNonce, serverNonce, timeStamp):
        self.id = id;
        self.userName = userName
        self.clientNonce = clientNonce
        self.serverNonce = serverNonce
        self.timeStamp = timeStamp
        self.attempt = 0

class Authentication:
    SESSION_MAX_NUMBER = 3000
    SESSION_MAX_TTL = 5 # seconds
    SESSION_MAX_ATTEMPTS = 1
    KEYS_MAX_TTL = 24 * 60 * 60 # seconds, must be at least three times larger than TOKEN_MAX_TTL
    TOKEN_MAX_TTL = 900 # seconds 
    
    SUCCESS = 0
    INCORRECT_NONCE = 1
    EMPTY_USERNAME = 2
    UNKNOWN_SESSIONID = 3
    HASH_NOT_MATCH = 4
    INVALID_TOKEN = 5
        
    def __init__(self):
        self._sessionLock = threading.Lock()
        self._sessions = OrderedDict()
        self._lastSessionId = 0
        self._keyLock = threading.Lock()
        self._previousKey = None
        self._previousKeyTimeStamp = None
        self._key = None
        self._keyTimeStamp = None
        
    def startSession(self, users, userName, clientNonce):
        if len(clientNonce) < 32:
            return self.INCORRECT_NONCE
        if not userName:
            return self.EMPTY_USERNAME
        
        timeStamp = datetime.datetime.utcnow()
        sessionId = 0
        with (self._sessionLock):
            if self._lastSessionId >= sys.maxsize:
                self._lastSessionId = 0
            sessionId = self._lastSessionId = self._lastSessionId + 1
            
            firstId = None
            idToDel = []
            for k,v in self._sessions.items():
                tdelta = timeStamp - v.timeStamp
                if tdelta.total_seconds() <= self.SESSION_MAX_TTL and v.attempt <= self.SESSION_MAX_ATTEMPTS:
                    if firstId is None: 
                        firstId = k
                else:    
                    idToDel.append(k)
                
            for k in idToDel:
                del self._sessions[k]
                
            if len(self._sessions) > self.SESSION_MAX_NUMBER and firstId is not None:
                del self._sessions[firstId]
                
        session = AuthenticationSession(sessionId, userName, clientNonce, os.urandom(32), timeStamp)
        self._sessions[sessionId] = session
        user = users.get(userName)
        salt = None
        if user is not None:
            salt = user.salt
        if salt is None:
            salt = os.urandom(32)
        
        return (self.SUCCESS, sessionId, session.serverNonce, salt)

    def getToken(self, users, sessionId, passwordHash):
        session = self._sessions.get(sessionId)
        if session is None or session.attempt > self.SESSION_MAX_ATTEMPTS:
            return self.UNKNOWN_SESSIONID
        session.attempt = session.attempt + 1
        user = users.get(session.userName)
        if user is not None:
            hv = hashlib.pbkdf2_hmac('sha256', user.password, session.clientNonce, 100)
            hv = hashlib.pbkdf2_hmac('sha256', hv, session.serverNonce, 100)
            if hash == passwordHash:
                timeStamp = datetime.datetime.utcnow()
                key, keyTimeStamp = self.getCurrentKey(timeStamp)
                
                content = self.packTimeStamp(timeStamp) + user.name.encode("utf8")

                iv = os.urandom(16)
                encryptedContent = None
                try:
                    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
                    encryptor = cipher.encryptor()
                    encryptedContent = encryptor.update(content) + encryptor.finalize()
                except:
                    return (self.HASH_NOT_MATCH, None)
                
                token = iv + self.packTimeStamp(keyTimeStamp) + encryptedContent
 
                return (self.SUCCESS, token)
                
        return (self.HASH_NOT_MATCH, None)

    def getUser(self, users, token):
        if len(token) <= 36:
            return (self.INVALID_TOKEN, None)
        keyTimeStamp = self.unpackTimeStamp(token[16:26])
        if keyTimeStamp is None:
            return (self.INVALID_TOKEN, None)
        key = self.matchKey(keyTimeStamp)
        if key is None:
            return (self.INVALID_TOKEN, None)

        content = None
        try:        
            cipher = Cipher(algorithms.AES(key), modes.CBC(token[0:16]), backend=default_backend())
            decryptor = cipher.decryptor()
            content = decryptor.update(token[26:]) + decryptor.finalize()
        except:
            return (self.INVALID_TOKEN, None)
        
        if content is None or len(content) <= 10:
            return (self.INVALID_TOKEN, None)
        
        timeStamp = self.unpackTimeStamp(content[0:10])
        if timeStamp is None or datetime.datetime.utcnow() - timeStamp > self.TOKEN_MAX_TTL:
            return (self.INVALID_TOKEN, None)
        
        userName = content[10:].decode("urf8")
        user = users.get(userName)
        if user is None:
            return (self.INVALID_TOKEN, None)
        
        return (self.SUCCESS, user)

    def getCurrentKey(self, timeStamp):
        key = None
        keyTimeStamp = None
        with self._keyLock:
            if self._key is None:
                self._key = os.urandom(32)
                self._keyTimeStamp = timeStamp
            else:
                tdelta = timeStamp - self._keyTimeStamp
                if tdelta < self.TOKEN_MAX_TTL * 2:
                    self._previousKey = self._key
                    self._previousKeyTimeStamp = self._keyTimeStamp
                    self._key = os.urandom(32)
                    self._keyTimeStamp = timeStamp
            key = self._key
            keyTimeStamp = self._keyTimesStamp
        return (key, keyTimeStamp)

    def matchKey(self, timeStamp):
        key = None
        keyTimeStamp = None
        previousKey = None
        previousKeyTimeStamp = None
        with self._keyLock:
            key = self._key
            keyTimeStamp = self._keyTimestamp
            previousKey = self._previousKey
            previousKeyTimeStamp = self._previousKeyTimeStamp
        if key is not None:
            if keyTimeStamp != timeStamp:
                key = None
                if previousKey is not None and previousKeyTimeStamp == timeStamp:
                    key = previousKey
        return key    

    @staticmethod
    def packTimeStamp(timeStamp):
        struct.pack(
            "!BBBBBBI",
            timeStamp.year,
            timeStamp.month,
            timeStamp.day,
            timeStamp.hour,
            timeStamp.minute,
            timeStamp.second,
            timeStamp.microsecond
        )
    
    @staticmethod
    def unpackTimeStamp(packedBytes):
        pass