import BinaryBuffer from "../serialization/BinaryBuffer";
import StringLookup from "../serialization/StringLookup";

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
    private _attributes: Map<string, Attribute> = new Map();
    private _parent?: Element;
    protected _children: Set<Element> = new Set();

    static deserialize(buffer: BinaryBuffer, lookup: StringLookup, parent?: Element): Element {
        const element = new Element(lookup.getString(buffer.readShort()), parent);

        // Attributes
        const attributeCount = buffer.readByte();
        for (let i = 0; i < attributeCount; i++) {
            const name = lookup.getString(buffer.readShort());
            const encoding = buffer.readByte();
            let value;
            switch (encoding) {
                case AttributeEncoding.Boolean:
                    value = buffer.readBoolean();
                    break;
                case AttributeEncoding.Byte:
                    value = buffer.readByte();
                    break;
                case AttributeEncoding.Short:
                    value = buffer.readShort();
                    break;
                case AttributeEncoding.Int:
                    value = buffer.readLong();
                    break;
                case AttributeEncoding.Float:
                    value = buffer.readFloat();
                    break;
                case AttributeEncoding.LookupIndex:
                    value = buffer.readShort();
                    break;
                case AttributeEncoding.String:
                    value = buffer.readString();
                    break;
                case AttributeEncoding.LengthEncodedString:
                    value = buffer.readLengthEncodedString();
                    break;
                case AttributeEncoding.Long:
                    value = buffer.readLong();
                    break;
                case AttributeEncoding.Double: //i dont think this is used
                    //value = buffer.readDouble();
                    break;
            }
            element.setAttribute(name, encoding, value);
        }

        // Children
        const childCount = buffer.readShort();
        for (let i = 0; i < childCount; i++) {
            Element.deserialize(buffer, lookup, element);
        }

        return element;
    }

    constructor(
        public readonly type: string,
        public readonly parent?: Element
    ) {}

    setAttribute(name: string, encoding: AttributeEncoding, value: any) {
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

    children(type?: string): Element[] {
        const children: Element[] = [];
        for (const child of this._children) {
            if (!type || child.type === type) {
                children.push(child);
            }
        }
        return children;
    }

    serialize(buffer: BinaryBuffer, lookup: StringLookup) {
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
            child.serialize(buffer, lookup);
        }
    }
}