(function(foo){
	var LIB = {},READY_MAP = [];
	var STATE = [];
	
	var module = function(moduleName){
		if(LIB[moduleName]){
			return LIB[moduleName].__modulePrototype__;
		}
	};
	
	var setReady= function(num){
		STATE[num]=0;
		ready();
	};
	
	var ready = function(callback){
		if(arguments.length>0){
			READY_MAP.push(callback);
			ready();
		} else if(STATE.join("-") === "0-0-0-0-0"){
			console.log("bootloader is ready");
			for(var i in READY_MAP){
				READY_MAP[i].call(foo);
			}
			READY_MAP = [];
		}
	};
	
	var Moduler = function Moduler(__modulePrototype__,dependsOn){
		this.intialize.apply(this,arguments);
		this.dependsOn = dependsOn;
	};
	
	Moduler.prototype = {
		intialize : function(__modulePrototype__){
			this.__modulePrototype__ = __modulePrototype__ || {};
		},
		module : function(){
			return this.__modulePrototype__;
		},
		extend : function(parentModuleName){
			if(LIB[parentModuleName]){
				this.__extendedFrom___ = parentModuleName;
				this.__modulePrototype__ = Object.create(module(parentModuleName) || {});
				LIB[parentModuleName].callOwnFunction("_extended_",this);
			} else {
				console.error("Parent Module "+parentModuleName+" does not exists");
			}
			return this;
		},
		mixin : function(ChildProto){
		    for (var i in ChildProto) {
		        if (ChildProto.hasOwnProperty(i) === true) {
		        	this.__modulePrototype__[i] = ChildProto[i];
		        }
		     }
		    return this;
		},
		as : function(definition){
			if(typeof definition === 'function'){
				var ChildProto
				if(this.dependsOn === undefined){
					ChildProto = definition.call(this, this.__modulePrototype__, this.__modulePrototype__);
				} else {
					var deps = [this.__modulePrototype__];
					for(var i in this.dependsOn){
						deps.push(foo._module_(this.dependsOn[i]))
					}
					ChildProto = definition.apply(this, deps);
				}
				if(ChildProto !== undefined){
					this.mixin(ChildProto);
				}
			} else if(typeof definition === "object"){
				this.mixin(definition);
			}
			this.callOwnFunction("_define_");
			return this;
		},
		callOwnFunction : function(prop){
	        if (this.__modulePrototype__.hasOwnProperty(prop) === true && typeof this.__modulePrototype__[prop] === "function") {
	        	return this.__modulePrototype__[prop].apply(this,arguments);
	        }
		}
	};
	
	var AbstractModule = function AbstractModule(moduleName,file){
		this.__module__ = moduleName;
		this.__file__ = file;
		this.__dir__ = "";
	};
	AbstractModule.prototype = {
		instance :  function(){
			var newObj = Object.create(this);
			newObj._instance_.apply(newObj,arguments);
			return newObj;
		},
		_instance_ : function(){
			
		}
	};
	
	var define = function(moduleInfo,definition){
		var moduleName, onModules;
		if(typeof moduleInfo ==="object"){
			moduleName = moduleInfo.name;
			onModules = moduleInfo.dependsOn || moduleInfo.on;
		} else if(typeof moduleInfo==="string"){
			moduleName = moduleInfo;
		}
		LIB[moduleName] = new Moduler(new AbstractModule(moduleName),onModules);
		
		if(definition !== undefined){
			LIB[moduleName].as(LIB[moduleName]);
		}
		
		ready(function(){
			LIB[moduleName].callOwnFunction("_ready_");
		});
		return LIB[moduleName];
	};
	
	//Resources loading...
	var config = {
			baseUrl : "",
			context : "",
			cdnServer  :"",
			resourceUrl : "resources.json",
			debug : false,
			android : true,
			indexJs : undefined, // 'app.js',
			resource : {}
	};
	
	var files = {
		js :{
			loaded : {},
			load : function(files,callback){
				return head.load(files,callback);
			}
		},
		pkg : {
			loaded : {},
			resolve : function(packageNames,output){
				var output = output || { files : [], load : [], loadingPackage : {}};
				for(var i in packageNames){
					var packageName = packageNames[i]
					if(!this.loaded[packageName] && !output.loadingPackage[packageName]){
						var myPackage = config.resource.bundles[packageName];
						if(myPackage){
							output.loadingPackage[packageName] = packageName;
							if(myPackage.on){
								files.pkg.resolve(myPackage.on,output);
							}
							var budnled = (!config.debug && myPackage.bundled && !files.js.loaded[myPackage.bundled]);
							if(budnled){
								output.load.push(myPackage.bundled);
							} 
							for(var j in myPackage.js){
								var file = myPackage.js[j];
								if(!files.js.loaded[file]){
									output.files.push(file)
									if(!budnled){
										output.load.push(file)
									}
								}
							}
						}
					}
				}
				return output;
			}
		},
		fill : function(output){
			for (var i in output.files){
				var filePath = output.files[i];
				this.js.loaded[output.files[i]] = true;
				var info = foo.URI.info(output.files[i],config.context);
				var moduleName = info.file.replace(/([\w]+)\.js$|.css$/, "$1");
				var moduleProto = module(moduleName);
				if(moduleProto){
					moduleProto.__file__ = info.file;
					moduleProto.__dir__ = info.dir;
				}
			}
			for (var i in output.load){
				this.js.loaded[output.load[i]] = true;
			}
			for (var packageName in output.loadingPackage){
				this.pkg.loaded[packageName] = packageName;
			}
		}
	};
	
	var require = function(){
		if(foo.__bundled__ && foo.__bundled__.length){
			var fillObj = files.pkg.resolve(foo.__bundled__);
			files.fill(fillObj);
			foo.__bundled__ = [];
		}
		if(arguments.length>0){
			var fileList =[],lodList =[];
			var output = files.pkg.resolve(arguments);
			files.js.load(output.load, function(){
				files.fill(output);
			});
			return output;
		}
	}
	
	var resourceLoader = function() {

		  var xmlhttp = new XMLHttpRequest();

		  xmlhttp.onreadystatechange = function() {
		    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
		      var resource = JSON.parse(this.responseText);
		      config.resource = resource;
		      var indexJs = config.indexJs || resource.indexJs;
		      var indexBundle = config.indexBundle || resource.indexBundle;
		      setReady(2);
		      
		      head.ready(function() {
		    	  setReady(3);
		        console.log("App Loaded : Ready function");
		      });
		      
		      if(indexJs){
		    	  console.error(indexJs)
		    	  files.js.load(indexJs);
		      } else if(indexBundle) {
		    	 require(indexBundle);
		      }

		      if(false && a.css.mediaprint){
		           var el= document.createElement('link');
		           el.setAttribute("rel", "stylesheet");
		           el.setAttribute("type", "text/css");
		           el.setAttribute("href", config.cdnServer + "/"  + a.css.mediaprint);
		           el.setAttribute("media", "print");
		           document.getElementsByTagName('head')[0].appendChild(el);
		        }
		    }
		  };
		  xmlhttp.open("GET", config.cdnServer + "/" +config.resourceUrl +"?_=" + (new Date()).getTime(), true);
		  xmlhttp.send();
	};
	
		foo.bootloader = function(_config){
			for(var i in _config){
				config[i] =_config[i];
			}
			setReady(1);
			resourceLoader();
		};
		foo.bootloader.ready = ready;
		
		foo._define_ = define;
		foo._module_ = module;
		foo._require_ = require;
		
		foo.__get_all__ = function(){
			return {
				files : files,
				config : config
			};
		};
		
		if(foo.define === undefined){
			foo.define = foo._define_;
		}
		if(foo.module === undefined){
			foo.module = foo._module_;
		}
		if(foo.require === undefined){
			foo.require = foo._require_;
		}
		
		if(foo.document && typeof document.addEventListener === "function"){
			document.addEventListener("DOMContentLoaded", function(event) { 
				setReady(4);
			});
		}
		setReady(0);
})(this);

