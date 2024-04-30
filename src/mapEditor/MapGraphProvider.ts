import * as vscode from 'vscode';
import WebviewCollection from '../utility/WebviewCollection.js';
import CelesteMapDocument from './CelesteMapDocument.js';
import Element from './serialization/Element.js';

const VIEW_ID = "celeste.mapGraph";

/**
 * TreeItem that wraps around an {@link ElementItem}
 */
class ElementItem extends vscode.TreeItem {
    constructor(
        public readonly element: Element,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    ) {
        super(element.type, collapsibleState);
        
        this.tooltip = `this element is a ${element.type!}`;
        this.description = "descriptipon";
    }
}

export default class MapGraphProvider implements vscode.TreeDataProvider<ElementItem> {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerTreeDataProvider(
            VIEW_ID,
            new MapGraphProvider()
        );
    }

    private _tab: vscode.Tab | undefined;

    private readonly _onDidChangeTreeData = new vscode.EventEmitter<void | ElementItem | ElementItem[] | null | undefined>();
    public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor() {
        
    }
    
    getTreeItem(item: ElementItem): ElementItem | Thenable<ElementItem> {
        return item;
    }

    getChildren(item?: ElementItem): vscode.ProviderResult<ElementItem[]> {
        var children: ElementItem[] = [];

        if (item) {
            for (const child of item.element.children()) {
                children.push(new ElementItem(child, vscode.TreeItemCollapsibleState.Collapsed));
            }
        } else {
            
        }

        return children;
    }

    getParent?(item: ElementItem): vscode.ProviderResult<ElementItem> {
        return new ElementItem(item.element.parent!, vscode.TreeItemCollapsibleState.Collapsed);
    }
}