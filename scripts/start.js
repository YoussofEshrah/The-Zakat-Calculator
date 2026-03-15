#!/usr/bin/env node
// Launch script that ensures ELECTRON_RUN_AS_NODE is fully removed
// (Claude Code and similar Electron-based tools set this variable,
// which prevents child Electron apps from starting properly)
delete process.env.ELECTRON_RUN_AS_NODE;

const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');

const child = spawn(electron, ['.'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: { ...process.env },
});

child.on('close', (code) => process.exit(code));
