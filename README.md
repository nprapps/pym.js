Pym.js
======

[![Build Status](https://travis-ci.org/nprapps/pym.js.svg?branch=master)](https://travis-ci.org/nprapps/pym.js)
[![Sauce Test Status](https://saucelabs.com/buildstatus/jjelosua)](https://saucelabs.com/u/jjelosua)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/jjelosua.svg)](https://saucelabs.com/u/jjelosua)

* [What is this?](#what-is-this)
* [Assumptions](#assumptions)
* [What's in here?](#whats-in-here)
* [Bootstrap the project](#bootstrap-the-project)
* [Hide project secrets](#hide-project-secrets)
* [Run the project](#run-the-project)
* [Test the project](#test-the-project)
* [Build the project](#build-the-project)
* [Versioning](#versioning)
* [What is the loader script for? Why do we need it?](#what-is-the-loader-script-for-why-do-we-need-it)
* [License and credits](#license-and-credits)
* [Additional contributors](#additional-contributors)


What is this?
-------------

Using iframes in a responsive page can be frustrating. It&rsquo;s easy enough to make an iframe&rsquo;s width span 100% of its container, but sizing its height is tricky &mdash; especially if the content of the iframe changes height depending on page width (for example, because of text wrapping or media queries) or events within the iframe.

<a href="https://raw.githubusercontent.com/nprapps/pym.js/master/src/pym.js">Pym.js</a> embeds and resizes an iframe responsively (width and height) within its parent container. It also bypasses the usual cross-domain issues.

Use case: The NPR Visuals team uses Pym.js to embed small custom bits of code (charts, maps, etc.) inside our CMS without CSS or JavaScript conflicts. [See an example of this in action.](http://www.npr.org/2014/03/25/293870089/maze-of-college-costs-and-aid-programs-trap-some-families)

## [&rsaquo; Read the documentation](http://blog.apps.npr.org/pym.js/)

## [&rsaquo; Browse the API](http://blog.apps.npr.org/pym.js/api/pym.js/1.2.2/)

Assumptions
-----------

The following things are assumed to be true in this documentation.

* You are running OS X.
* You have installed Node.js.
* You have installed Grunt globally.

For more details on the technology stack used in NPR Visuals' app template, see our [development environment blog post](http://blog.apps.npr.org/2013/06/06/how-to-setup-a-developers-environment.html).

Modern versions of Windows and Linux should work equally well but are untested by the NPR Visuals Team.

What's in here?
---------------

The project contains the following folders and important files:

* ``dist`` -- Unminified and minified versions of pym.js library and the pym-loader.js loader.
* ``examples`` -- Collection of working use cases for pym.js
* ``src`` -- Source files for this project
* ``test/pym`` -- Unit testing specs for pym.js
* ``test/pym-loader`` -- Unit testing specs for pym-loader.js
* ``test/html`` -- Child pages used for pym.js testing
* ``test/html-fixtures`` -- HTML templates for testing loader through the htmljs karma preprocessor
* ``.travis.yml`` -- [Travis CI](https://travis-ci.org/) config file
* ``Gruntfile.js`` -- [Grunt.js](http://gruntjs.com/) task runner config file
* ``karma.conf.js`` -- [Karma](https://karma-runner.github.io/1.0/index.html) runner configuration file
* ``karma.conf-sauce.js`` -- [Karma](https://karma-runner.github.io/1.0/index.html) runner configuration file for Sauce Labs
* ``nprapps_tools`` -- NPR Deployment tools to the CDN

Bootstrap the project
---------------------

Node.js is required. If you don't already have it, get it like this:

```
brew install node
```

Then bootstrap the project:

```
npm install
```

In order to do your own tests in Sauce Labs (_optional_) you will need to have a [Sauce Labs account](https://saucelabs.com/beta/login) (to their credit, they have a free tier for [open source projects](https://saucelabs.com/open-source)).

Once you have an account you will need to copy the example credentials file in the `sauce` folder to the actual credentials that will be used.

```
$ cd sauce
$ cp sauce_cred_sample.json sauce_cred.json
```

Edit the `sauce_cred.json` file to fill in your _USERNAME_ and _ACCESSKEY_ from [user settings](https://saucelabs.com/beta/user-settings).

Hide project secrets
--------------------

In this project the only project secrets that we have are the Sauce Labs credentials to secure a tunnel between Travis and Sauce Labs used in our continuous integration process. Those keys have been encrypted through Travis; you can read more about that process [here](https://docs.travis-ci.com/user/encryption-keys/)

Project secrets should **never** be stored anywhere else in the repository. They will be leaked to the client if you do. Instead, always store passwords, keys, etc. in environment variables and document that they are needed here in the README.

Run the project
---------------

In order to run pym.js the best approach is to fire up a local webserver and go to the examples to see it in action.

The included server includes `livereload` so each time you change something on the `examples` or `src` folder the server will refresh the page for you.

```
$ cd pym.js
$ grunt server
```


## Development tasks

Grunt configuration is included for running common development tasks.

Javascript can be linted with [jshint](http://jshint.com/):

```
grunt jshint
```

Unminified source can be regenerated with:

```
grunt concat
```

Minified source can be regenerated with:

```
grunt uglify
```

API documention can be generated with [jsdoc](https://github.com/jsdoc3/jsdoc):

```
grunt jsdoc
```

The release process is documented [on the wiki](https://github.com/nprapps/pym.js/wiki/Release-Process).

Test the project
----------------

We have introduced unit testing for Pym.js starting with the 1.0.0 release. The Pym.js testing suite uses a combination of [Karma](https://karma-runner.github.io/1.0/index.html), [Jasmine](http://jasmine.github.io/2.4/introduction.html) and [Sauce Labs](https://saucelabs.com/) to improve our browser coverage (Sauce Labs provides a nice [free tier solution for opensource projects](https://saucelabs.com/open-source))

### Test against your local browsers

*Requires Chrome and Firefox installed on your machine*

In order to run unit tests each time a change is detected, run:

```
grunt test
```

In order to run a one-off complete test suite, run:

```
npm test
```

### Test against Sauce Labs browsers

First you will need to make a copy the credentials sample file `sauce_cred_sample.json`, call it `sauce_cred.json`, and update your Sauce Labs `USERNAME` and `ACCESSKEY` that you will obtain once you have set up an account with [Sauce Labs](https://saucelabs.com/beta/login).

```
$ cd sauce
$ cp sauce_cred_sample.json sauce_cred.json
```

In order to run unit tests each time a change is detected, run:

```
$ grunt sauce
```

In order to run a one-off complete test suite, run:

```
$ npm run sauce
```

For local testing the list of browsers to use can be modified on `sauce/saucelabs-local-browsers.js`. We use [Travis CI](https://travis-ci.org/) for our continuous integration. When Travis is invoked it will use `sauce/saucelabs-browsers.js` as the list of browsers to test on.

A note around testing Pym.js on Sauce Labs, since the architecture of the tests with Travis and Sauce Labs creating _tunnels between VMs_ is a bit unreliable in terms of timing in some _random_ cases the response to a test case will not arrive in time and the test will fail due to a Timeout. We have tried to configure longer Timeouts for that error not to happen but still we find them during some test runs.

We have decided to create a small test suite using Travis own VM capabilities to test Pym.js on Firefox and declared the build successful if those tests pass. After that in the [_after_success_](https://docs.travis-ci.com/user/customizing-the-build#The-Build-Lifecycle) section of the Travis CI configuration we launch the Sauce Labs tests but that will not affect the result of the build process.

So If you see some of the Browsers in the Sauce Labs Matrix as failures that is, presumably, the reason for it. We are in contact with Sauce Labs to figure out if there's a way around this issue.

Build the project
-----------------

We use grunt tasks to build the project into the `dist` folder. Linting JS, preprocessing, uglyfing, etc.

```
$ grunt
```

We generate two copies of the pym and pym-loader libraries due to some really _tight length requirements_ when embedding scripts in the homepage of some of our users CMSs.

* **p.v1.m.js is a copy/alias of pym-v1.min.js**
* **pl.v1.m.js is a copy/alias of pym-loader-v1.min.js**

Versioning
----------

Starting with *Pym.js v1.0.0*, the project follows the [semantic versioning](http://semver.org/) pattern MAJOR.MINOR.PATCH.

* MAJOR version changes for backwards-incompatible API changes.
* MINOR version for new backwards-compatible functionality.
* PATCH version for backwards-compatible bug fixes.

To minimize the impact on our current and future customers, on the uncompressed and on the minified production side of pym we are only going to keep the major version exposed. That we can apply *PATCHES* and *MINOR* version changes without any change being made on our customer's code but we maintain the possibility of new major releases that are somewhat disruptive with previous versions of the library.

* pym.v1.0.0 and pym.v1.1.1 will both end up being minified into the same pym.v1.min.js.

* You can safely assume that pym.v1.js and pym.v1.min.js will have the *latest* version of pym in that MAJOR version.

* The same can be said for the pym-loader. pym-loader.v1.js and pym-loader.v1.min.js will have the *latest* version of pym-loader in that MAJOR version.

NPR will host and serve pym.js and pym-loader.js through a canonical CDN at `pym.nprapps.com`. We recommend that you link directly there to benefit instantaneously from the patches and minor releases.

What is the loader script for? Why do we need it?
-------------------------------------------------

Pym.js v1.0.0 development has been driven by a change needed to extend the ability to use Pym.js in certain CMSs used by NPR member stations and other use cases found by our collaborators that broke the loading process of loading Pym.js in common cases and thus made the embeds unusable.

We have decided to separate the particular needs of the Pym.js loading process in these special situations into a separate script that will act wrap and load Pym.js for these cases instead of polluting the Pym.js library itself with special needs of certain CMSs.

We want to keep Pym.js loading and invocation as manageable as possible. Due to the extensive use of Pym.js in many different environments, we encourage implementers to create special loaders if their integrations require it.

License and credits
-------------------

Released under the MIT open source license. See `LICENSE` for details.

Pym.js was built by the [NPR Visuals](http://github.com/nprapps) team, based on work by the [NPR Tech Team](https://github.com/npr/responsiveiframe) and [Ioseb Dzmanashvili](https://github.com/ioseb). Thanks to [Erik Hinton](https://twitter.com/erikhinton) for suggesting the name.

Contributors
------------

See [CONTRIBUTORS](CONTRIBUTORS)
