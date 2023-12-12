import * as vscode from 'vscode';
import { getAppPath } from 'steam-path';
import { MapEditorProvider } from './editor/mapEditor';

const CELESTE_APP_ID = 504230;

export async function activate(context: vscode.ExtensionContext) {
	const celeste = await getAppPath(CELESTE_APP_ID);
	if (!celeste) {
		vscode.window.showErrorMessage("Celeste is not installed.");
		return;
	}

	context.subscriptions.push(MapEditorProvider.register(context));
}

export function deactivate() {}
