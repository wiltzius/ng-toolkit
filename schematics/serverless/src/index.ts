import {
    apply, chain, mergeWith, move, Rule, Tree, url, MergeStrategy, SchematicContext
} from '@angular-devkit/schematics';
import {
    applyAndLog, addDependencyToPackageJson, addOrReplaceScriptInPackageJson, addOpenCollective, updateGitIgnore,
    createOrOverwriteFile, addEntryToEnvironment, getMethodBody, updateMethod, addMethod, addImportStatement, getDistFolder,
    isUniversal, getBrowserDistFolder, getServerDistFolder, implementInterface, addParamterToMethod, getNgToolkitInfo, updateNgToolkitInfo, updateProject
} from '@ng-toolkit/_utils';
import { getFileContent } from '@schematics/angular/utility/test';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { Path } from '@angular-devkit/core';
import * as bugsnag from 'bugsnag';

export default function addServerless(options: any): Rule {

    bugsnag.register('0b326fddc255310e516875c9874fed91');
    bugsnag.onBeforeNotify((notification) => {
        let metaData = notification.events[0].metaData;
        metaData.subsystem = {
            package: 'serverless',
            options: options
        };
    });

    options.serverless = {
        aws: {},
        gcloud: {}
    };

    const templateSource = apply(url('files/common'), [
        move(options.directory),
    ]);

    const rules: Rule[] = [];

    rules.push((tree: Tree, context: SchematicContext) => {
        // update project name
        updateProject(tree, options);
            
        const ngToolkitSettings = getNgToolkitInfo(tree, options);
        if (!ngToolkitSettings.universal) {
            return chain([
                mergeWith(templateSource, MergeStrategy.Overwrite),
                tree => {
                    if (isUniversal(tree, options)) {
                        tree.rename(`${options.directory}/server_universal.ts`, `${options.directory}/server.ts`);
                        tree.rename(`${options.directory}/server_static.ts`, `${options.directory}/temp/server_static.ts${new Date().getDate()}`);
                    } else {
                        tree.rename(`${options.directory}/server_universal.ts`, `${options.directory}temp/server_universal.ts${new Date().getDate()}`);
                        tree.rename(`${options.directory}/server_static.ts`, `${options.directory}/server.ts`);
                    }

                    const serverFileContent = getFileContent(tree, `${options.directory}/server.ts`);

                    tree.overwrite(`${options.directory}/server.ts`, serverFileContent
                        .replace('__distBrowserFolder__', getBrowserDistFolder(tree, options))
                        .replace('__distServerFolder__', getServerDistFolder(tree, options))
                    );
                }
            ])(tree, context);
        }
        if (ngToolkitSettings.serverless) {
            switch(options.provider) {
                case 'aws': {
                    tree.delete(`${options.directory}/lambda.js`);
                    tree.delete(`${options.directory}/serverless.yml`);
                    break;
                }
                case 'gcloud': {
                    tree.delete(`${options.directory}/index.js`);
                    tree.delete(`${options.directory}/serverless.yml`);
                    break;
                }
                case 'firebase': {
                    tree.delete(`${options.directory}/functions/index.js`);
                    tree.delete(`${options.directory}/firebase.json`);
                    break;
                }
            }
        }
        return tree;
    });

    rules.push(tree => {
        addDependencyToPackageJson(tree, options, 'ts-loader', '4.2.0', true);
        addDependencyToPackageJson(tree, options, 'webpack-cli', '2.1.2', true);
        addDependencyToPackageJson(tree, options, 'cors', '~2.8.4');
        addDependencyToPackageJson(tree, options, 'cp-cli', '^1.1.0');
    });
    

    rules.push(addOpenCollective(options));

    if (options.provider === 'firebase') {

        rules.push(updateGitIgnore(options, '/functions/node_modules/'));

        const source = apply(url('./files/firebase'), [
            move(options.directory)
        ]);

        rules.push(tree => {
            tree.create(`${options.directory}/functions/package.json`,`{
  "name": "functions",
  "description": "Cloud Functions for Firebase",
  "scripts": {
    "serve": "firebase serve --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "dependencies": {
    "firebase-admin": "~5.12.0",
    "firebase-functions": "^1.0.1"
  },
  "private": true
}
`);
            let firebaseProjectSettings = {};
            if (options.firebaseProject) {
                firebaseProjectSettings = {
                    projects: {
                        default: options.firebaseProject
                    }
                };
            }
            tree.create(`${options.directory}/.firebaserc`, JSON.stringify(firebaseProjectSettings, null, "  "));
        });

        rules.push(addOrReplaceScriptInPackageJson(options, 'build:prod:deploy', 'npm run build:prod && cd functions && npm install && cd .. && firebase deploy'));

        rules.push(mergeWith(source, MergeStrategy.Overwrite));
    }

    if (options.provider === 'gcloud' || options.provider === 'aws' ) {
        //serverless stuff
        rules.push( tree => {
            addDependencyToPackageJson(tree, options, 'serverless', '1.26.1', true)
            return tree;
        });

        if (options.provider === 'gcloud') {
            rules.push(addServerlessGcloud(options));
        } else if (options.provider === 'aws') {
            rules.push(addServerlessAWS(options));
        }
    }

    rules.push(tree => {
        createOrOverwriteFile(tree,`${options.directory}/local.js`,`
const port = process.env.PORT || 8080;

const server = require('./${getDistFolder(tree, options)}/server');

server.app.listen(port, () => {
    console.log("Listening on: http://localhost:"+port);
});
`);

        let webpack = getFileContent(tree, `${options.directory}/webpack.server.config.js`);
        tree.overwrite(`${options.directory}/webpack.server.config.js`, webpack.replace("__distFolder__", getDistFolder(tree, options)));
    });

    if (options.provider != 'firebase') {
        rules.push(updateEnvironment(options));
        rules.push(updateAppEntryFile(options));
    }

    rules.push(addBuildScriptsAndFiles(options));

    if (!options.skipInstall) {
        rules.push((tree: Tree, context: SchematicContext) => {
            tree.exists('.'); // noop
            context.addTask(new NodePackageInstallTask(options.directory));
        })
    }

    rules.push(tree => {
        const ngToolkitSettings = getNgToolkitInfo(tree, options);
        ngToolkitSettings.serverless = options;
        updateNgToolkitInfo(tree, options, ngToolkitSettings);
    });
    if (!options.disableBugsnag) {
        return applyAndLog(chain(rules));
    } else {
        return chain(rules);
    }
}

function addBuildScriptsAndFiles(options: any): Rule {
    return (tree: Tree) => {
        const packageJsonSource = JSON.parse(getFileContent(tree, `${options.directory}/package.json`));

        const universal:boolean = isUniversal(tree, options);

        let serverlessBasePath;
        switch(options.provider) {
            default: serverlessBasePath = '/'; break;
            case 'aws': serverlessBasePath = '/production/'; break;
            case 'gcloud': serverlessBasePath = '/http/'; break;
        }

        packageJsonSource.scripts['build:browser:prod'] = `ng build --prod`;
        packageJsonSource.scripts['build:browser:serverless'] = `ng build --prod --base-href ${serverlessBasePath}`;
        packageJsonSource.scripts['build:serverless'] = `npm run build:browser:serverless && npm run build:server:serverless`;
        packageJsonSource.scripts['build:prod'] = `npm run build:browser:prod && npm run build:server:prod`;
        packageJsonSource.scripts['server'] = `node local.js`;
        packageJsonSource.scripts['build:prod:deploy'] = `npm run build:prod && npm run deploy`;
        packageJsonSource.scripts['build:serverless:deploy'] = `npm run build:serverless && npm run deploy`;

        if (options.provider === 'firebase') {
            packageJsonSource.scripts['deploy'] = `cp-cli dist/ functions/dist/ && cd functions && npm install && firebase deploy`;
        } else {
            packageJsonSource.scripts['deploy'] = `serverless deploy`;
        }

        if (universal) {
            packageJsonSource.scripts['build:server:prod'] = `ng run ${options.project}:server && webpack --config webpack.server.config.js --progress --colors`;
            if (options.provider != 'firebase') {
                packageJsonSource.scripts['build:server:serverless'] = `ng run ${options.project}:server:serverless && webpack --config webpack.server.config.js --progress --colors`;
            } else {
                packageJsonSource.scripts['build:server:serverless'] = `ng run ${options.project}:server && webpack --config webpack.server.config.js --progress --colors`;
            }
        } else {
            packageJsonSource.scripts['build:server:prod'] = `webpack --config webpack.server.config.js --progress --colors`;
            packageJsonSource.scripts['build:server:serverless'] = `webpack --config webpack.server.config.js --progress --colors`;
        }

        tree.overwrite(`${options.directory}/package.json`, JSON.stringify(packageJsonSource, null, "  "));
        return tree;
    }
}

function addServerlessAWS(options: any): Rule {
    const fileName = options.serverless.aws.filename || 'serverless.yml';

    const source = apply(url('./files/aws'), [
        move(options.directory)
    ]);

    return chain([
        mergeWith(source),
        tree => {
            tree.rename(`${options.directory}/serverless-aws.yml`, `${options.directory}/${fileName}`);
            tree.overwrite(`${options.directory}/${fileName}`, getFileContent(tree,`${options.directory}/${fileName}`).replace('__appName__', options.project.toLowerCase()));

            addDependencyToPackageJson(tree, options, 'aws-serverless-express', '^3.2.0' );
            addDependencyToPackageJson(tree, options, 'serverless-apigw-binary', '^0.4.4', true );
            return tree;
        }
    ]);
}

function addServerlessGcloud(options: any): Rule {
    const fileName = options.serverless.gcloud.filename || 'serverless.yml';

    const source = apply(url('./files/gcloud'), [
        move(options.directory)
    ]);

    return chain([
        mergeWith(source),
        tree => {
            tree.rename(`${options.directory}/serverless-gcloud.yml`, `${options.directory}/${fileName}`);
            tree.overwrite(`${options.directory}/${fileName}`, getFileContent(tree,`${options.directory}/${fileName}`).replace('__appName__', options.project.toLowerCase()));

            addDependencyToPackageJson(tree, options, 'firebase-admin', '^5.11.0' );
            addDependencyToPackageJson(tree, options, 'firebase-functions', '^0.9.1' );
            addDependencyToPackageJson(tree, options, 'serverless-google-cloudfunctions', '^1.1.1', true );
            return tree;
        }
    ]);
}

function updateEnvironment(options: any): Rule {
    return tree => {
        if (!isUniversal(tree, options) || options.provider === 'firebase') {
            return tree;
        }

        let serverlessBasePath: string;

        if (options.provider === 'aws') {
            serverlessBasePath = '/production/';
        } else {
            serverlessBasePath = '/http/';
        }

        createOrOverwriteFile(tree, `${options.directory}/src/environments/environment.serverless.ts`, getFileContent(tree, `${options.directory}/src/environments/environment.prod.ts`));

        tree.getDir(`${options.directory}/src/environments`).visit( (path: Path) => {
            if (path.endsWith('.ts')) {
                addEntryToEnvironment(tree, path, 'baseHref', path.indexOf('serverless') > -1?serverlessBasePath:'/');
            }
        });

        //update CLI with new configuration

        const cliConfig: any = JSON.parse(getFileContent(tree, `${options.directory}/angular.json`));
        const project: any = cliConfig.projects[options.project].architect;
        for (let property in project) {
            if (project.hasOwnProperty(property) && (project[property].builder === '@angular-devkit/build-angular:server')) {
                if (!project[property].configurations) {
                    project[property].configurations = {};
                }
                project[property].configurations.serverless = {
                    "fileReplacements": [
                        {
                            "replace": "src/environments/environment.ts",
                            "with": "src/environments/environment.serverless.ts"
                        }
                    ]
                };
            }
        }

        tree.overwrite(`${options.directory}/angular.json`, JSON.stringify(cliConfig, null, "  "))

        return tree;
    }
}

function updateAppEntryFile(options: any): Rule {
    return tree=> {
        if (!isUniversal(tree, options)) {
            return tree;
        }
        const appComponentFilePath = `${options.directory}/src/app/app.component.ts`;
        const ngOnInit = getMethodBody(tree, appComponentFilePath, 'ngOnInit');
        addImportStatement(tree, appComponentFilePath, 'environment', '../environments/environment');
        implementInterface(tree, appComponentFilePath, 'OnInit', '@angular\/core');
        addImportStatement(tree, appComponentFilePath, 'Inject', '@angular\/core');
        addImportStatement(tree, appComponentFilePath, 'DOCUMENT', '@angular\/common');
        addImportStatement(tree, appComponentFilePath, 'isPlatformBrowser', '@angular\/common');
        addImportStatement(tree, appComponentFilePath, 'PLATFORM_ID', '@angular\/core');

        if (getMethodBody(tree, appComponentFilePath, 'constructor')) {
            addParamterToMethod(tree, appComponentFilePath, 'constructor', `@Inject(DOCUMENT) private document: any`)
            addParamterToMethod(tree, appComponentFilePath, 'constructor', `@Inject(PLATFORM_ID) private platformId: any`)
        } else {
            addMethod(tree, appComponentFilePath, `
    constructor(@Inject(DOCUMENT) private document:any, @Inject(PLATFORM_ID) private platformId: any){}
`)
        }

        if (ngOnInit) {
            updateMethod(tree, appComponentFilePath, 'ngOnInit', ngOnInit + `
    if (!isPlatformBrowser(this.platformId)) {
        let bases = this.document.getElementsByTagName('base');

        if (bases.length > 0) {
            bases[0].setAttribute('href', environment.baseHref);
        }
    }
`);
        } else {
            addMethod(tree, appComponentFilePath, `
    public ngOnInit(): void {
        if (!isPlatformBrowser(this.platformId)) {
            let bases = this.document.getElementsByTagName('base');
    
            if (bases.length > 0) {
                bases[0].setAttribute('href', environment.baseHref);
            }
        }
    }`);
        }
        return tree;
    }
}