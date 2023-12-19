import * as vscode from 'vscode';
import path from 'path';
import everestManifestSchema from './everest.json';
import everestMapSchema from './map.meta.json';

const scheme = 'celeste';
const schemas = new Map<string, [(resource: string) => Promise<boolean>, string]>();

async function onRequestSchemaURI(resource: string): Promise<string | undefined> {
	for (const [ id, [ predicate, _ ]] of schemas) {
		if (await predicate(resource)) {
			return `${scheme}://schemas/${id}`;
		}
	}

	return undefined;
}

function onRequestSchemaContent(schemaUri: string): string | undefined {
	const parsedUri = vscode.Uri.parse(schemaUri);
	const filename = path.basename(parsedUri.path);
	if (parsedUri.scheme !== scheme) {
		return undefined;
	}

	if (!parsedUri.path || !parsedUri.path.startsWith('/schemas/')) {
		return undefined;
	}

	if (!schemas.has(filename)) {
		return undefined;
	}
 
	const [ _, schema] = schemas.get(filename)!;
	return schema;
}

function registerSchema(id: string, schema: object, predicate: (resource: string) => Promise<boolean>) {
	schemas.set(id, [predicate, JSON.stringify(schema)]);
}

registerSchema("everest", everestManifestSchema, async (resource: string) => {
	if (resource.endsWith('.yaml') || resource.endsWith('.yml')) {
		const fileName = path.basename(resource, path.extname(resource));
		if (fileName === 'everest') {
			return true; //File is named everest.yaml or everest.yml
		}
	}

	return false;
});

registerSchema("map.meta", everestMapSchema, async (resource: string) => {
	const parsedPath = path.parse(resource);
	
	if (resource.endsWith('.yaml') || resource.endsWith('.yml')) {
		const fileName = path.basename(resource, '.meta' + parsedPath.ext);
		const siblings = await vscode.workspace.fs.readDirectory(vscode.Uri.file(parsedPath.dir));
		
		if (siblings.find(([name, type]) => name === fileName && type === vscode.FileType.File && name.endsWith('.bin'))) {
			return true; //A .bin file exists with the same name
		}
	}

	return false;
});

export default function(register: any) {
    register(scheme, onRequestSchemaURI, onRequestSchemaContent);
};