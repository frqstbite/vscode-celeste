import * as vscode from 'vscode';
import * as path from 'path';

import Element from './Element';
import BinaryBuffer from '../serialization/BinaryBuffer';
import StringLookup from '../serialization/StringLookup';

const HEADER = "CELESTE MAPS";
const EXTENSION = "bin";

async function readFile(uri: vscode.Uri): Promise<Uint8Array> {
    if (uri.scheme === 'untitled') { //Unsaved documents always start empty
        return new Uint8Array(0);
    }
    return await vscode.workspace.fs.readFile(uri);
}



// CustomDocument for Celeste maps
// Handles serialization and edit tracking
export default class CelesteMapDocument implements vscode.Disposable, vscode.CustomDocument {
    uri: vscode.Uri;
    structure: Element;

	static async open(uri: vscode.Uri): Promise<CelesteMapDocument> {
		const data = await readFile(uri);
		return new CelesteMapDocument(uri, data);
	}

    constructor(uri: vscode.Uri, data: Uint8Array) {
        this.uri = uri;

		const buffer = new BinaryBuffer(data);
		const header = buffer.readString();
		if (header !== HEADER) {
			throw new Error("Invalid header");
		}

        buffer.readString(); //Package name
        const lookup = StringLookup.deserialize(buffer);
		this.structure = Element.deserialize(buffer, lookup);
    }

    dispose(): void {

    }

    async save(cancellation: vscode.CancellationToken): Promise<void> {
		await this.saveAs(this.uri, cancellation);
	}

	async saveAs(target: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> {
        const lookup = new StringLookup();
		const buffer = new BinaryBuffer();
		buffer.writeString(HEADER);
		buffer.writeString(path.basename(target.path, '.' + EXTENSION)); //Package name
        this.structure.serialize(buffer, lookup);

		if (cancellation.isCancellationRequested) {
			return;
		}

		await vscode.workspace.fs.writeFile(target, buffer.getData());
	}

    async revert(_cancellation: vscode.CancellationToken): Promise<void> {
		const diskContent = await readFile(this.uri);
		
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