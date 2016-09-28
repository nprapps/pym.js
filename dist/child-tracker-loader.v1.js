/*! child-tracker-loader.js - v1.1.0 - 2016-09-27 */
/*
* debates-loader.js is a wrapper library that deals with particular CMS scenarios to successfully load Pym.js and required tracking code
* into a given page. To find out more about Pym.js check out the docs at http://blog.apps.npr.org/pym.js/ or the readme at README.md for usage.
*/

/** @module debates-loader */
(function(requirejs, jQuery) {
    /**
    * Initialize pym instances if Pym.js itself is available
    *
    * @method initializePym
    * @instance
    *
    * @param {String} pym Pym.js loaded library.
    */
    var initializePym = function(pym) {
        if(pym) {
            return pym.autoInit();
        }
        return null;
    };

    /**
     * Load pym with Requirejs if it is available on the page
     * Used in CorePublisher CMS member sites with persistent players
     * Create a different context to allow multiversion
     * via: http://requirejs.org/docs/api.html#multiversion
     *
     * @method tryLoadingWithRequirejs
     * @instance
     *
     * @param {String} pymUrl Url where Pym.js can be found
     */
    var tryLoadingWithRequirejs = function(pymUrl, trackerUrl) {
        if (typeof requirejs !== 'undefined') {
            // Requirejs config wants bare name, not the extension
            pymUrl = pymUrl.split(".js")[0];
            trackerUrl = trackerUrl.split(".js")[0];
            var context = 'context_debates_' + pymUrl.split('/').slice(-1)[0];
            // Requirejs detected, create a local require.js namespace
            var require_pym = requirejs.config({
                context: context,
                paths: {
                    'pym': pymUrl,
                    'tracker': trackerUrl
                 },
                shim: {
                    'pym': { exports: 'pym' },
                    'tracker': { exports: 'tracker' }
                }
            });

            // Load pym into local namespace
            require_pym(['require', 'pym', 'tracker'],
                        function(require, pym, tracker) {
                var autoInitInstances = initializePym(pym);

                if (autoInitInstances) {
                    for (var i = 0; i< autoInitInstances.length; i++) {
                        var pymParent = autoInitInstances[i];
                        pymParent.trackers = {};
                        pymParent.onMessage('test-visibility-tracker', function() {
                            pymParent.sendMessage('visibility-available', 'true');
                        });

                        pymParent.onMessage('remove-tracker', function(id) {
                            pymParent.trackers[id].stopTracking();
                            delete pymParent.trackers[id];
                        });

                        pymParent.onMessage('new-fact-check', function(id) {
                            var t = new tracker.VisibilityTracker(pymParent, id, function() {
                                pymParent.sendMessage('on-screen', id);
                            });
                            pymParent.trackers[id] = t;
                        }.bind(tracker));
                    }
                } else {
                    console.error("did not find any pym instance on autoInit");
                }

            });
            return true;
        }
        return false;
    };

    /**
     * Load pym and visibility tracker through jQuery async getScript module
     * Since this loader can be embedded multiple times in the same post
     * the function manages a global flag called pymloading to avoid
     * possible race conditions
     *
     * @method tryLoadingWithJQuery
     * @instance
     *
     * @param {String} pymUrl Url where Pym.js can be found
     */

    var tryLoadingWithJQuery = function(pymUrl, trackerUrl) {
        if (typeof jQuery !== 'undefined' && typeof jQuery.getScript === 'function') {
            jQuery.getScript(pymUrl).done(function() {
                var autoInitInstances = initializePym(window.pym);
                jQuery.getScript(trackerUrl).done(function () {
                    for (var i = 0; i< autoInitInstances.length; i++) {
                        var pymParent = autoInitInstances[i];
                        pymParent.trackers = {};
                        pymParent.onMessage('test-visibility-tracker', function() {
                            pymParent.sendMessage('visibility-available', 'true');
                        });

                        pymParent.onMessage('remove-tracker', function(id) {
                            pymParent.trackers[id].stopTracking();
                            delete pymParent.trackers[id];
                        });

                        pymParent.onMessage('new-fact-check', function(id) {
                            var tracker = new window.ChildTracker.VisibilityTracker(pymParent, id, function() {
                                pymParent.sendMessage('on-screen', id);
                            });
                            pymParent.trackers[id] = tracker;
                        });
                    }
                });
            });
            return true;
        }
        return false;
    };

    /**
     * As another loading fallback approach
     * try to append the script tag to the head of the document
     * via http://stackoverflow.com/questions/6642081/jquery-getscript-methods-internal-process
     * via http://unixpapa.com/js/dyna.html
     *
     * @method loadPymViaEmbedding
     * @instance
     *
     * @param {String} pymUrl Url where Pym.js can be found
     */
    var loadViaEmbedding = function(pymUrl, trackerUrl) {
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = pymUrl;
        script.onload = function() {
            // Remove the script tag once pym it has been loaded
            if (head && script.parentNode) {
                head.removeChild(script);
            }
            var autoInitInstances = initializePym(window.pym);
            head = document.getElementsByTagName('head')[0];
            var trackerScript = document.createElement('script');
            trackerScript.type = 'text/javascript';
            trackerScript.src = trackerUrl;
            trackerScript.onload = function() {
                // Remove the script tag once pym it has been loaded
                if (head && script.parentNode) {
                    head.removeChild(script);
                }

                // Start tracking
                for (var i = 0; i< autoInitInstances.length; i++) {
                    var pymParent = autoInitInstances[i];
                    pymParent.trackers = {};
                    pymParent.onMessage('test-visibility-tracker', function() {
                        pymParent.sendMessage('visibility-available', 'true');
                    });

                    pymParent.onMessage('remove-tracker', function(id) {
                        pymParent.trackers[id].stopTracking();
                        delete pymParent.trackers[id];
                    });

                    pymParent.onMessage('new-fact-check', function(id) {
                        var tracker = new window.ChildTracker.VisibilityTracker(pymParent, id, function() {
                            pymParent.sendMessage('on-screen', id);
                        });
                        pymParent.trackers[id] = tracker;
                    });
                }
            };
            head.appendChild(trackerScript);
        };
        head.appendChild(script);
        return true;
    };

    var pymUrl = "//pym.nprapps.org/pym.v1.min.js";
    /* Check for local testing, if the replacement has not been done yet on the build process */
    if (pymUrl.lastIndexOf('@@', 0) === 0) { pymUrl = '//pym.nprapps.org/pym.v1.min.js'; }

    var trackerUrl = "//carebot.nprapps.org/child-tracker.v1.min.js";
    /* Check for local testing, if the replacement has not been done yet on the build process */
    if (trackerUrl.lastIndexOf('@@', 0) === 0) { trackerUrl = '//carebot.nprapps.org///child-tracker.v1.min.js'; }

    tryLoadingWithRequirejs(pymUrl, trackerUrl) || tryLoadingWithJQuery(pymUrl, trackerUrl) || loadViaEmbedding(pymUrl, trackerUrl);

    /**
     * Callback to initialize Pym.js on document load events
     *
     * @method pageLoaded
     * @instance
     */
    var pageLoaded = function() {
        document.removeEventListener("DOMContentLoaded", pageLoaded);
        window.removeEventListener("load", pageLoaded);
        var autoInitInstances = initializePym(window.pym);
        if (autoInitInstances && typeof ChildTracker !== 'undefined') {
            // Start tracking
            for (var i = 0; i< autoInitInstances.length; i++) {
                var pymParent = autoInitInstances[i];
                pymParent.trackers = {};
                pymParent.onMessage('test-visibility-tracker', function() {
                    pymParent.sendMessage('visibility-available', 'true');
                });

                pymParent.onMessage('remove-tracker', function(id) {
                    pymParent.trackers[id].stopTracking();
                    delete pymParent.trackers[id];
                });

                pymParent.onMessage('new-fact-check', function(id) {
                    var tracker = new window.ChildTracker.VisibilityTracker(pymParent, id, function() {
                        pymParent.sendMessage('on-screen', id);
                    });
                    pymParent.trackers[id] = tracker;
                });
            }
        }
        return autoInitInstances;
    };

    // Listen to page load events to account for pjax load and sync issues
    window.document.addEventListener("DOMContentLoaded", pageLoaded);
    // Fallback for wider browser support
    window.addEventListener("load", pageLoaded);

})(window.requirejs, window.jQuery);
