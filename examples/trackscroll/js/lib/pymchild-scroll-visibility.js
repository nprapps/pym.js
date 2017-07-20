/** @module PymChildScrollVisibility */
(function(factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    }
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        window.PymChildScrollVisibility = factory.call(this);
    }
})(function() {
    var lib = {};

    // A simple wrapper for starting and clearing a timeout
    var Timer = function(callback, duration) {
        var alerter;

        function start() {
            if (callback && duration) {
                alerter = setTimeout(callback, duration);
            }
        }

        function stop() {
            clearTimeout(alerter);
        }

        return {
            start: start,
            stop: stop
        };
    };

    /**
     * Tracks if an element is visible and optionally triggers a timer to mark read status.
     *
     * @class Tracker
     * @param {String} id The id of the element the tracker will watch.
     * @param {Function} visible_callback Will be called everytime to tracked element is visible.
     * @param {Function} read_callback Will be called on every new time bucket.
     * @param {Object} config Configuration to override the default settings.
     */
    lib.Tracker = function(id, visible_callback, read_callback, config) {
        /**
         * The Tracker settings
         *
         * @memberof module:PymChildScrollVisibility.Tracker
         * @member {Object} settings
         * @inner
         */
        this.settings = {
            partial: true,
            read: (typeof read_callback === 'function'),
            read_time: 500,
        };

        this.id = id;
        this.isVisible = false;

        // Ensure a config object
        config = (config || {});

        // Add any overrides to settings coming from config.
        for (var key in config) {
            this.settings[key] = config[key];
        }

        function _parseInfo(info) {
            var infoArray = info.split(' ');
            var infoObj = {
                'vWidth': parseFloat(infoArray[0]),
                'vHeight': parseFloat(infoArray[1]),
                'iframeTop': parseFloat(infoArray[2]),
                'iframeLeft': parseFloat(infoArray[3]),
                'iframeBottom': parseFloat(infoArray[4]),
                'iframeRight': parseFloat(infoArray[5]),
            };

            return infoObj;
        }

        var isElementInViewport = function(parentObj) {
            console.log('parentObj',parentObj);
            var container = document.getElementById(this.id);
            // Ignore messages sent to posts that
            // have deing deleted from page
            if (!container) { return; }
            var rect = container.getBoundingClientRect();
            console.log('rect', rect);

            // Track partial visibility
            if (this.settings.partial) {
                // For partial visibility
                //   Vertically: -rect.bottom <= iframeRect.top <= vHeight - rect.top
                //   Horizontally: -rect.right <= iframeRect.left <= vWidth - rect.left
                if ((parentObj.iframeTop <= parentObj.vHeight - rect.top &&
                     parentObj.iframeTop >= -rect.bottom) &&
                    (parentObj.iframeLeft <= parentObj.vWidth - rect.left &&
                     parentObj.iframeLeft >= -rect.right)) {
                        return true;
                }
            }

            // Track complete visibility
            // For complete visibility
            //   Vertically: -rect.top <= iframeRect.top <= vHeight - rect.bottom
            //   Horizontally: -rect.left <= iframeRect.left <= vWidth - rect.right
            if ((parentObj.iframeTop <= parentObj.vHeight - rect.bottom &&
                 parentObj.iframeTop >= -rect.top) &&
                (parentObj.iframeLeft <= parentObj.vWidth - rect.right &&
                 parentObj.iframeLeft >= -rect.left)) {
                    return true;
            }
            return false;
        };

        this.checkIfVisible = function(parentInfo) {
            var parentObj = _parseInfo(parentInfo);
            var newVisibility = isElementInViewport.call(this, parentObj);
            console.log('isVisible', this.isVisible, 'newVisibility', newVisibility);
            // Stop timer if element is out of viewport now
            if (this.isVisible && !newVisibility && this.settings.read) {
                timer.stop();
            }

            if (!this.isVisible && newVisibility) {
                if (this.settings.read) {
                    timer.start();
                }
                visible_callback(this.id);
            }

            this.isVisible = newVisibility;
            return this.isVisible;
        }


        if (this.settings.read) {
            var _read_callback = function() {
                read_callback(this.id);
            };
            var timer = new Timer(_read_callback.bind(this), this.settings.read_time);
        }

        this.stopTimer = function() {
            if (this.settings.read) {
                timer.stop();
            }
        };

        return this;
    };
    return lib;
});
