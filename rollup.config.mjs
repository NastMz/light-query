import path from 'path'
import url from 'url'
import alias from '@rollup/plugin-alias'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const aliasEntries = [
  { find: '@core', replacement: path.resolve(__dirname, 'src/core') },
  { find: '@types', replacement: path.resolve(__dirname, 'src/types') },
  { find: '@hooks', replacement: path.resolve(__dirname, 'src/hooks') },
  { find: '@react', replacement: path.resolve(__dirname, 'src/react') },
  { find: '@utils', replacement: path.resolve(__dirname, 'src/utils') }
]

export default [
  {
    input: 'src/index.ts',
    external: ['react', 'react-dom'],
    plugins: [
      alias({ entries: aliasEntries }),
      typescript({ tsconfig: './tsconfig.json' }),
      resolve(),
      commonjs()
    ],
    output: [
      { file: 'dist/index.cjs.js', format: 'cjs', exports: 'named' },
      { file: 'dist/index.esm.js', format: 'esm' }
    ]
  },
  {
    input: 'src/index.ts',
    plugins: [
      alias({ entries: aliasEntries }),
      dts()
    ],
    output: [{ file: 'dist/index.d.ts', format: 'es' }]
  }
]
