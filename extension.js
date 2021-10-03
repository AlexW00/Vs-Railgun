// @ts-nocheck
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode"),
  getHighlightColor = require("./helper/Colour.js"),
  Queue = require("./helper/Queue.js");
Converter = require("./helper/Converter.js");
config = require("./config.json");

let queue = new Queue(),
  pos = { previousChar: 0, previousLine: 0, currentChar: 0, currentLine: 0 },
  eventBuffer = [],
  lastEventTimestamp = 0;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "vsrailgun.activate",
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
    // necessairy to filter out weird glitch events, sometimes 3 events get fired instead of one
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

// helper for checking validity of an event, needs improvement
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

// Main draw method which draws the cursor animation based on new char/line coords of TextEditorSelectionChangeEvent
function draw(textEditorSelectionChangeEvent) {
  const textEditor = textEditorSelectionChangeEvent.textEditor;

  pos = {
    previousChar: pos.currentChar,
    previousLine: pos.currentLine,
    currentChar: textEditorSelectionChangeEvent.selections[0].start.character,
    currentLine: textEditorSelectionChangeEvent.selections[0].start.line,
  };

  // get array of Position objects based on coordinates; convert to array of Ranges which can be used by VS Code decoration api
  let travelLinePositions = Converter.calculateTravelLinePositions(
      pos.previousChar,
      pos.previousLine,
      pos.currentChar,
      pos.currentLine
    ),
    travelLineRanges = Converter.linePositionsToLineRanges(travelLinePositions);

  // add decoration to queue of functions
  queue.add_function(decorateAll, {
    rangeArray: travelLineRanges,
    textEditor: textEditor,
  });
}

// function that loops over all Ranges and decorates each of them
function decorateAll({ rangeArray, textEditor }) {
  return new Promise(async (resolve) => {
    let len = rangeArray.length;
    for (let i = 0; len > i; i++) {
      let lineProgressPercentage = i / len;
      setTimeout(
        () =>
          // call decoration function for each Range object of the array
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

// decorates a given Range recursively
function decorate(params, msTotal, msTaken, lineProgressPercentage) {
  if (msTaken >= msTotal) {
    destroyDecoration(params);
    return;
  }
  const tick = Math.round(msTotal / config.highlight.numOfFrames);

  params.decorationType?.dispose();
  params.decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: getHighlightColor(
      msTaken,
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

module.exports = {
  activate,
  deactivate,
};
