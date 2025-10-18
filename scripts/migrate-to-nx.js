#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class NxMigrationManager {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.nxConfig = {
      version: 2,
      projects: {
        'mobile-app': {
          root: 'src',
          sourceRoot: 'src',
          projectType: 'application',
          targets: {
            build: {
              executor: '@nx/expo:build',
              options: {
                platform: 'all'
              }
            },
            serve: {
              executor: '@nx/expo:serve',
              options: {
                port: 8081
              }
            },
            test: {
              executor: '@nx/jest:jest',
              options: {
                jestConfig: 'jest.config.js'
              }
            },
            lint: {
              executor: '@nx/eslint:lint',
              options: {
                lintFilePatterns: ['src/**/*.{ts,tsx}']
              }
            }
          }
        },
        'backend-api': {
          root: 'backend',
          sourceRoot: 'backend/src',
          projectType: 'application',
          targets: {
            build: {
              executor: '@nx/node:build',
              options: {
                outputPath: 'backend/dist'
              }
            },
            serve: {
              executor: '@nx/node:serve',
              options: {
                buildTarget: 'backend-api:build'
              }
            },
            test: {
              executor: '@nx/jest:jest',
              options: {
                jestConfig: 'backend/jest.config.js'
              }
            },
            lint: {
              executor: '@nx/eslint:lint',
              options: {
                lintFilePatterns: ['backend/src/**/*.{ts,js}']
              }
            }
          }
        },
        'admin-portal': {
          root: 'admin-portal',
          sourceRoot: 'admin-portal/src',
          projectType: 'application',
          targets: {
            build: {
              executor: '@nx/webpack:webpack',
              options: {
                outputPath: 'admin-portal/dist'
              }
            },
            serve: {
              executor: '@nx/webpack:dev-server',
              options: {
                port: 3000
              }
            },
            test: {
              executor: '@nx/jest:jest',
              options: {
                jestConfig: 'admin-portal/jest.config.js'
              }
            },
            lint: {
              executor: '@nx/eslint:lint',
              options: {
                lintFilePatterns: ['admin-portal/src/**/*.{ts,tsx}']
              }
            }
          }
        }
      }
    };
  }

  async migrate() {
    console.log('🚀 Starting Nx Cloud migration...');
    
    try {
      // Step 1: Install Nx
      console.log('📦 Installing Nx...');
      execSync('npm install -g nx@latest', { stdio: 'inherit' });
      
      // Step 2: Initialize Nx workspace
      console.log('🔧 Initializing Nx workspace...');
      execSync('npx nx@latest init', { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
      
      // Step 3: Install Nx plugins
      console.log('🔌 Installing Nx plugins...');
      const plugins = [
        '@nx/js@latest',
        '@nx/react@latest',
        '@nx/expo@latest',
        '@nx/node@latest',
        '@nx/webpack@latest',
        '@nx/jest@latest',
        '@nx/eslint@latest'
      ];
      
      for (const plugin of plugins) {
        execSync(`npm install --save-dev ${plugin}`, { 
          stdio: 'inherit',
          cwd: this.projectRoot 
        });
      }
      
      // Step 4: Create nx.json configuration
      console.log('⚙️  Creating nx.json configuration...');
      this.createNxConfig();
      
      // Step 5: Create project configurations
      console.log('📁 Creating project configurations...');
      this.createProjectConfigs();
      
      // Step 6: Set up Nx Cloud
      console.log('☁️  Setting up Nx Cloud...');
      execSync('npx nx cloud', { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
      
      // Step 7: Create CI/CD configuration
      console.log('🔄 Creating CI/CD configuration...');
      this.createCIConfig();
      
      // Step 8: Create workspace scripts
      console.log('📝 Creating workspace scripts...');
      this.createWorkspaceScripts();
      
      console.log('✅ Nx Cloud migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  }

  createNxConfig() {
    const nxConfig = {
      version: 2,
      projects: this.nxConfig.projects,
      plugins: [
        {
          plugin: '@nx/js',
          options: {
            targetDefaults: {
              build: {
                dependsOn: ['^build'],
                inputs: ['production', '^production']
              },
              test: {
                inputs: ['default', '^production', '{workspaceRoot}/jest.preset.js']
              },
              lint: {
                inputs: ['default', '{workspaceRoot}/.eslintrc.json']
              }
            }
          }
        }
      ],
      namedInputs: {
        default: ['{projectRoot}/**/*', 'sharedGlobals'],
        production: [
          'default',
          '!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?',
          '!{projectRoot}/tsconfig.spec.json',
          '!{projectRoot}/jest.config.[jt]s',
          '!{projectRoot}/src/test-setup.[jt]s',
          '!{projectRoot}/test-setup.[jt]s',
          '!{projectRoot}/.eslintrc.json',
          '!{projectRoot}/eslint.config.js'
        ],
        sharedGlobals: []
      },
      targetDefaults: {
        build: {
          dependsOn: ['^build'],
          inputs: ['production', '^production']
        },
        test: {
          inputs: ['default', '^production', '{workspaceRoot}/jest.preset.js']
        },
        lint: {
          inputs: ['default', '{workspaceRoot}/.eslintrc.json']
        }
      },
      generators: {
        '@nx/react': {
          application: {
            style: 'css',
            linter: 'eslint',
            bundler: 'webpack'
          },
          component: {
            style: 'css'
          },
          library: {
            style: 'css',
            linter: 'eslint'
          }
        }
      }
    };
    
    fs.writeFileSync(
      path.join(this.projectRoot, 'nx.json'),
      JSON.stringify(nxConfig, null, 2)
    );
  }

  createProjectConfigs() {
    // Create project.json for each project
    const projects = ['mobile-app', 'backend-api', 'admin-portal'];
    
    projects.forEach(project => {
      const projectConfig = this.nxConfig.projects[project];
      const projectPath = path.join(this.projectRoot, projectConfig.root);
      
      if (fs.existsSync(projectPath)) {
        fs.writeFileSync(
          path.join(projectPath, 'project.json'),
          JSON.stringify(projectConfig, null, 2)
        );
      }
    });
  }

  createCIConfig() {
    const ciConfig = {
      name: 'GUILD App - Nx Cloud CI',
      on: {
        push: {
          branches: ['main', 'develop']
        },
        pull_request: {
          branches: ['main', 'develop']
        }
      },
      jobs: {
        'nx-cloud': {
          name: 'Nx Cloud',
          runsOn: 'ubuntu-latest',
          steps: [
            {
              name: 'Checkout',
              uses: 'actions/checkout@v4',
              with: {
                fetchDepth: 0
              }
            },
            {
              name: 'Setup Node.js',
              uses: 'actions/setup-node@v4',
              with: {
                nodeVersion: '18',
                cache: 'npm'
              }
            },
            {
              name: 'Install dependencies',
              run: 'npm ci'
            },
            {
              name: 'Nx Cloud',
              uses: 'nx-cloud/actions@latest',
              with: {
                nxCloudToken: '${{ secrets.NX_CLOUD_TOKEN }}'
              }
            }
          ]
        }
      }
    };
    
    fs.writeFileSync(
      path.join(this.projectRoot, '.github/workflows/nx-cloud.yml'),
      `name: GUILD App - Nx Cloud CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  nx-cloud:
    name: Nx Cloud
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetchDepth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          nodeVersion: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Nx Cloud
        uses: nx-cloud/actions@latest
        with:
          nxCloudToken: \${{ secrets.NX_CLOUD_TOKEN }}
`
    );
  }

  createWorkspaceScripts() {
    const scripts = {
      'build:all': 'nx run-many --target=build --all',
      'test:all': 'nx run-many --target=test --all',
      'lint:all': 'nx run-many --target=lint --all',
      'affected:build': 'nx affected --target=build',
      'affected:test': 'nx affected --target=test',
      'affected:lint': 'nx affected --target=lint',
      'graph': 'nx graph',
      'reset': 'nx reset',
      'migrate': 'nx migrate latest',
      'format': 'nx format:write',
      'format:check': 'nx format:check'
    };
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    packageJson.scripts = { ...packageJson.scripts, ...scripts };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

// Run the migration
if (require.main === module) {
  const migrator = new NxMigrationManager();
  migrator.migrate()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Run: npm install');
      console.log('2. Run: npx nx graph');
      console.log('3. Run: npx nx affected:build');
      console.log('4. Set up NX_CLOUD_TOKEN in GitHub secrets');
    })
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = NxMigrationManager;







