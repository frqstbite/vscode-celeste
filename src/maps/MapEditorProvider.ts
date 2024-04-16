import * as vscode from 'vscode';
import WebviewCollection from '../WebviewCollection';
import CelesteMapDocument from './CelesteMapDocument';

const VIEW_TYPE = "celeste.mapEditor";

export default class MapEditorProvider implements vscode.CustomEditorProvider<CelesteMapDocument> {
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

    private readonly webviews = new WebviewCollection();

    constructor(context: vscode.ExtensionContext) {

    }

    private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<CelesteMapDocument>>();
	public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

    async openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): Promise<CelesteMapDocument> {
        return CelesteMapDocument.open(uri);
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

    backupCustomDocument(document: CelesteMapDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
        throw new Error('Method not implemented.');
    }

    resolveCustomEditor(document: CelesteMapDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
        throw new Error('Method not implemented.');
    }
}