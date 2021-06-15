import resolve from '@rollup/plugin-node-resolve';
import multiEntry from 'rollup-plugin-multi-entry';
// import commonjs from '@rollup/plugin-commonjs';

import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

export default [
	// browser-friendly UMD build
	{
		input: [
			'src/modules/rating.ts',
			'src/modules/transition.ts',
			'src/modules/toast.ts',
			'src/modules/dimmer.ts',
			'src/modules/modal.ts',
			'src/modules/form.ts',
			'src/modules/slider.ts',
			'src/modules/popup.ts',
			'src/modules/progress.ts',
			'src/modules/nag.ts',
			'src/modules/calendar.ts',
			'src/modules/dropdown.ts',
			'src/modules/sticky.ts',
			'src/modules/embed.ts',
			'src/modules/sidebar.ts',
			'src/modules/accordion.ts',
			'src/modules/checkbox.ts',
			'src/modules/tab.ts',
			'src/modules/search.ts',
			'src/modules/shape.ts',
			'src/modules/api.ts'
		],
		output: {
			name: 'fomantic',
			file: pkg.browser,
			format: 'umd',
      globals: {
        'cash-dom': '$'
      }
		},
		plugins: [
      resolve(), // so Rollup can find `cash-dom`
      multiEntry(),
      typescript({
        target: 'es6'
      })
      // commonjs(), // so Rollup can convert `ms` to an ES module
		]
	},

	// CommonJS (for Node) and ES module (for bundlers) build.
	// (We could have three entries in the configuration array
	// instead of two, but it's quicker to generate multiple
	// builds from a single configuration where possible, using
	// an array for the `output` option, where we can specify 
	// `file` and `format` for each target)
	/*{
		input: 'src/main.js',
		external: ['ms'],
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		],
		plugins: [
			multiEntry(),
			babel({
				exclude: ['node_modules/**']
			})
		]
	}*/
];