import * as vscode from 'vscode';
import WebviewCollection from '../WebviewCollection';
import CelesteMapDocument from './CelesteMapDocument';
import Element from './Element';

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
    onDidChangeTreeData?: vscode.Event<void | ElementItem | ElementItem[] | null | undefined> | undefined;
    
    getTreeItem(item: ElementItem): ElementItem | Thenable<ElementItem> {
        return item;
    }

    getChildren(item?: ElementItem | undefined): vscode.ProviderResult<ElementItem[]> {
        var children: ElementItem[] = [];

        if (item) {
            for (const child of item.element.children()) {
                children.push(new ElementItem(child, vscode.TreeItemCollapsibleState.Collapsed));
            }
        }

        return children;
    }

    getParent?(item: ElementItem): vscode.ProviderResult<ElementItem> {
        return new ElementItem(item.element.parent!, vscode.TreeItemCollapsibleState.Collapsed);
    }
}