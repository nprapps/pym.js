requirejs(["util"], function(util) {
    //This function is called when scripts/helper/util.js is loaded.
    //If util.js calls define(), then this function is not fired until
    //util's dependencies have loaded, and the util argument will hold
    //the module value for "helper/util".
    var el = document.getElementById('require-test');
    el.innerHTML = util.getHello();
    console.log(util.getHello());
});
