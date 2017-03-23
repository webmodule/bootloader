# bootloader
Module Dependency Loader with bundlify

## Including Library

```html
<!DOCTYPE html>
<html>
<head>
<title>MyApp</title>
</head>
<body>
    <script src="/dist/bootloader_bundled/webmodules.bootloader.js?version=beta-5.6&debug=false">
        bootloader({
            appContext: '',
            indexBundle: "myapp/app",
            debugBundles: [],
            apiServer: "/data/"
        });
	</script>
</body>

</html>
```

## define

```javascript
define({
  module : "my.module",
  extend : "my.parent",
  using : ["mod1","mod2","mod3"]
}).as(function(MyModule,mod1,mod2,mod3){
  
  return {
    _define_ : function(){
    },
    _instance_ : function(){
    },
    _extended_ : function(){
    },
    _ready_ : function(){
    
    }
  };
  
})
```
## module
```javascript
module(["module1","module2"], function(module1,module2){
  
});
```

## importStyle 
Import StyleSheets packages recursively as mentioned in module.json

```javascript
__importStyle__("style/package/name");
```

## Hooks

```javascript
bootloader.onmodulenotfound =  function(moduleName, callback){
  //this is fallback for module not found 
};

bootloader.module404 =  function(moduleName){
  //finally raise alert when module not found
};

```
