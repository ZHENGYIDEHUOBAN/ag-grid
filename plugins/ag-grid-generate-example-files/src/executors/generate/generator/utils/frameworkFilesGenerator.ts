import prettier from 'prettier';

import { ANGULAR_GENERATED_MAIN_FILE_NAME } from '../constants';
import { vanillaToAngular } from '../transformation-scripts/grid-vanilla-to-angular';
import { vanillaToReactFunctional } from '../transformation-scripts/grid-vanilla-to-react-functional';
import { vanillaToReactFunctionalTs } from '../transformation-scripts/grid-vanilla-to-react-functional-ts';
import { vanillaToTypescript } from '../transformation-scripts/grid-vanilla-to-typescript';
import { vanillaToVue } from '../transformation-scripts/grid-vanilla-to-vue';
import { vanillaToVue3 } from '../transformation-scripts/grid-vanilla-to-vue3';
import { readAsJsFile } from '../transformation-scripts/parser-utils';
import { FRAMEWORKS, InternalFramework } from '../types';
import type { FileContents } from '../types';
import { deepCloneObject } from './deepCloneObject';
import { getBoilerPlateFiles, getEntryFileName, getMainFileName } from './fileUtils';
import { basename } from 'path';

interface FrameworkFiles {
    files: FileContents;
    boilerPlateFiles?: FileContents;
    hasProvidedExamples?: boolean;
    scriptFiles?: string[];
    /**
     * Filename to execute code
     */
    entryFileName: string;
    /**
     * Filename of main code that is run
     */
    mainFileName: string;
}

type ConfigGenerator = ({
    entryFile,
    indexHtml,
    isEnterprise,
    bindings,
    typedBindings,
    componentScriptFiles,
    otherScriptFiles,
    ignoreDarkMode,
    isDev,
}: {
    entryFile: string;
    indexHtml: string;
    isEnterprise: boolean;
    bindings: any;
    typedBindings: any;
    componentScriptFiles: FileContents;
    otherScriptFiles: FileContents;
    ignoreDarkMode?: boolean;
    isDev: boolean;
    importType: 'modules' | 'packages';
}) => Promise<FrameworkFiles>;

const createVueFilesGenerator =
    ({
        sourceGenerator,
        internalFramework,
    }: {
        sourceGenerator: (
            bindings: any,
            componentFilenames: string[],
            allStylesheets: string[]
        ) => (importType) => string;
        internalFramework: InternalFramework;
    }): ConfigGenerator =>
    async ({ bindings, indexHtml, componentScriptFiles, otherScriptFiles, isDev, importType }) => {
        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);

        const componentNames = getComponentName(componentScriptFiles);
        let mainJs = sourceGenerator(deepCloneObject(bindings), componentNames, [])(importType);

        mainJs = await prettier.format(mainJs, { parser: 'babel' });

        const entryFileName = getEntryFileName(internalFramework)!;
        const mainFileName = getMainFileName(internalFramework)!;

        const scriptFiles = {...otherScriptFiles, ...componentScriptFiles};

        return {
            files: {
                ...scriptFiles,
                [entryFileName]: mainJs,
                'index.html': indexHtml,
            },
            boilerPlateFiles,
            // Other files, not including entry file
            scriptFiles: Object.keys(scriptFiles),
            entryFileName,
            mainFileName,
        };
    };

export const frameworkFilesGenerator: Partial<Record<InternalFramework, ConfigGenerator>> = {
    vanilla: async ({ entryFile, indexHtml, typedBindings, componentScriptFiles, otherScriptFiles, ignoreDarkMode }) => {
        const internalFramework: InternalFramework = 'vanilla';
        const entryFileName = getEntryFileName(internalFramework)!;
        const mainFileName = getMainFileName(internalFramework)!;
        let mainJs = readAsJsFile(entryFile);

        // Chart classes that need scoping
        const gridImports = typedBindings.imports.find(
            (i: any) => i.module.includes('ag-grid-community') || i.module.includes('ag-grid-enterprise')
        );
        if (gridImports) {
            gridImports.imports.forEach((i: any) => {
                const toReplace = `(?<!\\.)${i}([\\s/.])`;
                const reg = new RegExp(toReplace, 'g');
                mainJs = mainJs.replace(reg, `agGrid.${i}$1`);
            });
        }

        const scriptFiles = {...otherScriptFiles, ...componentScriptFiles};
        mainJs = await prettier.format(mainJs, { parser: 'babel' });

        return {
            files: {
                ...scriptFiles,
                [entryFileName]: mainJs,
                'index.html': indexHtml,
            },
            scriptFiles: Object.keys(scriptFiles).concat(entryFileName),
            entryFileName,
            mainFileName,
        };
    },
    typescript: async ({
        entryFile,
        indexHtml,
        otherScriptFiles,
        componentScriptFiles,
        typedBindings,
        isDev,
        importType,
    }) => {
        const internalFramework: InternalFramework = 'typescript';
        const entryFileName = getEntryFileName(internalFramework)!;
        const mainFileName = getMainFileName(internalFramework)!;

        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);

        let mainTs = vanillaToTypescript(deepCloneObject(typedBindings), mainFileName, entryFile)(importType);

        mainTs = await prettier.format(mainTs, { parser: 'typescript' });

        const scriptFiles = {...otherScriptFiles, ...componentScriptFiles};

        return {
            files: {
                ...scriptFiles,
                [entryFileName]: mainTs,
                'index.html': indexHtml,
            },
            boilerPlateFiles,
            // NOTE: `scriptFiles` not required, as system js handles import
            entryFileName,
            mainFileName,
        };
    },
    reactFunctional: async ({ bindings, indexHtml, otherScriptFiles, componentScriptFiles, isDev, importType }) => {
        const internalFramework = 'reactFunctional';
        const entryFileName = getEntryFileName(internalFramework)!;
        const mainFileName = getMainFileName(internalFramework)!;
        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);

        const componentNames = getComponentName(componentScriptFiles);
        let indexJsx = vanillaToReactFunctional(deepCloneObject(bindings), componentNames, [])(importType);

        indexJsx = await prettier.format(indexJsx, { parser: 'babel' });

        const scriptFiles = {...otherScriptFiles, ...componentScriptFiles};

        return {
            files: {
                ...scriptFiles,
                [entryFileName]: indexJsx,
                'index.html': indexHtml,
            },
            boilerPlateFiles,
            // Other files, not including entry file
            scriptFiles: Object.keys(scriptFiles),
            entryFileName,
            mainFileName,
        };
    },
    reactFunctionalTs: async ({ typedBindings, indexHtml, otherScriptFiles, componentScriptFiles, isDev, importType }) => {
        const internalFramework: InternalFramework = 'reactFunctionalTs';
        const entryFileName = getEntryFileName(internalFramework)!;
        const mainFileName = getMainFileName(internalFramework)!;
        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);

        const componentNames = getComponentName(componentScriptFiles);
        let indexTsx = vanillaToReactFunctionalTs(deepCloneObject(typedBindings), componentNames, [])(importType);

        indexTsx = await prettier.format(indexTsx, { parser: 'typescript' });

        const scriptFiles = {...otherScriptFiles, ...componentScriptFiles};

        return {
            files: {
                ...scriptFiles,
                [entryFileName]: indexTsx,
                'index.html': indexHtml,
            },
            boilerPlateFiles,
            // NOTE: `scriptFiles` not required, as system js handles import
            entryFileName,
            mainFileName,
        };
    },
    angular: async ({ typedBindings, otherScriptFiles, componentScriptFiles, isDev, importType }) => {
        const internalFramework: InternalFramework = 'angular';
        const entryFileName = getEntryFileName(internalFramework)!;
        const mainFileName = getMainFileName(internalFramework)!;
        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);

        const componentNames = getComponentName(componentScriptFiles);
        let appComponent = vanillaToAngular(deepCloneObject(typedBindings), componentNames, [])(importType);

        appComponent = await prettier.format(appComponent, { parser: 'typescript' });

        const scriptFiles = {...otherScriptFiles, ...componentScriptFiles};

        return {
            files: {
                ...scriptFiles,
                // NOTE: No `index.html` as the contents are generated in the `app.component` file
                // NOTE: Duplicating entrypoint boilerplate file here, so examples
                // load from the same directory as these files, rather than
                // boilerplate files
                [entryFileName]: boilerPlateFiles[entryFileName],
                [ANGULAR_GENERATED_MAIN_FILE_NAME]: appComponent,
            },
            boilerPlateFiles,
            entryFileName,
            mainFileName,
        };
    },
    vue: createVueFilesGenerator({
        sourceGenerator: vanillaToVue,
        internalFramework: 'vue',
    }),
    vue3: createVueFilesGenerator({
        sourceGenerator: vanillaToVue3,
        internalFramework: 'vue3',
    }),
};

function getComponentName(otherScriptFiles: FileContents) {
    return Object.keys(otherScriptFiles).map((file) => basename(file));
}
