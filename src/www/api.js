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

/* Zwagah API class */

function ZwagahApi() {
}

ZwagahApi.prototype.setup = function(adminPassword) {
	return new Promise(function(resolve, reject) {
		setTimeout(function() { reject(new ZwagahError(`
		Error!
multiline
			error!
		`)); }, 2000);
	});
}
