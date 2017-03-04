describe('pymParent', function() {

    beforeEach(function() {
        document.body.innerHTML = '<div id="parent"><p id="placeholder"></p></div>';
    });

    afterEach(function() {
        // Clean pymParent
        pymParent = null;
        document.body.innerHTML = '';
    });

    describe('config', function() {
        afterEach(function() {
            pymParent.remove();
        });

        var pymParent;
        var url = 'http://localhost:9876/base/test/html/child.html';



        it('should have replace the contents of the container', function() {
            pymParent = new pym.Parent('parent', url, {});
            expect(document.getElementById('placeholder')).toBeNull();
        });

        it('should have an element once initialized', function() {
            pymParent = new pym.Parent('parent', url, {});
            expect(pymParent.el).toBeDefined();
        });

        it('should have an iframe once initialized', function() {
            pymParent = new pym.Parent('parent', url, {});
            expect(pymParent.iframe).toBeDefined();
        });

        it('should have an url defined once initialized', function() {
            pymParent = new pym.Parent('parent', url, {});
            expect(pymParent.url).toEqual(url+'?');
        });

        it('should be able to overwrite properties through config', function() {
            var xdomain = '\\*\.npr\.org'
            pymParent = new pym.Parent('parent', url, {xdomain: xdomain,
                                                       parenturlparam: 'test',
                                                       parenturlvalue: 'http://www'});
            var iframe = pymParent.iframe;
            expect(pymParent.settings.xdomain).toEqual(xdomain);
            expect(pymParent.settings.parenturlparam).toEqual('test');
            expect(pymParent.settings.parenturlvalue).toEqual('http://www');
            expect(iframe.src).toContain('test=http%3A%2F%2Fwww');

        });

        it('should be able to ignore optional params through config', function() {
            pymParent = new pym.Parent('parent', url, {optionalparams: false,
                                                       parenturlparams: 'test',
                                                       parenturlvalue: 'http://www'});
            var iframe = pymParent.iframe;
            expect(pymParent.settings.optionalparams).toEqual(false);
            expect(iframe.src).not.toContain('test=http%3A%2F%2Fwww');

        });

        it('should be able to add allowfullscreen attribute to iframe', function() {
            var allowfullscreen = true;
            pymParent = new pym.Parent('parent', url, {allowfullscreen: allowfullscreen});
            var iframe = pymParent.iframe;
            expect(pymParent.settings.allowfullscreen).toEqual(allowfullscreen);
            expect(iframe.getAttribute('allowfullscreen')).toEqual('');
        });

        it('should ignore allowfullscreen attribute if set to false to iframe', function() {
            var allowfullscreen = false;
            pymParent = new pym.Parent('parent', url, {allowfullscreen: allowfullscreen});
            var iframe = pymParent.iframe;
            expect(pymParent.settings.allowfullscreen).toEqual(allowfullscreen);
            expect(iframe.getAttribute('allowfullscreen')).toBeNull();
        });

        it('should be able to add id attribute to iframe', function() {
            var id = 'test';
            pymParent = new pym.Parent('parent', url, {id: id});
            var iframe = pymParent.iframe;
            expect(pymParent.settings.id).toEqual(id);
            expect(iframe.getAttribute('id')).toEqual(id);
        });

        it('should be able to add name attribute to iframe', function() {
            var name = 'test';
            pymParent = new pym.Parent('parent', url, {name: name});
            var iframe = pymParent.iframe;
            expect(pymParent.settings.name).toEqual(name);
            expect(iframe.getAttribute('name')).toEqual(name);
        });

        it('should be able to add sandbox attribute to iframe', function() {
            pymParent = new pym.Parent('parent', url, {sandbox: 'allow-scripts'});
            var iframe = pymParent.iframe;
            expect(iframe.getAttribute('sandbox')).toEqual('allow-scripts');
        });

        it('should not be able to add sandbox attribute if not a string to iframe', function() {
            pymParent = new pym.Parent('parent', url, {sandbox: 0});
            var iframe = pymParent.iframe;
            expect(iframe.getAttribute('sandbox')).toBeNull();
        });
    });

    describe('contructIframe method', function() {
        var pymParent;
        var url = 'http://localhost:9876/base/test/html/child.html';

        afterEach(function() {
            pymParent.remove();
        });

        it('should include hash in iframe.src if given in the original url', function() {
            var hash = '#param1=5&param2=test'
            url = 'http://localhost:9876/base/test/html/child.html'+hash;
            pymParent = new pym.Parent('parent', url, {});
            var iframe = pymParent.iframe;
            expect(pymParent.iframe.getAttribute('src')).toContain(hash);
        });

        it('should respect query parameters given in the original url', function() {
            var query = '?param1=5&param2=test'
            url = 'http://localhost:9876/base/test/html/child.html'+query;
            pymParent = new pym.Parent('parent', url, {});
            var iframe = pymParent.iframe;
            expect(pymParent.iframe.getAttribute('src')).toContain(query);
        });
    });

    describe('remove method', function() {
        var pymParent;
        var url = 'http://localhost:9876/base/test/html/child.html';

        it('should have not listen to resize events once removed', function(done) {
            // console.log("Spec: start", new Date().toLocaleTimeString());
            pymParent = new pym.Parent('parent', url, {});
            spyOn(pymParent, 'sendWidth').and.callThrough();
            pymParent.remove();
            // IE9 does not support Event constructor
            // via: http://stackoverflow.com/questions/1818474/how-to-trigger-the-window-resize-event-in-javascript/18693617#18693617
            var evt = window.document.createEvent('UIEvents');
            evt.initUIEvent('resize', true, false, window, 0);
            window.dispatchEvent(evt);
            setTimeout(function() {
                // console.log("Spec: timer 1s has ended check results", new Date().toLocaleTimeString());
                expect(pymParent.sendWidth).not.toHaveBeenCalled();
                done();
            }, 1000);
        });

        it('should have not listen to message events once removed', function(done) {
            // console.log("Spec: start", new Date().toLocaleTimeString());
            function handler(e) {
                // console.log("Spec: generic listener has received height msg", new Date().toLocaleTimeString());
                window.removeEventListener('message',handler);
                expect(pymParent.iframe.getAttribute('height')).toMatch(/1(px)?/);
                done();
            };
            pymParent = new pym.Parent('parent', url, {});
            var iframe = pymParent.iframe;
            var old_height = iframe.setAttribute("height", "1px");
            pymParent.remove();
            window.addEventListener('message',handler,false);
            window.postMessage('pymxPYMxparentxPYMxheightxPYMx100', '*');
        });

        it('should have no content on the container once remove has been called', function() {
            pymParent = new pym.Parent('parent', url, {});
            spyOn(pymParent, 'sendWidth').and.callThrough();
            pymParent.remove();
            expect(pymParent.el.childElementCount).toEqual(0);
        });

    });
});
