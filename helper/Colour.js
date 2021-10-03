// @ts-nocheck
const config = require("../config.json");

// returns the color based on time elapsed
function getHighlightColor(ms, msTotal, lineProgressPercentage) {
  const alpha = 1 - (msTotal - ms) / msTotal;
  let r = _getRainbowColour(lineProgressPercentage);
  //console.log(r);
  if (config.highlight.rainbowColourMode)
    return "rgba(" + r[0] + "," + r[1] + "," + r[2] + "," + alpha + ")";
  else return "rgba(" + config.highlight.colour + "," + alpha + ")";
}

// returns colour based on x(%) value
function _getRainbowColour(x) {
  let r = x,
    g = x + 1 / 6 > 1 ? x + 1 / 6 - 1 : x + 1 / 6,
    b = x + 2 / 6 > 1 ? x + 2 / 6 - 1 : x + 2 / 6;
  return [
    _calcColourIngredient(r),
    _calcColourIngredient(g),
    _calcColourIngredient(b),
  ];
}

function _calcColourIngredient(percent) {
  let total = 6 * 255,
    pos = total * percent;
  let c = 255;
  if (pos > total * (1 / 6) && pos < total * (5 / 6)) {
    if (pos < total * (2 / 6) || pos > total * (4 / 6)) {
      c = c - Math.abs(total / 2 - pos) / 3;
    }
  } else c = 90;
  return c;
}

module.exports = getHighlightColor;
