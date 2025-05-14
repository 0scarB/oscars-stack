var EMPTY = 0;

var PARTIAL_OP = 0x10;
var opCode = 0;
var NUM   = ++opCode;
var ADD   = PARTIAL_OP|++opCode;
var MUL   = PARTIAL_OP|++opCode;
var PRINT = ++opCode;

/** @param {number} opCode **/
function opCodeToStr(opCode) {
    switch (opCode) {
        case NUM: return "NUM";
        case ADD: return "PARTIAL_ADD";
        case MUL: return "PARTIAL_MUL";
        case ADD&~PARTIAL_OP: return "ADD";
        case MUL&~PARTIAL_OP: return "MUL";
        default: throw new Error();
    }
}

/** @param {number} opCode **/
function opPrecedence(opCode) {
    switch (opCode) {
        case PRINT            : return 0;
        case NUM              : return 1;
        case MUL & ~PARTIAL_OP: return 2;
        case ADD & ~PARTIAL_OP: return 3;
        default: throw new Error();
    }
}

function main() {
    var instructions = [NUM, 1, ADD, NUM, 2, MUL, NUM, 3];
    var lhsStack = [0];
    lhsStack.length = 0;
    var rhsStack = instructions.reverse();

    /** @param {number[]} stack **/
    function printStack(stack) {
        for (var i = stack.length-1; i > -1; --i) {
            var x = stack[i];
            try {
                var opStr = opCodeToStr(x);
                console.log(`${opStr} ${x}`);
            } catch (e) {
                console.log(x);
            }
        }
    }

    // Legend
    // ------
    // ... | ...  "|" delimits two stacks. Elements nearest "|" are at the top
    //                of the stacks
    // ... => ... a substitution rule where the substitution is applied if the
    //                pattern on the left is matched
    // (a)?, (b)? partially resolved binary operator, missing righthand-side
    //                operand
    // (a) , (b)  fully resolved binary operator
    // (a) < (b)  check whether operator (b) should be evaluated before (a) in
    //                the order of operations
    // x, y       numeric operands
    //
    // Substitutions
    // -------------
    // ...   x     | (a)? ... => ...      x (a)? |                 ...
    // ...   (a)?  | x    ... => ...      x (a)  |                 ...
    // ... x y (a) | (b)? ...
    //          if (a) < (b)? => ... (a)? x (b)? |                 ...
    //          else          => ...             | eval[ x (a) y ] ...

    while (1) {
        var lhsTop = lhsStack.length ? lhsStack[lhsStack.length-1] : 0;
        var rhsTop = rhsStack.length ? rhsStack[rhsStack.length-1] : 0;
        if (!lhsTop && rhsTop === NUM) {
            rhsStack.pop();
            lhsStack.push(rhsStack.pop(), NUM);
        } else if (lhsTop === NUM && rhsTop & PARTIAL_OP) {
            lhsStack.pop();
            lhsStack.push(rhsStack.pop());
        } else if ((lhsTop & PARTIAL_OP) && rhsTop === NUM) {
            rhsStack.pop();
            lhsStack.push(rhsStack.pop(), lhsStack.pop() & ~PARTIAL_OP);
        } else if (!rhsTop || rhsTop & PARTIAL_OP) {
            var lhsPrecedence = opPrecedence(lhsTop);
            var rhsPrecedence =
                rhsTop ? opPrecedence(rhsTop & ~PARTIAL_OP) : 15;
            if (lhsPrecedence <= rhsPrecedence) {
                var op = lhsStack.pop();
                if (op === NUM) {
                    break;
                }
                var rhsOperand = lhsStack.pop();
                var lhsOperand = lhsStack.pop();
                switch (op) {
                    case NUM: throw new Error();
                    case ADD & ~PARTIAL_OP:
                        rhsStack.push(lhsOperand + rhsOperand);
                        break;
                    case MUL & ~PARTIAL_OP:
                        rhsStack.push(lhsOperand * rhsOperand);
                        break;
                    default:
                        throw new Error();
                }
                rhsStack.push(NUM);
            } else {
                lhsStack[lhsStack.length-1] = lhsStack[lhsStack.length-2];
                lhsStack[lhsStack.length-2] = lhsTop|PARTIAL_OP;
                lhsStack.push(rhsStack.pop());
            }
        } else {
            throw new Error();
        }

        //console.log("===");
        //printStack(lhsStack);
        //console.log("---");
        //printStack(rhsStack);
    }
    printStack(lhsStack);
    printStack(rhsStack);
}
main();

