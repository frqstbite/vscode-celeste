import * as vscode from 'vscode';
import * as path from 'path';

import Element from '../celeste/Element';
import BinaryBuffer from '../celeste/BinaryBuffer';
import StringLookup from '../celeste/StringLookup';

const HEADER = "CELESTE MAPS";
const EXTENSION = "bin";

// Handles bridging the gap between vscode and Element abstraction, including serialization
export default class MapDocument implements vscode.Disposable, vscode.CustomDocument {
    uri: vscode.Uri;
    map: Element;

    constructor(uri: vscode.Uri, data: Uint8Array) {
        this.uri = uri;

		const buffer = new BinaryBuffer(data);
		const header = buffer.readString();
		if (header !== HEADER) {
			throw new Error("Invalid header");
		}

        buffer.readString(); //Package name
        const lookup = StringLookup.deserialize(buffer);
		this.map = Element.deserialize(buffer, lookup);
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
        this.map.serialize(buffer, lookup);

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