import BinaryBuffer from "./BinaryBuffer.js";

export default class StringLookup {
    private lookup: string[] = [];
    private lookupMap: Map<string, number> = new Map();

    static deserialize(buffer: BinaryBuffer): StringLookup {
        const lookup = new StringLookup();
        const count = buffer.readShort();
        for (var i = 0; i < count; i++) {
            lookup.addString(buffer.readString());
        }
        return lookup;
    }

    private addString(str: string): number {
        const index = this.lookup.length;
        this.lookup.push(str);
        this.lookupMap.set(str, index);
        return index;
    }

    getString(index: number): string {
        return this.lookup[index];
    }

    getLookupIndex(str: string): number {
        if (this.lookupMap.has(str)) {
            return this.lookupMap.get(str)!;
        } else {
            return this.addString(str);
        }
    }
}