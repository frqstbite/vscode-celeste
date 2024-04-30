import * as vscode from 'vscode';
import { getAppPath } from 'steam-path';

import AttributeEditorProvider from './mapEditor/AttributeEditorProvider';
import MapEditorProvider from './mapEditor/MapEditorProvider';
import MapGraphProvider from './mapEditor/MapGraphProvider';
import registerSchemas from './schemas';

const CELESTE_APP_ID = 504230;

export async function activate(context: vscode.ExtensionContext) {
/*	const celeste = await getAppPath(CELESTE_APP_ID);
	if (!celeste) {
		vscode.window.showErrorMessage("Celeste is not installed.");
		return;
	}*/

	// Set up map viewport
	//context.subscriptions.push(MapEditorProvider.register(context));

	// Set up map graph
	//context.subscriptions.push(MapGraphProvider.register(context));

	// Set up attribute editor
	//context.subscriptions.push(AttributeEditorProvider.register(context));
	
	registerSchemas(context);
}

export function deactivate() {}
