/*
 * WRITING APP
 *
 * ©2016.
 */

window.Typing = (function() {
    let self = {};

    const fadeOutTime = 1.5;
    const baseTime = 7e3;
    const timeAdj = 3e3;
    const undoLength = 50;

    let started = false;
    let timeoutID = null;

    let el = $("#text");

    let tablevel = 0;
    let backspaceCount = 0;

    let editingCursor = 0;
    let tokens = [];
    let selectionMode = "";

    let last = [];

    self.styles = {
        opacity: 1.0,
        transition: "opacity 0.5s",
    };

    self.textEntered = function(e) {
        if (!started) {
            started = Date.now();
        }

        autoCorrect();
        $scope.input.text = el.value;

        if (this.writing) {
            reset();  // stop the deleting of text
            timeoutID = setTimeout(fadeOutText, getTimeout(started));
        }

    };

    let autoCorrect = function() {
        if (!el.value) return;

        let start = el.selectionStart;
        let end = el.selectionEnd;

        let replacements = [
            [/\b(t)eh\b/gi, "$1he"],
            [/\b(a)dn\b/gi, "$1nd"],
            [/--/gi, "—"],
            //[/\n\s*(\w)/gi, t => t[0] + t.substr(1).toUpperCase()],
        ];
        
        // autocapitalize first letter
        //el.value = el.value[0].toUpperCase() + el.value.substr(1);
        for (let replacement of replacements) {
            el.value = el.value.replace(...replacement);
        }

        el.setSelectionRange(start, end);
    };

    let getTimeout = function(startTime) {
        let totalTime = Date.now() - startTime;
        
        // fade timeout from base time down by timeAdj seconds over 2 min
        let timeout = baseTime - timeAdj * Math.min(totalTime / (2*60*1e3), 1);

        return timeout - fadeOutTime;
    };

    let fadeOutText = function() {
        // schedule text deletion
        timeoutID = setTimeout(deleteText, fadeOutTime * 1e3);

        self.styles.transition = `opacity ${fadeOutTime}s`;
        self.styles.opacity = 0;
    };

    let deleteText = function() {
        $scope.input.text = "";
        started = false;
        el.scrollHeight = 0;
        reset();
    };

    let reset = function() {
        clearTimeout(timeoutID);
        self.styles.transition = "opacity 0.1s";
        self.styles.opacity = 1.0;
        
        // adjust textarea height
        setTimeout(self.manageHeight, 0);
    };


    self.manageHeight = function() {
        // either 70% or scrollHeight.  -2 offsets the padding
        el.style.height = "1em";
        let type_scroll = $scope.options.typewriterScrolling && $scope.writing;
        let height = 0.9 * innerHeight;
        if (type_scroll) {
            height = Math.min(0.7 * innerHeight, el.scrollHeight) - 8;
        }
        el.style.height = height + "px";
        el.scrollTop = el.scrollHeight;
    };

    self.handleSpecialKeys = function(e) {
        if (e.keyCode === 9) { // tab key
            e.preventDefault();

            let start = el.selectionStart;
            let end = el.selectionEnd;

            // set text value to (before cursor) + \t + (after cursor)
            el.value = el.value.substring(0, start) + "\t" + el.value.substring(end);

            // put cursor back
            el.selectionStart = el.selectionEnd = start + 1;

            tablevel++;
            self.textEntered.call($scope);
        } else if (e.keyCode === 13) { // enter key
            e.preventDefault();

            let start = el.selectionStart;
            let end = el.selectionEnd;

            // add in proper tabbing
            let text = el.value;
            el.value = text.substring(0, start) + "\n";
            for (let i = 0; i < tablevel; i++) 
                el.value += "\t";
            el.value += text.substring(end);

            // put cursor back
            el.selectionStart = el.selectionEnd = start + 1 + tablevel;

            self.textEntered.call($scope);
        } else if (e.keyCode === 8) { // backspace
            e.preventDefault();

            if (backspaceCount >= this.options.maxBackspaces) 
                return;
            else 
                backspaceCount++;

            let start = el.selectionStart;
            let end = el.selectionEnd;
            let extra = (start === end) ? 1 : 0; // any extra bit to delete

            let deleted = el.value.substring(start - extra, end);
            // delete text
            el.value = el.value.substring(0, start - extra) + el.value.substring(end);

            // put cursor back
            el.selectionStart = el.selectionEnd = start - extra;

            // for every tab character in the deleted text, decrement tablevel
            for (let char of deleted) {
                if (char === "\t") tablevel--;
            }
            if (tablevel < 0) tablevel = 0;
            self.textEntered.call($scope);

            return;
        } else if (e.keyCode === 222) { // apostrophe
            e.preventDefault();

            let start = el.selectionStart;
            let end = el.selectionEnd;
            let previous = el.value.substring(start - 1, start);

            let quote;

            if (previous === " " || previous === "") {
                if (e.shiftKey) 
                    quote = "“";
                else
                    quote = "‘";
            } else {
                if (e.shiftKey) 
                    quote = "”";
                else
                    quote = "’";
            }

            el.value = el.value.substring(0, start) + quote + el.value.substring(end);

            // put cursor back
            el.selectionStart = el.selectionEnd = start + 1;

            self.textEntered.call($scope);
        } else if (e.keyCode === 32) { // space bar
            last.push(el.value);
            if (last.length > undoLength) last.shift();
        }

        backspaceCount = Math.max(0, backspaceCount - 1);
    };

    self.toggleWriting = function(e) {
        e.preventDefault();
        reset();

        Storage.saveWriting.call(this);
        if (!this.writing) last.push(el.value);

        this.writing = !this.writing;
        el.disabled = false;
        el.focus();
    };

    self.setSelectionMode = function(mode) {
        if (mode === "") return;

        // if same as before, don't highlight anything
        if (mode === selectionMode) {
            selectionMode = "";
            el.setSelectionRange(el.value.length - 1);
            return;
        }

        selectionMode = mode;

        let before = getSelectionBoundaries();

        let regex;
        switch (selectionMode) {
            case "letter":
                regex = /()/;
                break;
            case "word":
                regex = /(\s+)/;
                break;
            case "paragraph":
                regex = /(\n)/;
                break;
            case "sentence":
                regex = /([\.\?\!]\s+)/;
                break;
            default:
                throw new Error(`Unexpected mode: ${mode}`);
                return;
        }

        tokens = el.value.split(regex).map(t => t.length);
        if (tokens.length % 2) // add extra character at end if missing
            tokens.push(1);

        // adjust cursor index
        let length = tokens.length;
        let count = 0;
        for (let i = 0; i < length; i += 2) {
            count += tokens[i] + tokens[i+1];
            if (count > before.start) {
                editingCursor = i;
                break;
            }
        }

        self.selectObj();
    };

    self.selectObj = function() {
        let boundaries = getSelectionBoundaries();
        el.setSelectionRange(boundaries.start, boundaries.end);
    };

    self.deleteSelection = function() {
        let boundaries = getSelectionBoundaries();
        last.push(el.value);
            if (last.length > undoLength) last.shift();
        el.value = el.value.substr(0, boundaries.start) + el.value.substr(boundaries.end);
        $scope.input.text = el.value;
        // reset selection
        selectionMode = ""; 
        self.setSelectionMode(selectionMode);
    };

    self.undo = function() {
        let boundaries = getSelectionBoundaries();
        if (last.length)
            el.value = last.pop();
        $scope.input.text = el.value;
        // reset selection
        selectionMode = ""; 
        self.setSelectionMode(selectionMode);
    };

    self.insertText = function(e) {
        el.selectionEnd = el.selectionStart;
        self.toggleWriting.call($scope, e);
    };
    self.appendText = function(e) {
        el.selectionStart = el.selectionEnd;
        self.toggleWriting.call($scope, e);
    };

    let getSelectionBoundaries = function() {
        let start = 0;
        let end = 0;
        let length = tokens.length;
        // step through, finding the starting index
        for (let i = 0; i < length; i += 2) {
            let adj = tokens[i] + tokens[i+1]; 
            end += adj;
            if (i === editingCursor) {
                start = end - adj;
                break;
            }
        }

        return {start, end};
    };

    self.selectNext = function() {
        editingCursor = Math.min(editingCursor + 2, tokens.length - 2);
        self.selectObj();
    };
    self.selectPrevious = function() {
        editingCursor = Math.max(editingCursor - 2, 0);
        self.selectObj();
    };

    return self;
})();
