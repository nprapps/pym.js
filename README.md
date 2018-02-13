Pym.js
======

*RECOMMENDED UPDATE* : Pym users, we’ve released an update that closes a potential security hole. We recommend everyone update to 1.3.2. The easiest way to ensure you’re constantly up-to-date is to use our CDN version, follow instructions [here](http://blog.apps.npr.org/pym.js/index.html#get-pym-cdn).


What is this?
-------------

Using iframes in a responsive page can be frustrating. It&rsquo;s easy enough to make an iframe&rsquo;s width span 100% of its container, but sizing its height is tricky &mdash; especially if the content of the iframe changes height depending on page width (for example, because of text wrapping or media queries) or events within the iframe.

<a href="https://raw.githubusercontent.com/nprapps/pym.js/master/src/pym.js">Pym.js</a> embeds and resizes an iframe responsively (width and height) within its parent container. It also bypasses the usual cross-domain issues.

Use case: The NPR Visuals team uses Pym.js to embed small custom bits of code (charts, maps, etc.) inside our CMS without CSS or JavaScript conflicts. [See an example of this in action.](http://www.npr.org/2014/03/25/293870089/maze-of-college-costs-and-aid-programs-trap-some-families)

## [&rsaquo; Read the documentation](http://blog.apps.npr.org/pym.js/)

What is the loader script for? Why do we need it?
-------------------------------------------------

Pym.js v1.0.0 development has been driven by a change needed to extend the ability to use Pym.js in certain CMSes used by NPR member stations and other use cases found by our collaborators that broke the loading process of loading Pym.js in common cases and thus made the embeds unusable.

We have decided to separate the particular needs of the Pym.js loading process in these special situations into a separate script that will act wrap and load Pym.js for these cases instead of polluting the Pym.js library itself with special needs of certain CMSes.

We want to keep Pym.js loading and invocation as manageable as possible. Due to the extensive use of Pym.js in many different environments, we encourage implementers to create special loaders if their integrations require it.

Credits
-------

Pym.js was built by the [NPR Visuals](http://github.com/nprapps) team, based on work by the [NPR Tech Team](https://github.com/npr/responsiveiframe) and [Ioseb Dzmanashvili](https://github.com/ioseb). Thanks to [Erik Hinton](https://twitter.com/erikhinton) for suggesting the name.

Contributors
------------

See [CONTRIBUTORS](https://github.com/nprapps/responsiveiframe/blob/master/CONTRIBUTORS)
