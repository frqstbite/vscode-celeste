import * as vscode from 'vscode';
import MapDocument from './MapDocument';

export class MapEditorProvider implements vscode.CustomEditorProvider<MapDocument> {
    private static readonly viewType = "celeste.mapEditor";

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider(
            MapEditorProvider.viewType,
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

    openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): MapDocument | Thenable<MapDocument> {
        throw new Error('Method not implemented.');
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