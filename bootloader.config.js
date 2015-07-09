bootloader.config.set({
	debug : true,
	contextPath : 'app',
	resourcePath : 'resources',
	dataPath : 'data',
	bundles : {
		link : "/app/resources/resources.json?$=*&_=.json",
		parse : function(resp){
			return { bundles : eval(resp) };
		}
	},
	combine : true,
	moduleConfig : {
		"spamjs.module" : {
			"rivetConfig" : {
				prefix: 'rv'
			}
		}
	}
});