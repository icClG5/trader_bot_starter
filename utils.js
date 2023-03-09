const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const currentFilePath = path.resolve(__dirname);

function parameterHandler(trader_bot_args, currentFilePath, process_name) {
  let execParams;
  let trader_bot_args_transformed = trader_bot_args
    .split("/")
    .reduce((result, item) => {
      const [key, value] = item.split("=");
      result[key] = value;
      return result;
    }, {});

  const execPath = path.resolve(
    currentFilePath,
    `../${process_name}_config.cfg`
  );

  if (fs.existsSync(execPath)) {
    // 清理之前的参数文件
    fs.unlinkSync(execPath);
  }

  console.log(trader_bot_args, "trader_bot_args");
  execParams = JSON.stringify(trader_bot_args_transformed).replace(/"/g, '\\"');
  console.log(execParams, "execParams");
  fs.writeFileSync(execPath, execParams, function (err) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
  });
  return execParams;
}

function clearPosition(param_str) {
  const obj = param_str.split("/").reduce((acc, item) => {
    const [key, value] = item.split("=");
    acc[key] = value;
    return acc;
  }, {});

  const keyValueArr = Object.entries(obj);
  const keyValueStr = keyValueArr
    .map(([key, value]) => `${key} = "${value}"`)
    .join("\n");

  fs.writeFileSync(
    path.resolve(currentFilePath, "../clean_position/config.toml"),
    keyValueStr
  );

  const pythonProcess = spawn(
    "python3",
    [
      path.resolve(currentFilePath, "../clean_position/run_quit.py"),
      "-c",
      "config.toml",
    ],
    {
      cwd: path.resolve(currentFilePath, "../clean_position"),
    }
  );

  pythonProcess.stdout.on("data", (data) => {
    console.log(`Python script output: ${data}`);
    process.exit(0);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Python script error: ${data}`);
    process.exit(1);
  });

  pythonProcess.on("close", (code) => {
    console.log(`Python script exited with code ${code}`);
    process.exit(2);
  });
}

module.exports = {
  parameterHandler,
  clearPosition,
};
