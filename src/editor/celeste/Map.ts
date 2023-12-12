import BinaryBuffer from "./mapformat/BinaryBuffer";
import Element, { AttributeEncoding, ElementSerializable } from "./mapformat/Element";
import StringLookup from "./mapformat/StringLookup";
import Room from "./Room";
import { Rect } from './types';

function getFillerElement(filler: Rect): Element {
    const element = new Element("rect");
    element.setAttribute("x", AttributeEncoding.Int, filler.x);
    element.setAttribute("y", AttributeEncoding.Int, filler.y);
    element.setAttribute("w", AttributeEncoding.Int, filler.width);
    element.setAttribute("h", AttributeEncoding.Int, filler.height);
    return element;
}

export default class Map implements ElementSerializable {
    filler: Rect[] = [];
    style: any; //TODO: implement
    rooms: Room[] = [];

    static deserialize(data: Uint8Array) {
        const buffer = new BinaryBuffer(data);
        buffer.readString(); //CELESTE MAPS
        buffer.readString(); //Package name
        const lookup = StringLookup.deserialize(buffer);

        const root = Element.deserialize(buffer, lookup);
        const map = new Map();

        // Filler
        const fillerElement = root.getChild("Filler");
        fillerElement!.children.forEach(child => map.filler.push({
            x: child.getAttribute("x"),
            y: child.getAttribute("y"),
            width: child.getAttribute("w"),
            height: child.getAttribute("h"),
        }));

        // Style

        // Rooms
        const roomsElement = root.getChild("levels");
        roomsElement!.children.forEach(child => map.rooms.push(Room.deserialize(child)));
    }

    toElement(): Element {
        const element = new Element("CelesteMap");

        // Filler
        const FillerElement = new Element("Filler");
        this.filler.map(getFillerElement).forEach(FillerElement.addChild); //Convert filler to elements and add as children
        element.addChild(FillerElement);

        // Style
        const StyleElement = new Element("Style");
        element.addChild(StyleElement);

        // Rooms
        const RoomsElement = new Element("levels");
        this.rooms.map(room => room.toElement()).forEach(RoomsElement.addChild); //Convert rooms to elements and add as children

        return element;
    }
}