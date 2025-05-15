var instructionCode = 0;
var NO_OP                        = ++instructionCode;
var ACC_SET_PTR                  = ++instructionCode;
var ACC_ASSIGN_IMM               = ++instructionCode;
var ACC_ADD_IMM                  = ++instructionCode;
var JMP_IF_ACC_NOT_ZERO          = ++instructionCode;
var ACC_PRINT                    = ++instructionCode;
var LABEL                        = ++instructionCode;
var JMP_TO_LABEL_IF_ACC_NOT_ZERO = ++instructionCode;

/** @typedef {{
 *     mem: DataView,
 *     accPtr: number,
 *     instructionPtr: number,
 *     labelToAddr: Map<string, number>,
 * }} Program **/

/** @param {Program} program **/
function doNextCoreInstruction(program) {
    var {mem, accPtr, instructionPtr: ip} = program;
    switch (mem.getUint8(ip++)) {
        case NO_OP: break;
        case ACC_SET_PTR:
            accPtr = mem.getUint32(ip);
            ip += 4;
            break;
        case ACC_ASSIGN_IMM:
            mem[accPtr] = mem.getInt32(ip);
            ip += 4;
            break;
        case ACC_ADD_IMM:
            mem[accPtr] += mem.getInt32(ip);
            ip += 4;
            break;
        case JMP_IF_ACC_NOT_ZERO:
            if (mem[accPtr]) {
                ip += mem.getInt32(ip);
            }
            ip += 4;
            break;
        case ACC_PRINT:
            console.log(mem[accPtr]);
            break;
        default:
            throw new Error(
                `Invalid instruction-code ${mem.getUint8(ip-1)}!`);
    }
    program.accPtr         = accPtr;
    program.instructionPtr = ip;
}

function doNextLabelingInstruction(program) {
    var {mem, instructionPtr: ip} = program;
    switch (mem.getUint8(ip)) {
        case LABEL:
            var labelName = "";
            var charCode = 0;
            mem.setUint8(ip++, NO_OP);
            while (charCode = mem.getUint8(ip)) {
                labelName += String.fromCharCode(charCode);
                mem.setUint8(ip++, NO_OP);
            }
            mem.setUint8(ip++, NO_OP);
            program.labelToAddr.set(labelName, ip);
            break;
        case JMP_TO_LABEL_IF_ACC_NOT_ZERO:
            var labelName = "";
            var charCode = 0;
            mem.setUint8(ip++, NO_OP);
            while (charCode = mem.getUint8(ip)) {
                labelName += String.fromCharCode(charCode);
                mem.setUint8(ip++, NO_OP);
            }
            mem.setUint8(ip++, NO_OP);
            if (labelName.length < 3) {
                // This is a hack to ensure that enough space is left
                // for the 32-bit integer argument of the jump instruction
                // that will be substituted
                throw new Error(
                    "Label name must be at least 3 characters long!");
            }
            var labelAddr = program.labelToAddr.get(labelName);
            if (labelAddr === undefined) {
                throw new Error(
                    `Cannot jump to unknown label '${labelName}'!`);
            }
            ip -= labelName.length + 2;
            mem.setUint8(ip++  , JMP_IF_ACC_NOT_ZERO);
            mem.setInt32(ip, labelAddr - (ip+5));
            break;
        default:
            throw new Error(
                `Invalid instruction-code ${mem.getUint8(ip-1)}!`);
    }
}

/** @param {Program} program **/
function runInstructions(program) {
    while (program.instructionPtr < program.mem.byteLength) {
        switch (program.mem.getUint8(program.instructionPtr)) {
            case LABEL:
            case JMP_TO_LABEL_IF_ACC_NOT_ZERO:
                doNextLabelingInstruction(program);
                break;
            default:
                doNextCoreInstruction(program);
                break;
        }
    }
}

function main() {
    var program = createProgram(
        [ACC_SET_PTR, 0, ACC_ASSIGN_IMM, 1, ACC_ADD_IMM, 2, ACC_PRINT],
        1024);
    runInstructions(program);
    console.log("---");

    var program = createProgram(
        [
            ACC_SET_PTR, 0,
            ACC_ASSIGN_IMM, 10,
            ACC_PRINT,
            ACC_ADD_IMM, -1,
            JMP_IF_ACC_NOT_ZERO, -11,
        ],
        1024);
    runInstructions(program);
    console.log("---");

    var program = createProgram(
        [
            ACC_SET_PTR, 0,
            ACC_ASSIGN_IMM, 10,
            LABEL, "loop_start",
            ACC_PRINT,
            ACC_ADD_IMM, -1,
            JMP_TO_LABEL_IF_ACC_NOT_ZERO, "loop_start",
        ],
        64);
    runInstructions(program);
    console.log("---");
}

/** @param {number[]} instructions
 *  @param {number  } memorySizeInBytes
 *  @returns {Program} **/
function createProgram(instructions, memorySizeInBytes) {
    var memoryBuffer   = new ArrayBuffer(memorySizeInBytes);
    var memoryDataView = new DataView(memoryBuffer);

    /** @type {Program} **/
    var program = {
        mem: memoryDataView,
        accPtr: 0,
        instructionPtr: memorySizeInBytes,
        labelToAddr: new Map([["foo", 0]]),
    }
    program.labelToAddr.clear();

    // Calculate size of instructions
    var instructionsSizeInBytes = 0;
    var i = 0;
    while (i < instructions.length) {
        switch (instructions[i++]) {
            case ACC_SET_PTR:
            case ACC_ASSIGN_IMM:
            case ACC_ADD_IMM:
            case JMP_IF_ACC_NOT_ZERO:
                instructionsSizeInBytes += 4; ++i;
                break;

            case ACC_PRINT: break;

            case LABEL:
            case JMP_TO_LABEL_IF_ACC_NOT_ZERO:
                instructionsSizeInBytes += 1 + instructions[i++].length;
                break;

            default: throw new Error();
        }
        ++instructionsSizeInBytes;
    }
    program.instructionPtr -= instructionsSizeInBytes;

    // Encode instructions to the bytes at the end of the program's
    // memory
    var i = 0;
    var j = program.instructionPtr;
    while (i < instructions.length) {
        var code = instructions[i++];
        program.mem.setUint8(j++, code);
        switch (code) {
            case ACC_SET_PTR:
                program.mem.setUint32(j, instructions[i++]);
                j += 4;
                break;

            case ACC_ASSIGN_IMM:
            case ACC_ADD_IMM:
            case JMP_IF_ACC_NOT_ZERO:
                program.mem.setInt32(j, instructions[i++]);
                j += 4;
                break;

            case ACC_PRINT: break;

            case LABEL:
            case JMP_TO_LABEL_IF_ACC_NOT_ZERO:
                var labelName = instructions[i++];
                assert(() => typeof labelName === "string");
                for (var k = 0; k < labelName.length; ++k) {
                    program.mem.setUint8(j++, labelName.charCodeAt(k));
                }
                program.mem.setUint8(j++, 0);
                break;

            default: throw new Error();
        }
    }
    return program;
}

/** @param {boolean | (() => boolean)} cond
 *  @param {string = ""} msgOnFail
 *  @returns {void|never} **/
function assert(cond, msgOnFail = "") {
    var isTrue = false;
    if (typeof cond === "function") {
        isTrue = cond();
    } else {
        isTrue = cond;
    }
    if (!isTrue) {
        var errMsg = "Assertion failed:\n\t";
        if (typeof cond === "function") {
            errMsg += cond.toString()+'\n';
        }
        if (msgOnFail) {
            errMsg += msgOnFail;
        }
        throw new Error(errMsg);
    }
}

/** @returns {never} **/
function notImplemented() {
    throw new Error("Not implemented!");
}

main();

