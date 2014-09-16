/*
* Pym.js is library that resizes an iframe based on the width of the parent and the resulting height of the child.
* Check out the docs at http://blog.apps.npr.org/pym.js/ or the readme at README.md for usage.
*/

(function(factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        window.pym = factory.call(this);
    }
})(function() {
    var MESSAGE_DELIMITER = 'xPYMx';

    var lib = {};

    /**
    * Generic function for parsing URL params.
    *
    * @method _getParameterByName
    * @param {String} name The name of the paramter to get from the URL.
    */
    var params;
    var _getParameterByName = function(name) {
        if (params) return params[name] || "";
        params = {};
        var search = window.location.search.replace(/^\?/, "");
        var pairs = search.split("&");
        pairs.forEach(function(pair) {
            var split = pair.split("=");
            params[split[0]] = split[1] ? decodeURIComponent(split[1].replace(/\+/g, " ")) : "";
        });
        return params[name];
    };

    /**
     * Check the message to make sure it comes from an acceptable xdomain.
     * Defaults to '*' but can be overriden in config.
     *
     * @method _isSafeMessage
     * @param {Event} e The message event.
     * @param {Object} settings Configuration.
     */
    var _isSafeMessage = function(e, settings) {
        if (settings.xdomain !== '*') {
            // If origin doesn't match our xdomain, return.
            if (!e.origin.match(new RegExp(settings.xdomain + '$'))) { return; }
        }

        return true;
    };

    /**
     * Construct a message to send between frames.
     *
     * NB: We use string-building here because JSON message passing is
     * not supported in all browsers.
     *
     * @method _makeMessage
     * @param {String} id The unique id of the message recipient.
     * @param {String} messageType The type of message to send.
     * @param {String} message The message to send.
     */
    var _makeMessage = function(id, messageType, message) {
        var bits = ['pym', id, messageType, message];

        return bits.join(MESSAGE_DELIMITER);
    };

    /**
     * Construct a regex to validate and parse messages.
     *
     * @method _makeMessageRegex
     * @param {String} id The unique id of the message recipient.
     */
    var _makeMessageRegex = function(id) {
        var bits = ['pym', id, '(\\S+)', '(.+)'];

        return new RegExp('^' + bits.join(MESSAGE_DELIMITER) + '$');
    };

    /**
     * Initialize Pym for elements on page that have data-pym attributes.
     *
     * @method _autoInit
     */
    var _autoInit = function() {
        var elements = document.querySelectorAll(
            '[data-pym-src]:not([data-pym-auto-initialized])'
        );

        var length = elements.length;

        for (var idx = 0; idx < length; ++idx) {
            var element = elements[idx];

            /*
            * Mark automatically-initialized elements so they are not
            * re-initialized if the user includes pym.js more than once in the
            * same document.
            */
            element.setAttribute('data-pym-auto-initialized', '');

            // Ensure elements have an id
            if (element.id === '') {
                element.id = 'pym-' + idx;
            }

            var src = element.getAttribute('data-pym-src');
            var xdomain = element.getAttribute('data-pym-xdomain');
            var config = {};

            if (xdomain) {
               config.xdomain = xdomain;
            }

            new lib.Parent(element.id, src, config);
        }
    };

    /**
     * The Parent half of a response iframe.
     *
     * @class Parent
     * @param {String} id The id of the div into which the iframe will be rendered.
     * @param {String} url The url of the iframe source.
     * @param {Object} config Configuration to override the default settings.
     */
    var Parent = function(id, url, config) {
        //guard against missing `new`
        if (!(this instanceof Parent)) {
            return new Parent(id, url, config);
        }

        this.id = id;
        this.url = url;
        this.el = document.getElementById(id);
        this.iframe = null;

        this.settings = {
            xdomain: '*'
        };

        this.messageRegex = _makeMessageRegex(this.id); 
        this.messageHandlers = {};

        // Add any overrides to settings coming from config.
        for (var key in config) {
            this.settings[key] = config[key];
        }

        // Add height event callback 
        this.onMessage('height', this._onHeightMessage);

        // Add a listener for processing messages from the child.
        var that = this;
        window.addEventListener('message', function(e) {
            return that._processMessage(e);
        }, false);

        // Construct the iframe in the container element.
        this._constructIframe();
    };

        /**
         * Construct the iframe.
         *
         * @memberof Parent.prototype
         * @method _constructIframe
         */
    Parent.prototype = {
        _constructIframe: function() {
            // Calculate the width of this element.
            var width = this.el.offsetWidth;

            // Create an iframe element attached to the document.
            this.iframe = document.createElement("iframe");

            // Save fragment id
            var hash = '';
            var hashIndex = this.url.indexOf('#');

            if (hashIndex > -1) {
                hash = this.url.substring(hashIndex, this.url.length);
                this.url = this.url.substring(0, hashIndex);
            }

            // If the URL contains querystring bits, use them.
            // Otherwise, just create a set of valid params.
            if (this.url.indexOf('?') < 0) {
                this.url += '?';
            } else {
                this.url += '&';
            }
            
            // Append the initial width as a querystring parameter, and the fragment id
            this.iframe.src = this.url + 'initialWidth=' + width + '&childId=' + this.id + hash;

            // Set some attributes to this proto-iframe.
            this.iframe.setAttribute('width', '100%');
            this.iframe.setAttribute('scrolling', 'no');
            this.iframe.setAttribute('marginheight', '0');
            this.iframe.setAttribute('frameborder', '0');

            // Append the iframe to our element.
            this.el.appendChild(this.iframe);

            // Add an event listener that will handle redrawing the child on resize.
            var that = this;
            window.addEventListener('resize', function() {
                that.sendWidth();
            });
        },

        /**
         * Fire all event handlers for a given message type.
         *
         * @memberof Parent.prototype
         * @method _fire
         * @param {String} messageType The type of message.
         * @param {String} message The message data.
         */
        _fire: function(messageType, message) {
            if (messageType in this.messageHandlers) {
                for (var i = 0; i < this.messageHandlers[messageType].length; i++) {
                   this.messageHandlers[messageType][i].call(this, message);
                }
            }
        },

        /**
         * @callback Parent~onMessageCallback
         * @param {String} message The message data.
         */

        /**
         * Process a new message from the child.
         *
         * @memberof Parent.prototype
         * @method _processMessage
         * @param {Event} e A message event.
         */
        _processMessage: function(e) {
            if (!_isSafeMessage(e, this.settings)) { return; }

            // Grab the message from the child and parse it.
            var match = e.data.match(this.messageRegex);

            // If there's no match or too many matches in the message, punt.
            if (!match || match.length !== 3) {
                return false;
            }

            var messageType = match[1];
            var message = match[2];

            this._fire(messageType, message);
        },

        /**
         * Resize iframe in response to new height message from child.
         *
         * @memberof Parent.prototype
         * @method _onHeightMessage
         * @param {String} message The new height.
         */
        _onHeightMessage: function(message) {
            /*
             * Handle parent message from child.
             */
            var height = parseInt(message);
            
            this.iframe.setAttribute('height', height + 'px');
        },


        /**
         * Bind a callback to a given messageType from the child.
         *
         * @memberof Parent.prototype
         * @method onMessage
         * @param {String} messageType The type of message being listened for.
         * @param {Parent~onMessageCallback} callback The callback to invoke when a message of the given type is received.
         */
        onMessage: function(messageType, callback) {
            if (!(messageType in this.messageHandlers)) {
                this.messageHandlers[messageType] = [];
            }

            this.messageHandlers[messageType].push(callback);
        },

        /**
         * Send a message to the the child.
         *
         * @memberof Parent.prototype
         * @method sendMessage
         * @param {String} messageType The type of message to send.
         * @param {String} message The message data to send.
         */
        sendMessage: function(messageType, message) {
            this.el.getElementsByTagName('iframe')[0].contentWindow.postMessage(_makeMessage(this.id, messageType, message), '*');
        },

        /**
         * Transmit the current iframe width to the child.
         *
         * You shouldn't need to call this directly.
         *
         * @memberof Parent.prototype
         * @method sendWidth
         */
        sendWidth: function() {
            var width = this.el.offsetWidth;

            this.sendMessage('width', width);
        }
    };

    /**
     * The Child half of a responsive iframe.
     *
     * @class Child
     * @param {Object} config Configuration to override the default settings.
     */
    var Child = function(config) {
        //guard against missing `new`
        if (!(this instanceof Child)) {
            return new Child(config);
        }

        this.parentWidth = null;
        this.id = null;

        this.settings = {
            renderCallback: null,
            xdomain: '*',
            polling: 0
        };

        this.messageRegex = null;
        this.messageHandlers = {};

        // Identify what ID the parent knows this child as.
        this.id = _getParameterByName('childId');
        this.messageRegex = new RegExp('^pym' + MESSAGE_DELIMITER + this.id + MESSAGE_DELIMITER + '(\\S+)' + MESSAGE_DELIMITER + '(.+)$');

        // Get the initial width from a URL parameter.
        var width = parseInt(_getParameterByName('initialWidth'));

        // Bind the width message handler
        this.onMessage('width', this._onWidthMessage);

        // Initialize settings with overrides.
        for (var key in config) {
            this.settings[key] = config[key];
        }

        // Set up a listener to handle any incoming messages.
        var that = this;
        window.addEventListener('message', function(e) {
            that._processMessage(e);
        }, false);

        // If there's a callback function, call it.
        if (this.settings.renderCallback) {
            this.settings.renderCallback(width);
        }

        // Send the initial height to the parent.
        this.sendHeight();

        // If we're configured to poll, create a setInterval to handle that.
        if (this.settings.polling) {
            window.setInterval(this.sendHeight.bind(this), this.settings.polling);
        }

    };

    Child.prototype = {

        /**
         * Bind a callback to a given messageType from the child.
         *
         * @memberof Child.prototype
         * @method onMessage
         * @param {String} messageType The type of message being listened for.
         * @param {Child~onMessageCallback} callback The callback to invoke when a message of the given type is received.
         */
        onMessage: function(messageType, callback) {
            if (!(messageType in this.messageHandlers)) {
                this.messageHandlers[messageType] = [];
            }

            this.messageHandlers[messageType].push(callback);
        },

        /**
         * @callback Child~onMessageCallback
         * @param {String} message The message data.
         */

        /**
         * Fire all event handlers for a given message type.
         *
         * @memberof Parent.prototype
         * @method _fire
         * @param {String} messageType The type of message.
         * @param {String} message The message data.
         */
        _fire: function(messageType, message) {
            /*
             * Fire all event handlers for a given message type.
             */
            if (messageType in this.messageHandlers) {
                for (var i = 0; i < this.messageHandlers[messageType].length; i++) {
                   this.messageHandlers[messageType][i].call(this, message);
                }
            }
        },

        /**
         * Process a new message from the parent.
         *
         * @memberof Child.prototype
         * @method _processMessage
         * @param {Event} e A message event.
         */
        _processMessage: function(e) {
            /*
            * Process a new message from parent frame.
            */
            // First, punt if this isn't from an acceptable xdomain.
            if (!_isSafeMessage(e, this.settings)) { return; }

            // Get the message from the parent.
            var match = e.data.match(this.messageRegex);

            // If there's no match or it's a bad format, punt.
            if (!match || match.length !== 3) { return; }

            var messageType = match[1];
            var message = match[2];

            this._fire(messageType, message);
        },

        /**
         * Send a message to the the Parent.
         *
         * @memberof Child.prototype
         * @method sendMessage
         * @param {String} messageType The type of message to send.
         * @param {String} message The message data to send.
         */
        sendMessage: function(messageType, message) {
            /*
             * Send a message to the parent.
             * Note: Previously window.top, but that breaks in iframe previews for some CMSs
             */
            window.parent.postMessage(_makeMessage(this.id, messageType, message), '*');
        },

        /**
         * Transmit the current iframe height to the parent.
         *
         * Call this directly in cases where you manually alter the height of the iframe contents.
         *
         * @memberof Child.prototype
         * @method sendHeight
         */
        sendHeight: function() {
            /*
            * Transmit the current iframe height to the parent.
            * Make this callable from external scripts in case they update the body out of sequence.
            */

            // Get the child's height.
            var height = document.body.offsetHeight;

            // Send the height to the parent.
            this.sendMessage('height', height);
        },

        /**
         * Resize iframe in response to new width message from parent.
         *
         * @memberof Child.prototype
         * @method _onWidthMessage
         * @param {String} message The new width.
         */
        _onWidthMessage: function(message) {
            /*
             * Handle width message from the child.
             */
            var width = parseInt(message);

            // Change the width if it's different.
            if (width !== this.parentWidth) {
                this.parentWidth = width;

                // Call the callback function if it exists.
                if (this.settings.renderCallback) {
                    this.settings.renderCallback(width);
                }

                // Send the height back to the parent.
                this.sendHeight();
            }
        }
    };

    lib.Child = Child;
    lib.Parent = Parent;

    // Initialize elements with pym data attributes
    _autoInit();

    return lib;
});
