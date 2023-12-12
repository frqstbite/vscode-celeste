import Element, { AttributeEncoding, ElementSerializable } from './mapformat/Element';
import { WindPattern } from './types';
import { RoomDecal, RoomEntity } from './RoomObject';

export default class Room implements ElementSerializable {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    
    disableDownTransition: boolean = false;
    c: number = 0;
    windPattern: WindPattern = "None";
    whisper: boolean = false;
    space: boolean = false;
    dark: boolean = false;
    underwater: boolean = false;

    cameraOffsetX: number = 0;
    cameraOffsetY: number = 0;
    
    music: string = "";
    ambience: string = "";
    musicProgress: string = "";
    ambienceProgress: string = "";
    
    altMusic: string = "";
    delayAltMusicFade: any;
    
    musicLayer1: boolean = false;
    musicLayer2: boolean = false;
    musicLayer3: boolean = false;
    musicLayer4: boolean = false;

    foregroundDecals: RoomDecal[] = [];
    backgroundDecals: RoomDecal[] = [];
    entities: RoomEntity[] = [];
    triggers: RoomEntity[] = [];

    static deserialize(element: Element): Room {
        // Root room element
        const room = new Room(
            element.getAttribute("name"),
            element.getAttribute("x"),
            element.getAttribute("y"),
            element.getAttribute("width"),
            element.getAttribute("height"),
        );

        room.disableDownTransition = element.getAttribute("disableDownTransition");
        room.c = element.getAttribute("c");
        room.windPattern = element.getAttribute("windPattern");
        room.whisper = element.getAttribute("whisper");
        room.space = element.getAttribute("space");
        room.dark = element.getAttribute("dark");
        room.underwater = element.getAttribute("underwater");

        room.cameraOffsetX = element.getAttribute("cameraOffsetX");
        room.cameraOffsetY = element.getAttribute("cameraOffsetY");

        room.music = element.getAttribute("music");
        room.ambience = element.getAttribute("ambience");
        room.musicProgress = element.getAttribute("musicProgress");
        room.ambienceProgress = element.getAttribute("ambienceProgress");

        room.altMusic = element.getAttribute("altMusic");
        room.delayAltMusicFade = element.getAttribute("delayAltMusicFade");

        room.musicLayer1 = element.getAttribute("musicLayer1");
        room.musicLayer2 = element.getAttribute("musicLayer2");
        room.musicLayer3 = element.getAttribute("musicLayer3");
        room.musicLayer4 = element.getAttribute("musicLayer4");

        return room;
    }

    constructor(name: string, x: number, y: number, width: number, height: number) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    toElement(): Element {
        // ☠️
        const element = new Element("level");
        element.setAttribute("name", AttributeEncoding.String, this.name);
        element.setAttribute("x", AttributeEncoding.Int, this.x);
        element.setAttribute("y", AttributeEncoding.Int, this.y);
        element.setAttribute("width", AttributeEncoding.Int, this.width);
        element.setAttribute("height", AttributeEncoding.Int, this.height);
        element.setAttribute("disableDownTransition", AttributeEncoding.Boolean, this.disableDownTransition);
        element.setAttribute("c", AttributeEncoding.Int, this.c);
        element.setAttribute("windPattern", AttributeEncoding.String, this.windPattern);
        element.setAttribute("whisper", AttributeEncoding.Boolean, this.whisper);
        element.setAttribute("space", AttributeEncoding.Boolean, this.space);
        element.setAttribute("dark", AttributeEncoding.Boolean, this.dark);
        element.setAttribute("underwater", AttributeEncoding.Boolean, this.underwater);
        element.setAttribute("cameraOffsetX", AttributeEncoding.Int, this.cameraOffsetX);
        element.setAttribute("cameraOffsetY", AttributeEncoding.Int, this.cameraOffsetY);
        element.setAttribute("music", AttributeEncoding.String, this.music);
        element.setAttribute("ambience", AttributeEncoding.String, this.ambience);
        element.setAttribute("musicProgress", AttributeEncoding.String, this.musicProgress);
        element.setAttribute("ambienceProgress", AttributeEncoding.String, this.ambienceProgress);
        element.setAttribute("altMusic", AttributeEncoding.String, this.altMusic);
        element.setAttribute("delayAltMusicFade", AttributeEncoding.String, this.delayAltMusicFade);
        element.setAttribute("musicLayer1", AttributeEncoding.Boolean, this.musicLayer1);
        element.setAttribute("musicLayer2", AttributeEncoding.Boolean, this.musicLayer2);
        element.setAttribute("musicLayer3", AttributeEncoding.Boolean, this.musicLayer3);
        element.setAttribute("musicLayer4", AttributeEncoding.Boolean, this.musicLayer4);

        return element;
    }
}