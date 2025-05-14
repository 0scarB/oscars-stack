var instructionCode = 0;
var ACC_SET_PTR         = ++instructionCode;
var ACC_ASSIGN_IMM      = ++instructionCode;
var ACC_ADD_IMM         = ++instructionCode;
var JMP_IF_ACC_NOT_ZERO = ++instructionCode;
var ACC_PRINT           = ++instructionCode;

/** @typedef {{
 *     mem: DataView,
 *     accPtr: number,
 *     instructionPtr: number,
 * }} Program **/

/** @param {Program} program **/
function runInstructions(program) {
    var {mem, accPtr, instructionPtr: ip} = program;
    while (ip < mem.byteLength) {
        switch (mem.getUint8(ip++)) {
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
    }
    program.accPtr         = accPtr;
    program.instructionPtr = ip;
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
    }

    // Calculate size of instructions
    var instructionsSizeInBytes = 0;
    var i = 0;
    while (i < instructions.length) {
        switch (instructions[i++]) {
            case ACC_SET_PTR        : instructionsSizeInBytes += 4; ++i; break;
            case ACC_ASSIGN_IMM     : instructionsSizeInBytes += 4; ++i; break;
            case ACC_ADD_IMM        : instructionsSizeInBytes += 4; ++i; break;
            case JMP_IF_ACC_NOT_ZERO: instructionsSizeInBytes += 4; ++i; break;
            case ACC_PRINT: break;
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
                program.mem.setInt32(j, instructions[i++]);
                j += 4;
                break;
            case ACC_ADD_IMM:
                program.mem.setInt32(j, instructions[i++]);
                j += 4;
                break;
            case JMP_IF_ACC_NOT_ZERO:
                program.mem.setInt32(j, instructions[i++]);
                j += 4;
                break;
            case ACC_PRINT: break;
            default: throw new Error();
        }
    }
    return program;
}

main();

