var pymChild = null;
/*
 * Initialize pym
 * Initialize transcript DOM
 * Set poll on transcript file
 */
function onWindowLoaded() {
    pymChild = new pym.Child({
        renderCallback: updateIFrame
    });

    // event listeners
    pymChild.onMessage('visibility-available', onVisibilityAvailable)
    pymChild.onMessage('on-screen', onFactCheckRead);
    pymChild.onMessage('fact-check-visible', onFactCheckVisible);
    pymChild.onMessage('request-client-rect', onRectRequest);
    pymChild.sendMessage('test-visibility-tracker', 'test');
}

// event handlers

/*
 * Update pym iframe height
 */
var updateIFrame = function() {
    if (pymChild) {
        pymChild.sendHeight();
    }
}

var onVisibilityAvailable = function(str) {
    document.body.classList.remove('vis-not-available');
}

var onFactCheckRead = function(id) {
    const factCheck = document.getElementById(id);
    factCheck.classList.remove('unread');
    numReadFactChecks = numReadFactChecks + 1;
    readFactChecks.push(id);
}

var onFactCheckVisible = function(id) {
    const factCheck = document.getElementById(id);
    factCheck.classList.remove('offscreen');
    if (seenFactChecks.indexOf(id) == -1) {
        seenFactChecks.push(id);
        updateFooter();
    }
}

var onRectRequest = function(id) {
    const factCheck = document.getElementById(id);
    const rect = factCheck.getBoundingClientRect();
    const rectString = rect.top + ' ' + rect.left + ' ' + rect.bottom + ' ' + rect.right;
    pymChild.sendMessage(id + '-rect-return', rectString);

}

/*
 * Initially load the graphic
 * (NB: Use window.load to ensure all images have loaded)
 */
window.onload = onWindowLoaded;
