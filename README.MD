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
| Dimmer        | Transition    |   ✔️  |         |
| Progress      | none          |   ✔️  |         |
| Rating        | none          |   ✔️  |         |
| Popup         | Transition    |   ✔️  |         |
| Toast         | Transition    |   ✔️  |         |
| Sticky        | none          |   ✔️  |         |
| Slider        | none          |   ✔️  |         |
| Calendar      | Popup         |   ⚠️  | range is broken, halp ! |
| Checkbox      | none          |   ⚠️  | grouped checkbox must be rethinked |
| Dropdown      | Transition    |   ⚠️  | not finished and utterly broken |
| Tab           | none          |   ⚠️  | not finished and utterly broken |
| Accordion     | Transition    |   ❌  |         |
| Embed         | ...           |   ❌  |         |
| Modal         | ...           |   ❌  |         |
| Nag           | ...           |   ❌  |         |
| Search        | ...           |   ❌  |         |
| Shape         | ...           |   ❌  |         |
| Sidebar       | ...           |   ❌  |         |
| API           | ...           |   ❌  |         |
| Form          | ...           |   ❌  |         |
| State         | ...           |   ❌  |         |
| Visibility    | ...           |   ❌  |         |
| Site          | ...           |   ❌  |         |

## jQuery

[jQuery's related discussion](https://github.com/fomantic/Fomantic-UI/issues/374)

jQuery is heavily used in FUI actually, and remove all its references from code is a real PITA (trust me, i've tried and others too...). But we can reduce its footprint on the code by using a lighter compatible library. [Cash](https://github.com/fabiospampinato/cash) seems to be a great solution. The only caveat I saw for now is the lack on jQuery's animation methods, but we'll find a lightweight alternative too !

### To be continued...