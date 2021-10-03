const vscode = require("vscode");

function linePositionsToLineRanges(linePositions) {
  let ranges = new Array();
  linePositions.forEach((pos1) => {
    ranges.push(
      new vscode.Range(pos1, new vscode.Position(pos1.line, pos1.character + 1))
    );
  });
  return ranges;
}

function calculateTravelLinePositions(x0, y0, x1, y1) {
  const differenceSteps = manhattan(x0, y0, x1, y1),
    diffX = x0 - x1,
    diffY = y0 - y1;
  var points = new Array();

  const bigX = x0 > x1 ? x0 : x1,
    bigY = y0 > y1 ? y0 : y1,
    smallX = bigX != x0 ? x0 : x1,
    smallY = bigY != y0 ? y0 : y1;

  for (var i = 0; i < differenceSteps; i++) {
    const ratio = i / differenceSteps;
    try {
      points = [
        new vscode.Position(
          Math.round(
            diffY * ratio < 0 ? bigY + diffY * ratio : smallY + diffY * ratio
          ),
          Math.round(
            diffX * ratio < 0 ? bigX + diffX * ratio : smallX + diffX * ratio
          )
        ),
        ...points,
      ];
    } catch (err) {}
  }
  return points;
}

function manhattan(x0, y0, x1, y1) {
  return Math.abs(x1 - x0) + Math.abs(y1 - y0);
}

module.exports = {
  linePositionsToLineRanges,
  calculateTravelLinePositions,
};
