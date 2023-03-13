const pm2 = require("pm2");
const fs = require("fs");
const path = require("path");
const currentFilePath = path.resolve(__dirname);

function startRunKucoin(process_name, trader_bot_args) {
  const obj = trader_bot_args.split("/").reduce((acc, item) => {
    const [key, value] = item.split("=");
    acc[key] = value;
    return acc;
  }, {});

  const keyValueArr = Object.entries(obj);
  const keyValueStr = keyValueArr
    .map(([key, value]) => `${key} = "${value}"`)
    .join("\n");

  const cofigFileName = `${process_name}_config.toml`;

  fs.writeFileSync(
    path.resolve(currentFilePath, `../newfast/${cofigFileName}`),
    keyValueStr
  );

  pm2.start(
    {
      script: path.resolve(currentFilePath, `../newnewfast/run.py`),
      interpreter: "python",
      name: process_name,
      args: ["-c", cofigFileName],
      cwd: path.resolve(currentFilePath, "../"),
    },
    function (err) {
      if (!err) {
        console.log("====== kucoin_trader_bot_starter start success  ======");
      } else {
        console.log("====== kucoin_trader_bot_starter start fail  ======");
      }
    }
  );
}

module.exports = {
  startRunKucoin,
};
