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
            raster[Math.floor(y)][x] = 1;
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
            raster[y][Math.floor(x)] = 1;
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
        ) { raster[Math.floor(y)][x] = 1; }
    } else {
        var yInc = changeInY < 0 ? -1 : 1;
        var xInc = yInc*changeInX/changeInY;
        for (var y = Math.floor(y1+0.5), x = x1+0.5;
            y !== Math.floor(y2+0.5);
            y += yInc, x += xInc
        ) { raster[y][Math.floor(x)] = 1; }
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
        raster[y][x] = 1;
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
            raster[y][x] = 1;
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
            raster[y][x] = 1;
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
            raster[y][x] = 1;
            if (d > 0) {
                x += xInc;
                d -= absChangeInY+absChangeInY;
            }
            d += absChangeInX+absChangeInX;
        }
    }
}

/** @param {number[][]} raster **/
function print(raster) {
    var result = "";
    for (var i = 0; i < raster.length; ++i) {
        for (var j = 0; j < raster[i].length; ++j) {
            result += raster[i][j] ? '##' : '  ';
        }
        result += '\n';
    }
    console.log(result);
}

function main() {
    var radius = 15;
    var cx     = 20;
    var cy     = 20;

    var raster = createRaster(40, 40);
    var phi = Math.PI/4;
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
        drawLineApproach5(raster, x1, y1, x2, y2);
        console.log("\x1b[2J\x1B[H"); // ANSI terminal escape code to clear screen
        print(raster);
        phi += 1.0/64.0;
        if (phi > 2*Math.PI) {
            phi -= 2*Math.PI;
        }
    }, 10);
}

main();

