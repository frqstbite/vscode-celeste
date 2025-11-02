import path from 'path';
import * as vscode from 'vscode';
import Element from '../../../common/src/Element.js';
import CelesteMapDocument from '../CelesteMapDocument.js';
import DocumentCollection from '../utility/DocumentCollection.js';
import MapEditorProvider from './MapEditorProvider.js';

/**
 * TreeItem that wraps around an {@link ElementItem}
 */
class ElementItem extends vscode.TreeItem {
	constructor(
		public readonly element: Element,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(element.type, collapsibleState);

		this.tooltip = `this element is a ${element.type!}`;
		this.description = element.getAttribute('name');
	}
}

export default class MapGraphProvider implements vscode.TreeDataProvider<ElementItem> {
	private static readonly viewId = 'celeste.mapGraph';

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		return vscode.window.registerTreeDataProvider(
			MapGraphProvider.viewId,
			new MapGraphProvider()
		);
	}

	private readonly _onDidChangeTreeData = new vscode.EventEmitter<
		void | ElementItem | ElementItem[] | null | undefined
	>();
	public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	constructor() {
		MapEditorProvider.onDidChangeActiveDocument((document) => {
			this._onDidChangeTreeData.fire();
		});
	}

	getTreeItem(item: ElementItem): ElementItem | Thenable<ElementItem> {
		return item;
	}

	getChildren(item?: ElementItem): vscode.ProviderResult<ElementItem[]> {
		var children: ElementItem[] = [];

		if (item) {
			for (const child of item.element.getChildren()) {
				children.push(new ElementItem(child, vscode.TreeItemCollapsibleState.Collapsed));
			}
		} else {
			const document = MapEditorProvider.activeDocument;
			if (document) {
				children.push(
					new ElementItem(document.root!, vscode.TreeItemCollapsibleState.Collapsed)
				);
			}
		}

		return children;
	}

	getParent?(item: ElementItem): vscode.ProviderResult<ElementItem> {
		return new ElementItem(
			item.element.getParent()!,
			vscode.TreeItemCollapsibleState.Collapsed
		);
	}
}
