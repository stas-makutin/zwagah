import tornado.web
import tornado.websocket
import base64
import logging
import config
import security

class HttpApiHandler(tornado.web.RequestHandler):
    def initialize(self, app):
        self.app = app

    def prepare(self):
        if self.app._config.users.needSetupAdmin():
            self.redirect("/app/app.htm?setup")    
    
    @tornado.web.asynchronous
    def get(self, query):
        if query == "authenticate":
            self.entryAuthenticate()
        elif query == "restart":
            self.entryRestart()
        else:
            self.set_status(404)
            self.write_error(404)
        self.finish()
    
    def entryAuthenticate(self):
        nonce = self.get_argument("nonce", default=None)
        userName = self.get_argument("user", default=None)
        if nonce or userName:
            status = security.Authentication.SUCCESS
            sessionId = serverNonce = salt = None
            if not nonce:
                status = security.Authentication.INCORRECT_NONCE
            elif not userName:
                status = security.Authentication.EMPTY_USERNAME
            else:
                try:
                    clientNonce = base64.b64decode(nonce, altchars=None, validate=True);
                    status, sessionId, serverNonce, salt = self.app._authentication.startSession(self.app._config.users, userName, clientNonce)
                except:
                    status = security.Authentication.INCORRECT_NONCE
            self.write({
                "status" : status, 
                "sessionId" : sessionId, 
                "nonce" : None if serverNonce is None else str(base64.b64encode(serverNonce), "utf-8"), 
                "salt" : None if salt is None else str(base64.b64encode(salt), "utf-8")
            })
        else:
            sessionId = self.get_argument("session", default=None)
            encodedHash = self.get_argument("hash", default=None)
            status = security.Authentication.SUCCESS
            token = None
            if not sessionId:
                status = security.Authentication.UNKNOWN_SESSIONID
            elif not encodedHash:
                status = security.Authentication.HASH_NOT_MATCH    
            else:
                try:
                    passwordHash = base64.b64decode(encodedHash, altchars=None, validate=True);
                    status, token = self.app._authentication.getToken(self.app._config.users, int(sessionId), passwordHash)
                except:
                    status = security.Authentication.HASH_NOT_MATCH
            self.write({
                "status" : status, 
                "token" : None if token is None else str(base64.b64encode(token), "utf-8")
            })

    def entryRestart(self):
        goUrl = self.get_argument("go", default="")
        if not goUrl:
            goUrl = "/"
        if not goUrl.startswith("/"):
            goUrl = "/" + goUrl
        self.app.restart()
        self.redirect(goUrl)

class WebSocketApiHandler(tornado.websocket.WebSocketHandler):

    def initialize(self, app):
        self.app = app
    
    def open(self, *args):
        pass
    
    def on_message(self, message):
        pass
    
    def on_close(self):
        pass