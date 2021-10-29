#!/usr/bin/env node

(() => {
  const chalk = require("chalk");
  const { program } = require("commander");
  const inquirer = require("inquirer");
  const nodePath = require("path");
  const fs = require("fs");
  const licensePath = nodePath.join(__dirname, "..", "licenseLib");
  const cwd = process.cwd();
  const error = chalk.bold.red;
  const success = chalk.bold.green;
  const doing = chalk.bold.blue;
  program.version("1.0.2");

  program
    .option("-u, --update", "更新开源协议(未实现)")
    .option("-d, --drop", "不保留原开源协议")
    .option("-a, --auth <auth>", "协议所有者姓名")
    .option("-n, --name <name>", "指定开源协议名称(模糊匹配)")
    .option("-p, --path <path>", "协议生成绝对路径");

  program.parse(process.argv);
  const options = program.opts();
  const { drop, name, path, auth } = options;
  let licenseFiles = fs.readdirSync(licensePath);
  if (name) {
    licenseFiles = licenseFiles.filter(
      (fileName) =>
        fileName.toLocaleUpperCase().indexOf(name.toLocaleUpperCase()) > -1
    );
    if (!licenseFiles.length) {
      console.log(error("此开源协议不存在,请检查协议名称输入是否有误"));
      return;
    }
  }
  const promptList = [
    {
      programName: "auth",
      type: "input",
      message: "请输入协议署名",
      name: "authName",
      default: "",
      validate: (val) => {
        return val ? true : "请输入协议署名";
      },
    },
    {
      programName: "drop",
      type: "confirm",
      message: "是否保留原开源协议",
      name: "retain",
    },
    {
      programName: "name",
      type: "list",
      message: "请选择一种协议",
      name: "licenseName",
      choices: licenseFiles,
    },
  ];
  inquirer
    .prompt(
      promptList.filter(({ programName, choices }) => {
        if (programName === "name") return choices.length !== 1;
        return !options[programName];
      })
    )
    .then(({ licenseName, retain, authName }) => {
      const fDrop = drop || !retain;
      const fAuth = auth || authName;
      const fPath = path || cwd;
      const year = new Date().getFullYear();
      const timestamp = Date.now();
      console.log(doing("正在读取指定开源协议"));
      const fileBody = fs.readFileSync(
        nodePath.join(licensePath, licenseName || name),
        "utf8"
      );
      console.log(doing("正在修改开源协议内容"));
      const fBody = fileBody.replace("$year", year).replace("$name", fAuth);
      if (!fDrop) {
        console.log(doing("正在检查旧版开源协议"));
        const flag = fs.existsSync(nodePath.join(fPath, "LICENSE"));
        if (flag) {
          console.log(doing("旧版开源协议存在,正在重命名旧版协议"));
          const old = fs.readFileSync(nodePath.join(fPath, "LICENSE"), "utf8");
          fs.writeFileSync(
            nodePath.join(fPath, `LICENSE.old.${timestamp}`),
            old
          );
          console.log(doing("旧版开源协议重命名完成,正在写入新的协议"));
        } else {
          console.log(doing("旧版开源协议不存在,正在写入新的协议"));
        }
      }
      fs.writeFileSync(nodePath.join(fPath, `LICENSE`), fBody);
      console.log(success("新的开源协议已经生成啦"));
    });
})();
