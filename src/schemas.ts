import * as vscode from 'vscode';
import path from 'path';
import everestManifestSchema from './schemas/everest.json';
import everestMapSchema from './schemas/map.meta.json';

const SCHEMA = 'celeste';

const SchemaURI = (string: string) => `${SCHEMA}://schemas/${string}`;

const xmlSchemas = [
	{
		"systemId": path.join(__dirname, "./schemas/DecalRegistry.xsd"),
		"pattern": "**/DecalRegistry.xml"
	},
	{
		"systemId": path.join(__dirname, "./schemas/Tilesets.xsd"),
		"pattern": "**/{Fore,Back}groundTiles.xml"
	},
	{
		"systemId": path.join(__dirname, "./schemas/AnimatedTiles.xsd"),
		"pattern": "**/AnimatedTiles.xml"
	}
];
const yamlSchemas = new Map<string, [(resource: string) => boolean, string]>();

function createYAMLSchema(id: string, schema: object, predicate: (resource: string) => boolean) {
	yamlSchemas.set(id, [predicate, JSON.stringify(schema)]);
}

createYAMLSchema("everest", everestManifestSchema, (resource: string) => {
	const fileName = path.basename(resource, path.extname(resource));
	return fileName === 'everest';
});

createYAMLSchema("map.meta", everestMapSchema, (resource: string) => {
	const parsedPath = path.parse(resource);
	
	if (parsedPath.name.endsWith('.meta')) {
		// TODO: check for .bin file with same name
		//const fileName = path.basename(resource, '.meta' + parsedPath.ext);
		//const siblings = vscode.workspace.fs.readDirectory(vscode.Uri.file(parsedPath.dir));
		
		//if (siblings.find(([name, type]) => name === fileName && type === vscode.FileType.File && name.endsWith('.bin'))) {
			return true; //A .bin file exists with the same name
		//}
	}

	return false;
});

export default async function() {
	// Register XML schemas
	const xmlExtension = await vscode.extensions.getExtension("redhat.vscode-xml")?.activate();
	if (xmlExtension) {
		vscode.window.showInformationMessage("XML extension detected, registering schemas.");
		xmlExtension.addXMLFileAssociations(xmlSchemas);
	}

	// Register YAML schemas
	const yamlExtension = await vscode.extensions.getExtension("redhat.vscode-yaml")?.activate();
	if (yamlExtension) {
		//vscode.window.showInformationMessage("YAML extension detected, registering schemas.");

		function onRequestYAMLSchemaURI(resource: string): string | undefined {
			for (const [ id, [ predicate, _ ]] of yamlSchemas) {
				if (predicate(resource)) {
					return SchemaURI(`yaml/${id}`);
				}
			}
		
			return undefined;
		}
		
		function onRequestYAMLSchemaContent(schemaUri: string): string | undefined {
			const parsedUri = vscode.Uri.parse(schemaUri);
			const filename = path.basename(parsedUri.path);
			if (parsedUri.scheme !== SCHEMA) {
				return undefined;
			}
		
			if (!parsedUri.path || parsedUri.authority !== 'schemas') {
				return undefined;
			}
			
			if (!yamlSchemas.has(filename)) {
				return undefined;
			}
		
			const [ _, schema] = yamlSchemas.get(filename)!;
			return schema;
		}

		yamlExtension.registerContributor(SCHEMA, onRequestYAMLSchemaURI, onRequestYAMLSchemaContent);
	}
}