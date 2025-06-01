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
    var deltaX = x2 - x1;
    var deltaY = y2 - y1;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
            var xTemp = x1;
            var yTemp = y1;
            x1 = x2;
            y1 = y2;
            x2 = xTemp;
            y2 = yTemp;
            deltaX = -deltaX;
            deltaY = -deltaY;
        }
        var slope = deltaY/deltaX;
        for (var x = Math.round(x1), y = y1+0.5;
            x <= Math.round(x2);
            ++x, y += slope
        ) {
            raster[Math.floor(y)][x] = 1;
        }
    } else {
        if (deltaY < 0) {
            var xTemp = x1;
            var yTemp = y1;
            x1 = x2;
            y1 = y2;
            x2 = xTemp;
            y2 = yTemp;
            deltaX = -deltaX;
            deltaY = -deltaY;
        }
        var slope = deltaX/deltaY;
        for (var y = Math.round(y1), x = x1+0.5;
            y <= y2;
            ++y, x += slope
        ) {
            raster[y][Math.floor(x)] = 1;
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
        drawLineApproach1(raster, x1, y1, x2, y2);
        console.log("\x1b[2J\x1B[H"); // ANSI terminal escape code to clear screen
        print(raster);
        phi += 1.0/16.0;
        if (phi > 2*Math.PI) {
            phi -= 2*Math.PI;
        }
    }, 100);
}

main();

