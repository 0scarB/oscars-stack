"use strict";

/** @param {string} sourceCode **/
function main(sourceCode) {
    console.log(sourceCode);
    var s = sourceCode;
    var i = 0;

    var MOV_ACC_TO_MEM  = 0x00;
    var SET_ACC         = 0x01;
    var ADD_TO_ACC      = 0x02;
    var SUB_FROM_ACC    = 0x03;
    var JMP             = 0x04;
    var JMP_IF_ACC_ZERO = 0x05;
    var PRINT_ACC       = 0x06;
    var FROM_MEM        = 0x10;
    var instructions    = [0];
    instructions.length = 0;
    var op            = SET_ACC;
    var maxMemAddr    = 0;
    var targetMemAddr = maxMemAddr;

    var STMT       = 0x10;
    var PARSE_NAME = 0x20;
    var INIT_VAR   = 0x30;
    var ASSIGN_VAR = 0x40;
    var IF         = 0x50;
    var WHILE      = 0x60;
    var PRINT      = 0x70;
    var OPERAND    = 0x80;
    var OPERATOR   = 0x90;
    var ctx         = STMT;
    var ctxStack    = [0];
    ctxStack.length = 0;

    var name          = "";
    var nameIsKeyword = false;

    var varNameToMemAddr = new Map([["foo", 0]]);
    varNameToMemAddr.clear();

    var blockDepth = 0;

    // Parse source code and generate instructions
    while (i < s.length || ctxStack.length) {
        // Skip whitespace
        while (i < s.length &&
            s[i] === ' '  || s[i] === '\t' || s[i] === '\n' ||
            s[i] === '\r' || s[i] === '\v' || s[i] === '\f'
        ) { ++i; }

        if (ctx === -1 || i >= s.length) {
            ctx = ctxStack.pop();
        }

        switch (ctx) {
            case STMT:
                if (i < s.length && s[i] === '{') {
                    ++i;
                    ++blockDepth;
                    continue;
                }
                if (!name) {
                    ctx = PARSE_NAME;
                    ctxStack.push(STMT);
                    continue;
                }
                if (nameIsKeyword) {
                    switch (name) {
                        case "if"   :
                            ctxStack.push(IF);
                            ctx = OPERAND;
                            continue;
                        case "while":
                            ctxStack.push(instructions.length, WHILE);
                            ctx = OPERAND;
                            continue;
                        case "print":
                            ctxStack.push(PRINT);
                            ctx = OPERAND;
                            continue;
                    }
                }
                if (i < s.length) {
                    switch (s[i++]) {
                        case ':': ctx =   INIT_VAR; continue;
                        case '=': ctx = ASSIGN_VAR; continue;
                    }
                }
                throw new Error("Unexpected start of statement!");

            case PARSE_NAME:
                name = "";
                while (i < s.length && (
                    s[i] === '_' ||
                    ('a' <= s[i] && s[i] <= 'z') ||
                    ('A' <= s[i] && s[i] <= 'Z') ||
                    (name && '0' <= s[i] && s[i] <= '9')
                )) { name += s[i++]; }
                nameIsKeyword =
                    name === "if"    ||
                    name === "while" ||
                    name === "print";
                ctx = -1;
                break;

            case INIT_VAR:
                if (varNameToMemAddr.has(name)) {
                    throw new Error(
                        `Variable '${varName}' already initialized. `+
                        `It cannot be reinitialized!`);
                }
                targetMemAddr = maxMemAddr++;
                varNameToMemAddr.set(name, targetMemAddr);
                ctx = OPERAND;
                ctxStack.push(INIT_VAR+1);
                break;
            case ASSIGN_VAR:
                targetMemAddr = varNameToMemAddr.get(name)
                if (targetMemAddr === undefined) {
                    throw new Error(
                        `Variable '${varName}' not initialized!`);
                }
                ctx = OPERAND;
                ctxStack.push(ASSIGN_VAR+1);
                break;
            case   INIT_VAR+1:
            case ASSIGN_VAR+1:
                instructions.push(MOV_ACC_TO_MEM, targetMemAddr);
                ctx = STMT;
                break;

            case IF:
                if (i >= s.length || s[i++] !== '{') {
                    throw new Error(
                        "Expected block to be entered with '{' after "+
                        "if-condition!");
                }
                ++blockDepth;
                instructions.push(JMP_IF_ACC_ZERO, -1);
                ctx = STMT;
                ctxStack.push(instructions.length-1, IF+1);
                break;
            case IF+1:
                var ifBlockEndPlaceholderIdx = ctxStack.pop();
                instructions[ifBlockEndPlaceholderIdx] = instructions.length;
                ctx = STMT;
                break;

            case WHILE:
                if (i >= s.length || s[i++] !== '{') {
                    throw new Error(
                        "Expected block to be entered with '{' after "+
                        "while-condition!");
                }
                ++blockDepth;
                instructions.push(JMP_IF_ACC_ZERO, -1);
                ctx = STMT;
                ctxStack.push(instructions.length-1, WHILE+1);
                break;
            case WHILE+1:
                var loopBlockEndPlaceholderIdx = ctxStack.pop();
                var loopStart                  = ctxStack.pop();
                instructions.push(JMP, loopStart);
                instructions[loopBlockEndPlaceholderIdx] = instructions.length;
                ctx = STMT;
                break;

            case PRINT:
                instructions.push(PRINT_ACC);
                ctx = STMT;
                break;

            case OPERAND:
                if (i < s.length) {
                    if ('0' <= s[i] && s[i] <= '9') {
                        var num = +s[i++];
                        while (i < s.length && '0' <= s[i] && s[i] <= '9') {
                            num = 10*num + +s[i++];
                        }
                        instructions.push(op, num);
                        ctx = OPERATOR;
                        continue;
                    } else {
                        ctxStack.push(OPERAND+1);
                        ctx = PARSE_NAME;
                        continue;
                    }
                }
                throw new Error("Expected operand!");
            case OPERAND+1:
                if (!nameIsKeyword) {
                    if (!name) {
                        throw new Error("Expected variable after operator!");
                    }
                    var varMemAddr = varNameToMemAddr.get(name);
                    if (varMemAddr === undefined) {
                        throw new Error(
                            `No variable with name '${varName}'!`);
                    }
                    instructions.push(op|FROM_MEM, varMemAddr);
                }
                ctx = OPERATOR;
                break;

            case OPERATOR:
                op = SET_ACC;
                if (i < s.length) {
                    switch (s[i]) {
                        case '+': op = ADD_TO_ACC  ; break;
                        case '-': op = SUB_FROM_ACC; break;

                        case '}':
                            if (!blockDepth--) {
                                throw new Error(
                                    "Imbalanced brackets '{ ... }'!");
                            }
                            ctx = -1;
                            ++i;
                            continue;
                    }
                    if (op !== SET_ACC) {
                        ctx = OPERAND;
                        ++i;
                        continue;
                    }
                }
                name = "";
                ctx = -1;
                break;

            default:
                throw new Error(
                    `Unhandled context with code 0x${ctx.toString(16)}!`);
        }
    }
    if (blockDepth) {
        throw new Error("Block(s) not closed with '}'!");
    }

    // Evaluate instructions
    var mem = Array(1024).fill(0);
    var ip = 0;
    var acc = NaN;
    while (ip < instructions.length) {
        switch (instructions[ip++]) {
            case MOV_ACC_TO_MEM:
                mem[instructions[ip++]] = acc;
                break;

            case      SET_ACC: acc  = instructions[ip++]; break;
            case   ADD_TO_ACC: acc += instructions[ip++]; break;
            case SUB_FROM_ACC: acc -= instructions[ip++]; break;
            case      SET_ACC|FROM_MEM: acc  = mem[instructions[ip++]]; break;
            case   ADD_TO_ACC|FROM_MEM: acc += mem[instructions[ip++]]; break;
            case SUB_FROM_ACC|FROM_MEM: acc -= mem[instructions[ip++]]; break;

            case JMP:
                ip = instructions[ip++];
                break;
            case JMP_IF_ACC_ZERO:
                if (acc) {
                    ++ip;
                } else {
                    ip = instructions[ip++];
                }
                break;
            case PRINT_ACC:
                console.log(acc);
                break;
            default:
                throw new Error(
                    `Unhandled instruction code '${instructions[ip-1]}!'`);
        }
    }
}

main("if 1 { print 1 }");
main("if 0 { print 0 }");
main("if 2 { print 2 }");
main("if 10-12+2 { print 123 }");
main("if 10-12+1 { print 321 }");
main(
    "a : 1+2\n"+
    "print a");
main(
    "a : 1+2\n"+
    "a = 4\n"+
    "print a");
main(
    "{\n"+
    "   a : 1+2\n"+
    "   a = 4\n"+
    "   print a\n"+
    "}");
main(
    "i : 10\n"+
    "while i {\n"+
    "    print i\n"+
    "    i = i-1\n"+
    "}");

