var state = 0;
var END_OF_SOURCE = 0;
var PROG          = (state += 0x10);
var STMT          = (state += 0x10);
var IF            = (state += 0x10);
var EXPR          = (state += 0x10);
var NAME          = (state += 0x10);
var WHITESPACE    = (state += 0x10);

/** @param {string}   sourceCode
 *  @param {number[]} stack **/
function parserStep(sourceCode, stack) {
    var pos  = stack.pop();
    var char = pos < sourceCode.length ? sourceCode[pos] : '\0';
    var state = stack.pop();
    switch (state) {
        case PROG:
            stack.push(PROG+1, PROG+2, STMT);
            break;
        case PROG+1:
            if (char === '\0') { return; }
            stack.push(PROG+1, PROG+1, STMT);
            break;
        case PROG+2:
            throw new Error("Empty program!");

        case STMT:
            stack.push(STMT+1, STMT+1, WHITESPACE);
            break;
        case STMT+1:
            stack.push(STMT+2, STMT+4, NAME);
            break;
        case STMT+2:
            stack.push(STMT+3, STMT+3, WHITESPACE);
            break;
        case STMT+3:
            stack.push(ASSIGN, EXPR, STMT+4, ASSIGN);
            break;
        case STMT+3:
            var returnStateIfEndOfSource = stack.pop();
            if (char === '{') {
                stack.push(STMT+4, STMT+5, STMT);
            } else if (char === '\0') {
                stack.pop();
                stack.push(returnStateIfEndOfSource);
            } else {
                throw new Error(`Invalid start of statement '${char}'!`);
            }
            break;
        case STMT+4:
        case STMT+5:
            notImplemented();

        case WHITESPACE:
            var returnStateIfNoWhitespaces = stack.pop();
            if (char === ' ' || char === '\n') {
                ++pos;
                stack.push(WHITESPACE+1);
            } else {
                stack.pop();
                stack.push(returnStateIfNoWhitespaces);
            }
            break;
        case WHITESPACE+1:
            var returnStateIfOneOrMoreWhitespaces = stack.pop();
            if (char ===  ' ' || char === '\t' || char === '\n' ||
                char === '\n' || char === '\v' || char === '\f'
            ) {
                ++pos;
                stack.push(WHITESPACE+1);
            } else {
                stack.push(returnStateIfOneOrMoreWhitespaces);
            }
            break;

        case NAME:
            var returnStateIfNotName = stack.pop();
            if (('a' <= char && char <= 'z') ||
                ('A' <= char && char <= 'Z') ||
                char === '_' || char === '$'
            ) {
                var nameStartPos = pos++;
                stack.push(nameStartPos, NAME+1);
            } else {
                stack.pop();
                stack.push(returnStateIfNotName);
            }
            break;
        case NAME+1:
            var nameStartPos      = stack.pop();
            var returnStateIfName = stack.pop();
            if (('a' <= char && char <= 'z') ||
                ('A' <= char && char <= 'Z') ||
                ('0' <= char && char <= '9') ||
                char === '_' || char === '$'
            ) {
                ++pos;
                stack.push(nameStartPos, NAME+1);
            } else {
                var nameStopPos = pos;
                console.log(`NAME(${sourceCode.slice(nameStartPos, nameStopPos)})`);
                stack.push(nameStartPos, nameStopPos, returnStateIfName);
            }
            break;

        default:
            throw new Error(`Invalid parser state 0x${state.toString(16)}`);
    }
    stack.push(pos);
}

function main() {
    var stack = [PROG, 0];
    var sourceCode = "foo = 1 + 2";
    while (1) {
        parserStep(sourceCode, stack);
    }
}

/** @returns {never} **/
function notImplemented() {
    throw new Error("Not implemented!");
}
/** @returns {never} **/
function unreachable() {
    throw new Error("Should be unreachable!");
}

main();

