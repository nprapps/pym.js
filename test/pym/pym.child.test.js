// For incoming messages
var manualMessagelisteners = [];
// For outgoing messages
var manualParentMessagelisteners = [];

function registerAndAddMessageListener(f) {
    window.addEventListener('message',f,false);
    manualMessagelisteners.push(f);
};

function removeManualMessageListeners() {
    for (var i=0; i < manualMessagelisteners.length; i++){
        window.removeEventListener("message", manualMessagelisteners[i]);
    }
    manualMessagelisteners = [];
};

function registerAndAddParentMessageListener(f) {
    window.parent.addEventListener('message',f,false);
    manualParentMessagelisteners.push(f);
};

function removeManualParentMessageListeners() {
    for (var i=0; i < manualParentMessagelisteners.length; i++){
        window.parent.removeEventListener("message", manualParentMessagelisteners[i]);
    }
    manualParentMessagelisteners = [];
};

describe('pymChild', function() {
    var height = 600;
    var pymChild;
    var stub = {
        'callback': function(param) {
            //console.log("sub.callback: "+param);
        }
    };

    beforeEach(function() {
        document.body.style.height = height+"px";
        document.body.innerHTML = __html__['test/html-fixtures/child_template.html'];
        spyOn(stub, 'callback').and.callThrough();
    });

    afterEach(function() {
        stub.callback.calls.reset();
        if (pymChild) pymChild.remove();
        pymChild = null;
        document.getElementsByTagName('html')[0].removeAttribute("class");
        // Stop listeners
        removeManualMessageListeners();
        removeManualParentMessageListeners();
        document.body.innerHTML = '';
    });

    describe('config', function() {
        it('should be able to overwrite the xdomain property through config', function() {
            var xdomain = '\\*\.npr\.org'
            pymChild = new pym.Child({xdomain: xdomain});
            expect(pymChild.settings.xdomain).toEqual(xdomain);
        });

        it('should be able to overwrite the parentUrl property through config', function() {
            pymChild = new pym.Child({parenturlparam: 'test' });
            expect(pymChild.settings.parenturlparam).toEqual('test');
        });

        it('should execute callback if passed through config', function() {

            var render = function(w) {
                stub.callback(w);
            }
            pymChild = new pym.Child({id: 'example', renderCallback: render});
            expect(stub.callback).toHaveBeenCalledTimes(1);
            expect(stub.callback).toHaveBeenCalledWith(NaN);
        });

        it('should be able to execute a callback when a width message arrives', function(done) {
            // console.log("Spec: start", new Date().toLocaleTimeString());
            var width = 1000;
            var render = function(w) {
                // console.log("Spec: received width msg in callback", new Date().toLocaleTimeString());
                stub.callback(w);
                expect(w).toEqual(width)
                done();
            }
            pymChild = new pym.Child({id: 'example'});
            pymChild.settings.renderCallback = render;
            // Simulate a width message comming from the parent
            window.postMessage('pymxPYMxexamplexPYMxwidthxPYMx'+width, '*');
        });

        it('should fire height messages if polling config is given', function(done) {
            // console.log("Spec: start", new Date().toLocaleTimeString());
            var handler = function(e) {
                // console.log("Spec: received height msg while polling", new Date().toLocaleTimeString());
                if (e.data === "pymxPYMxxPYMxheightxPYMx"+height) stub.callback(e.data);
            };
            pymChild = new pym.Child({polling: 200});
            registerAndAddParentMessageListener(handler);
            setTimeout(function() {
                // console.log("Spec: timer 1.1s has ended check results", new Date().toLocaleTimeString());
                expect(stub.callback.calls.count()).toBeGreaterThan(5);
                done();
            }, 1100);
        });
    });

    describe('sendHeight method', function() {
        it('should get executed on creation', function(done) {
            // console.log("Spec: start", new Date().toLocaleTimeString());
            var handler = function(e) {
                // console.log("Spec: received height msg", new Date().toLocaleTimeString());
                expect(e.data).toEqual("pymxPYMxexamplexPYMxheightxPYMx"+height);
                done();
            };
            registerAndAddParentMessageListener(handler);
            pymChild = new pym.Child({id: 'example'});
        });

        it('should send a height message after a width message arrives', function(done) {
            // console.log("Spec: start", new Date().toLocaleTimeString());
            var width = 1000;
            var handler = function(e) {
                // console.log("Spec: received height msg", new Date().toLocaleTimeString());
                if (e.data === "pymxPYMxexamplexPYMxheightxPYMx"+height) stub.callback(e.data);
                expect(stub.callback).toHaveBeenCalledTimes(1);
                done();
            };
            pymChild = new pym.Child({id: 'example'});
            registerAndAddParentMessageListener(handler);
            // Simulate a width message comming from the parent
            window.postMessage('pymxPYMxexamplexPYMxwidthxPYMx'+width, '*');
        });

        it('should not send a third height message after two identical width message arrive', function(done) {
            // console.log("Spec: start", new Date().toLocaleTimeString());
            var width = 1000;
            var handler = function(e) {
                // console.log("Spec: received height msg", new Date().toLocaleTimeString());
                if (e.data === "pymxPYMxexample4xPYMxheightxPYMx"+height) stub.callback(e.data);
            };
            registerAndAddParentMessageListener(handler);
            pymChild = new pym.Child({id: 'example4'});
            window.postMessage('pymxPYMxexample4xPYMxwidthxPYMx'+width, '*');
            setTimeout(function() {
                // console.log("Spec: timer .5s ended send identical width", new Date().toLocaleTimeString());
                window.postMessage('pymxPYMxexample4xPYMxwidthxPYMx'+width, '*');
            }, 500);
            setTimeout(function() {
                // console.log("Spec: timer 1s ended check results", new Date().toLocaleTimeString());
                expect(stub.callback.calls.count()).toEqual(2);
                done();
            }, 1000);
        });
    });

    describe('markWhetherEmbedded', function() {
        it('should get executed on creation even without callback', function() {
            var htmlElement = document.getElementsByTagName('html')[0]
            var origClass = htmlElement.className;
            pymChild = new pym.Child({});
            expect(origClass).not.toEqual(htmlElement.className);
            expect(htmlElement.className).toEqual('embedded');
        });

        it('should execute callback if passed through config', function() {
            var embedded_calllback = function(w) {
                stub.callback(w);
            }
            pymChild = new pym.Child({id: 'example', onMarkedEmbeddedStatus: embedded_calllback});
            expect(stub.callback).toHaveBeenCalledTimes(1);
        });

        // TODO figure out how to test not-embedded child
    });

    describe('remove method', function() {
        it('should have not listen to any message events once removed', function(done) {
            // console.log("Spec: start", new Date().toLocaleTimeString());
            var width = 1000;
            function resolve() {
                expect(stub.callback).not.toHaveBeenCalled();
                done();
            };
            var handler = function(msg) {
                stub.callback(msg);
            };
            var manual_handler = function(e) {
                if (e.data === 'pymxPYMxremove2xPYMxcustomxPYMxTest') {
                    resolve();
                }
            };
            pymChild = new pym.Child({id: 'remove2'});
            pymChild.onMessage('custom', handler);
            pymChild.onMessage('width', handler);
            registerAndAddMessageListener(manual_handler);
            pymChild.remove();
            window.postMessage('pymxPYMxremove2xPYMxwidthxPYMx'+width, '*');
            window.postMessage('pymxPYMxremove2xPYMxcustomxPYMxTest', '*');
        });

        it('should stop sending height events configured by polling once removed', function(done) {
            // console.log("Spec: start", new Date().toLocaleTimeString());
            var removed = false;
            function resolve() {
                // Just allow one to pass in but there should not be more than that
                expect(stub.callback.calls.count()).not.toBeGreaterThan(1);
                done();
            };
            var manual_handler = function(e) {
                if (e.data === 'pymxPYMxremove3xPYMxheightxPYMx'+height) {
                    if (removed) stub.callback(e.data);
                }
            };

            pymChild = new pym.Child({id: 'remove3', polling: 200});
            registerAndAddParentMessageListener(manual_handler);
            setTimeout(function() {
                pymChild.remove();
                removed = true;
            }, 1000);
            setTimeout(function() {
                // console.log("Spec: timer 2s has ended check results", new Date().toLocaleTimeString());
                resolve();
            }, 2000);
        });

    });

    describe('messages', function() {
        it('should send scrollTo message to parent window', function(done) {
            // console.log("Spec: start", new Date().toLocaleTimeString());
            var hash = "about";
            var handler = function(e) {
                if (e.data === "pymxPYMxexample2xPYMxnavigateToxPYMx"+"#"+hash) {
                    // console.log("Spec: received navigateTo msg", new Date().toLocaleTimeString());
                    stub.callback(e.data);
                    expect(stub.callback).toHaveBeenCalledTimes(1);
                    done();
                }
            };
            pymChild = new pym.Child({id: 'example2'});
            registerAndAddParentMessageListener(handler);
            // Simulate a width message comming from the parent
            pymChild.scrollParentTo(hash);
        });

        it('should send navigateTo message to parent window', function(done) {
            // console.log("Spec: start", new Date().toLocaleTimeString());
            var url = "http://example.com";
            var handler = function(e) {
                if (e.data === "pymxPYMxexample3xPYMxnavigateToxPYMx"+url) {
                    // console.log("Spec: received navigateTo msg", new Date().toLocaleTimeString());
                    stub.callback(e.data);
                    expect(stub.callback).toHaveBeenCalledTimes(1);
                    done();
                }
            };
            pymChild = new pym.Child({id: 'example3'});
            registerAndAddParentMessageListener(handler);
            // Simulate a width message comming from the parent
            pymChild.navigateParentTo(url);
        });

        it('should send scrollParentToChild message to parent window', function(done) {
            // console.log("Spec: start", new Date().toLocaleTimeString());
            var handler = function(e) {
                if (e.data.lastIndexOf("pymxPYMxexample3xPYMxscrollToChildPosxPYMx", 0) === 0) {
                    // console.log("Spec: received scrollToChildPos msg", new Date().toLocaleTimeString());
                    stub.callback(e.data);
                    expect(stub.callback).toHaveBeenCalledTimes(1);
                    done();
                }
            };
            pymChild = new pym.Child({id: 'example3'});
            registerAndAddParentMessageListener(handler);
            // Simulate a width message comming from the parent
            pymChild.scrollParentToChildEl("marker");
        });

        it('should send scrollParentToChild message to parent window', function(done) {
            // console.log("Spec: start", new Date().toLocaleTimeString());
            var predictedPos = 100;
            var handler = function(e) {
                if (e.data === "pymxPYMxexample3xPYMxscrollToChildPosxPYMx"+100) {
                    // console.log("Spec: received scrollToChildPos msg", new Date().toLocaleTimeString());
                    stub.callback(e.data);
                    expect(stub.callback).toHaveBeenCalledTimes(1);
                    done();
                }
            };
            pymChild = new pym.Child({id: 'example3'});
            registerAndAddParentMessageListener(handler);
            // Simulate a width message comming from the parent
            pymChild.scrollParentToChildPos(100);
        });
    });
});
