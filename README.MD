# Fomantic UI ES6

## ⚠️⚠️⚠️READ THIS BEFORE ANYTHING ELSE !!!⚠️⚠️⚠️
This repository is for reseach purpose only, to keep track of though and ideas about FUI's ES6 modules (see [Fomantic-UI's related issue](https://github.com/fomantic/Fomantic-UI/issues/319)). **DO NOT USE IT IN PRODUCTION !** You've been warned...

## Install
First, install Rollup.
```sh
npm install --global rollup
```

Then clone this repository, go inside and install dependencies:
```sh
git clone https://github.com/prudho/fomantic-es6.git
cd rollupmantic/
npm install
```

Finally you can build the ~~totally bugged and incomplete~~ library:
```sh
npm run build
```

...and contemplate broken modules by loading examples available in the `test` repository.

## What's done ?
| Module        | Depends on    | Done  | Comment |
| ------------- |:-------------:| :----:| ------- |
| Transition    | none          |   ✔️  |         |
| Dimmer        | Transition    |   ✔️  | new callbacks ! |
| Progress      | none          |   ✔️  |         |
| Rating        | none          |   ✔️  |         |
| Popup         | Transition    |   ✔️  |         |
| Toast         | Transition    |   ✔️  |         |
| Sticky        | none          |   ✔️  |         |
| Slider        | none          |   ✔️  |         |
| Sidebar       | none          |   ✔️  |         |
| Calendar      |  |   ⚠️  | range is broken, halp ! |
| Checkbox      | none          |   ⚠️  | grouped checkbox must be rethinked |
| Dropdown      | Transition    |   ⚠️  | not finished and utterly broken |
| Tab           | none          |   ⚠️  | need to find a replacement for $.address (state library) |
| Accordion     | Transition    |   ⚠️  |         |
| Embed         | none          |   ⚠️  |         |
| Modal         | Transition, Dimmer |   ⚠️  |         |
| Nag           | none          |   ⚠️  |         |
| API           | none          |   ⚠️  | needs intesive tests |
| Form          | Transition, Calendar, Checkbox, Dropdown |   ⚠️  |         |
| Search        | API, Transition |   ⚠️  | needs API debugging |
| Shape         | none          |   ⚠️  |         |
| State         | none          |   ⚠️  |         |
| Visibility    | none          |   ⚠️  |         |
| Site          | ...           |   ❌  |         |

## jQuery

[jQuery's related discussion](https://github.com/fomantic/Fomantic-UI/issues/374)

jQuery is heavily used in FUI actually, and remove all its references from code is a real PITA (trust me, i've tried and others too...). But we can reduce its footprint on the code by using a lighter compatible library. [Cash](https://github.com/fabiospampinato/cash) seems to be a great solution. ~~The only caveat I saw for now is the lack on jQuery's animation methods, but we'll find a lightweight alternative too !~~ FOUND ! Implemented by ourselves :)

## Todo
- find a replacement for the `.addBack` jQuery's function (used once in dropdown).
- find a replacement for the `$.adress` functions used in tabs.
- ~~implement a vanilla Ajax library to handle requests.~~ (#5bccb8b529246a1b29006aed7e65109a9cbaa011)
- fix polymorhp variables that exists in the code.
- fix some method which requires multiple parameters.
- fix some `Cash` behaviors that don't work like jQuery.

### To be continued...