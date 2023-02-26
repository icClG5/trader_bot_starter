const fs = require("fs");
const path = require("path");

function parameterHandler(trader_bot_args, currentFilePath, process_name) {
  let execParams;
  let trader_bot_args_transformed = trader_bot_args
    .split("\\")
    .reduce((acc, line) => {
      const [key, value] = line.split("=");
      if (key) {
        acc[key.trim()] = value.trim();
      }
      return acc;
    }, {});

  const execPath = path.resolve(
    currentFilePath,
    `../${process_name}_config.cfg`
  );
  console.log(trader_bot_args, "trader_bot_args");
  execParams = JSON.stringify(trader_bot_args_transformed).replace(/"/g, '\\"');
  console.log(execParams, "execParams");
  fs.writeFileSync(execPath, execParams, function (err, res) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
  });
  return execParams;
}

module.exports = {
  parameterHandler,
};
