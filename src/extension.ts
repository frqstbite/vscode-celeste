import * as vscode from 'vscode';
import { getAppPath } from 'steam-path';
import MapEditorProvider from './maps/MapEditorProvider';
import registerSchemas from './schemas';

const CELESTE_APP_ID = 504230;

export async function activate(context: vscode.ExtensionContext) {
	/*const celeste = await getAppPath(CELESTE_APP_ID);
	if (!celeste) {
		vscode.window.showErrorMessage("Celeste is not installed.");
		return;
	}*/

	// Set up map editor
	context.subscriptions.push(MapEditorProvider.register(context));

	// Set up map graph
	context.subscriptions.push();

	// Register YAML schemas, if the extension is installed
	const yamlExtension = vscode.extensions.getExtension("redhat.vscode-yaml");
	if (yamlExtension) {
		const yamlExtensionAPI = await vscode.extensions.getExtension("redhat.vscode-yaml")!.activate();
		registerSchemas((a: any, b: any, c: any) => yamlExtensionAPI.registerContributor(a, b, c)); //preserves 'this'
	}
}

export function deactivate() {}
