// copy of base64js.min.js from 
(function(r){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=r()}else if(typeof define==="function"&&define.amd){define([],r)}else{var e;if(typeof window!=="undefined"){e=window}else if(typeof global!=="undefined"){e=global}else if(typeof self!=="undefined"){e=self}else{e=this}e.base64js=r()}})(function(){var r,e,n;return function(){function r(e,n,t){function o(i,a){if(!n[i]){if(!e[i]){var u=typeof require=="function"&&require;if(!a&&u)return u(i,!0);if(f)return f(i,!0);var d=new Error("Cannot find module '"+i+"'");throw d.code="MODULE_NOT_FOUND",d}var c=n[i]={exports:{}};e[i][0].call(c.exports,function(r){var n=e[i][1][r];return o(n?n:r)},c,c.exports,r,e,n,t)}return n[i].exports}var f=typeof require=="function"&&require;for(var i=0;i<t.length;i++)o(t[i]);return o}return r}()({"/":[function(r,e,n){"use strict";n.byteLength=c;n.toByteArray=v;n.fromByteArray=s;var t=[];var o=[];var f=typeof Uint8Array!=="undefined"?Uint8Array:Array;var i="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";for(var a=0,u=i.length;a<u;++a){t[a]=i[a];o[i.charCodeAt(a)]=a}o["-".charCodeAt(0)]=62;o["_".charCodeAt(0)]=63;function d(r){var e=r.length;if(e%4>0){throw new Error("Invalid string. Length must be a multiple of 4")}return r[e-2]==="="?2:r[e-1]==="="?1:0}function c(r){return r.length*3/4-d(r)}function v(r){var e,n,t,i,a;var u=r.length;i=d(r);a=new f(u*3/4-i);n=i>0?u-4:u;var c=0;for(e=0;e<n;e+=4){t=o[r.charCodeAt(e)]<<18|o[r.charCodeAt(e+1)]<<12|o[r.charCodeAt(e+2)]<<6|o[r.charCodeAt(e+3)];a[c++]=t>>16&255;a[c++]=t>>8&255;a[c++]=t&255}if(i===2){t=o[r.charCodeAt(e)]<<2|o[r.charCodeAt(e+1)]>>4;a[c++]=t&255}else if(i===1){t=o[r.charCodeAt(e)]<<10|o[r.charCodeAt(e+1)]<<4|o[r.charCodeAt(e+2)]>>2;a[c++]=t>>8&255;a[c++]=t&255}return a}function l(r){return t[r>>18&63]+t[r>>12&63]+t[r>>6&63]+t[r&63]}function h(r,e,n){var t;var o=[];for(var f=e;f<n;f+=3){t=(r[f]<<16&16711680)+(r[f+1]<<8&65280)+(r[f+2]&255);o.push(l(t))}return o.join("")}function s(r){var e;var n=r.length;var o=n%3;var f="";var i=[];var a=16383;for(var u=0,d=n-o;u<d;u+=a){i.push(h(r,u,u+a>d?d:u+a))}if(o===1){e=r[n-1];f+=t[e>>2];f+=t[e<<4&63];f+="=="}else if(o===2){e=(r[n-2]<<8)+r[n-1];f+=t[e>>10];f+=t[e>>4&63];f+=t[e<<2&63];f+="="}i.push(f);return i.join("")}},{}]},{},[])("/")});

//---

/* Zwagah error class */

function ZwagahError(message) {
	this.name = "ZwagahError";
	this.message = message;
	this.stack = (new Error()).stack;
}
ZwagahError.prototype = new Error;

/* Zwagah User class */

function ZwagahUser(name = "", token = null) {
	this.name = name;
	this.token = token;
}

/* Zwagah Login helper */

const zwagahLoginUserName = "zwagahUser";
const zwagahLoginUserPassword = "zwagahUserKey";
const zwagahLoginUserToken = "zwagahToken";

function ZwagahLogin() {
}

ZwagahLogin.getUserName = function() {
	return window.localStorage.getItem(zwagahLoginUserName);
}

ZwagahLogin.setUserName = function(name) {
	window.localStorage.setItem(zwagahLoginUserName, name);
}

ZwagahLogin.getPassword = function() {
	let value = window.sessionStorage.getItem(zwagahLoginUserPassword);
	if (!value)
		value = window.localStorage.getItem(zwagahLoginUserPassword);
	return value;
}

ZwagahLogin.setPassword = function(value, sessionOnly = true) {
	if (sessionOnly) {
		window.sessionStorage.setItem(zwagahLoginUserPassword, value);
		window.localStorage.removeItem(zwagahLoginUserPassword);
	} else {
		window.localStorage.setItem(zwagahLoginUserPassword, value);
		window.sessionStorage.removeItem(zwagahLoginUserPassword);
	}
}

ZwagahLogin.getToken = function() {
	return window.sessionStorage.getItem(zwagahLoginUserToken);
}

ZwagahLogin.setToken = function(token) {
	window.sessionStorage.setItem(zwagahLoginUserToken, token);
}

ZwagahLogin.reset = function() {
	window.localStorage.removeItem(zwagahLoginUserPassword);
	window.sessionStorage.removeItem(zwagahLoginUserPassword);
	window.sessionStorage.removeItem(zwagahLoginUserToken);
}

ZwagahLogin.login = function(loginUrl, goUrl = null) {
//	return new ZwagahUser("testuser", null);
	
	let userName = ZwagahLogin.getUserName();
	let token = ZwagahLogin.getToken();
	if (userName && token) {
		return new ZwagahUser(userName, token);
	}
	
	let password = ZwagahLogin.getPassword();
	if (userName && password) {
		new ZwagahApi()
			.login(userName, password, true)
			.then(result => {
				ZwagahLogin.setToken(result.token);
				return new ZwagahUser(userName, token);
			})
			.catch(error => {
				// fall back to login page
			})
		;
	}		
	
	if (!loginUrl)
		loginUrl = "/";
	if (goUrl) {
		loginUrl += (loginUrl.lastIndexOf("?") >= 0) ? "&go=" : "?go=";
		loginUrl += encodeURIComponent(goUrl);
	}
	window.location.replace(loginUrl);
	return null;
}

ZwagahLogin.logout = function(goUrl = null) {
	ZwagahLogin.reset();
	if (!goUrl)
		goUrl = "/";
	window.location.replace(goUrl);
}

/* Zwagah API class */

function ZwagahApi() {
}

ZwagahApi.prototype.setup = function(adminPassword) {
	return new Promise((resolve, reject) => {
		setTimeout(function() { reject(new ZwagahError(`
		Error!
multiline
			error!
		`)); }, 2000);
	});
}

ZwagahApi.prototype.login = function(userName, userPassword, isPasswordSalted = false) {
	return new Promise((resolve, reject) => {
		resolve({"token":"...","passKey":"..."});
		//setTimeout(() =>{ reject(new ZwagahError("Unknown user or wrong password.")); }, 1500);
	});
}
	
ZwagahApi.prototype.getConfig = function(userToken)	{
	return new Promise((resolve, reject) => {
		let mock = {
			"controller" : {
				"comPorts" : [
					{ "port" : "COM1" },
					{ "port" : "COM2" },
					{ "port" : "COM3", "current" : true }
				]
			},
			"httpServer" : {
				"port" : 8888,
				"wwwRootDirectory" : "/opt/zwagah/www/"
			}
		};
		setTimeout(() => { resolve(mock); }, 2000);
	});
}

