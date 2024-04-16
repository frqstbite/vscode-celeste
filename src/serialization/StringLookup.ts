import BinaryBuffer from "./BinaryBuffer";

export default class StringLookup {
    lookup: string[] = [];
    lookupMap: Map<string, number> = new Map();

    static deserialize(buffer: BinaryBuffer): StringLookup {
        const lookup = new StringLookup();
        const count = buffer.readShort();
        for (var i = 0; i < count; i++) {
            lookup.addString(lookup.lookup.length, buffer.readString());
        }
        return lookup;
    }

    private addString(index: number, str: string) {
        this.lookup.push(str);
        this.lookupMap.set(str, index);
    }

    getString(index: number): string {
        return this.lookup[index];
    }

    getLookupIndex(str: string): number {
        if (this.lookupMap.has(str)) {
            return this.lookupMap.get(str)!;
        } else {
            const index = this.lookup.length;
            this.addString(index, str);
            return index;
        }
    }
}