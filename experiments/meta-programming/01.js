var opCode = 0;
var SET_ACC_MEM_ADDR = ++opCode;
var JMP   = ++opCode;
var JMPZ  = ++opCode;
var SET = ++opCode;
var ADD   = ++opCode;
var SUB   = ++opCode;
var LAND  = ++opCode;
var LOR   = ++opCode;
var EQ    = ++opCode;
var GT    = ++opCode;
var LT    = ++opCode;
var PRINT = ++opCode;
var FROM_MEM = 0x10;

/** @typedef {{print: (s: string) => void}} Platform **/

/** @param {number[]} instrs
 *  @param {Platform} platform **/
function executeInstructions(instrs, platform) {
    var ip = 0;
    var mem = new Array(4096).fill(0);
    var accMemAddr = 0;
    while (ip < instrs.length) {
        var op = instrs[ip++];
        if (op === PRINT) {
            platform.print(mem[accMemAddr]);
            continue;
        }
        var val = instrs[ip++];
        if (op & FROM_MEM) {
            val = mem[val];
        }

        switch (op & ~FROM_MEM) {
            case SET_ACC_MEM_ADDR:accMemAddr = val; break;

            case JMPZ: if (mem[accMemAddr]) { break; } // else fallthrough!
            case JMP : ip += val;
                break;

            case SET : mem[accMemAddr]  = val; break;
            case ADD : mem[accMemAddr] += val; break;
            case SUB : mem[accMemAddr] -= val; break;
            case LAND: mem[accMemAddr] = +(mem[accMemAddr]  && val); break;
            case LOR : mem[accMemAddr] = +(mem[accMemAddr]  || val); break;
            case EQ  : mem[accMemAddr] = +(mem[accMemAddr] === val); break;
            case GT  : mem[accMemAddr] = +(mem[accMemAddr]   > val); break;
            case LT  : mem[accMemAddr] = +(mem[accMemAddr]   < val); break;
        }
    }
}

/** @param {string  } sourceCode
 *  @param {Platform} platform **/
function main(sourceCode, platform) {
    var s = sourceCode;
    var i = 0;

    var instructions = [0];
    instructions.length = 0;

    function whitespaceAt(i) {
        return i < s.length && (
            s[i] === ' '  || s[i] === '\t' || s[i] === '\n' ||
            s[i] === '\r' || s[i] === '\v' || s[i] === '\f'
        );
    }

    /** @returns {boolean} **/
    function whitespace() {
        var start = i;
        while (whitespaceAt(i)) { ++i; }
        return i !== start;
    }

    /** @returns {string | ""} **/
    function symbol() {
        var result = "";
        while (i < s.length && !whitespaceAt(i)) { result += s[i++]; }
        return result;
    }

    /** @template T
     *  @param   {() => T} func
     *  @returns {() => T} **/
    function rollbackOnFail(func) {
        return () => {
            var rollbackI = i;
            var rollbackInstructionLen = instructions.length;
            var returnVal = func();
            if (!returnVal) {
                i = rollbackI;
                instructions.length = rollbackInstructionLen;
            }
            return returnVal;
        }
    }

    var integer = rollbackOnFail(function () {
        var isNegative = i < s.length && s[i] === '-';
        if (isNegative) {
            ++i;
            whitespace();
        }
        var start = i;
        instructions.push(0);
        while (i < s.length && '0' <= s[i] && s[i] <= '9') {
            instructions[instructions.length-1] =
                10*instructions[instructions.length-1] + +s[i++];
        }
        if (isNegative) {
            instructions[instructions.length-1] =
                -instructions[instructions.length-1];
        }
        return i !== start;
    });

    var labelToInstructionIdx = new Map([["foo", 0]]);
    labelToInstructionIdx.clear();
    var unresolvedLabelRefsNames = ["foo"];
    var unresolvedLabelRefsIdxs  = [0];
    unresolvedLabelRefsNames.length = 0;
    unresolvedLabelRefsIdxs .length = 0;

    var lowLevelInstruction = rollbackOnFail(function () {
        var opCode = -1;
        var s = symbol();
        switch (s) {
            case "$mem"  : opCode = SET_ACC_MEM_ADDR; break;
            case "$jmp"  : opCode = JMP             ; break;
            case "$jmpz" : opCode = JMPZ            ; break;
            case "$set"  : opCode = SET             ; break;
            case "$add"  : opCode = ADD             ; break;
            case "$sub"  : opCode = SUB             ; break;
            case "$land" : opCode = LAND            ; break;
            case "$lor"  : opCode = LOR             ; break;
            case "$eq"   : opCode = EQ              ; break;
            case "$gt"   : opCode = GT              ; break;
            case "$lt"   : opCode = LT              ; break;
            case "$print": opCode = PRINT           ; break;

            case "$label":
                if (!whitespace()) { return false; }
                var name = symbol();
                if (!name) { return false; }
                labelToInstructionIdx.set(name, instructions.length);
                return true;

            default: return false;
        }
        instructions.push(opCode);

        if (opCode === PRINT) { return true; }

        if (!whitespace()) { return false; }
        if (integer()    ) { return true; }

        var sym = symbol();
        if (sym === "mem") {
            instructions[instructions.length-1] = opCode|FROM_MEM;
            return whitespace() && integer();
        }
        var instructionIdx = labelToInstructionIdx.get(sym);
        if (instructionIdx === undefined) {
            unresolvedLabelRefsNames.push(sym);
            unresolvedLabelRefsIdxs .push(instructions.length);
            instructions.push(-1);
        } else {
            instructions.push(instructionIdx - instructions.length - 1);
        }
        return true;
    });

    while (i < s.length) {
        whitespace();
        if (i >= s.length) {
            break;
        }

        if (!lowLevelInstruction()) {
            throw new Error("Not implemented!");
        }
    }

    for (var j = 0; j < unresolvedLabelRefsIdxs.length; ++j) {
        var labelName = unresolvedLabelRefsNames[j];
        var labeledInstructionIdx = labelToInstructionIdx.get(labelName);
        if (labeledInstructionIdx === undefined) {
            throw new Error(`No label '${labelName}'!`);
        }
        var placeholderInstructionIdx = unresolvedLabelRefsIdxs[j];
        instructions[placeholderInstructionIdx] =
            labeledInstructionIdx - placeholderInstructionIdx -1;
    }

    executeInstructions(instructions, platform);
}

function test(sourceCode, expectedOutput) {
    var actualOutput = "";
    main(sourceCode, {
        print: function (s) {
            if (actualOutput) {
                actualOutput += '\n';
            }
            actualOutput += s;
            //console.log(s);
        }},
    );
    if (actualOutput === expectedOutput) {
        console.log(`PASS: ${sourceCode.replaceAll('\n', "\\n")}`);
    } else {
        console.error(`FAIL: ${sourceCode}`);
        console.error(actualOutput);
        console.error("!==");
        console.error(expectedOutput);
    }
}

test("$set 1 $add 2 $print", "3");
test(
    "$set 10\n"+
    "$label begin_loop\n"+
    "   $jmpz end_loop\n"+
    "   $print\n"+
    "   $sub 1\n"+
    "   $jmp begin_loop\n"+
    "$label end_loop"
    ,
    "10\n"+
    "9\n"+
    "8\n"+
    "7\n"+
    "6\n"+
    "5\n"+
    "4\n"+
    "3\n"+
    "2\n"+
    "1");
test(
    "$mem 11 $set 3\n"+
    "$mem 12 $set 5\n"+
    "$mem 0 $set 1\n"+
    "$label loop\n"+
    "   $mem 1 $set mem 0\n"+
    "   $mem 11 $sub 1\n"+
    "   $jmpz 2 $jmp end_if1\n"+
    "       $mem 1 $set 1000\n"+
    "       $mem 11 $set 3\n"+
    "   $label end_if1\n"+
    "   $mem 12 $sub 1\n"+
    "   $jmpz 2 $jmp end_if2\n"+
    "       $mem 1 $eq 1000 $jmpz else\n"+
    "           $mem 1 $set 3000\n"+
    "           $jmp end_if3\n"+
    "       $label else\n"+
    "           $mem 1 $set 2000\n"+
    "       $label end_if3\n"+
    "       $mem 12 $set 5\n"+
    "   $label end_if2\n"+
    "   $mem 1 $print\n"+
    "   $mem 0 $add 1\n"+
    "$mem 1 $set mem 0\n"+
    "$lt 17 $jmpz 2 $jmp loop"
    ,
    "1\n"+
    "2\n"+
    "1000\n"+
    "4\n"+
    "2000\n"+
    "1000\n"+
    "7\n"+
    "8\n"+
    "1000\n"+
    "2000\n"+
    "11\n"+
    "1000\n"+
    "13\n"+
    "14\n"+
    "3000\n"+
    "16"
)

