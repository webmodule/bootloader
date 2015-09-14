(function(foo) {
	var bootloader,fileUtil,config;
	var READY_MAP = [];
  var bootReady;

	foo.onmodulenotfound = function(moduleName,callback){
		console.warn("Module",moduleName,"not found, will now try to resolve by bruteforce and call",callback);
		var bundleName = fileUtil.forModule(moduleName,true);
		if(is.Function(callback)){
			console.info("I have searched for ",moduleName, "from", bundleName, "package");
      require(bundleName,function(){
        callback(module(moduleName,false));
      });
		} else {
			require(bundleName);
		}
		return module(moduleName,false);
	};

	// Bootloaded ready functionality
	var STATE = [],nowMReady;
	var setReady = function(num) {
		STATE[num] = 0;
		bootReady();
	};
	var isReady = function(){
		return nowMReady || (STATE.join("-") === "0-0-0-0-0-0") && (nowMReady=true);
	};

	/**
	 * Registers callbacks to execute when bootlader is ready with domReady
	 * 
	 * @param callback
	 */
	bootReady = function(callback) {
		if (arguments.length > 0) {
			READY_MAP.push(callback);
			bootReady();
		} else if (isReady()) {
			console.info("Bootloader : bootloader is ready");
			for ( var i in READY_MAP) {
				foo.setTimeout(READY_MAP[i]);
			}
			READY_MAP = [];
			bootReady = foo.setTimeout;
		}
	};
	
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
		resource : {},
    livereload : false,
    livereloadUrl : null
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
      _loaded_ : {},
			loaded : function(file, yesLoaded){
        if(yesLoaded){
          this._loaded_[file] = yesLoaded;
        }
        return this._loaded_[file];
      },
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
					return (!fileUtil.js.loading[file] && !fileUtil.js.loaded(file));
				});

        if(syncLoad){
					filesToLoad.map(function(file){
						fileUtil.js.loading[file] = true;
						fileUtil.js.loadScript(config.resourceUrl+URI(file,config.resourceDir) + '?_=' + config.version);
						fileUtil.js.loaded(file, true);
					});
					if(callback) callback();
				} else {
					return head.load(filesToLoad.map(function(file){
						fileUtil.js.loading[file] = true;
						return config.resourceUrl+URI(file,config.resourceDir) + '?_=' + config.version;
					}),callback);	
				}
			}
		},
		pkg : {
			loaded : {},loadedCss : {},
			resolveCss : function(packageNames, output){
				var output = output || {
					filesCss : [], loadCss : [], loadingPackage : {}
				};
				for ( var i in packageNames) {
					var packageName = packageNames[i];
					if (!this.loadedCss[packageName]
							&& !output.loadingPackage[packageName]) {
						var myPackage = config.resource.bundles[packageName];
						if (myPackage) {
							output.loadingPackage[packageName] = packageName;
							if (myPackage.on) {
								fileUtil.pkg.resolveCss(myPackage.on, output);
							}
							var combined = (!config.debug && (myPackage.combined && myPackage.combined.length>0));
							if (combined) {
								if(is.Array(myPackage.combined)){
									output.loadCss = output.loadCss.concat(myPackage.combined);
								} else {
									output.loadCss.push(myPackage.combined);
								}
							}
							for ( var j in myPackage.css) {
								var file = myPackage.css[j];
								output.filesCss.push(file);
								if (!combined) {
									output.loadCss.push(file);
								}
							}
						}
					}
				}
				return output;
			},
			resolve : function(packageNames, output) {
				var output = output || {
					files : [], load : [], loadingPackage : {}
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

							var budnled = (!config.debug && (myPackage.bundled && myPackage.bundled.length>0));
							if (budnled) {

								if(is.Array(myPackage.bundled)){
									output.load = output.load.concat(myPackage.bundled);
								} else {
									output.load.push(myPackage.bundled);
								}
							}
							for ( var j in myPackage.js) {
								var file = myPackage.js[j];
								if (!fileUtil.js.loaded(file)) {
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
						var yefile = bundle.js[i];
						var thisModuleName = yefile.replace(/^.*[\\\/]/,"").replace(/\.js$/,"");;
						if(thisModuleName == moduleName && (!notLoaded || !fileUtil.js.loaded(yefile))){
							return bundleName;
						}
					}
				}
			}
		},
		fill : function(output) {
			for ( var i in output.files) {
				var filePath = output.files[i];
				this.js.loaded(output.files[i],true);
				var info = foo.URI.info(output.files[i], config.resourceUrl + config.resourceDir);
				var moduleName = info.file.replace(/^.*[\\\/]/,"").replace(/\.js$/,"");
				var moduleProto = module(moduleName,false);
				if (moduleProto) {
					moduleProto.__file__ = info.file;
					moduleProto.__dir__ = info.origin + info.dir;
				}
			}
			for ( var i in output.load) {
				this.js.loaded(output.load[i], true);
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
		},10)
	};
	
	var importStyle = function(){
		var output = fileUtil.pkg.resolveCss(arguments);
		head.load(output.loadCss.map(function(file){
			return config.resourceUrl+URI(file,config.resourceDir)+"?"+config.version;
		}),function(){
			for ( var packageName in output.loadingPackage) {
				fileUtil.pkg.loadedCss[packageName] = packageName;
			}
		});
		return output;
	};
	
	var require = function() {
		if (foo.__bundled__ && foo.__bundled__.length) {
			var fillObj = fileUtil.pkg.resolve(foo.__bundled__);

      fillObj.load = fillObj.load.reverse().unique().reverse();
      //fillObj.loadingPackage = fillObj.loadingPackage.reverse().unique().reverse();
      fillObj.files = fillObj.files.reverse().unique().reverse();

			fileUtil.fill(fillObj);
			foo.__bundled__ = [];
		}
		var callback, syncLoad;
		var req = new Require();
		if (arguments.length > 0 && arguments[0]) {
      if(typeof arguments[arguments.length-1] === "function"){
        callback = [].pop.apply(arguments);
      } else {
        /**
         * TO Avoid Recursive Loading, Module should not be downloaded syncronously
         *  when first file is loading;
         */
        syncLoad = isReady() && true;
      }
      var output = fileUtil.pkg.resolve(arguments);
      //Need to reverse to order while unifying as, last file shud be loaded in last for sure :)
      output.load = output.load.reverse().unique().reverse();
      if(arguments.length>0 && output.load.length>0){
        //bootReady(function(){
          fileUtil.js.load(output.load, function() {
            //Fill shud be done before calling callback as cllback might use paths
            fileUtil.fill(output);
            (req).to(callback);
          },syncLoad && isReady());
        //});
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
			console.debug(resource.version);
			if(config.debug !== true && resource.version !== undefined){
				config.version = resource.version;
			}
			head.ready(function() {
				setReady(3);
				console.info("Bootloader : header Ready function");
			});

			if (indexJs) {
				fileUtil.js.load(indexJs);
			} else if (indexBundle) {
				var bundelsToLoad = [indexBundle];
				if(config.debugBundles){
					bundelsToLoad = bundelsToLoad.concat(config.debugBundles);
				} else  if(config.debug){
					bundelsToLoad = bundelsToLoad.concat(Object.keys(resource.bundles));
				}
				bundelsToLoad.push(function(){
					console.info("Bootloader : Index bundle Loaded");
				});
				require.apply(require,bundelsToLoad);
			}

      config.livereloadUrl = resource.livereloadUrl || config.livereloadUrl;

      if(config.debug && config.livereload && config.livereloadUrl){
        head.load([config.livereloadUrl]);
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
      if(!config.resourceUrl && foo.location){
        config.resourceUrl = foo.location.origin;
      }
			config.version = (config.debug === false && config.version)?  config.version: (new Date()).getTime() ;
      if(!foo.is.Value(config.livereloadUrl) && foo.URL){
        var url = new foo.URL(config.resourceUrl);
        config.livereloadUrl = url.protocol + "//"+url.hostname + ":35729/livereload.js"
      }
			setReady(1);
			resourceLoader();
			_config_set_ = true;
			console.info("Bootloader : Config Set");
		}
	};
	
	foo.bootloader.config = function(){
		return config;
	};

	foo._define_.ready = function(){
		return bootReady.apply(foo,arguments);
	};
	
	foo._define_.setSafe("require",require);
	foo._define_.setSafe("importStyle",importStyle);

	foo.__get_all__ = function() {
		return {
			files : files,
			config : config
		};
	};

	if (foo.document && typeof document.addEventListener === "function") {
		document.addEventListener("DOMContentLoaded", function(event) {
			console.info("Bootloader : document is ready");
			setReady(4);
		});
		window.addEventListener('load',function(){
			console.info("Bootloader : window is ready");
			setReady(5);
		},false);
	} else {
		console.error("document.load is not supported, trigger bootloader.ready manually when document is ready");
	}
	setReady(0);
})(this);

var scripts = document.getElementsByTagName("script");
eval( scripts[ scripts.length - 1 ].innerHTML );
