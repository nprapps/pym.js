describe('pym', function() {
    var stub = {
        log: function(e) {
            console.log(e.target);
        },
        handler: function(e) {
            //console.log("handler: msg: " + msg);
        },
    }

    var manualCustomlisteners = [];

    function registerAndAddCustomListener(f) {
        document.addEventListener('pym:pym-initialized',f,false);
        manualCustomlisteners.push(f);
    };

    function removeManualCustomListeners() {
        for (var i=0; i < manualCustomlisteners.length; i++){
            document.removeEventListener("pym:pym-initialized", manualCustomlisteners[i]);
        }
        manualCustomlisteners = [];
    };


    var elements = [];

    beforeEach(function() {
        document.body.innerHTML = __html__['test/html-fixtures/autoinit_single_template.html'];
    });

    afterEach(function() {
        document.body.innerHTML = '';
    });

    describe('autoinit', function() {

        //TODO find a way to test autoinit on startup it seems that karma
        // is executing pym outside of this sandbox somehow so the document
        // that is viewed from inside the pym library has not the autoinit_template body.

        it('the auto init element should have id "auto-init-test1"', function() {
            var elements = window.pym.autoInit();
            expect(elements[0].id).toBe('auto-init-test1');
            expect(elements.length).toEqual(1);
        });

        it('the auto init should allow multiple instances', function() {
            document.body.innerHTML = __html__['test/html-fixtures/autoinit_multiple_template.html'];
            var elements = window.pym.autoInit();
            expect(elements.length).toEqual(3);
        });

        it('autoinit should mark as initialized all instances', function() {
            document.body.innerHTML = __html__['test/html-fixtures/autoinit_multiple_template.html'];
            var elements = window.pym.autoInit();
            var not_init = document.querySelectorAll('[data-pym-src]:not([data-pym-auto-initialized])').length;
            var inited = document.querySelectorAll('[data-pym-src]').length;
            expect(not_init).toEqual(0);
            expect(inited).toEqual(3);
        });

        it('autoinited instances should be accesible through its own variable', function() {
            document.body.innerHTML = __html__['test/html-fixtures/autoinit_multiple_template.html'];
            var elements = window.pym.autoInit();
            var instances = window.pym.autoInitInstances;
            expect(instances.length).toEqual(3);
            expect(elements).toEqual(instances);
        });

        it('it should clean an instance if removed if called on it', function() {
            document.body.innerHTML = __html__['test/html-fixtures/autoinit_multiple_template.html'];
            var elements = window.pym.autoInit();
            expect(elements.length).toEqual(3);
            elements[0].remove();
            expect(elements.length).toEqual(2);
        });

        it('it should also clean an instance on autoInit if it has become an empty container', function() {
            document.body.innerHTML = __html__['test/html-fixtures/autoinit_multiple_template.html'];
            var elements = window.pym.autoInit();

            expect(elements.length).toEqual(3);
            // Remove iframe from the container element
            elements[0].el.removeChild(elements[0].iframe);
            elements = window.pym.autoInit();
            expect(elements.length).toEqual(2);
        });

        it('autoinit should allow passing config through data attributes', function() {
            document.body.innerHTML = __html__['test/html-fixtures/autoinit_data_attrs_template.html'];
            var elements = window.pym.autoInit();
            var not_init = document.querySelectorAll('[data-pym-src]:not([data-pym-auto-initialized])').length;
            var inited = document.querySelectorAll('[data-pym-src]').length;
            var iframe = elements[0].iframe;
            expect(not_init).toEqual(0);
            expect(inited).toEqual(1);
            expect(iframe.getAttribute('allowfullscreen')).toEqual('');
            expect(iframe.getAttribute('id')).toEqual('exampleid');
            expect(iframe.getAttribute('name')).toEqual('examplename');
            expect(iframe.getAttribute('title')).toEqual('exampletitle');
            expect(iframe.getAttribute('sandbox')).toEqual('allow-scripts allow-same-origin allow-top-navigation');
            expect(iframe.src).toEqual(jasmine.stringMatching('childId=auto-init-test1&parentTitle=&test=http%3A%2F%2Fwww.example.com'));
        });

        it('autoinit should allow passing optionalparams as a data-attribute', function() {
            document.body.innerHTML = __html__['test/html-fixtures/autoinit_data_attrs_optional_template.html'];
            var elements = window.pym.autoInit();
            var not_init = document.querySelectorAll('[data-pym-src]:not([data-pym-auto-initialized])').length;
            var inited = document.querySelectorAll('[data-pym-src]').length;
            var iframe = elements[0].iframe;
            expect(not_init).toEqual(0);
            expect(inited).toEqual(1);
            expect(iframe.getAttribute('allowfullscreen')).toEqual('');
            expect(iframe.getAttribute('id')).toEqual('exampleid');
            expect(iframe.getAttribute('name')).toEqual('examplename');
            expect(iframe.getAttribute('title')).toEqual('exampletitle');
            expect(iframe.getAttribute('sandbox')).toEqual('allow-scripts allow-same-origin allow-top-navigation');
            expect(iframe.src).not.toContain('parentTitle=&test=http%3A%2F%2Fwww.example.com');
        });
    });

    describe('custom events', function() {
        beforeEach(function() {
            spyOn(stub, 'handler').and.callThrough();
        });

        afterEach(function() {
            //jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
            stub.handler.calls.reset();
            // Stop listeners
            removeManualCustomListeners();
            document.body.innerHTML = '';
        });

        it('should fire a custom event when autoinit is executed', function(done) {
            function handler(e) {
                stub.handler(e);
                expect(stub.handler).toHaveBeenCalledTimes(1);
                done();
            };
            registerAndAddCustomListener(handler);
            var elements = window.pym.autoInit();
        });
    });

});
