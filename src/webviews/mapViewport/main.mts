const vscode = acquireVsCodeApi();

vscode.postMessage({
    command: 'alert',
    text: 'Hello from the Celeste editor viewport !'
});