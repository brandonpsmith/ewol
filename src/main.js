import { resolve } from "path";
import { readFileSync } from "fs";

import Debug from "debug";

import wrap from "wrap-ansi";
import { width } from "window-size";
import chalk from "chalk";

const debug = Debug("ewol");

const loadConfig = config => {
  try {
    debug(`reading config file "${config}"`);
    const file = readFileSync(config, { encoding: "utf8" });
    debug(`parsing config file "${config}"`);
    if (file.trim() !== "") return JSON.parse(file);
  } catch (e) {
    debug(e.message);
    console.error(chalk.red(`cannot read config file ${config}`));
    process.exit(1);
  }
};

const verifyVariables = variables =>
  Object.keys(variables || {}).reduce(
    (obj, name) => {
      const variable = variables[name];

      // does this environment variable exists
      debug(`checking for environment variable "${name}"`);
      const env = typeof process.env[name] !== "undefined";
      debug(`environment variable "${name}" ${env ? "found" : "NOT found"}`);

      // check for a default value and set it if it does not exist
      if (typeof variable.default !== "undefined") {
        if (!env) process.env[name] = variable.default;
        return obj;
      }

      // if it is required and the environment variable does not exists
      if (typeof variable.required !== "boolean" || variable.required) {
        if (!env) obj.required.push({ name, description: variable.description });
        return obj;
      }

      if (!env) obj.optional.push({ name, description: variable.description });

      return obj;
    },
    { required: [], optional: [] }
  );

// print variables
const printVariables = (variables, type, color, out) => {
  const count = variables.length;
  const s = count === 1 ? "" : "s";
  const verb = count === 1 ? "is" : "are";

  const header = color(`The following ${count} environmental variable${s} ${verb} ${type}:`);

  const messages = variables.reduce(
    (str, variables) => (str += `\n${chalk.blue(variables.name)} ${variables.description}`),
    ""
  );

  out(`\n${wrap(`${header}${messages}`, width)}\n`);
};

export const check = ({
  config = resolve(process.cwd(), "env.json"),
  print = { required: true, optional: false }
} = {}) => {
  const { required, optional } = verifyVariables(loadConfig(config));

  debug(`total required missing variables: ${required.length}`);
  debug(`total optional missing variables: ${optional.length}`);

  if (print.required && required.length >= 1) {
    printVariables(required, "required", chalk.bgRed.black, console.error);
  }

  if (print.optional && optional.length >= 1) {
    printVariables(optional, "missing (but optional)", chalk.bgYellow.black, console.log);
  }

  if (required.length) {
    process.exit(1);
  }
};
