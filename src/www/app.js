function parseQueryString() {
	var rv = {};
	var queryString = window.location.search;
	if (queryString) {
		queryString = queryString.substr(1)
		var b = 0, e = 0, l = queryString.length;
		while (b < l) {
			e = queryString.indexOf("&", b);
			if (e < 0) e = l;
			var k = decodeURIComponent(queryString.substr(b, e - b));
			b = e + 1;
			var v = "", p = k.indexOf("=");
			if (p >= 0) {
				v = k.substr(p + 1, k.length);
				k = k.substr(0, p);
			}
			k = k.toLowerCase();
			if (k in rv) {
				rv[k].push(v);
			} else {
				rv[k] = [v];
			}
		}
	}
	return rv;
}

function renderTemplate(templateId, params = null, target = null) {
	let template = document.getElementById(templateId).content.cloneNode(true);
	if (params) {
		for (let name in params) {
			template.querySelector(name).innerHTML = params[name];
		}
	}
	if (target)
		target.appendChild(template);
	else
		document.body.appendChild(template);
}

function getElementsWithBase(base, ...ids) {
	var rv = [];
	for (var i = 0; i< ids.length; i++) {
		var id = ids[i], el = null;
		if (typeof id == "string" && id) {
			var p = id.lastIndexOf(",");
			if (p >= 0) {
				var idx = id.substr(p + 1), t = "", _id = id.substr(0, p);
				if (idx.length > 0) {
					t = idx.charAt(0);
					idx = parseInt( (t >= "0" && t <= "9") ? idx : idx.substr(1) );
				} else {
					idx = 0;
				}
				
				if (t === "c") {
					el = base.getElementsByClassName(_id);
				} else if (t === "t") {
					el = base.getElementsByTagName(_id);
				} else if (t === "n") {
					el = document.getElementsByName(_id);
				} else {
					el = document.getElementsByName(_id);
				}					
				
				if (el && idx < el.length) {
					el = el[idx];
				} else {
					el = null;
				}
				
			} else {
				el = document.getElementById(id);
			}
		}
		if (el)
			rv.push(el);
		else
			throw new Error("Unable to find an element with id " + id);
	}
	return rv;	
}

function getElements(...ids) {
	return getElementsWithBase(document, ...ids);
}

function cancelEvent(e, preventDefault = true) {
	e.stopPropagation();
	if (preventDefault) e.preventDefault();
}

const passwordRule = "Password must be at least 6 characters long and contain at least 3 unique characters.";

function isPasswordValid(password) {
	if (typeof password === "string") {
		l = password.length;
		if (l >= 6) {
			var chars = {}, cl = 0;
			while (l-- >= 0 && cl < 3) {
				var ch = password[l];
				if (!(ch in chars)) {
					chars[ch] = true;
					cl++;
				}					
			}
			if (cl >= 3) {
				return true;
			}
		}
	}
	return false;
}

function showLoader(show) {
	var [elLoader] = getElements("loader");
	elLoader.className = show ? "display-blck" : "display-none";
}

function initialize() {
	var [elErrorIcon, elErrorBox] = getElements("error-icon", "error-box");
	var [elErrorBoxHeader] = getElementsWithBase(elErrorBox, "header,t0");
	
	elErrorIcon.addEventListener("click", e => {
		cancelEvent(e);
		elErrorIcon.className = "display-none";
		elErrorBox.className = "display-inbl";
	});
	elErrorBoxHeader.addEventListener("click", e => {
		cancelEvent(e);
		elErrorIcon.className = "display-blck";
		elErrorBox.className = "display-none";
	});
}

function hideError() {
	var [elErrorIcon, elErrorBox] = getElements("error-icon", "error-box");
	elErrorIcon.className = elErrorBox.className = "display-none";
}

function showError(title, message) {
	var [elErrorIcon, elErrorBox] = getElements("error-icon", "error-box");
	var [elErrorBoxHeader,elErrorBoxMessage] = getElementsWithBase(elErrorBox, "header,t0", "pre,t0");
	
	elErrorIcon.className = "display-none";
	elErrorBoxHeader.innerHTML = title + "<a>x</a>";
	elErrorBoxMessage.innerHTML = message;
	elErrorBox.className = "display-inbl";
}

function runSetup(query) {
	var [elPassword, elPasswordConfirm, elSubmit] = getElements("password,0", "password-confirm,0", "submit,0");
	var [elPasswordLight, elPasswordConfirmLight] = [elPassword.nextSibling, elPasswordConfirm.nextSibling];
	
	elPasswordLight.className = elPasswordConfirmLight.className = "check-light-bad";
	elSubmit.disabled = true;
	elSubmit.className = "button-off";

	function testPassword() {
		var password = elPassword.value;
		if (isPasswordValid(password)) {
			elPasswordLight.className = "check-light-ok";
			if (password === elPasswordConfirm.value) {
				elPasswordConfirmLight.className = "check-light-ok";
				elSubmit.disabled = false;
				elSubmit.className = "button-on";
				return;
			} 
		} else {
			elPasswordLight.className = "check-light-bad";
		}
		elPasswordConfirmLight.className = "check-light-bad";
		elSubmit.disabled = true;
		elSubmit.className = "buttonOff";
	}

	elSubmit.addEventListener("click", e => {
		cancelEvent(e);
		var password = elPassword.value;
		if (isPasswordValid(password)) {
			document.body.className = "waiting";
			elSubmit.disabled = true;
			elSubmit.className = "button-off";
			showLoader(true);
			new ZwagahApi()
				.setup(password)
				.then(function (result) {
					var goUrl = query["go"];
					if (!goUrl) {
						goUrl = "/";
					}
					window.location.replace(goUrl);
				})
				.catch(function (error) {
					showError("Unable to setup admin user", error.message);
					elSubmit.disabled = false;
					elSubmit.className = "button-on";
					document.body.className = "";
					showLoader(false);
				})
			;
		}		
	});
	elPassword.addEventListener("input", e => {
		testPassword();
	});
	elPasswordConfirm.addEventListener("input", e => {
		testPassword();
	});
}

function runConfig(query) {
}

function zwaLoad() {
	renderTemplate("template-loader");
	showLoader(true);
	
	var query = parseQueryString();
	let sequence = [];
	if ("setup" in query) {
		sequence.push(() => { renderTemplate("template-header", {".title" : "Setup"}); });
		sequence.push(() => { initialize(); });
		sequence.push(() => { renderTemplate("template-setup", {".passwordRule" : passwordRule}); });
		sequence.push(() => { runSetup(query); });
	} else if ("config" in query) {
		sequence.push(() => { renderTemplate("template-header", {".title" : "Configuration"}); });
		sequence.push(() => { initialize(); });
		sequence.push(() => { renderTemplate("template-config"); });
		sequence.push(() => { runConfig(query); });
	} else {
		sequence.push(() => { renderTemplate("template-header", {".title" : "Void"}); });
		sequence.push(() => { renderTemplate("template-void"); });
	}
	
	for (let func of sequence) {
		func();
	}
	
	showLoader(false);
}