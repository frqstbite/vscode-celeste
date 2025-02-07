import * as vscode from 'vscode';
import { v1 } from 'uuid';

import DocumentCollection from '../utility/DocumentCollection';
import CelesteMapDocument from '../CelesteMapDocument';

export default class MapEditorProvider implements vscode.CustomEditorProvider<CelesteMapDocument> {
    public static readonly viewType = 'celeste.mapViewport';

    public static activeDocument: CelesteMapDocument | undefined;
    private static readonly _onDidChangeActiveDocument = new vscode.EventEmitter<CelesteMapDocument | undefined>();
    /**
     * Fired when the active document changes.
     */
    public static readonly onDidChangeActiveDocument = MapEditorProvider._onDidChangeActiveDocument.event;

    public static activeWebview: vscode.WebviewPanel | undefined;
    private static readonly _onDidChangeActiveWebview = new vscode.EventEmitter<vscode.WebviewPanel | undefined>();
    public static readonly onDidChangeActiveWebview = MapEditorProvider._onDidChangeActiveWebview.event;

    public static register(extension: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider(
            MapEditorProvider.viewType,
            new MapEditorProvider(extension),
            {
                supportsMultipleEditorsPerDocument: true,
                webviewOptions: {
					retainContextWhenHidden: true
				}
            }
        );
    }

    private readonly _extension: vscode.ExtensionContext;
    private readonly _documents = new DocumentCollection<CelesteMapDocument>();

    private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<CelesteMapDocument>>();
	public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

    constructor(extension: vscode.ExtensionContext) {
        this._extension = extension;

        // Update active document when tab changes
        this._updateActiveDocument();
        vscode.window.tabGroups.onDidChangeTabs( (_) => this._updateActiveDocument() );
    }

    private _updateActiveDocument() {
        const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
        const data = tab?.input as any;

        if (data?.viewType === MapEditorProvider.viewType) {
            // Active document is a CelesteMapDocument
            const active = this._documents.get(data.uri);
            if (active !== MapEditorProvider.activeDocument) {
                MapEditorProvider.activeDocument = active;
            } else {
                return; //No change
            }
        } else {
            MapEditorProvider.activeDocument = undefined;
        }

        MapEditorProvider._onDidChangeActiveDocument.fire(MapEditorProvider.activeDocument);
    }
    
    async openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): Promise<CelesteMapDocument> {
        const map = await CelesteMapDocument.open(uri, openContext);

		if (token.isCancellationRequested) {
			map.dispose(); //Dispose the document if the operation was canceled
			throw new Error('Canceled'); //cant return null so i guess we're just gonna fuckin throw?? god forbid i want to cancel this operation
		}

        const upsig = map.onDidChangeContent((e) => this._onDidChangeCustomDocument.fire(e)); //Forward content changes to VS Code
        const dsig = map.onDidDispose(() => {
            upsig.dispose();
            dsig.dispose();
        });

        return map;
    }

    async saveCustomDocument(document: CelesteMapDocument, cancellation: vscode.CancellationToken): Promise<void> {
        await document.save(cancellation);
    }

    async saveCustomDocumentAs(document: CelesteMapDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> {
        await document.saveAs(destination, cancellation);
    }

    async revertCustomDocument(document: CelesteMapDocument, cancellation: vscode.CancellationToken): Promise<void> {
        await document.revert(cancellation);
    }

    async backupCustomDocument(document: CelesteMapDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Promise<vscode.CustomDocumentBackup> {
        return await document.backup(context.destination, cancellation);
    }

    resolveCustomEditor(document: CelesteMapDocument, panel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
        // Begin tracking this document
        this._documents.add(document.uri, document);
        this._documents.addWebview(document.uri, panel);
        this._updateActiveDocument();
        
        panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extension.extensionUri, 'out'),
                vscode.Uri.joinPath(this._extension.extensionUri, 'assets')
            ]
        };
        
        panel.webview.html = this._getHtmlForWebview(panel.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = this._webviewUrl(webview, ['out', 'mapViewport.js']);
        const styleUri = this._webviewUrl(webview, ['assets', 'css', 'mapViewport.css'])
        const nonce = v1();

        return `<!DOCTYPE html>
        <html lang='en'>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <meta http-equiv='Content-Security-Policy' content='default-src 'none'; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';'>
                <link href=${styleUri} rel='stylesheet' />
                <title>Celeste Map Editor</title>
            </head>
            <body>
                <div id='app'></div>
                <script type='module' src='${scriptUri}' nonce='${nonce}'></script>
            </body>
        </html>`;
    }

    private _webviewUrl(webview: vscode.Webview, path: string[]) {
        return webview.asWebviewUri(vscode.Uri.joinPath(this._extension.extensionUri, ...path));
    }
}