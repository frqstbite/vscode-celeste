import * as vscode from 'vscode';
import path from 'path';
import everestManifestSchema from './everest.json';
import everestMapSchema from './map.meta.json';

const SCHEMA = 'celeste';
const schemas = new Map<string, [(resource: string) => boolean, string]>();

function onRequestSchemaURI(resource: string): string | undefined {
	for (const [ id, [ predicate, _ ]] of schemas) {
		if (predicate(resource)) {
			return `${SCHEMA}://schemas/${id}`;
		}
	}

	return undefined;
}

function onRequestSchemaContent(schemaUri: string): string | undefined {
	const parsedUri = vscode.Uri.parse(schemaUri);
	const filename = path.basename(parsedUri.path);
	if (parsedUri.scheme !== SCHEMA) {
		return undefined;
	}

	if (!parsedUri.path || parsedUri.authority !== 'schemas') {
		return undefined;
	}
	
	if (!schemas.has(filename)) {
		return undefined;
	}
 
	const [ _, schema] = schemas.get(filename)!;
	return schema;
}

function registerSchema(id: string, schema: object, predicate: (resource: string) => boolean) {
	schemas.set(id, [predicate, JSON.stringify(schema)]);
}

registerSchema("everest", everestManifestSchema, (resource: string) => {
	if (resource.endsWith('.yaml') || resource.endsWith('.yml')) {
		const fileName = path.basename(resource, path.extname(resource));
		if (fileName === 'everest') {
			return true; //File is named everest.yaml or everest.yml
		}
	}

	return false;
});

registerSchema("map.meta", everestMapSchema, (resource: string) => {
	const parsedPath = path.parse(resource);
	
	if (resource.endsWith('.meta.yaml') || resource.endsWith('.meta.yml')) {
		//const fileName = path.basename(resource, '.meta' + parsedPath.ext);
		//const siblings = vscode.workspace.fs.readDirectory(vscode.Uri.file(parsedPath.dir));
		
		//if (siblings.find(([name, type]) => name === fileName && type === vscode.FileType.File && name.endsWith('.bin'))) {
			return true; //A .bin file exists with the same name
		//}
	}

	return false;
});

export default function(register: any) {
    register(SCHEMA, onRequestSchemaURI, onRequestSchemaContent);
};