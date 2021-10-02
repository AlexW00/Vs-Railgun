// @ts-nocheck
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const { readBuilderProgram } = require("typescript");
const vscode = require("vscode");
const Queue = require("./helper/Queue.js");
const config = require("./config.json");
let editor,
  queue = new Queue(),
  pos = { previousChar: 0, previousLine: 0, currentChar: 0, currentLine: 0 },
  lastMove = 0,
  eventBuffer = [],
  lastEventTimestamp = 0;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vsrailgun" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "vsrailgun.helloWorld",
    function () {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Activated RailGun");
    }
  );

  context.subscriptions.push(disposable);

  vscode.window.onDidChangeTextEditorSelection(function (
    textEditorSelectionChangeEvent
  ) {
    lastEventTimestamp = Date.now();
    if (textEditorSelectionChangeEvent.selections[0].start.character == 0) {
      checkEventValidity(textEditorSelectionChangeEvent)
        .then((textEditorSelectionChangeEvent) =>
          draw(textEditorSelectionChangeEvent)
        )
        .catch((reason) => {
          console.log(reason);
        });
    } else draw(textEditorSelectionChangeEvent);
  });
}

function checkEventValidity(textEditorSelectionChangeEvent) {
  return new Promise((resolve, reject) => {
    eventBuffer.push(textEditorSelectionChangeEvent);
    setTimeout(() => {
      if (eventBuffer.length == 1) resolve(textEditorSelectionChangeEvent);
      else eventBuffer = [];
      reject("Invalid event");
    }, 50);
  });
}

function draw(textEditorSelectionChangeEvent) {
  lastMove = Date.now();
  console.log("EXE");
  console.log(textEditorSelectionChangeEvent);
  if (textEditorSelectionChangeEvent.selections.length > 2) {
    return;
  }
  const newLine = textEditorSelectionChangeEvent.selections[0].start.line,
    newChar = textEditorSelectionChangeEvent.selections[0].start.character,
    textEditor = textEditorSelectionChangeEvent.textEditor,
    kind = textEditorSelectionChangeEvent.kind ?? 0;

  pos = {
    previousChar: pos.currentChar,
    previousLine: pos.currentLine,
    currentChar: newChar,
    currentLine: newLine,
  };

  console.log(pos);
  let travelLinePositions = calculateTravelLinePositions(
      pos.previousChar,
      pos.previousLine,
      pos.currentChar,
      pos.currentLine
    ),
    travelLineRanges = linePositionsToLineRanges(travelLinePositions);

  queue.add_function(decorateAll, {
    rangeArray: travelLineRanges,
    textEditor: textEditor,
  });
}

function decorateAll({ rangeArray, textEditor }) {
  return new Promise(async (resolve, reject) => {
    let len = rangeArray.length;
    for (let i = 0; len > i; i++) {
      let lineProgressPercentage = i / len;
      setTimeout(
        () =>
          decorate(
            {
              editor: textEditor,
              range: rangeArray.splice(0, 1),
              decorationType: vscode.window.createTextEditorDecorationType({
                backgroundColor: getHighlightColor(
                  100,
                  100,
                  lineProgressPercentage
                ),
              }),
            },
            config.highlight.duration,
            0,
            lineProgressPercentage
          ),
        config.line.speed * i
      );
    }
    lineProgressPercentage = 1;
    resolve();
  });
}

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

function decorate(params, msTotal, msTaken, lineProgressPercentage) {
  if (msTaken >= msTotal) {
    destroyDecoration(params);
    return;
  }
  const tick = Math.round(msTotal / config.highlight.numOfFrames);

  params.decorationType?.dispose();
  params.decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: getHighlightColor(
      msTotal - msTaken,
      msTotal,
      lineProgressPercentage
    ),
  });
  params.editor.setDecorations(params.decorationType, params.range);
  setTimeout(
    () => decorate(params, msTotal, msTaken + tick, lineProgressPercentage),
    msTotal / tick
  );
}

let destroyDecoration = (params) => {
  params.decorationType?.dispose();
};

// this method is called when your extension is deactivated
function deactivate() {
  //console.log("Deactivated");
}

function getHighlightColor(ms, msTotal, lineProgressPercentage) {
  const alpha = 1 - (msTotal - ms) / msTotal;
  let r = _getRainbowColour(lineProgressPercentage);
  //console.log(r);
  if (config.highlight.rainbowColourMode)
    return "rgba(" + r[0] + "," + r[1] + "," + r[2] + "," + alpha + ")";
  else return "rgba(" + config.highlight.colour + "," + alpha + ")";
}

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  activate,
  deactivate,
};
