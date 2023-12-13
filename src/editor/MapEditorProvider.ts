import * as vscode from 'vscode';
import MapDocument from './MapDocument';

const VIEW_TYPE = "celeste.mapEditor";

async function readFile(uri: vscode.Uri): Promise<Uint8Array> {
    if (uri.scheme === 'untitled') { //Unsaved documents always start empty
        return new Uint8Array(0);
    }
    return await vscode.workspace.fs.readFile(uri);
}

export default class MapEditorProvider implements vscode.CustomEditorProvider<MapDocument> {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider(
            VIEW_TYPE,
            new MapEditorProvider(context),
            {
                webviewOptions: {
					retainContextWhenHidden: true,
				},
            }
        );
    }

    constructor(context: vscode.ExtensionContext) {

    }

    private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<MapDocument>>();
	public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

    async openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): Promise<MapDocument> {
        const data = await readFile(uri);
        return new MapDocument(uri, data);
    }

    async saveCustomDocument(document: MapDocument, cancellation: vscode.CancellationToken): Promise<void> {
        await document.save(cancellation);
    }

    async saveCustomDocumentAs(document: MapDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> {
        await document.saveAs(destination, cancellation);
    }

    revertCustomDocument(document: MapDocument, cancellation: vscode.CancellationToken): Promise<void> {
        throw new Error('Method not implemented.');
    }

    backupCustomDocument(document: MapDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
        throw new Error('Method not implemented.');
    }

    resolveCustomEditor(document: MapDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
        throw new Error('Method not implemented.');
    }
}