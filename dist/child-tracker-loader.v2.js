/*! child-tracker-loader.js - v2.0.0 - 2016-11-01 */
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

    // Child Tracking messages functionality
    /**
    * Sends On Screen message to the child
    *
    * @method sendOnScreen
    * @instance
    *
    * @param {String} id The id of the element in the child that has appeared on screen
    */
    var sendOnScreen = function(id) {
        // TODO: Improve hack
        // Ignore events to empty embeds, keeps listening after unloading the page
        if (this.el.getElementsByTagName('iframe').length !== 0) {
            this.sendMessage('on-screen', id);
        }
    };

    /**
    * Listen to resize events and send the viewport height
    * to the child to allow for finer navigation
    *
    * @method onResize
    * @instance
    */
    var sendViewportHeight = function() {
        var height = window.innerHeight || document.documentElement.clientHeight;
        if (this.el.getElementsByTagName('iframe').length !== 0) {
            this.sendMessage('viewport-height', height);
        }
    };

    /**
    * Function called from the child to test if the parent has visibility tracker
    * enabled to allow for fallback options
    *
    * @method onTestVisibilityTracker
    * @instance
    */
    var onTestVisibilityTracker = function() {
        var id = location.hash;
        // TODO: Improve hack
        // Ignore events to empty embeds, keeps listening after unloading the page
        if (this.el.getElementsByTagName('iframe').length !== 0) {
            this.sendMessage('visibility-available', id);
        }
    };

    /**
    * Function fired from the child through pym messaging in order to remove a
    * given element from the visibility tracking system and avoid memory bloating
    *
    * @method onRemoveTracker
    * @instance
    *
    * @param {String} id The id of the element in the child to remove from tracking
    */
    var onRemoveTracker = function(id) {
        this.trackers[id].stopTracking();
        delete this.trackers[id];
    };

    /**
    * Function called from the child to update the parent title to show a counter
    * of the new unseen posts like twitter does
    *
    * @method onUpdateTitle
    * @instance
    */
    var onUpdateTitle = function(update) {
        update = +update;
        var m = /\((\d+)\)(.*)/.exec(document.title);
        if (m) {
            var cnt = +m[1];
            cnt = update ? cnt + update : update;
            document.title = cnt > 0 ? '(' + cnt + ')'+ m[2] : m[2].trim();
        } else if (update > 0) {
            document.title = '('+update+') ' + document.title;
        }
    };


    /**
    * Function fired from the child through pym messaging in order to add a new element
    * to the visibility tracking system
    *
    * @method onNewFactCheck
    * @instance
    *
    * @param {String} id The id of the element in the child to track
    */
    var onRequestTracking = function(local_tracker, id) {
        // Config to override default timing parameters on the visibility tracker
        //
        //    WAIT_TO_ENSURE_SCROLLING_IS_DONE: 40,
        //    WAIT_TO_MARK_READ: 500,
        //    ANIMATION_DURATION: 800
        //
        var config = {};

        if (local_tracker) {
            var t = new local_tracker.VisibilityTracker(this, id, sendOnScreen.bind(this, id), config);
            this.trackers[id] = t;
        } else {
            var tracker = new window.ChildTracker.VisibilityTracker(this, id, sendOnScreen.bind(this, id), config);
            this.trackers[id] = tracker;
        }
    };

    /**
    * Add child visibility tracking functionality
    *
    * @method addChildTracker
    * @instance
    *
    * @param {Array} Array of autoinited pymParent instances in the page
    * @param {Object} Child visibility tracker library in case it is not global (require.js)
    */
    var addChildTracker = function(autoInitInstances, local_tracker) {
        for (var idx = 0; idx < autoInitInstances.length; idx++) {
            // Create a valid scope for the tracker callbacks
            (function(idx) {
                var pymParent = autoInitInstances[idx];
                pymParent.trackers = {};
                pymParent.onMessage('test-visibility-tracker', onTestVisibilityTracker);
                pymParent.onMessage('remove-tracker', onRemoveTracker);
                pymParent.onMessage('request-tracking', onRequestTracking.bind(pymParent, local_tracker));
                pymParent.onMessage('get-viewport-height', sendViewportHeight);
                pymParent.onMessage('update-parent-title', onUpdateTitle);
                // Check for resize and send updated viewport height to the child
                window.addEventListener('resize', sendViewportHeight.bind(pymParent));
            })(idx);
        }
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
                    addChildTracker(autoInitInstances, tracker);
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
                    addChildTracker(autoInitInstances);
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
                addChildTracker(autoInitInstances);
            };
            head.appendChild(trackerScript);
        };
        head.appendChild(script);
        return true;
    };

    var pymUrl = "//pym.nprapps.org/pym.v1.min.js";
    /* Check for local testing, if the replacement has not been done yet on the build process */
    if (pymUrl.lastIndexOf('@@', 0) === 0) { pymUrl = '../../src/pym.js'; }

    var trackerUrl = "//carebot.nprapps.org/child-tracker.v2.min.js";
    /* Check for local testing, if the replacement has not been done yet on the build process */
    if (trackerUrl.lastIndexOf('@@', 0) === 0) { trackerUrl = '../../src/child-tracker.js'; }

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
            addChildTracker(autoInitInstances);
        }
        return autoInitInstances;
    };

    // Listen to page load events to account for pjax load and sync issues
    window.document.addEventListener("DOMContentLoaded", pageLoaded);
    // Fallback for wider browser support
    window.addEventListener("load", pageLoaded);

})(window.requirejs, window.jQuery);
