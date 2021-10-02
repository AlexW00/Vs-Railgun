// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const { readBuilderProgram } = require("typescript");
const vscode = require("vscode");
let editor;

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
  let lastLine = 0,
    lastChar = 0;

  vscode.window.onDidChangeTextEditorSelection(function (textEditor) {
    if (textEditor.selections.length > 2) {
      console.log("selected text");
      return;
    }
    const newLine = textEditor.selections[0].start.line,
      newChar = textEditor.selections[0].start.character,
      kind = textEditor.kind ?? 0;

    console.log("last line: " + lastLine + " last char: " + lastChar);
    console.log("new line: " + newLine + " new char: " + newChar);

    let lineCoords = line(lastChar, lastLine, newChar, newLine),
      rangeArray = getRangeArray(lineCoords);
    editor = textEditor.textEditor;
    decorateAll(rangeArray, textEditor);

    lastLine = newLine;
    lastChar = newChar;
  });
}

function decorateAll(rangeArray, textEditor) {
  if (rangeArray.length == 0) return;
  decorate(
    {
      editor: textEditor.textEditor,
      range: rangeArray.splice(0, 1),
      decorationType: vscode.window.createTextEditorDecorationType({
        backgroundColor: getCursorShape(100, 100),
      }),
    },
    200,
    0
  );
  sleep(50).then(() => decorateAll(rangeArray, textEditor));
}

function getRangeArray(lineCoords) {
  let ranges = new Array();
  lineCoords.forEach((pos1) => {
    ranges.push(
      new vscode.Range(pos1, new vscode.Position(pos1.line, pos1.character + 1))
    );
  });
  return ranges;
}

function getLine(x1, y1, x2, y2) {
  var points = new Array(),
    a = x1 - x2,
    b = y1 - y2,
    numberOfPoints = Math.sqrt(a * a + b * b);
  // TODO: ??????
  for (var i = 0; i < numberOfPoints; i++) {
    points.push(
      new vscode.Position(
        Math.round((Math.abs(y1 - y2) / numberOfPoints) * i + y2),
        Math.round((Math.abs(x1 - x2) / 10) * i + y2)
      )
    );
  }

  return points;
}

function line(x0, y0, x1, y1) {
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
      points.push(
        new vscode.Position(
          Math.round(
            diffY * ratio < 0 ? bigY + diffY * ratio : smallY + diffY * ratio
          ),
          Math.round(
            diffX * ratio < 0 ? bigX + diffX * ratio : smallX + diffX * ratio
          )
        )
      );
    } catch (err) {}
  }
  return points.reverse();
}

function manhattan(x0, y0, x1, y1) {
  return Math.abs(x1 - x0) + Math.abs(y1 - y0);
}

function decorate(params, msTotal, msTaken) {
  if (msTaken >= msTotal) {
    destroyDecoration(params);
    return;
  }
  const tick = Math.round(msTotal / 20);

  params.decorationType?.dispose();
  params.decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: getCursorShape(msTotal - msTaken, msTotal),
  });
  params.editor.setDecorations(params.decorationType, params.range);
  sleep(msTotal / tick).then(() => {
    decorate(params, msTotal, msTaken + tick);
  });
}

let updateDecoration = (msLeft, msTotal, params) => {
  params.decorationType?.dispose();
  params.decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: getCursorShape(msLeft, msTotal),
  });
  params.editor.setDecorations(params.decorationType, params.decorationOptions);
};

let destroyDecoration = (params) => {
  params.decorationType?.dispose();
};

// this method is called when your extension is deactivated
function deactivate() {
  //console.log("Deactivated");
}

function getCursorShape(ms, msTotal) {
  const ratio = 1 - (msTotal - ms) / msTotal;
  return "rgba(255,255,255," + ratio + ")";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function looper(ms, pause, onLoop, onEnd, obj) {
  const numOfLoops = ms / pause;
  for (let i = 0; i < numOfLoops; i++) {
    //console.log("Updating: " + (ms - i * pause));
    onLoop(ms - i * pause, ms, obj);
    await sleep(pause);
  }
  onEnd(obj);
  //console.log("Deleting");
}

module.exports = {
  activate,
  deactivate,
};
