import Element, { AttributeEncoding, ElementSerializable } from "./mapformat/Element";

abstract class Point implements ElementSerializable {
    abstract element: string;
    x: number;
    y: number;
    
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    toElement(): Element {
        const element = new Element(this.element);

        element.setAttribute("x", AttributeEncoding.Int, this.x);
        element.setAttribute("y", AttributeEncoding.Int, this.y);

        return element;
    }
}

abstract class RoomObject extends Point {
    element: string;
    width: number = 0;
    height: number = 0;

    constructor(type: string, x: number, y: number, width?: number, height?: number) {
        super(x, y);
        this.element = type;
        this.width = width ?? this.width;
        this.height = height ?? this.height;
    }

    toElement(): Element {
        const element = super.toElement();

        element.setAttribute("width", AttributeEncoding.Int, this.width);
        element.setAttribute("height", AttributeEncoding.Int, this.height);

        return element;
    }
}

export class Node extends Point {
    element: string = "node";
}

export class RoomEntity extends RoomObject {
    nodes: Node[] = [];

    toElement(): Element {
        const element = super.toElement();

        // Convert nodes to elements and add as children
        this.nodes.map(node => node.toElement()).forEach(element.addChild);

        return element;
    }
}

export class RoomDecal extends RoomObject {
    texture: string;
    scaleX: number = 1;
    scaleY: number = 1;

    constructor(texture: string, x: number, y: number) {
        super("decal", x, y);
        this.texture = texture;
    }

    toElement(): Element {
        const element = super.toElement();

        element.setAttribute("texture", AttributeEncoding.String, this.texture);
        element.setAttribute("scaleX", AttributeEncoding.Float, this.scaleX);
        element.setAttribute("scaleY", AttributeEncoding.Float, this.scaleY);

        return element;
    }
}