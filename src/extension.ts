import * as vscode from "vscode";
import * as fs from "fs";

let shouldStop = false;

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "human-typer.typeClipboard",
      async () => {
        shouldStop = false;
        const text = await vscode.env.clipboard.readText();
        await typeText(text);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "human-typer.typeFromFile",
      async () => {
        shouldStop = false;
        const file = await vscode.window.showOpenDialog({
          canSelectMany: false,
          filters: { Text: ["txt", "js", "ts", "html", "css", "json"] }
        });

        if (!file) return;

        const text = fs.readFileSync(file[0].fsPath, "utf-8");
        await typeText(text);
      }
    )
  );

  // 🛑 STOP COMMAND
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "human-typer.stopTyping",
      () => {
        shouldStop = true;
        vscode.window.showInformationMessage("Human Typer stopped");
      }
    )
  );
}

async function typeText(text: string) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !text) return;

  const config = vscode.workspace.getConfiguration("humanTyper");

  const minDelay = config.get<number>("minDelay", 30);
  const maxDelay = config.get<number>("maxDelay", 90);
  const pauseAfterNewLine = config.get<number>("pauseAfterNewLine", 200);
  const pauseAfterBrace = config.get<number>("pauseAfterBrace", 300);
  const pauseAfterSemicolon = config.get<number>("pauseAfterSemicolon", 180);
  const lineByLine = config.get<boolean>("lineByLine", false);
  const mistakeChance = config.get<number>("mistakeChance", 0);

  const lines = lineByLine ? text.split("\n") : [text];

  for (const line of lines) {
    if (shouldStop) return;

    const chars = lineByLine ? line + "\n" : line;

    for (const char of chars) {
      if (shouldStop) return;

      // Optional mistake simulation
      if (mistakeChance > 0 && Math.random() < mistakeChance) {
        await editor.edit(e => e.insert(editor.selection.active, randomChar()));
        await sleep(80);
        await editor.edit(e =>
          e.delete(
            new vscode.Range(
              editor.selection.active.translate(0, -1),
              editor.selection.active
            )
          )
        );
      }

      await editor.edit(e => e.insert(editor.selection.active, char));

      let delay = minDelay + Math.random() * (maxDelay - minDelay);
      if (char === "\n") delay += pauseAfterNewLine;
      else if (char === "{" || char === "}") delay += pauseAfterBrace;
      else if (char === ";") delay += pauseAfterSemicolon;

      await sleep(delay);
    }
  }
}

function randomChar() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  return chars[Math.floor(Math.random() * chars.length)];
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function deactivate() {}
