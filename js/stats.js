/*
 * WRITING APP
 *
 * ©2016.
 */

window.Stats = (function() {
    let self = {};

    self.wordCount = function() {
        // split on whitespace
        if (!this.input.text) return 0;
        return this.input.text.trim().split(/\s+/).length;
    };

    self.characterCount = function() {
        if (!this.input.text) return 0;
        return this.input.text.length;
    };

    self.readability = function() {
        try {
            return textStatistics(this.input.text).fleschKincaidGradeLevel();
        } catch (e) {
            return 0;
        }
    };

    self.averageSentenceLength = function() {
        try {
            let sl = textStatistics(this.input.text).averageWordsPerSentence();
            return sl.toFixed(0);
        } catch (e) {
            return 0;
        }
    };


    return self;
})();
