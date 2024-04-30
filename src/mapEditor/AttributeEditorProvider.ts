import * as vscode from 'vscode';
import { v1 } from 'uuid';

import WebviewCollection from '../utility/WebviewCollection';
import CelesteMapDocument from './CelesteMapDocument';
import Element from './serialization/Element';

export default class AttributeEditorProvider implements vscode.WebviewViewProvider {
    public static readonly viewId = "celeste.attributeEditor";

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerWebviewViewProvider(
            AttributeEditorProvider.viewId,
            new AttributeEditorProvider(context)
        );
    }

    private _view?: vscode.WebviewView;
    
    constructor(
        private readonly _extension: vscode.ExtensionContext
    ) {}

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extension.extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // TODO: Handle messages from the webview
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const nonce = v1();

        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extension.extensionUri, 'out', 'attributeEditor.js'));

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <!--
                Use a content security policy to only allow loading styles from our extension directory,
                and only allow scripts that have a specific nonce.
                (See the 'webview-sample' extension sample for img-src content security policy examples)
            -->
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
            <title>Attribute Editor</title>
        </head>
        <body>

            <vscode-button id="add-color-button">Howdy!</vscode-button>

            <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}