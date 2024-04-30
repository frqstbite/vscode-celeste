import * as vscode from 'vscode';
import { v1 } from 'uuid';

import BinaryBuffer from "./BinaryBuffer";
import StringLookup from "./StringLookup";
import CelesteMapDocument from '../CelesteMapDocument';

export enum AttributeEncoding {
    Boolean,
    Byte,
    Short,
    Int,
    Float,
    LookupIndex,
    String,
    LengthEncodedString,
    Long,
    Double,
}

type Attribute = [AttributeEncoding, any];

export default class Element {
    public id: string;
    private _attributes: Map<string, Attribute> = new Map();
    private _parent?: string;
    protected _children: Set<Element> = new Set();

    static fromBinary(document: CelesteMapDocument, in: BinaryBuffer, lookup: StringLookup, parent?: Element, ): [Map<string, Element>, string] {
        const type = lookup.getString(in.readShort())
        const element = new Element(type, parent);

        // Attributes
        const attributeCount = in.readByte();
        for (let i = 0; i < attributeCount; i++) {
            const name = lookup.getString(in.readShort());
            const encoding = in.readByte();
            let value;
            switch (encoding) {
                case AttributeEncoding.Boolean:
                    value = in.readBoolean();
                    break;
                case AttributeEncoding.Byte:
                    value = in.readByte();
                    break;
                case AttributeEncoding.Short:
                    value = in.readShort();
                    break;
                case AttributeEncoding.Int:
                    value = in.readLong();
                    break;
                case AttributeEncoding.Float:
                    value = in.readFloat();
                    break;
                case AttributeEncoding.LookupIndex:
                    value = in.readShort();
                    break;
                case AttributeEncoding.String:
                    value = in.readString();
                    break;
                case AttributeEncoding.LengthEncodedString:
                    value = in.readLengthEncodedString();
                    break;
                case AttributeEncoding.Long:
                    value = in.readLong();
                    break;
                case AttributeEncoding.Double: //i dont think this is used
                    //value = buffer.readDouble();
                    break;
            }
            element.setAttribute(name, value, encoding as AttributeEncoding);
        }

        // Children
        const childCount = in.readShort();
        for (let i = 0; i < childCount; i++) {
            Element.fromBinary(in, lookup, element);
        }

        return element;
    }

    constructor(
        public readonly type: string,
        public readonly parent?: Element
    ) {
        this.id = v1();
    }

    parentTo(parent: Element) {
        this._parent = parent;
        parent._children.add(this);
    }

    setAttribute(name: string, value: any, encoding?: AttributeEncoding) {
        //vscode.window.showInformationMessage(`[${this.type}] ${name}: ${value} (${AttributeEncoding[encoding as number]})`);
        if (encoding === undefined) {
            if (this._attributes.has(name)) {
                encoding = this._attributes.get(name)![0];
            } else {
                throw new Error(`Attribute ${name} does not exist on element ${this.type}`);
            }
        }

        this._attributes.set(name, [encoding, value]);
    }

    getAttribute(name: string): any | undefined {
        const attr = this._attributes.get(name);
        return attr ? attr[1] : undefined;
    }

    /**
     * Delete this element from the hierarchy.
     */
    delete() {
        this._parent?._children.delete(this);
        this._parent = undefined;
    }

    /**
     * Return a child element of the specified type
     * @param type 
     * @returns 
     */
    child(type: string): Element | undefined {
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
    children(type?: string): Element[] {
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
            buffer.writeByte(encoding);
            switch (encoding) {
                case AttributeEncoding.Boolean:
                    buffer.writeBoolean(value);
                    break;
                case AttributeEncoding.Byte:
                    buffer.writeByte(value);
                    break;
                case AttributeEncoding.Short:
                    buffer.writeShort(value);
                    break;
                case AttributeEncoding.Int:
                    buffer.writeLong(value);
                    break;
                case AttributeEncoding.Float:
                    buffer.writeFloat(value);
                    break;
                case AttributeEncoding.LookupIndex:
                    buffer.writeShort(value);
                    break;
                case AttributeEncoding.String:
                    buffer.writeString(value);
                    break;
                case AttributeEncoding.LengthEncodedString:
                    buffer.writeLengthEncodedString(value);
                    break;
                case AttributeEncoding.Long:
                    buffer.writeLong(value);
                    break;
                case AttributeEncoding.Double: //i dont think this is used
                    //buffer.writeDouble(value);
                    break;
            }
        }

        // Children
        buffer.writeShort(this._children.size);
        for (const child of this._children) {
            child.toBinary(buffer, lookup);
        }
    }

    toJson(): any {
        const json: any = { type: this.type };

        // Attributes
        json.attributes = {};
        for (const [name, [encoding, value]] of this._attributes.entries()) {
            json.attributes[name] = value;
        }

        // Children
        json.children = [];
        for (const child of this._children) {
            json.children.push(child.toJson());
        }

        return json; 
    }
}