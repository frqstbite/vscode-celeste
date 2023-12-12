import * as vscode from 'vscode';
import Map from './celeste/Map';
import BinaryBuffer from './celeste/mapformat/BinaryBuffer';
import StringLookup from './celeste/mapformat/StringLookup';

async function readFile(uri: vscode.Uri): Promise<Uint8Array> {
    if (uri.scheme === 'untitled') { //Unsaved documents always start empty
        return new Uint8Array(0);
    }
    return await vscode.workspace.fs.readFile(uri);
}

// Handles bridging the gap between vscode and the Map class, including serialization
export default class MapDocument implements vscode.Disposable, vscode.CustomDocument {
    uri: vscode.Uri;
    map: Map;

    constructor(uri: vscode.Uri, data: Uint8Array) {
        this.uri = uri;
    }

    dispose(): void {

    }

    async save(cancellation: vscode.CancellationToken): Promise<void> {
		await this.saveAs(this.uri, cancellation);
	}

	async saveAs(target: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> {
        const lookup = new StringLookup();
		const buffer = new BinaryBuffer();
        this.map.toElement().serialize(buffer, lookup);

		if (cancellation.isCancellationRequested) {
			return;
		}

		await vscode.workspace.fs.writeFile(target, buffer.getData());
	}

    async revert(_cancellation: vscode.CancellationToken): Promise<void> {

    }

    async backup(destination: vscode.Uri, cancellation: vscode.CancellationToken): Promise<vscode.CustomDocumentBackup> {
		await this.saveAs(destination, cancellation);

		return {
			id: destination.toString(),
			delete: async () => {
				try {
					await vscode.workspace.fs.delete(destination);
				} catch {
					// noop
				}
			}
		};
	}
}