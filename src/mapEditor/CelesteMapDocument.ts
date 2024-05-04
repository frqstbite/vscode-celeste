import * as vscode from 'vscode';
import * as path from 'path';

import { Disposable } from '../utility/Disposable';
import Element from './serialization/Element';
import BinaryBuffer from './serialization/BinaryBuffer';
import StringLookup from './serialization/StringLookup';
import ElementTree from './serialization/ElementTree';


/**
 * CustomDocument for Celeste maps.
 * Handles serialization and edit tracking.
 */
export default class CelesteMapDocument extends Disposable implements vscode.CustomDocument {
	private static readonly header = "CELESTE MAP";

    public readonly uri: vscode.Uri;
    
	private readonly _root: string;
	public get root() { return this.getElement(this._root) }
	
	private _elements: ElementTree;
	private _edits: vscode.CustomDocumentEditEvent<CelesteMapDocument>[] = [];
	private _savedEdits: vscode.CustomDocumentEditEvent<CelesteMapDocument>[] = [];

    private readonly _onDidChangeContent = this._register(new vscode.EventEmitter<vscode.CustomDocumentEditEvent<CelesteMapDocument>>());
	/**
	 * Fired when the document is modified.
	 */
	public readonly onDidChangeContent = this._onDidChangeContent.event;

	static async open(uri: vscode.Uri, context: vscode.CustomDocumentOpenContext): Promise<CelesteMapDocument> {
		const data =  context.untitledDocumentData || await vscode.workspace.fs.readFile(uri);
		const map = new CelesteMapDocument(uri, data);

		return map;
	}

    constructor(uri: vscode.Uri, data: Uint8Array) {
		super();

        this.uri = uri;

		const buffer = new BinaryBuffer(data);
		const header = buffer.readString();
		if (header !== CelesteMapDocument.header) {
			throw new Error(`Invalid header: ${header} (expected ${CelesteMapDocument.header})`);
		}
		
		buffer.readString(); //Package name

        const lookup = StringLookup.deserialize(buffer);
		this._elements = ElementTree.fromBinary(buffer, lookup);
		this._root = this._elements.root;
    }

	getElement(id: string): Element | undefined {
		return this._elements.getElement(id);
	}

	insertElement(parentId: string, id: string): void {
		const parent = this.getElement(parentId);
		if (!parent) throw new Error(`Element with id ${parentId} not found`);
		const element = this.getElement(id);
		if (!element) throw new Error(`Element with id ${id} not found`);

		const edit = {
			document: this,
			label: 'Insert Element',
			undo: () => {
				this._edits.pop();
				element.delete();
			},
			redo: () => {
				this._edits.push(edit);
				element.setParent(parent);
			}
		};
		edit.redo();
		this._onDidChangeContent.fire(edit);
	}
	
	changeElement(id: string, changes: { [key: string]: any }): void {
		const element = this.getElement(id);
		if (!element) throw new Error(`Element with id ${id} not found`);

		const oldValues: { [key: string]: any } = {};
		const newValues: { [key: string]: any } = {};
		for (const key in changes) {
			oldValues[key] = element.getAttribute(key);
			newValues[key] = changes[key];
		}

		const edit = {
			document: this,
			label: 'Change Element',
			undo: () => {
				this._edits.pop();
				for (const key in oldValues) {
					element.setAttribute(key, oldValues[key]);
				}
			},
			redo: () => {
				this._edits.push(edit);
				for (const key in newValues) {
					element.setAttribute(key, newValues[key]);
				}
			}
		};
		edit.redo();
		this._onDidChangeContent.fire(edit);
	}

	removeElement(id: string): void {
		const element = this.getElement(id);
		if (!element) throw new Error(`Element with id ${id} not found`);

		const parent = element.getParent();
		if (!parent) throw new Error('Cannot remove the root element');

		const edit = {
			document: this,
			label: 'Remove Element',
			undo: () => {
				this._edits.pop();
				element.setParent(parent!);
			},
			redo: () => {
				this._edits.push(edit);
				element.delete();
			}
		};
		edit.redo();
		this._onDidChangeContent.fire(edit);
	}

    async save(cancellation: vscode.CancellationToken): Promise<void> {
		await this.saveAs(this.uri, cancellation);
	}

	async saveAs(target: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> {
		this._savedEdits = Array.from(this._edits); //Mark edits as saved

        const lookup = new StringLookup();
		const buffer = new BinaryBuffer();
		buffer.writeString(CelesteMapDocument.header);
		buffer.writeString(path.basename(target.path, path.extname(target.path))); //Package name
        this.root?.toBinary(buffer, lookup);

		if (cancellation.isCancellationRequested) {
			return;
		}

		await vscode.workspace.fs.writeFile(target, buffer.getData());
	}

    async revert(_cancellation: vscode.CancellationToken): Promise<void> {
		// Undo edits until its present in the saved edits
		while (this._edits.length > this._savedEdits.length) {
			this._edits.pop()?.undo();
		}
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