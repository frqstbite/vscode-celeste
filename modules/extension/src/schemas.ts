import * as vscode from 'vscode';
import path from 'path';

const SCHEME = 'celeste';

export default async function(extension: vscode.ExtensionContext) {
	const SCHEMA_PATH = path.join(extension.extensionPath, 'assets/schemas');

	// Register XML schemas
	const xmlExtension = await vscode.extensions.getExtension('redhat.vscode-xml')?.activate();
	if (xmlExtension) {
		//vscode.window.showInformationMessage('XML extension detected, registering schemas.');
		xmlExtension.addXMLFileAssociations([
			{
				'systemId': path.join(SCHEMA_PATH, 'xml/DecalRegistry.xsd'),
				'pattern': '**/DecalRegistry.xml'
			},
			{
				'systemId': path.join(SCHEMA_PATH, 'xml/Tilesets.xsd'),
				'pattern': '**/{Fore,Back}groundTiles.xml'
			},
			{
				'systemId': path.join(SCHEMA_PATH, 'xml/AnimatedTiles.xsd'),
				'pattern': '**/AnimatedTiles.xml'
			}
		]);
	}

	// Register YAML schemas
	const yamlSchemas = [
		{
			'path': path.join(SCHEMA_PATH, 'yaml/everest.json'),
			'predicate': (resource: string) => path.basename(resource, path.extname(resource)) === 'everest',
		},
		{
			'path': path.join(SCHEMA_PATH, 'yaml/map.meta.json'),
			'predicate': (resource: string) => path.basename(resource, path.extname(resource)).endsWith('.meta'),
		}
	
	];

	const yamlExtension = await vscode.extensions.getExtension('redhat.vscode-yaml')?.activate();
	if (yamlExtension) {
		//vscode.window.showInformationMessage('YAML extension detected, registering schemas.');
		yamlExtension.registerContributor(SCHEME,
			(resource: string) => yamlSchemas.find( ({predicate}) => predicate(resource) )?.path, //TODO: Check if this is even correct
			async (schemaUri: string) => await import(schemaUri, { assert: { type: 'json' } }) //TODO: Check if this even works
		);
	}
}