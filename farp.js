#!/usr/bin/env node

const {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
} = require("fs");
const { dirname, relative, join, sep } = require("path");
const { promisify } = require("util");
const glob = require("glob");
const stripJsonComments = require("strip-json-comments");

const asyncGlob = promisify(glob);

function writeLine(str = "") {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(str);
}

(async () => {
  const tempDir = join(process.cwd(), ".farp");
  if (existsSync(tempDir)) {
    console.error(`Already patched. Delete ${tempDir} to override.`);
    process.exit(2);
  }
  mkdirSync(tempDir);
  const saveOriginal = (file) => {
    const dest = join(tempDir, relative(process.cwd(), file));
    const dirpath = relative(process.cwd(), dirname(dest));
    let subpath = "";
    for (const dir of dirpath.split(sep)) {
      subpath = join(subpath, dir);
      if (!existsSync(subpath)) {
        mkdirSync(subpath); // Keep dir structure
      }
    }
    copyFileSync(file, dest); // Save original file
  };

  let str, tsconfig;

  const appsTsconfigs = await asyncGlob(
    join(process.cwd(), "apps", "**", "tsconfig.json")
  );
  const libsTsconfigs = await asyncGlob(
    join(process.cwd(), "libs", "**", "tsconfig.json")
  );
  const appsAndLibsTsconfigs = [...appsTsconfigs, ...libsTsconfigs];
  const allChildTsconfigs = await asyncGlob(
    join(process.cwd(), "{apps,libs}", "**", "tsconfig.{app,lib}.json")
  );

  // Set composite and declaration in each app and lib's tsconfig.json:
  for (const file of appsAndLibsTsconfigs) {
    saveOriginal(file);
    str = readFileSync(file, { encoding: "utf8" });
    tsconfig = JSON.parse(stripJsonComments(str));
    tsconfig.compilerOptions = {
      ...tsconfig.compilerOptions,
      composite: true,
      declaration: true,
    };
    writeFileSync(file, JSON.stringify(tsconfig), { encoding: "utf8" });
    writeLine("Patched " + file);
  }

  // Include all libs' ts files in all tsconfig.{app,lib}.json files:
  for (const file of allChildTsconfigs) {
    saveOriginal(file);
    const dir = dirname(file);
    const relativePathsToLibsTs = libsTsconfigs
      .map((libPath) => relative(dir, dirname(libPath)))
      .filter((path) => path.length > 0); // Don't include self
    str = readFileSync(file, { encoding: "utf8" });
    tsconfig = JSON.parse(stripJsonComments(str));
    tsconfig.include = [
      ...(tsconfig.include || []).filter((s) => !s.includes("..")),
      ...relativePathsToLibsTs.map((path) => `${path}/src/**/*.ts`),
    ];
    tsconfig.exclude = [
      ...(tsconfig.exclude || []).filter((s) => !s.includes("..")),
      ...relativePathsToLibsTs.map((path) => `${path}/src/**/*.spec.ts`),
    ];
    writeFileSync(file, JSON.stringify(tsconfig), { encoding: "utf8" });
    writeLine("Patched " + file);
  }

  // Save paths to all apps and libs in top-level tsconfig.json:
  const file = "tsconfig.json";
  if (existsSync(file)) {
    saveOriginal(file);
    str = readFileSync(file, { encoding: "utf8" });
  }
  tsconfig = JSON.parse(stripJsonComments(str || "{}"));
  tsconfig.references = appsAndLibsTsconfigs.map((path) => ({
    path: `./${path.replace("/tsconfig.json", "")}`,
  }));
  str = JSON.stringify(tsconfig);
  writeFileSync(file, str, { encoding: "utf8" });
  writeLine("Patched tsconfig.json");
  writeLine("Find All References should work now\n");
  console.log('Run "unfarp" to undo the patch');
  console.log("The app will not work while the patch is in place");
  process.exit();
})();
