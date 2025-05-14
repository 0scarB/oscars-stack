var RULES = [
    "0$", "0|",
    "1$", "1|",
    "a0|", "|0",
    "a1|", "|1",
    "b0|", "|1",
    "b1|", "c|0",
    "a0", "0a",
    "a1", "1a",
    "b0", "0b",
    "b1", "1b",
    "0+", "+a",
    "1+", "+b",
    "+c", "1",
]

/** @param {string[]} rules
 *  @param {string} input **/
function run(rules, input) {
    var output = input;
    while (true) {
        console.log(output);
        var didSubstitution = false;
        for (var i = 1; !didSubstitution && i < rules.length; i += 2) {
            var match       = rules[i-1];
            var replacement = rules[i];
            if (match[match.length-1] === '$' &&
                output.endsWith(match.slice(0, match.length-1))
            ) {
                output = output.slice(0, output.length-match.length+1) +
                         replacement;
                didSubstitution = true;
                continue;
            }
            var matchPos = output.indexOf(match);
            if (matchPos !== -1) {
                output = output.slice(0, matchPos) +
                         replacement               +
                         output.slice(matchPos+match.length);
                didSubstitution = true;
                continue;
            }
        }
        if (!didSubstitution) { break; }
    }
    return output;
}


run(RULES, "1101+1010");
