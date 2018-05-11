function cancelablePromise(promise) {
	let cancel;
	const cancelPromise = new Promise((resolve, reject) => {
		cancel = reject.bind(null, { cancelled : true });
	});
	return Object.assign(Promise.race([promise, cancelPromise]), { cancel });
}

function escapeHtml(src, mode = 0) {
	const map = {"&" : "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"' : "&quot;"};
	if (1 == mode)
		return src.replace(/[&<>"]/g, function(m) { return map[m]; });
	if (2 == mode)
		return src.replace(/[&<>']/g, function(m) { return map[m]; });
	if (3 == mode)
		return src.replace(/[&<>"']/g, function(m) { return map[m]; });
	return src.replace(/[&<>]/g, function(m) { return map[m]; });
}

function parseQueryString() {
	let rv = {};
	let queryString = window.location.search;
	if (queryString) {
		queryString = queryString.substr(1)
		let b = 0, e = 0, l = queryString.length;
		while (b < l) {
			e = queryString.indexOf("&", b);
			if (e < 0) e = l;
			let k = decodeURIComponent(queryString.substr(b, e - b));
			b = e + 1;
			let v = "", p = k.indexOf("=");
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

function ifParentOf(element, parent) {
	while (element) {
		let p = element.parentNode;
		if (p === parent)
			return true;
		element = p;
	}
	return false;
}

function getElementsWithBase(base, ...ids) {
	let rv = [];
	for (var i = 0; i< ids.length; i++) {
		let id = ids[i], el = null;
		if (typeof id == "string" && id) {
			let p = id.lastIndexOf(",");
			if (p >= 0) {
				let idx = id.substr(p + 1), t = "", _id = id.substr(0, p);
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

function removeOptions(element) {
	if (element && element.length && element.remove) {
		while (element.length > 0) element.remove(0);
	}
}

const passwordRule = "Password must be at least 6 characters long and contain at least 3 unique characters.";

function isPasswordValid(password) {
	if (typeof password === "string") {
		l = password.length;
		if (l >= 6) {
			let chars = {}, cl = 0;
			while (l-- >= 0 && cl < 3) {
				let ch = password[l];
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
	const [elLoader] = getElements("loader");
	elLoader.className = show ? "display-blck" : "display-none";
}

function initialize() {
	const [elErrorIcon, elErrorBox] = getElements("error-icon", "error-box");
	const [elErrorBoxHeader] = getElementsWithBase(elErrorBox, "header,t0");
	
	elErrorIcon.addEventListener("click", e => {
		e.preventDefault();
		elErrorIcon.className = "display-none";
		elErrorBox.className = "display-inbl";
	});
	elErrorBoxHeader.addEventListener("click", e => {
		e.preventDefault();
		elErrorIcon.className = "display-blck";
		elErrorBox.className = "display-none";
	});
}

function showUser(userName, show = true) {
	const [elHeader] = getElements("header");
	const [elUserArea,elUserName] = getElementsWithBase(elHeader, "div,t1", "span,t0");
	if (show) {
		elUserName.innerHTML = escapeHtml(userName);
		elUserArea.className = "display-blck";
	} else {
		elUserName.innerHTML = "";
		elUserArea.className = "display-none";
	}
}

//const urlLogin = "/app/app.htm?login";
const urlLogin = "app.htm?login";

function getCurrentUrl() {
	return window.location.href;
}

function login(returnUrl = null) {
	if (!returnUrl)
		returnUrl = getCurrentUrl();
	const user = ZwagahLogin.login(urlLogin, returnUrl);
	if (!user) {
		throw new Error("User not logged it.");
	}
	showUser(user.name);
	return user;
}

function logout(goUrl = null) {
	if (!goUrl) {
		goUrl = urlLogin;
		goUrl += (goUrl.lastIndexOf("?") >= 0) ? "&go=" : "?go=";
		goUrl += encodeURIComponent(getCurrentUrl());
	}
	ZwagahLogin.logout(goUrl);
}

function showError(title, message) {
	const [elErrorIcon, elErrorBox] = getElements("error-icon", "error-box");
	const [elErrorBoxHeader,elErrorBoxMessage] = getElementsWithBase(elErrorBox, "header,t0", "pre,t0");
	
	elErrorIcon.className = "display-none";
	elErrorBoxHeader.innerHTML = escapeHtml(title) + "<a>x</a>";
	elErrorBoxMessage.innerHTML = escapeHtml(message);
	elErrorBox.className = "display-inbl";
}

function hideError() {
	const [elErrorIcon, elErrorBox] = getElements("error-icon", "error-box");
	elErrorIcon.className = elErrorBox.className = "display-none";
}

let onDropListClose = null;

function showDropDiv(populate, close, ...boundElements) {
	const [elDropList] = getElements("drop-list");
	
	if (elDropList.className !== "display-none")
		return false;
	
	onDropListClose = close;
	
	["click", "keydown", "resize"].forEach(type => { window.addEventListener(type, hideDropDiv) });
	
	let rect = {top: null, left: null, width: null, height: null};
	for (var i = 0; i< boundElements.length; i++) {
		let r = boundElements[i].getBoundingClientRect();
		if (rect.top === null || rect.top < r.bottom)
			rect.top = r.bottom;
		if (rect.left === null || rect.left > r.left)
			rect.left = r.left;
		let w = r.right - rect.left;
		if (rect.width === null || rect.width < w)
			rect.width = w;
	}
	
	rect = populate(elDropList, rect);
	
	if (rect.left !== null)
		elDropList.style.left = (window.pageXOffset + rect.left) + "px";
	if (rect.top !== null)
		elDropList.style.top = (window.pageYOffset + rect.top) + "px";
	if (rect.width !== null)
		elDropList.style.width = rect.width + "px";
	if (rect.height !== null)
		elDropList.style.height = rect.height + "px";
	elDropList.className = "display-blck";
	
	return true;
}

function hideDropDiv(event = null) {
	const [elDropList] = getElements("drop-list");
	
	if (elDropList.className === "display-none")
		return false;
	
	if (event !== null) {
		let escape = event.type == "keydown" && event.key == "Escape";
		if (ifParentOf(event.target, elDropList)) {
			if (!escape)
				return;
		} else if (!escape) {
			return;
		}
		event.stopPropagation();
		event.preventDefault();
	}
	
	elDropList.className = "display-none";
	elDropList.innerHTML = "";
	
	["click", "keydown", "resize"].forEach(type => { window.removeEventListener(type, hideDropDiv) });
	
	if (onDropListClose !== null) {
		onDropListClose();
		onDropListClose = null;
	}
	
	return true;
}

function toggleDropList(adjustSize, init, populate, select, close, ...boundElements) {
	if (hideDropDiv()) {
		return false;
	}
	
	return showDropDiv(
		(elDropList, rect) => {
			rect = adjustSize(elDropList, rect);

			const loadingContent = "<div>.....</div>";
			let count = 0;
			let content = "";
			
			let append = (value, text, last, error = null) => {
				if (error) {
					elDropList.innerHTML = `<span>${escapeHtml(error)}</span>`;
				}
				if (text) {
					count++;
					if (value)
						content += `<option value="${escapeHtml(value, 1)}">${escapeHtml(text)}</option>`;
					else
						content += `<option>${escapeHtml(text)}</option>`;
				}
				if (last) {
					const fontSize = parseFloat(getComputedStyle(elDropList).fontSize) * 1.1;
					const minHeight = 3 * fontSize;
					const maxHeight = (window.innerHeight - rect.top - rect.height) * 0.95;
					let height = count * 1.265 * fontSize; 
					if (height > maxHeight)
						height = maxHeight;
					if (height < minHeight)
						height = minHeight;
					elDropList.innerHTML = `<select size="${count}" style="height:${height}px;">${content}</select>`;
			
					const [elSelect] = getElementsWithBase(elDropList, "select,t0");
					elSelect.focus();
					if (count > 0) {
						elSelect.selectedIndex = 0;
					}
					["click", "keyup"].forEach(type => { elSelect.addEventListener(type, e => {
						if (e.type == "keyup") {
							if (e.key != "Enter" && e.key != " ")
								return;
						}
						event.stopPropagation();
						event.preventDefault();
						if (elSelect.selectedIndex >= 0) {
							content = '';
							count = 0;
							if (select(elSelect.selectedOptions[0].value, elSelect.selectedOptions[0].text, append)) {
								elDropList.innerHTML = loadingContent;
							}
						}
					})});
				}
			};

			elDropList.innerHTML = loadingContent;
			init();
			populate(append);
			
			return rect;
		},
		close,
		...boundElements
	);
}

function runSetup(query) {
	const [elPassword, elPasswordConfirm, elSubmit] = getElements("password,0", "password-confirm,0", "submit,0");
	const [elPasswordLight, elPasswordConfirmLight] = [elPassword.nextSibling, elPasswordConfirm.nextSibling];
	
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
		e.preventDefault();
		let password = elPassword.value;
		if (isPasswordValid(password)) {
			document.body.className = "waiting";
			elSubmit.disabled = true;
			elSubmit.className = "button-off";
			showLoader(true);
			new ZwagahApi()
				.setup(password)
				.then(result => {
					let goUrl = query["go"];
					if (!goUrl) {
						goUrl = "/";
					}
					window.location.replace(goUrl);
				})
				.catch(error => {
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

function runLogin(query) {
	const [elUser, elPassword, elKeepUserIn, elSubmit] = getElements("username,0", "password,0", "keepUserIn,0", "submit,0");
	const [elUserLight, elPasswordLight] = [elUser.nextSibling, elPassword.nextSibling];

	elUserLight.className = elPasswordLight.className = "check-light-bad";
	elSubmit.disabled = true;
	elSubmit.className = "button-off";
	
	testInput = e=> {
		validCount = 0;
		if (elUser.value) {
			elUserLight.className = "check-light-ok";
			validCount++;
		} else {
			elUserLight.className = "check-light-bad";
		}
		if (elPassword.value) {
			elPasswordLight.className = "check-light-ok";
			validCount++;
		} else {
			elPasswordLight.className = "check-light-bad";
		}
		if (validCount === 2) {
			elSubmit.disabled = false;
			elSubmit.className = "button-on";
		} else {
			elSubmit.disabled = true;
			elSubmit.className = "button-off";
		}
	};
	
	elUser.value = ZwagahLogin.getUserName();
	elPassword.value = ZwagahLogin.getPassword();
	testInput(null);
	
	elSubmit.addEventListener("click", e => {
		e.preventDefault();
		let userName = elUser.value;
		let password = elPassword.value;
		if (userName && password) {
			showLoader(true);
			const sessionOnly = !elKeepUserIn.checked;
			ZwagahLogin.reset();
			ZwagahLogin.setUserName(userName);
			new ZwagahApi()
				.login(userName, password, false)
				.then(result => {
					ZwagahLogin.setPassword(result.passKey, sessionOnly);
					ZwagahLogin.setToken(result.token);
					let goUrl = query["go"];
					if (!goUrl) {
						goUrl = "/";
					}
					window.location.replace(goUrl);
				})
				.catch(error => {
					showError("Unable to login", error.message);
					showLoader(false);
				})
			;
		}
	});
	[elUser, elPassword].forEach( el => el.addEventListener("input", testInput));
}

function runConfig(query) {
	const currentUser = login();
	const [elSection] = getElements("config");
	const elTabs = getElementsWithBase(elSection, "nav,t0", "nav,t1");
	const elPages = getElementsWithBase(elSection, "section,t0", "section,t1");
	let pageModified = false;
	let pageLoaders = [];
	let pageUnloaders = [];

	// common behavior
	window.addEventListener("beforeunload", e=> {
		if (pageModified) {
			e.returnValue = ".";
			return ".";
		}
	});
	
	// general page behavior
	const [elComPort, elWwwPort, elWwwRoot, elWwwRootBtn, elOkBtn] = getElementsWithBase(elTabs[0], "comPort,0", "wwwport,0", "wwwroot,0", "wwwroot-browse,0", "general-submit,0");
	
	elWwwRootBtn.addEventListener("click", e => {
		e.stopPropagation();
		e.preventDefault();
		let promise = null;
		let init = () => {
			promise = cancelablePromise(new ZwagahApi().listDirectory(currentUser.token, elWwwRoot.value));
		};
		let populate = (report) => {
			if (promise) promise
				.then(res => { for (let entry of res) report(entry[0], entry[1], false); report(null, null, true); })
				.catch(error => { if (!error.cancelled) report(null, null, false, error.message); })
			;
		};
		toggleDropList(
			(elDropList, rect) => { rect.width -= parseFloat(getComputedStyle(elWwwRootBtn).fontSize) * 0.2; return rect; },
			init, populate,
			(value, text, report) => {
				elWwwRoot.value = value;
				init();
				populate(report);
				return true;
			},
			() => {
				if (promise) promise.cancel();
				elWwwRootBtn.value = "...";
			},
			elWwwRoot, elWwwRootBtn
		);
	});
	
	elOkBtn.addEventListener("click", e => {
		e.preventDefault();
		showLoader(true);
		let params = {};
		params["controller.comPort"] = elComPort.selectedOptions[0].value;
		params["httpServer.port"] = elWwwPort.value;
		params["httpServer.wwwRootDirectory"] = elWwwRoot.value;
		new ZwagahApi()
			.setConfig(currentUser.token, params)
			.then(res => {
				elOkBtn.className = "button-off";
				pageModified = false;
				showLoader(false);
			})
			.catch(error => {
				showError("Unable to save the configuration", error.message);
				showLoader(false);
			})
	});

	pageLoaders.push(() => {
		new ZwagahApi()
			.getConfig(currentUser.token)
			.then(res => {
				if (res.controller.comPorts) {
					for (let port of res.controller.comPorts) {
						let opt = document.createElement("option");
						opt.value = port.port;
						opt.text = port.label ? port.label : port.port;
						opt.selected = port.current == true;
						elComPort.add(opt);
					}
				}
				if (res.httpServer) {
					elWwwPort.value = res.httpServer.port;
					elWwwRoot.value = res.httpServer.wwwRootDirectory;
				}
				elComPort.disabled = elWwwPort.disabled = elWwwRoot.disabled = elWwwRootBtn.disabled = false;
				elWwwRootBtn.className = elOkBtn.className = "button-on";
				showLoader(false);
			})
			.catch(error => {
				showError("Unable to get the configuration", error.message);
				showLoader(false);
			})
		;
	});
	
	pageUnloaders.push(() => {
		removeOptions(elComPort);
		elWwwPort.value = 0;
		elWwwRoot.value = "";
		elComPort.disabled = elWwwPort.disabled = elWwwRoot.disabled = elWwwRootBtn.disabled = elOkBtn.disabled = true;
		elWwwRootBtn.className = elOkBtn.className = "button-off";
	});
	
	[elComPort, elWwwPort, elWwwRoot, elWwwRootBtn].forEach( el => el.addEventListener("input", e=> {
		pageModified = true;
		elOkBtn.disabled = false;
		elOkBtn.className = "button-on";
	}));
	
	// users page initialization
	pageLoaders.push(() => {
		showLoader(false);
	});
	
	pageUnloaders.push(() => {
	});
	
	// initialize tabs
	let activePage = 0;
	if ("page" in query) {
		const page = query["page"][0].toLowerCase();
		switch (page) {
			case "users": activePage = 1; break;
		}
	}
	for (let i = 0; i < elPages.length; i++) {
		let elTab = elTabs[i], elPage = elPages[i];
		let index = i;
		if (index == activePage) {
			elTab.className = "active-tab";
			elPage.className = "";
		} else {
			elTab.className = "inactive-tab";
			elPage.className = "display-none";
			pageUnloaders[index]();
		}
		
		["click", "keyup"].forEach( ev => elTab.addEventListener(ev, e => {
			e.preventDefault();
			if (e instanceof KeyboardEvent) {
				if (!(e.keyCode == 0xd || e.keyCode == 0x20)) return;
			}
			
			if (activePage != index) {
				if (pageModified && !confirm("Changes you made may not be saved. Do you want to continue?")) {
					return;
				}
				showLoader(true);
				hideError();
				pageModified = false;
				pageUnloaders[activePage]();
				elTabs[activePage].className = "inactive-tab";
				elPages[activePage].className = "display-none";
				elTab.className = "active-tab";
				elPage.className = "";
				activePage = index;
				pageLoaders[activePage]();
			}
		}));	
	}
	
	// active page loading
	pageLoaders[activePage]();
}

function zwaLoad() {
	renderTemplate("template-loader");
	showLoader(true);
	
	var query = parseQueryString();
	let sequence = [];
	if ("setup" in query) {
		sequence.push(() => { renderTemplate("template-header", {".title" : "Setup"}); });
		sequence.push(() => { initialize(); });
		sequence.push(() => { renderTemplate("template-setup", {".password-rule" : passwordRule}); });
		sequence.push(() => { runSetup(query); });
		sequence.push(() => { showLoader(false); });
	} else if ("login" in query) {
		sequence.push(() => { renderTemplate("template-header", {".title" : "Login"}); });
		sequence.push(() => { initialize(); });
		sequence.push(() => { renderTemplate("template-login"); });
		sequence.push(() => { runLogin(query); });
		sequence.push(() => { showLoader(false); });
	} else if ("config" in query) {
		sequence.push(() => { renderTemplate("template-header", {".title" : "Configuration"}); });
		sequence.push(() => { initialize(); });
		sequence.push(() => { renderTemplate("template-drop-list") });
		sequence.push(() => { renderTemplate("template-config", {".password-rule" : passwordRule}); });
		sequence.push(() => { runConfig(query); });
	} else {
		sequence.push(() => { renderTemplate("template-header", {".title" : "Void"}); });
		sequence.push(() => { renderTemplate("template-void"); });
		sequence.push(() => { showLoader(false); });
	}
	
	for (let func of sequence) {
		func();
	}
}