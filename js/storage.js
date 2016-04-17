/*
 * WRITING APP
 *
 * ©2016.
 */

window.Storage = (function() {
    let self = {};

    self.saveSettings = function() {
        localforage.setItem("settings", this.options);
    };

    self.saveWriting = function() {
        localforage.setItem("text", this.input.text);
    };

    self.loadAll = function() {
        localforage.getItem("settings").then(v => {
            if (v)
                this.$set("options", v);
        }); 
        localforage.getItem("text").then(v => {
            if (v) {
                this.$set("writing", false);
                this.$set("input.text", v);
                this.$nextTick(Typing.manageHeight);
            }
        })
    };

    return self;
})();
