(function(foo) {
	var bootloader,fileUtil,config;
	var LIB = {}, READY_MAP = [];

	var __module__ = foo._module_;
	/**
	 * Getter for register modules, tries to search in bootloader library and
	 * fallbacks to foo as default.
	 * 
	 * @param moduleName
	 * @returns {*|{}|h.__modulePrototype__}
	 */
	var module = function(moduleName,skipFallback) {
		if (LIB[moduleName]) {
			return LIB[moduleName].__modulePrototype__;
		} else if (__module__) {
			return __module__(moduleName) || (function(){
				if(!skipFallback){
					var myModule = foo.bootloader.moduleNotFound(moduleName,config.resource,moduleNotFound);
					if(myModule===undefined){
						console.error("Module:",moduleName, "does not exists");
					}
					return myModule;
				}
			})();
		}
	};
	var moduleNotFound = function(moduleName){
		var bundleName = fileUtil.forModule(moduleName,true);
		require(bundleName);
		return module(moduleName,true);
	};

	// Bootloaded ready functionality
	var STATE = [];
	var setReady = function(num) {
		STATE[num] = 0;
		ready();
	};
	var isReady = function(){
		return (STATE.join("-") === "0-0-0-0-0-0");
	};

	/**
	 * Registers callbacks to execute when bootlader is ready with domReady
	 * 
	 * @param callback
	 */
	var ready = function(callback) {
		if (arguments.length > 0) {
			READY_MAP.push(callback);
			ready();
		} else if (isReady()) {
			console.log("bootloader is ready");
			for ( var i in READY_MAP) {
				foo.setTimeout(READY_MAP[i]);
			}
			READY_MAP = [];
			ready = foo.setTimeout;
		}
	};

	/**
	 * Module Contianer/Meta-Info
	 * 
	 * @param __modulePrototype__
	 * @param dependsOn
	 * @constructor
	 */
	var Moduler = function Moduler(__modulePrototype__, dependsOn) {
		this.intialize.apply(this, arguments);
		this.dependsOn = dependsOn;
	};

	Moduler.prototype = {
		/**
		 * Initialize moduler with default prototype
		 * 
		 * @param __modulePrototype__
		 */
		intialize : function(__modulePrototype__) {
			this.__modulePrototype__ = __modulePrototype__ || {};
		},
		/**
		 * returns module prototype
		 * 
		 * @returns {*|{}}
		 */
		module : function() {
			return this.__modulePrototype__;
		},
		/**
		 * Extends module from parent module
		 * 
		 * @param parentModuleName
		 * @returns {Moduler}
		 */
		extend : function(parentModuleName) {
			if (LIB[parentModuleName]) {
				this.__modulePrototype__ = foo.mixin(Object
						.create(module(parentModuleName) || {}),this.__modulePrototype__);
				this.__modulePrototype__.__extend__ = [parentModuleName].concat(this.__modulePrototype__.__extend__);
				LIB[parentModuleName].callOwnFunction("_extended_", this);
			} else {
				console.error("Parent Module " + parentModuleName
						+ " does not exists");
			}
			return this;
		},
		/**
		 * 
		 * @param ChildProto
		 * @returns {Moduler}
		 */
		mixin : function(ChildProto) {
			for ( var i in ChildProto) {
				if (ChildProto.hasOwnProperty(i) === true) {
					this.__modulePrototype__[i] = ChildProto[i];
				}
			}
			return this;
		},
		as : function(definition) {
			var self = this;
			if (typeof definition === 'function') {
				var ChildProto;
				if (this.dependsOn === undefined) {
					ChildProto = definition.call(this,
							this.__modulePrototype__, this.__modulePrototype__);
				} else {
					var deps = [ this.__modulePrototype__ ];
					for ( var i in this.dependsOn) {
						deps.push(foo._module_(this.dependsOn[i]));
					}
					ChildProto = definition.apply(this, deps);
				}
				if (ChildProto !== undefined) {
					this.mixin(ChildProto);
				}
			} else if (typeof definition === "object") {
				this.mixin(definition);
			}
			this.callOwnFunction("_define_");
			return this;
		},
		callOwnFunction : function(prop) {
			if (this.__modulePrototype__.hasOwnProperty(prop) === true
					&& typeof this.__modulePrototype__[prop] === "function") {
				return this.__modulePrototype__[prop].apply(this.__modulePrototype__, arguments);
			}
		}
	};

	/***************************************************************************
	 * Abstract Module
	 **************************************************************************/
	var AbstractModule = function AbstractModule(moduleName, file) {
		this.name = moduleName;
		this.__file__ = file;
		this.__dir__ = "";
		this.__extend__ = [];
	};
	AbstractModule.prototype = {
		create : function(){
			return this.instacne.apply(this,arguments);
		},
		instance : function() {
			var newObj = Object.create(this);
			(newObj._create_ || newObj._instance_).apply(newObj, arguments);
			return newObj;
		},
		_instance_ : function() {
		},
		path : function(path){
			return foo.URI(path,this.__dir__);
		},
		parent : function(){
			if(this.__extend__ && this.__extend__[0]){
				return module(this.__extend__[0]);
			} else return AbstractModule.prototype;
		},
		mixin : function(source) {
			for ( var i in source) {
				if (source.hasOwnProperty(i) === true) {
					this[i] = source[i];
				}
			}
			return this;
		},
		is : function(type){
			if(this.__extend__ && this.__extend__[0] && is.String(type)){
				return !!this.__extend__.filter(function(iType){
					return iType === type;
				})[0];
			}
		}
	};
	
	/**
	 * 
	 * Defines and registers module
	 * 
	 * @param moduleInfo -
	 *            Name of module or Map of module info
	 * @param definition -
	 *            Module prototype or function returning module prototype.
	 * @returns {*}
	 */
	var define = function(moduleInfo, definition) {
		var moduleName, onModules, extendsFrom;
		if (typeof moduleInfo === "object") {
			moduleName = moduleInfo.name || moduleInfo.module;
			onModules = moduleInfo.dependsOn || moduleInfo.modules;
			extendsFrom = moduleInfo.extend;
		} else if (typeof moduleInfo === "string") {
			moduleName = moduleInfo;
		}
		
		LIB[moduleName] = new Moduler(new AbstractModule(moduleName), onModules);
		LIB[moduleName].__moduleName__ = moduleName;

		if(is.String(extendsFrom)){
			LIB[moduleName].extend(extendsFrom);
		}
		
		if (definition !== undefined) {
			LIB[moduleName].as(definition);
		}
		
		ready(function() {
			LIB[moduleName].callOwnFunction("_ready_");
		});
		return LIB[moduleName];
	};
	
	define("AbstractModule",AbstractModule.prototype);
	
	// Resources loading...
	config = {
		baseUrl : "",
		appContext : "",
		resourceDir : null,
		resourceUrl : "",
		resourceJson : "resources.json",
		debug : false,
		android : true,
		indexJs : undefined, // 'app.js',
		resource : {}
	};
	
	
	fileUtil = {
		get : function(url,callback,sync){
			var xmlhttp = new XMLHttpRequest();
			if(foo.is.Function(callback)){
				xmlhttp.onreadystatechange = function() {
					if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
						callback.call(xmlhttp,xmlhttp.responseText);
					}
				};
			}
			xmlhttp.open("GET",url,sync || false);
			return xmlhttp;
		},
		js : {
			loading : {},
			loaded : {},
			loadScript : function(inFileName) {
				var aScript, aScriptSource;
				fileUtil.get(inFileName+"?_="+config.version,function(responseText){
					// set the returned script text while adding special comment to auto include in debugger source listing:
					aScriptSource = responseText + '\n////# sourceURL='+ inFileName + '\n';
					if (true){
						aScript = document.createElement('script');
						aScript.type = 'text/javascript';
						aScript.text = aScriptSource;
						document.getElementsByTagName('head')[0].appendChild(aScript);
						aScript.src = inFileName;
					} else {
						eval(aScriptSource);
					}
				},false).send();
			},
			load : function(filesToLoad, callback, syncLoad){
				var filesToLoad = filesToLoad.filter(function(file){
					return (!fileUtil.js.loading[file] && !fileUtil.js.loaded[file]);
				});
				if(syncLoad){
					filesToLoad.map(function(file){
						fileUtil.js.loading[file] = true;
						fileUtil.js.loadScript(config.resourceUrl+URI(file,config.resourceDir));
						fileUtil.js.loaded[file] = true;
					});
					if(callback) callback();
				} else {
					return head.load(filesToLoad.map(function(file){
						return config.resourceUrl+URI(file,config.resourceDir);
					}),callback);	
				}
			}
		},
		pkg : {
			loaded : {},
			resolve : function(packageNames, output) {
				var output = output || {
					files : [],
					load : [],
					loadingPackage : {}
				};
				for ( var i in packageNames) {
					var packageName = packageNames[i];
					if (!this.loaded[packageName]
							&& !output.loadingPackage[packageName]) {
						var myPackage = config.resource.bundles[packageName];
						if (myPackage) {
							output.loadingPackage[packageName] = packageName;
							if (myPackage.on) {
								fileUtil.pkg.resolve(myPackage.on, output);
							}
							var budnled = (!config.debug && myPackage.bundled && !fileUtil.js.loaded[myPackage.bundled]);
							if (budnled) {
								output.load.push(myPackage.bundled);
							}
							for ( var j in myPackage.js) {
								var file = myPackage.js[j];
								if (!fileUtil.js.loaded[file]) {
									output.files.push(file);
									if (!budnled) {
										output.load.push(file);
									}
								}
							}
						}
					}
				}
				return output;
			}
		},
		forModule : function(moduleName,notLoaded){
			for(var bundleName in config.resource.bundles){
				if(!notLoaded || !fileUtil.pkg.loaded[bundleName]){
					var bundle = config.resource.bundles[bundleName];
					for(var i in bundle.modules){
						if(bundle.modules[i] = moduleName){
							return bundleName;
						}
					}
					for(var i in bundle.js){
						var file = bundle.js[i];
						var thisModuleName = file.replace(/([\/\w]+)\/([\.\w]+)\.js$/, "$2");
						if(thisModuleName == moduleName && (!notLoaded || !fileUtil.js.loaded[file])){
							return bundleName;
						}
					}
				}
			}
		},
		fill : function(output) {
			for ( var i in output.files) {
				var filePath = output.files[i];
				this.js.loaded[output.files[i]] = true;
				var info = foo.URI.info(output.files[i], config.resourceUrl + config.resourceDir);
				var moduleName = info.file.replace(/([\w]+)\.js$|.css$/, "$1");
				var moduleProto = module(moduleName, true);
				if (moduleProto) {
					moduleProto.__file__ = info.file;
					moduleProto.__dir__ = info.origin + info.dir;
				}
			}
			for ( var i in output.load) {
				this.js.loaded[output.load[i]] = true;
			}
			for ( var packageName in output.loadingPackage) {
				this.pkg.loaded[packageName] = packageName;
			}
		}
	};

	function Require(definer){
		this.definer = definer;
	}
	Require.prototype = {
		list : [],
		to : function(definer){
			if(definer !==undefined){
				if(typeof definer === "function"){
					//this.list.push(this.definer);
					//this.toExecute();
					definer.call(foo,define,module);
				}
			}
			return this;
		},
		toExecute : foo.debounce(function(){
			while(cb = this.list.pop()){
				cb.call(foo,define,module);
			}
		},10),
		define : define
	};
	
	var require = function() {
		if (foo.__bundled__ && foo.__bundled__.length) {
			var fillObj = fileUtil.pkg.resolve(foo.__bundled__);
			fileUtil.fill(fillObj);
			foo.__bundled__ = [];
		}
		var callback, syncLoad;
		var req = new Require();
		if (arguments.length > 0) {
			if(typeof arguments[arguments.length-1] === "function"){
				callback = [].pop.apply(arguments);
			} else {
				syncLoad = true;
			}
			var output = fileUtil.pkg.resolve(arguments);
			if(arguments.length>0 && output.load.length>0){
				fileUtil.js.load(output.load, function() {
					(req).to(callback);
					fileUtil.fill(output);
				},syncLoad && isReady());
			} else {
				return (req).to(callback);
			}
		}
		return (req);
	};

	var resourceLoader = function() {

		var xmlhttp = new XMLHttpRequest();
		var info = foo.URI.info(config.resourceJson, config.resourceUrl + config.resourceDir);
		fileUtil.get(info.href + "?_=" + config.version, function(resp){
			var resource = JSON.parse(this.responseText);
			config.resource = resource;
			var indexJs = config.indexJs || resource.indexJs;
			var indexBundle = config.indexBundle || resource.indexBundle;
			setReady(2);

			head.ready(function() {
				setReady(3);
				console.log("App Loaded : Ready function");
			});

			if (indexJs) {
				fileUtil.js.load(indexJs);
			} else if (indexBundle) {
				require(indexBundle);
			}

			if (false && a.css.mediaprint) {
				var el = document.createElement('link');
				el.setAttribute("rel", "stylesheet");
				el.setAttribute("type", "text/css");
				el.setAttribute("href", config.resourceUrl + "/"
						+ a.css.mediaprint);
				el.setAttribute("media", "print");
				document.getElementsByTagName('head')[0].appendChild(el);
			}
		},true).send();
	};

	var _config_set_ = false;
	var localConfig = {};
	var isLocalStorageAvailable = (function(){
	  "use strict";
	  try {
		  var mod = "modernizr";
		  foo.localStorage.setItem(mod, mod);
		  foo.localStorage.removeItem(mod);
		  return true;
	  } catch(e) {
		  return false;
	  }
	})();
	
	foo.bootloader = function(_config,init) {
		for ( var i in _config) {
			config[i] = _config[i];
		}
		if(init!==false && _config_set_ == false){
			if(isLocalStorageAvailable){
				var localConfig = JSON.parse(foo.localStorage.getItem("bootConfig") || null);
				for(var i in localConfig){
					config[i] = localConfig[i];
				}
			}
			if(!foo.is.Value(config.resourceDir)){
				config.resourceDir = config.resourceDir || config.appContext;
			}
			config.version = config.version || (new Date()).getTime();
			setReady(1);
			resourceLoader();
			_config_set_ = true;
		}
	};
	foo.bootloader.moduleNotFound = function(moduleName,resources,defaultFunction){
		console.warn("Module",moduleName,"not found, will now try to resolve by bruteforce.");
		return defaultFunction(moduleName);
	};
	foo.bootloader.ready = ready;
	foo.bootloader.config = function(){
		return config;
	};

	foo._setFoo_("define",define);
	foo._setFoo_("module",module);
	foo._setFoo_("require",require);

	foo.__get_all__ = function() {
		return {
			files : files,
			config : config
		};
	};

	if (foo.define === undefined) {
		foo.define = foo._define_;
	}
	if (foo.module === undefined) {
		foo.module = foo._module_;
	}
	if (foo.require === undefined) {
		foo.require = foo._require_;
	}

	if (foo.document && typeof document.addEventListener === "function") {
		document.addEventListener("DOMContentLoaded", function(event) {
			setReady(4);
		});
		window.addEventListener('load',function(){
			console.info("window is ready");
			setReady(5);
		},false);
	} else {
		console.error("document.load is not supported, trigger bootloader.ready manually when document is ready");
	}
	setReady(0);
})(this);

var scripts = document.getElementsByTagName("script");
eval( scripts[ scripts.length - 1 ].innerHTML );
