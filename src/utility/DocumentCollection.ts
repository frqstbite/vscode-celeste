import * as vscode from 'vscode';
import { Disposable } from './Disposable';

/**
 * Tracks `CustomDocument`s and their associated webviews.
 */
export default class DocumentCollection<T extends Disposable & vscode.CustomDocument> {

	private readonly _documents = new Set<{
		readonly resource: string;
		readonly document: T;
		readonly webviews: Set<vscode.WebviewPanel>;
	}>();

	/**
	 * Get a `CustomDocument` from the collection.
	 */
	public get(uri: vscode.Uri): T | undefined {
		const key = uri.toString();
		for (const entry of this._documents) {
			if (entry.resource === key) {
				return entry.document;
			}
		}
		return undefined;
	}

	/**
	 * Get all known webviews for a given uri.
	 */
	public *getWebviews(uri: vscode.Uri): Iterable<vscode.WebviewPanel> {
		const key = uri.toString();
		for (const entry of this._documents) {
			if (entry.resource === key) {
				for (const webview of entry.webviews) {
					yield webview;
				}
				return;
			}
		}
	}

	/**
	 * Add a new `CustomDocument` to the collection.
	 */
	public add(uri: vscode.Uri, document: T) {
		const entry = {
			resource: uri.toString(),
			document: document,
			webviews: new Set<vscode.WebviewPanel>(),
		};
		this._documents.add(entry);

		document.onDidDispose( () => this._documents.delete(entry) );
	}

	/**
	 * Add a new webview to the collection.
	 */
	public addWebview(uri: vscode.Uri, webview: vscode.WebviewPanel) {
		const key = uri.toString();
		for (const entry of this._documents) {
			if (entry.resource === key) {
				entry.webviews.add(webview);
				webview.onDidDispose( () => entry.webviews.delete(webview) );
				return;
			}
		}
	}
}