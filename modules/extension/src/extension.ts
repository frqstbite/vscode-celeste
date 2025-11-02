import * as vscode from 'vscode';
import AttributeEditorProvider from './providers/AttributeEditorProvider';
import MapEditorProvider from './providers/MapEditorProvider';
import MapGraphProvider from './providers/MapGraphProvider';
import registerSchemas from './schemas';

const CELESTE_APP_ID = 504230;

export async function activate(context: vscode.ExtensionContext) {
	// Set up map viewport
	context.subscriptions.push(MapEditorProvider.register(context));

	// Set up map graph
	context.subscriptions.push(MapGraphProvider.register(context));

	// Set up attribute editor
	context.subscriptions.push(AttributeEditorProvider.register(context));

	// Register schemas
	registerSchemas(context);
}

export function deactivate() {}
