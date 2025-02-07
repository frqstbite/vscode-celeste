# `vscode-celeste`: The Celeste tooling you've been waiting for.

This extension contains a sleu of tools essential to expedient [Celeste](https://www.celestegame.com) modding with [Everest](https://everestapi.github.io). 

- [Features](#features)
  - [Markup Schemas](#markup-schemas)
  - [Visual Map Editor](#visual-map-editor)
  - [Markup-Based Plugin API](#markup-based-plugin-api)
- [Requirements](#requirements)
- [Settings](#settings)
  - [`vscode-celeste.enable`](#vscode-celesteenable)
  - [`vscode-celeste.thing`](#vscode-celestething)
- [Contributing](#contributing)
- [License](#license)

## Features

### Markup Schemas

Edit your mod's markup files comfortably with autocomplete and static validation.

`vscode-celeste` contains out-of-the-box support for the following Celeste and Everest files:
- `everest.yaml`
- Map `.meta.yaml` files for annotating maps with Everest properties
- `AnimatedTiles.xml`
- `DecalRegistry.xml`
- `ForegroundTiles.xml` and `BackgroundTiles.xml`

### Visual Map Editor

This extension enables you to open `.bin` files like any other file.
Instead of a regular old text editor, you are presented with a suite of tools:

#### Map Viewport



#### Attribute Editor

#### Map Graph

Select 

### Markup-Based Plugin API

[Ahorn](https://github.com/CelestialCartographers/Ahorn) plugins are written in [Julia](https://julialang.org).

[Lönn](https://github.com/CelestialCartographers/Loenn) plugins are written in [Lua](https://www.lua.org). 

This extension is written in [TypeScript](https://www.typescriptlang.org).
Does that mean you have to *learn the complexities of TypeScript* just to support this editor?
Of course not! `vscode-celeste`'s plugin API is entirely markup-based; you can write your plugin definitions in YAML, XML, or JSON.
See the [Plugin Documentation]() for more information

## Requirements

In order to take use this 

## Settings

This extension doesn't contribute any settings right now. If it did, they would be listed like so:

### `vscode-celeste.enable`
Enable/disable this extension.

### `vscode-celeste.thing`
Set to `blah` to do something.

## Planned Features

Here are some features that you can expect to come in the future, in no particular order:

- Validation for `Dialog/` files
- [Lua Cutscenes](https://github.com/Cruor/LuaCutscenes) integration
- Visual editors for the [plugin API](#markup-based-plugin-api)
- Celeste save file editor
- Launch Celeste directly into `.bin` file

## Contributing
Issues and pull requests are welcome. 

## License
This extension and [its packages](/packages) are released under the MIT License. Refer to [the license file](/LICENSE) for more information.
