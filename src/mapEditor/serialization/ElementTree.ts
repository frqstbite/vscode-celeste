import { v1 } from "uuid";

import BinaryBuffer from "./BinaryBuffer";
import Element from "./Element";
import StringLookup from "./StringLookup";
import { AttributeEncoding } from "./AttributeEncoding";


type JSONAttribute = {
    encoding: number,
    value: any
};

type JSONElement = {
    type: string;
    parent?: string;
    attributes: { [name: string]: JSONAttribute };
    children: string[];
};

type JSONElementTree = {
    root: string;
    elements: { [id: string]: JSONElement };
};


function encodeJSONElement(tree: ElementTree, element: Element): JSONElement {
    const json: JSONElement = {
        type: element.type,
        parent: tree.getParent(tree.getId(element)!),
        attributes: {},
        children: [],
    };

    // Attributes
    for (const [name, [encoding, value]] of element.getAttributes().entries()) {
        json.attributes[name] = {
            encoding: encoding as number,
            value: value,
        };
    }

    // Children
    for (const child of element.getChildren()) {
        json.children.push(tree.getId(child)!);
    }

    return json;
}

function decodeJSONElement(tree: JSONElementTree, id: string, cache?: Map<string, Element>): Element {
    // Initialize cache if not provided
    cache = cache ?? new Map();
    if (cache?.has(id)) {
        return cache.get(id)!;
    }

    const json = tree.elements[id];
    const element = new Element(json.type);
    cache?.set(id, element);

    // Attributes
    for (const [name, { encoding, value }] of Object.entries(json.attributes)) {
        element.setAttribute(name, value, encoding as AttributeEncoding);
    }

    // Children
    for (const child of json.children) {
        element.addChild(decodeJSONElement(tree, child, cache));
    }

    return element;
}


/**
 * Manages hierarchical stucture and serialization of `Elements`.
 */
export default class ElementTree {
    private _elements: Map<string, Element> = new Map();
    private _ids: WeakMap<Element, string> = new WeakMap();

    /**
     * The id of the root `Element` of this `ElementTree`.
     */
    public readonly root: string;
    
    /**
     * Constructs an `ElementTree` from some binary data.
     * @param buffer The buffer to read the data from.
     * @param lookup The lookup table to use for string decoding.
     * @returns A new `ElementTree` constructed from the binary data.
     */
    static fromBinary(buffer: BinaryBuffer, lookup: StringLookup): ElementTree {
        return new ElementTree(Element.fromBinary(buffer, lookup));
    }

    /**
     * Constructs an `ElementTree` from a JSON object.
     * @param json The JSON object to read the data from.
     * @returns A new `ElementTree` constructed from the JSON object.
     */
    static fromJSON(json: JSONElementTree): ElementTree {
        return new ElementTree(decodeJSONElement(json, json.root));
    }

    constructor(root: Element) {
        this.root = this.addElement(root);
    }
    
    /**
     * Serializes the `ElementTree` to a binary format.
     * @param buffer The buffer to write the binary data to.
     * @param lookup The lookup table to use for string encoding.
     */
    toBinary(buffer: BinaryBuffer, lookup: StringLookup) {
        this.getElement(this.root)?.toBinary(buffer, lookup);
    }

    /**
     * Serializes the `ElementTree` to a JSON object.
     * @returns A JSON representation of the `ElementTree`.
     */
    toJSON(): JSONElementTree {
        const tree: JSONElementTree = {
            root: this.root,
            elements: {},
        };

        for (const [id, element] of this._elements) {
            tree.elements[id] = encodeJSONElement(this, element);
        }

        return tree;
    }

    /**
     * Add an element to the tree.
     * @param element Element to add.
     * @param parent Optional parent to set for the newly added `Element`.
     * @returns The id of the new `Element`.
     */
    addElement(element: Element, parent?: string): string {
        const id = v1();
        this._elements.set(id, element);
        this._ids.set(element, id);
        
        // Set the parent if one was provided.
        if (parent !== undefined && this._elements.has(parent)) {
            element.setParent(this.getElement(parent)!);
        }

        // Add children recursively.
        for (const child of element.getChildren()) {
            this.addElement(child, id);
        }

        return id;
    }

    /**
     * Remove an element from the tree.
     * @param element Element to remove.
     */
    removeElement(id: string) {
        const element = this.getElement(id);
        if (element) {
            element.delete();
            this._elements.delete(id);
        }
    }

    /**
     * Gets the parent of an `Element`.
     * @param element The id of the `Element` to get the parent of.
     * @returns The id of the parent of the given `Element`, if it has one. `undefined` is returned if the `Element` is not from this `ElementTree`.
     */
    getParent(element: string): string | undefined {
        const elem = this.getElement(element);
        const parent = elem?.getParent();
        return parent ? this.getId(parent) : undefined;
    }

    /**
     * 
     * @param element The id of the `Element` to set the parent of.
     * @param parent The id of the new parent `Element`.
     */
    setParent(element: string, parent: string) {
        const child = this.getElement(element);
        const newParent = this.getElement(parent);
        if (child && newParent) {
            child.setParent(newParent);
        }
    }

    /**
     * Get an element by its id.
     * @param id Id of the `Element` to retrieve.
     * @returns The element with the given id, or `undefined` if it does not exist.
     */
    getElement(id: string): Element | undefined {
        return this._elements.get(id);
    }

    /**
     * Get the id of an element.
     * @param element `Element` to get the id of.
     * @returns The id of the element, or undefined if it does not belong to this `ElementTree`.
     */
    getId(element: Element): string | undefined {
        return this._ids.get(element);
    }
}