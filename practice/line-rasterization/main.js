/** @param {number} w
 *  @param {number} h
 *  @returns {number[][]} **/
function createRaster(w, h) {
    var result = [Array(w).fill(0)];
    for (var i = 1; i < h; ++i) {
        result.push(Array(w).fill(0));
    }
    return result;
}

/** @param {number[][]} **/
function clearRaster(raster) {
    for (var i = 0; i < raster.length; ++i) {
        raster[i].fill(0);
    }
}

/** @param {number[][]} raster
 *  @param {number} x1
 *  @param {number} y1
 *  @param {number} x2
 *  @param {number} y2 **/
function drawLineApproach1(raster, x1, y1, x2, y2) {
    var changeInX = x2 - x1;
    var changeInY = y2 - y1;
    if (Math.abs(changeInX) > Math.abs(changeInY)) {
        if (changeInX < 0) {
            var xTemp = x1;
            var yTemp = y1;
            x1 = x2;
            y1 = y2;
            x2 = xTemp;
            y2 = yTemp;
            changeInX = -changeInX;
            changeInY = -changeInY;
        }
        var slope = changeInY/changeInX;
        for (var x = Math.round(x1), y = y1+0.5;
            x <= Math.round(x2);
            ++x, y += slope
        ) {
            raster[Math.floor(y)][x] = 255;
        }
    } else {
        if (changeInY < 0) {
            var xTemp = x1;
            var yTemp = y1;
            x1 = x2;
            y1 = y2;
            x2 = xTemp;
            y2 = yTemp;
            changeInX = -changeInX;
            changeInY = -changeInY;
        }
        var slope = changeInX/changeInY;
        for (var y = Math.round(y1), x = x1+0.5;
            y <= y2;
            ++y, x += slope
        ) {
            raster[y][Math.floor(x)] = 255;
        }
    }
}

function drawLineApproach2(raster, x1, y1, x2, y2) {
    var changeInX = x2 - x1;
    var changeInY = y2 - y1;
    if (Math.abs(changeInX) > Math.abs(changeInY)) {
        var xInc = changeInX < 0 ? -1 : 1;
        var yInc = xInc*changeInY/changeInX;
        for (var x = Math.floor(x1+0.5), y = y1+0.5;
            x !== Math.floor(x2+0.5);
            x += xInc, y += yInc
        ) { raster[Math.floor(y)][x] = 255; }
    } else {
        var yInc = changeInY < 0 ? -1 : 1;
        var xInc = yInc*changeInX/changeInY;
        for (var y = Math.floor(y1+0.5), x = x1+0.5;
            y !== Math.floor(y2+0.5);
            y += yInc, x += xInc
        ) { raster[y][Math.floor(x)] = 255; }
    }
}

function drawLineApproach3(raster, x1, y1, x2, y2) {
    var x1 = Math.floor(x1+0.5);
    var y1 = Math.floor(y1+0.5);
    var x2 = Math.floor(x2+0.5);
    var y2 = Math.floor(y2+0.5);
    var changeInX = x2 - x1;
    var changeInY = y2 - y1;

    var  halfPixelUnit = Math.max(Math.abs(changeInX), Math.abs(changeInY));
    var      pixelUnit =  2*halfPixelUnit;
    var pixelXMinBound = x1*pixelUnit;
    var pixelX         = pixelXMinBound + halfPixelUnit;
    var pixelYMinBound = y1*pixelUnit;
    var pixelY         = pixelYMinBound + halfPixelUnit;
    var x = x1;
    var y = y1;
    while (x !== x2 || y !== y2) {
        raster[y][x] = 255;
        pixelX += changeInX;
        pixelY += changeInY;
        if (pixelX < pixelXMinBound) {
            --x;
            pixelXMinBound -= pixelUnit;
        } else if (pixelX >= pixelXMinBound + pixelUnit) {
            ++x;
            pixelXMinBound += pixelUnit;
        }
        if (pixelY < pixelYMinBound) {
            --y;
            pixelYMinBound -= pixelUnit;
        } else if (pixelY >= pixelYMinBound + pixelUnit) {
            ++y;
            pixelYMinBound += pixelUnit;
        }
    }
}

function drawLineApproach4(raster, x1, y1, x2, y2) {
    var changeInX = x2 - x1;
    var changeInY = y2 - y1;
    var xInc = changeInX < 0 ? -1 : 1;
    var yInc = changeInY < 0 ? -1 : 1;
    var absChangeInX = xInc === -1 ? -changeInX : changeInX;
    var absChangeInY = yInc === -1 ? -changeInY : changeInY;
    if (absChangeInX > absChangeInY) {
        var y = Math.floor(y1+0.5);
        var z       = yInc*Math.floor(y1*absChangeInX+0.5);
        var zThresh = z + absChangeInX;
        for (var x = Math.floor(x1+0.5); x !== Math.floor(x2+0.5); x += xInc) {
            raster[y][x] = 1;
            z += absChangeInY;
            if (z > zThresh) {
                y += yInc;
                zThresh += absChangeInX;
            }
        }
    } else {
        var x = Math.floor(x1+0.5);
        var z       = xInc*Math.floor(x1*absChangeInY+0.5);
        var zThresh = z + absChangeInY;
        for (var y = Math.floor(y1+0.5); y !== Math.floor(y2+0.5); y += yInc) {
            raster[y][x] = 255;
            z += absChangeInX;
            if (z > zThresh) {
                x += xInc;
                zThresh += absChangeInY;
            }
        }
    }
}

function drawLineApproach5(raster, x1, y1, x2, y2) {
    var changeInX = x2 - x1;
    var changeInY = y2 - y1;
    var xInc = changeInX < 0 ? -1 : 1;
    var yInc = changeInY < 0 ? -1 : 1;
    var absChangeInX = xInc === -1 ? -changeInX : changeInX;
    var absChangeInY = yInc === -1 ? -changeInY : changeInY;
    // Bresenham's Line Algorithm
    // https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
    if (absChangeInX > absChangeInY) {
        var d = absChangeInY+absChangeInY - absChangeInX;
        var y = Math.round(y1);
        for (var x = Math.round(x1); x !== Math.round(x2); x += xInc) {
            raster[y][x] = 255;
            if (d > 0) {
                y += yInc;
                d -= absChangeInX+absChangeInX;
            }
            d += absChangeInY+absChangeInY;
        }
    } else {
        var d = absChangeInX+absChangeInX - absChangeInY;
        var x = Math.round(x1);
        for (var y = Math.round(y1); y !== Math.round(y2); y += yInc) {
            raster[y][x] = 255;
            if (d > 0) {
                x += xInc;
                d -= absChangeInY+absChangeInY;
            }
            d += absChangeInX+absChangeInX;
        }
    }
}

function drawLineApproach6(raster, x1, y1, x2, y2) {
    var changeInX = x2 - x1;
    var changeInY = y2 - y1;
    var xInc = changeInX < 0 ? -1 : 1;
    var yInc = changeInY < 0 ? -1 : 1;
    var absChangeInX = xInc === -1 ? -changeInX : changeInX;
    var absChangeInY = yInc === -1 ? -changeInY : changeInY;
    if (absChangeInX > absChangeInY) {
        var slope = absChangeInY/absChangeInX;
        var x = Math.floor(x1+0.5);
        var y = Math.floor(y1);
        var yFrac = slope*(x1 - x + 0.5);
        if (yInc === -1) {
            y += 1.0;
            yFrac = 1 - yFrac;
        }
        for (; x !== Math.floor(x2+0.5); x += xInc) {
            raster[y     ][x] = Math.floor(256.0*(1.0 - yFrac));
            raster[y+yInc][x] = Math.floor(256.0*yFrac);
            yFrac += slope;
            if (yFrac >= 1.0) {
                yFrac -= 1.0;
                y += yInc;
            }
        }
    } else {
        var slope = absChangeInX/absChangeInY;
        var y = Math.floor(y1+0.5);
        var x = Math.floor(x1);
        var xFrac = slope*(y1 - y + 0.5);
        if (xInc === -1) {
            x += 1.0;
            xFrac = 1 - xFrac;
        }
        for (; y !== Math.floor(y2+0.5); y += yInc) {
            raster[y][x     ] = Math.floor(256.0*(1.0 - xFrac));
            raster[y][x+xInc] = Math.floor(256.0*xFrac);
            xFrac += slope;
            if (xFrac >= 1.0) {
                xFrac -= 1.0;
                x += xInc;
            }
        }
    }
}

function drawLineApproach7(raster, x1, y1, x2, y2) {
    x1 = (x1+0.5)|0;
    y1 = (y1+0.5)|0;
    x2 = (x2+0.5)|0;
    y2 = (y2+0.5)|0;
    var changeInX = x2 - x1;
    var changeInY = y2 - y1;
    var xInc = changeInX < 0 ? -1 : 1;
    var yInc = changeInY < 0 ? -1 : 1;
    var absChangeInX = xInc === -1 ? -changeInX : changeInX;
    var absChangeInY = yInc === -1 ? -changeInY : changeInY;
    var pixelVal = 255.0;
    if (absChangeInX > absChangeInY) {
        var pixelValDec = 256.0*absChangeInY/absChangeInX;
        var y = y1;
        for (var x = x1; x !== x2; x += xInc) {
            if (pixelVal < 0) {
                pixelVal += 256.0;
                y += yInc;
            }
            raster[y     ][x] = pixelVal | 0;
            raster[y+yInc][x] = (256.0 - pixelVal) | 0;
            pixelVal -= pixelValDec;
        }
    } else {
        var pixelValDec = 256.0*absChangeInX/absChangeInY;
        var x = x1;
        for (var y = y1; y !== y2; y += yInc) {
            if (pixelVal < 0) {
                pixelVal += 256.0;
                x += xInc;
            }
            raster[y][x     ] = pixelVal | 0;
            raster[y][x+xInc] = (256.0 - pixelVal) | 0;
            pixelVal -= pixelValDec;
        }
    }
}

/** @param {number[][]} raster **/
function print(raster) {
    var result = "";
    for (var i = 0; i < raster.length; ++i) {
        for (var j = 0; j < raster[i].length; ++j) {
            var pixelVal = raster[i][j];
            if (pixelVal < 16) {
                result += '  ';
            } else if (pixelVal < 64) {
                result += '░░';
            } else if (pixelVal < 128) {
                result += '▒▒';
            } else if (pixelVal < 192) {
                result += '▓▓';
            } else {
                result += '██';
            }
        }
        result += '\n';
    }
    console.log(result);
}

function main() {
    var radius = 40;
    var cx     = 50;
    var cy     = 50;

    var raster = createRaster(100, 100);
    var phi = 0;
    setInterval(() => {
        var x1 = cx + radius*Math.cos(phi - Math.PI);
        var y1 = cy + radius*Math.sin(phi - Math.PI);
        var x2 = cx + radius*Math.cos(phi);
        var y2 = cy + radius*Math.sin(phi);

        clearRaster(raster);
        //drawLineApproach1(raster, x1, y1, x2, y2);
        //drawLineApproach2(raster, x1, y1, x2, y2);
        //drawLineApproach3(raster, x1, y1, x2, y2);
        //drawLineApproach4(raster, x1, y1, x2, y2);
        //drawLineApproach5(raster, x1, y1, x2, y2);
        //drawLineApproach6(raster, x1, y1, x2, y2);
        drawLineApproach7(raster, x1, y1, x2, y2);
        console.log("\x1b[2J\x1B[H"); // ANSI terminal escape code to clear screen
        print(raster);
        phi += 1.0/64.0;
        if (phi > 2*Math.PI) {
            phi -= 2*Math.PI;
        }
    }, 10);
}

main();

