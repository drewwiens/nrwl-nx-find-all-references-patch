#!/usr/bin/env node

const { existsSync, unlinkSync } = require("fs");
const rimraf = require("rimraf");
const { join } = require("path");
const { promisify } = require("util");
const ncp = require("ncp").ncp;

const asyncNcp = promisify(ncp);
const asyncRimraf = promisify(rimraf);

function writeLine(str = "") {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(str);
}

(async () => {
  const tempDir = join(process.cwd(), ".farp");
  if (!existsSync(tempDir)) {
    console.error(`Existing patch not detected. Exiting`);
    process.exit(1);
  }
  await asyncNcp(tempDir, process.cwd());
  writeLine("Restored original tsconfig files");

  const file = "./tsconfig.json";
  if (existsSync(file) && !existsSync(join(tempDir, file))) {
    unlinkSync(file);
    writeLine("Removed " + file);
  }

  await asyncRimraf(tempDir);
  writeLine("Removed " + tempDir);
  writeLine("Removed patch successfully\n");
  process.exit();
})();
