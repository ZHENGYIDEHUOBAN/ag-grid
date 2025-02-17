import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { URL, fileURLToPath } from 'node:url';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), vueJsx(), vueDevTools()],
    build: {
        minify: process.env.NX_TASK_TARGET_CONFIGURATION === 'production', // in lieue of sourcemaps
        sourcemap: false, //process.env.NX_TASK_TARGET_CONFIGURATION !== 'production', sourcemaps arent currently working currectly - perhaps due to vfcs
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: resolve(__dirname, 'src/main.ts'),
            name: 'AgGridVue',
            // the proper extensions will be added
            fileName: 'main',
        },
        rollupOptions: {
            // make sure to externalize deps that shouldn't be bundled
            // into your library
            external: ['vue', 'ag-grid-community'],
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    'ag-grid-community': 'agGrid',
                    vue: 'Vue',
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
