const floor = Math.floor; // for performance

function frexp(value: number) {
    if (value === 0) {
        return [value, 0];
    }
    var data = new DataView(new ArrayBuffer(8));
    data.setFloat64(0, value);
    var bits = (data.getUint32(0) >>> 20) & 0x7FF;
    if (bits === 0) { // denormal
        data.setFloat64(0, value * Math.pow(2, 64));  // exp + 64
        bits = ((data.getUint32(0) >>> 20) & 0x7FF) - 64;
    }
    var exponent = bits - 1022;
    var mantissa = ldexp(value, -exponent);
    return [mantissa, exponent];
}

function ldexp(mantissa: number, exponent: number) {
    var steps = Math.min(3, Math.ceil(Math.abs(exponent) / 1023));
    var result = mantissa;
    for (var i = 0; i < steps; i++) {
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
    var res = 0;
    var multiplier = 1;

    while (true) {
        var byte = buffer.readByte();

        if (byte < 128) {
            return res + byte * multiplier;
        } else {
            res += (byte - 128) * multiplier;
        }

        multiplier *= 128;
    }
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
        var string = "";
        for (var i = 0; i < this.readShort(); i += 2) {
            const repeat = this.readByte();
            const char = this.readByte();
            string += String.fromCharCode(char).repeat(repeat);
        }
        return string;
    }

    // might be slow
    writeLengthEncodedString(value: string) {
        var condensed = [];
        var lastChar = "";
        var repeat = 0;
        for (var i = 0; i < value.length; i++) {
            var char = value.charAt(i);
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
        for (var i = 0; i < condensed.length; i += 2) {
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
        var [ b4, b3, b2, b1 ] = this.readBytes(4);
        var exponent = (b1 % 128) * 2 + floor(b2 / 128);
    
        if (exponent === 0) {
            return 0.0;
        }
    
        var sign = (b1 > 127) ? -1 : 1;
        var mantissa = ((b2 % 128) * 256 + b3) * 256 + b4;
    
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
        var b1, b2, b3, b4;
    
        var val = n;
        var sign = 0;
    
        if (val < 0) {
            sign = 1;
            val = -val;
        }
    
        var [ mantissa, exponent ] = frexp(val);
    
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
}