import { AttributeEncoding } from "./AttributeEncoding";

const floor = Math.floor; // for performance

function frexp(value: number) {
    if (value === 0) {
        return [value, 0];
    }
    let data = new DataView(new ArrayBuffer(8));
    data.setFloat64(0, value);
    let bits = (data.getUint32(0) >>> 20) & 0x7FF;
    if (bits === 0) { // denormal
        data.setFloat64(0, value * Math.pow(2, 64));  // exp + 64
        bits = ((data.getUint32(0) >>> 20) & 0x7FF) - 64;
    }
    let exponent = bits - 1022;
    let mantissa = ldexp(value, -exponent);
    return [mantissa, exponent];
}

function ldexp(mantissa: number, exponent: number) {
    let steps = Math.min(3, Math.ceil(Math.abs(exponent) / 1023));
    let result = mantissa;
    for (let i = 0; i < steps; i++) {
        result *= Math.pow(2, floor((exponent + i) / steps));
    }
    return result;
}

function twosCompliment(n: number, power: number) {
    if (n >= Math.pow(2, power - 1)) {
        return n - Math.pow(2, power);
    } else {
        return n;
    }
}

function readVariableLength(buffer: BinaryBuffer) {
    /*let res = 0;
    let multiplier = 1;

    while (true) {
        let byte = buffer.readByte();

        if (byte < 128) {
            return res + byte * multiplier;
        } else {
            res += (byte - 128) * multiplier;
        }

        multiplier *= 128;
    }*/

    var num1 = 0;
    var num2 = 0;
    var b;
    
    do {
        if (num2 == 35) {
            throw new RangeError("Bad 7-bit integer");
        }
        b = buffer.readByte();
        num1 |= (b & 0x7F) << num2;
        num2 += 7;
    } while ((b & 0x80) != 0);
    
    // At this point, num1 equals the result integer
    return num1;
}

function writeVariableLength(buffer: BinaryBuffer, length: number) {
    while (length > 127) {
        buffer.writeByte(length % 128 + 128);
        length = floor(length / 128);
    }

    buffer.writeByte(length);
}

export default class BinaryBuffer {
    private head: number = 0;
    private data: number[] = [];

    constructor(data?: Uint8Array) {
        if (data) {
            this.data = Array.from(data);
        }
    }

    getData(): Uint8Array {
        return new Uint8Array(this.data);
    }

    seek(offset: number) {
        this.head = offset;
    }

    readByte(): number {
        return this.data[this.head++];
    }

    readBytes(n: number): number[] {
        const bytes = this.data.slice(this.head, this.head + n);
        this.head += n;

        return bytes;
    }

    writeByte(value: number) {
        this.data.push(value);
    }

    writeBytes(...values: number[]) {
        this.data.push(...values);
    }

    readBoolean(): boolean {
        return this.readByte() !== 0;
    }
    
    writeBoolean(value: boolean) {
        this.writeByte(value ? 1 : 0);
    }

    readShort(): number {
        const [ b1, b2 ] = this.readBytes(2);

        return b1 + b2 * 256;
    }

    writeShort(value: number) {
        this.writeBytes(value % 256, floor(value / 256) % 256);
    }

    readLong(): number {
        const [ b1, b2, b3, b4 ] = this.readBytes(4);

        return b1 + b2 * 256 + b3 * 65536 + b4 * 16777216;
    }

    writeLong(value: number) {
        this.writeBytes(
            value % 256,
            floor(value / 256) % 256,
            floor(value / 65536) % 256,
            floor(value / 16777216) % 256
        );
    }

    readLengthEncodedString(): string {
        let string = "";
        const length = this.readShort();
        for (let i = 0; i < length; i += 2) {
            const repeat = this.readByte();
            const char = this.readByte();
            string += String.fromCharCode(char).repeat(repeat);
        }
        return string;
    }

    // might be slow
    writeLengthEncodedString(value: string) {
        let condensed = [];
        let lastChar = "";
        let repeat = 0;
        for (let i = 0; i < value.length; i++) {
            let char = value.charAt(i);
            if (char === lastChar) {
                repeat++;
            } else {
                if (repeat > 0) {
                    condensed.push(repeat);
                    condensed.push(lastChar);
                }
                repeat = 1;
                lastChar = char;
            }
        }

        this.writeShort(condensed.length);
        for (let i = 0; i < condensed.length; i += 2) {
            this.writeBytes(
                condensed[i] as number,
                (condensed[i + 1] as string).charCodeAt(0),
            ); 
        }
    }

    readString() {
        const length = readVariableLength(this);
        return String.fromCharCode.apply(null, this.readBytes(length));
    }

    writeString(value: string) {
        writeVariableLength(this, value.length);
        value.split('').map(c => c.charCodeAt(0)).forEach(this.writeByte);
    }

    readFloat(): number {
        let [ b4, b3, b2, b1 ] = this.readBytes(4);
        let exponent = (b1 % 128) * 2 + floor(b2 / 128);
    
        if (exponent === 0) {
            return 0.0;
        }
    
        let sign = (b1 > 127) ? -1 : 1;
        let mantissa = ((b2 % 128) * 256 + b3) * 256 + b4;
    
        // Infinity/NaN check
        // Eight 1s in exponent is infinity/NaN
        if (exponent === 255) {
            if (mantissa === 0) {
                return Infinity * sign;
            } else {
                return NaN;
            }
        }
    
        mantissa = (ldexp(mantissa, -23) + 1) * sign;
    
        return ldexp(mantissa, exponent - 127);
    }

    writeFloat(n: number) {
        let b1, b2, b3, b4;
    
        let val = n;
        let sign = 0;
    
        if (val < 0) {
            sign = 1;
            val = -val;
        }
    
        let [ mantissa, exponent ] = frexp(val);
    
        if (val === 0) {
            mantissa = 0;
            exponent = 0;
    
        } else if (!Number.isFinite(val)) {
            // Exponent is all 1s and mantissa is all 0s on infinity
            mantissa = 0;
            exponent = 255; // Eight 1s
    
        } else if (Number.isNaN(val)) {
            // Exponent is all 1s and mantissa is not 0 on NaN
            mantissa = 1;
            exponent = 255; // Eight 1s
    
        } else {
            mantissa = (mantissa * 2 - 1) * ldexp(0.5, 24);
            exponent = exponent + 126;
        }
    
        b1 = floor(mantissa) % 256;
        val = floor(mantissa / 256);
        b2 = floor(val) % 256;
        val = floor(val / 256);
    
        b3 = floor(exponent * 128 + val) % 256;
        val = floor((exponent * 128 + val) / 256);
        b4 = floor(sign * 128 + val) % 256;
    
        this.writeBytes(b1, b2, b3, b4);
    }

    readEncodedValue(): [AttributeEncoding, any] {
        const encoding = this.readByte();
        // yucky switch statement
        switch (encoding) {
            case AttributeEncoding.Boolean:
                return [encoding, this.readBoolean()];
            case AttributeEncoding.Byte:
                return [encoding, this.readByte()];
            case AttributeEncoding.Short:
                return [encoding, this.readShort()];
            case AttributeEncoding.Int:
                return [encoding, this.readLong()];
            case AttributeEncoding.Float:
                return [encoding, this.readFloat()];
            case AttributeEncoding.LookupIndex:
                return [encoding, this.readShort()];
            case AttributeEncoding.String:
                return [encoding, this.readString()];
            case AttributeEncoding.LengthEncodedString:
                return [encoding, this.readLengthEncodedString()];
            case AttributeEncoding.Long:
                return [encoding, this.readLong()];
            case AttributeEncoding.Double:
                return [encoding, this.readFloat()];
            default:
                throw new Error(`Unknown encoding on encoded value: ${encoding}`);
        }

    }

    writeEncodedValue(encoding: AttributeEncoding, value: any) {
        this.writeByte(encoding as number);
        // yucky switch statement
        switch (encoding) {
            case AttributeEncoding.Boolean:
                this.writeBoolean(value);
                break;
            case AttributeEncoding.Byte:
                this.writeByte(value);
                break;
            case AttributeEncoding.Short:
                this.writeShort(value);
                break;
            case AttributeEncoding.Int:
                this.writeLong(value);
                break;
            case AttributeEncoding.Float:
                this.writeFloat(value);
                break;
            case AttributeEncoding.LookupIndex:
                this.writeShort(value);
                break;
            case AttributeEncoding.String:
                this.writeString(value);
                break;
            case AttributeEncoding.LengthEncodedString:
                this.writeLengthEncodedString(value);
                break;
            case AttributeEncoding.Long:
                this.writeLong(value);
                break;
            case AttributeEncoding.Double:
                this.writeFloat(value); //preeeeetty sure this is unused
                break;
            default:
                throw new Error(`Attempt to write encoded value with unknown encoding: ${encoding}`);
        }
    }
}