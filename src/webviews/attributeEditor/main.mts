import { provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox } from "@vscode/webview-ui-toolkit";

// Register UI components
provideVSCodeDesignSystem().register(
    vsCodeButton(),
    vsCodeCheckbox()
);

// Get the global vscode object
const vscode = acquireVsCodeApi();

// Handle messages from the webview
window.addEventListener('message', event => {
    const message = event.data; // The JSON data our extension sent

    switch (message.command) {
        case 'alert':
            alert(message.text);
            break;
        case 'select':
            console.log(message.text);
            break;
    }
});

// Send a message to our extension
vscode.postMessage({
    command: 'alert',
    text: 'Hello from the webview!'
});

// DOM elements
const viewportElement = document.getElementById('viewport');
