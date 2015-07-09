(function(foo){
	var LIB = {};
	
	var module = function(moduleName){
		return LIB[moduleName].__modulePrototype__;
	};
	
	var ready = function(callback){
		
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
		extend : function(parentModule){
			this.__extendedFrom___ = parentModule;
			this.__modulePrototype__ = Object.create(module(parentModule));
			LIB[parentModule].callOwnFunction("_extended_",this);
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
		callOwnFucntion : function(prop){
	        if (this.__modulePrototype__.hasOwnProperty(prop) === true && typeof this.__modulePrototype__[prop] === "function") {
	        	return this.__modulePrototype__[prop].apply(this,arguments);
	        }
		}
	};
	
	var AbstractModule = function AbstractModule(){
		
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
		LIB[moduleName] = new Moduler(new AbstractModule(),onModules);
		
		if(definition !== undefined){
			LIB[moduleName].as(LIB[moduleName]);
		}
		
		ready(function(){
			LIB[moduleName].callOwnFunction("_ready_");
		});
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
			loeaded : {},
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
							output.loadingPackage[packageName] = true;
							if(myPackage.on){
								files.js.resolve(myPackage.on,output);
							}
							for(var j in myPackage.js){
								output.files.push(myPackage.js[j])
							}
							if(myPackage.bundled){
								output.load.push(myPackage.bundled);
							} else {
								for(var j in myPackage.js){
									output.load.push(myPackage.js[j])
								}
							}
						}
					}
				}
				return output;
			}
		} 
	};
	
	var require = function(){
		var fileList =[],lodList =[];
		var output = files.pkg.resolve(arguments);
		console.log(output.load)
		files.js.load(output.load, function(){
			console.log("files loaded",output.load)
		});
		return output;
	}
	
	var resourceLoader = function() {

		  var xmlhttp = new XMLHttpRequest();

		  xmlhttp.onreadystatechange = function() {
		    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
		      var resource = JSON.parse(this.responseText);

		      config.resource = resource;
		      var indexJs = config.indexJs || resource.indexJs;
		      var indexPackage = config.indexPackage || resource.indexPackage;
		      
		      head.ready(function() {
		        console.log("App Loaded : Ready function");
		      });
		      
		      if(indexJs){
		    	  console.error(indexJs)
		    	  files.js.load(indexJs);
		      } else if(indexPackage) {
		    	 // require(indexPackage);
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
			resourceLoader();
		};
		
		foo._define_ = define;
		foo._module_ = module;
		foo._require_ = require;
		
		if(foo.define === undefined){
			foo.define = foo._define_;
		}
		if(foo.module === undefined){
			foo.module = foo._module_;
		}
		if(foo.require === undefined){
			foo.require = foo._require_;
		}
		
})(this);
