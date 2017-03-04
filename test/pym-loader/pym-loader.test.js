var loadViaEmbedding = function(url, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onload = function() {
        // Remove the script tag once pym it has been loaded
        if (head && script.parentNode) {
            head.removeChild(script);
        }
    };
    head.appendChild(script);
};

var loadedListeners = [];
var initializedListeners = [];

function registerAndAddLoadedListener(f) {
    document.addEventListener('pym-loader:pym-loaded',f,false);
    loadedListeners.push(f);
};

function removeLoadedListeners() {
    for (var i=0; i < loadedListeners.length; i++){
        document.removeEventListener("pym-loader:pym-loaded", loadedListeners[i]);
    }
    loadedListeners = [];
};

function registerAndAddInitializedListener(f) {
    document.addEventListener('pym:pym-initialized',f,false);
    initializedListeners.push(f);
};

function removeInitializedListeners() {
    for (var i=0; i < initializedListeners.length; i++){
        document.removeEventListener("pym:pym-initialized", initializedListeners[i]);
    }
    initializedListeners = [];
};

describe('pym-loader', function() {
    var originalTimeout;

    var stub = {
        log: function(e) {
            // console.log(e.target);
        },
        handler: function(e) {
            //console.log("handler: msg: " + msg);
        }
    }

    beforeAll(function(){
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
    });

    afterAll(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    beforeEach(function() {
        document.body.innerHTML = __html__['test/html-fixtures/loader_single_template.html'];
    });

    afterEach(function() {
        stub.handler.calls.reset();
        // Clear custom listeners
        removeLoadedListeners();
        removeInitializedListeners();
        document.body.innerHTML = '';
    });

    describe('load with requirejs', function() {
        beforeEach(function() {
            spyOn(stub, 'handler').and.callThrough();
        });

        it('should fire custom events and autoinit parent', function(done) {
            function handlerLoaded(e) {
                // console.log("event1: "+e.type);
                stub.handler(e);
                registerAndAddInitializedListener(handlerInitialized);
            };
            function handlerInitialized(e) {
                // console.log("event2: "+e.type);
                stub.handler(e);
                expect(stub.handler).toHaveBeenCalledTimes(2);
                var not_init = document.querySelectorAll('[data-pym-src]:not([data-pym-auto-initialized])').length;
                var inited = document.querySelectorAll('[data-pym-src]').length;
                expect(not_init).toEqual(0);
                expect(inited).toEqual(1);
                setTimeout(done, 2000);
                done();
            };
            registerAndAddLoadedListener(handlerLoaded);
            loadViaEmbedding("http://localhost:9876/base/src/pym-loader.js");
        });
    });

    describe('load with jquery', function() {
        beforeEach(function() {
            window.requirejs = undefined;
            spyOn(stub, 'handler').and.callThrough();
        });

        it('should fire a custom event when pym is loaded', function(done) {
            function handlerLoaded(e) {
                // console.log(e);
                stub.handler(e);
                expect(stub.handler).toHaveBeenCalledTimes(1);
                done();
            };
            // console.log(window.requirejs);
            registerAndAddLoadedListener(handlerLoaded);
            loadViaEmbedding("http://localhost:9876/base/src/pym-loader.js");
        });

        it('should fire a custom event when pym is initialized', function(done) {
            function handlerInitialized(e) {
                // console.log(e);
                stub.handler(e);
                expect(stub.handler).toHaveBeenCalledTimes(1);
                done();
            };
            // console.log(window.requirejs);
            registerAndAddInitializedListener(handlerInitialized);
            loadViaEmbedding("http://localhost:9876/base/src/pym-loader.js");
        });

        it('should autoinit the parent', function(done) {
            function handlerInitialized(e) {
                // console.log(e);
                stub.handler(e);
                var not_init = document.querySelectorAll('[data-pym-src]:not([data-pym-auto-initialized])').length;
                var inited = document.querySelectorAll('[data-pym-src]').length;
                expect(not_init).toEqual(0);
                expect(inited).toEqual(1);
                done();
            };
            // console.log(window.requirejs);
            registerAndAddInitializedListener(handlerInitialized);
            loadViaEmbedding("http://localhost:9876/base/src/pym-loader.js");
        });
    });

    describe('append pym to head', function() {
        beforeEach(function() {
            window.requirejs = undefined;
            window.jQuery = undefined;
            spyOn(stub, 'handler').and.callThrough();
        });

        it('should fire a custom event when pym is loaded', function(done) {
            function handlerLoaded(e) {
                // console.log(e);
                stub.handler(e);
                expect(stub.handler).toHaveBeenCalledTimes(1);
                done();
            };
            // console.log(window.requirejs);
            // console.log(window.jQuery);
            registerAndAddLoadedListener(handlerLoaded);
            loadViaEmbedding("http://localhost:9876/base/src/pym-loader.js");
        });

        it('should fire a custom event when pym is initialized', function(done) {
            function handlerInitialized(e) {
                // console.log(e);
                stub.handler(e);
                expect(stub.handler).toHaveBeenCalledTimes(1);
                done();
            };
            // console.log(window.requirejs);
            // console.log(window.jQuery);
            registerAndAddInitializedListener(handlerInitialized);
            loadViaEmbedding("http://localhost:9876/base/src/pym-loader.js");
        });

        it('should autoinit the parent', function(done) {
            function handlerInitialized(e) {
                // console.log(e);
                stub.handler(e);
                var not_init = document.querySelectorAll('[data-pym-src]:not([data-pym-auto-initialized])').length;
                var inited = document.querySelectorAll('[data-pym-src]').length;
                expect(not_init).toEqual(0);
                expect(inited).toEqual(1);
                done();
            };
            // console.log(window.requirejs);
            // console.log(window.jQuery);
            registerAndAddInitializedListener(handlerInitialized);
            loadViaEmbedding("http://localhost:9876/base/src/pym-loader.js");
        });
    });
});
