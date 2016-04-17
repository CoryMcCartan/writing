/*
 * WRITING APP
 *
 * ©2016.
 */

window.Dialogs = (function() {
    let self = {};

    let d = {
        settings: $("dialog#settings"),
    };

    self.show = function(s) {
        d[s].showModal();
    };

    self.close = function(s) {
        d[s].close();
    };

    return self;
})();
    
    
