import * as vscode from 'vscode';
import { v1 } from 'uuid';

import BinaryBuffer from "./BinaryBuffer";
import StringLookup from "./StringLookup";
import ElementTree from './ElementTree';
import CelesteMapDocument from '../CelesteMapDocument';
import { AttributeEncoding } from './AttributeEncoding';

type Attribute = [AttributeEncoding, any];

export default class Element {
    private _attributes: Map<string, Attribute> = new Map();
    private _parent?: Element;
    private _children: Set<Element> = new Set();
    
    public readonly type: string;

    static fromBinary(buffer: BinaryBuffer, lookup: StringLookup, parent?: Element): Element {
        const s = buffer.readShort()
        const type = lookup.getString(s);
        const element = new Element(type, parent);

        // Attributes
        const attributeCount = buffer.readByte();
        for (let i = 0; i < attributeCount; i++) {
            const name = lookup.getString(buffer.readShort());
            const [ encoding, value ] = buffer.readEncodedValue();
            element.setAttribute(name, value, encoding);
        }

        // Children
        const childCount = buffer.readShort();
        for (let i = 0; i < childCount; i++) {
            Element.fromBinary(buffer, lookup, element);
        }

        return element;
    }

    constructor(type: string, parent?: Element) {
        this.type = type;
        if (parent) {
            this.setParent(parent);
        }
    }

    /**
     * Delete this element from the hierarchy.
     */
    delete() {
        this._parent?.removeChild(this);
        this._parent = undefined;
    }

    getParent(): Element | undefined {
        return this._parent;
    }

    setParent(parent: Element) {
        this._parent?.removeChild(this);
        this._parent = parent;
        parent.addChild(this);
    }

    getAttribute(name: string): any | undefined {
        const attr = this._attributes.get(name);
        return attr ? attr[1] : undefined;
    }

    setAttribute(name: string, value: any, encoding?: AttributeEncoding) {
        //vscode.window.showInformationMessage(`[${this.type}] ${name}: ${value} (${AttributeEncoding[encoding as number]})`);
        if (encoding === undefined) {

            // No encoding specified. Does this attribute already exist?
            if (this._attributes.has(name)) {
                encoding = this._attributes.get(name)![0]; //Get the encoding from the existing attribute

            // TODO: else if element schema has this attribute, get encoding from schema 

            } else {
                throw new Error(`Attribute ${name} does not exist on element ${this.type}`); //Throw
            }
        }

        this._attributes.set(name, [encoding, value]);
    }

    getAttributes(): Map<string, Attribute> {
        return this._attributes;
    }

    /**
     * Add a child element to this element.
     * @param element 
     * @returns 
     */
    addChild(element: Element): Element {
        this._children.add(element);
        return element;
    }

    /**
     * Remove a child `Element` from this `Element`.
     * @param element The child to remove.
     */
    removeChild(element: Element) {
        this._children.delete(element);
    }

    /**
     * Return a child `Element` of the specified type.
     * @param type The type of the child to return.
     * @returns 
     */
    getChild(type: string): Element | undefined {
        for (const child of this._children) {
            if (child.type === type) {
                return child;
            }
        }
        return undefined;
    }

    /**
     * Return all children of this element
     * @param type - If specified, only return children of this type
     * @returns 
     */
    getChildren(type?: string): Element[] {
        const children: Element[] = [];
        for (const child of this._children) {
            if (!type || child.type === type) {
                children.push(child);
            }
        }
        return children;
    }

    toBinary(buffer: BinaryBuffer, lookup: StringLookup) {
        buffer.writeShort(lookup.getLookupIndex(this.type));

        // Attributes
        buffer.writeByte(this._attributes.size);
        for (const [name, [encoding, value]] of this._attributes.entries()) {
            buffer.writeShort(lookup.getLookupIndex(name));
            buffer.writeEncodedValue(encoding, value);
        }

        // Children
        buffer.writeShort(this._children.size);
        for (const child of this._children) {
            child.toBinary(buffer, lookup);
        }
    }
}