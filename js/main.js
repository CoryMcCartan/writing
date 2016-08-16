/*
 * WRITING APP
 *
 * ©2016.
 */

"use strict";

function main() {
    let app = new Vue({
        el: "main",
        data: {
            Typing,
            options: {
                theme: "main",
                font: "Courier",
                typewriterScrolling: true,
                typewriterSounds: true,
                maxBackspaces: 5,
            },
            input: {
                text: null,
            },
            writing: true,
            Dialogs,
            Themes,
        },
        computed: {
            wrapperStyle: function() {
                if (this.options.typewriterScrolling && this.writing)
                    return { position: "absolute", };
                else 
                    return { position: "initial", };
            },
            wordCount: Stats.wordCount,
            characterCount: Stats.characterCount,
            readability: Stats.readability,
            sentenceLength: Stats.averageSentenceLength,
        },
        methods: {
            textEntered: Typing.textEntered,
            handleSpecialKeys: Typing.handleSpecialKeys,
            toggleWriting: Typing.toggleWriting,
            saveSettings: Storage.saveSettings,
            focusTextarea: () => $("#text").focus(),
        },
        watch: {
            options: function() {
                form_els.forEach(el => {
                    if (el.updateClasses_) {
                        el.updateClasses_();
                    } else {
                        el.updateValueStyles_();
                    }
                });
            },
        },
    });

    // keyboard listeners
    Mousetrap.bindGlobal(["ctrl+p", "j k"], app.toggleWriting);
    Mousetrap.bindGlobal(["mod+s"], function(e) {
        e.preventDefault();
        Storage.saveWriting.call(app);
    });
    Mousetrap.bind("mod+r", Storage.saveWriting.bind(app));

    Mousetrap.bind("l", Typing.setSelectionMode.bind(app, "letter"));
    Mousetrap.bind("w", Typing.setSelectionMode.bind(app, "word"));
    Mousetrap.bind("p", Typing.setSelectionMode.bind(app, "paragraph"));
    Mousetrap.bind("s", Typing.setSelectionMode.bind(app, "sentence"));
    Mousetrap.bind("j", Typing.selectNext.bind(app));
    Mousetrap.bind("k", Typing.selectPrevious.bind(app));
    Mousetrap.bind("d", Typing.deleteSelection);
    Mousetrap.bind("c", app.toggleWriting);
    Mousetrap.bind("i", Typing.insertText);
    Mousetrap.bind("a", Typing.appendText);
    Mousetrap.bind("u", Typing.undo);

    window.$scope = app;

    $("main").style.opacity = 1;
    $("#text").focus();

    Storage.loadAll.call(app);

    window.addEventListener("beforeunload", function() {
        Storage.saveWriting.call(app);
    });

    let down_sound = new Audio("assets/keydown.mp3");
    let up_sound = new Audio("assets/keyup.mp3");
        up_sound.volume = 0.8;
    let key_down = -1;
    document.body.addEventListener("keydown", function(e) {
        if (!app.options.typewriterSounds) return;
        if (key_down === e.keyCode) {
            e.preventDefault();
            return;
        }
        key_down = e.keyCode;
        down_sound.currentTime = 0;
        down_sound.play(); 
    });
    document.body.addEventListener("keyup", function(e) {
        if (!app.options.typewriterSounds) return;
        key_down = -1;
        up_sound.currentTime = 0;
        up_sound.play(); 
    });
    
}

window.form_els = [];

Vue.directive("mdl", {
    bind: function() {
        componentHandler.upgradeElement(this.el);
        let type = this.el.classList[0].slice(4);
        type = "Material" + type[0].toUpperCase() + type.slice(1);
        form_els.push(this.el[type]); 
    },
});
