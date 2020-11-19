const AggDAI_USD = artifacts.require("Agg_DAI_USD");
const AggETH_USD = artifacts.require("Agg_ETH_USD");
const AggEUR_USD = artifacts.require("Agg_EUR_USD");
const AggUSDT_ETH = artifacts.require("Agg_USDT_ETH");

const USDT_fake = artifacts.require("USDT_fake");

const ConversionPath = artifacts.require("ConversionPath");

module.exports = async function(deployer) {
  await deployer.deploy(AggDAI_USD);
  await deployer.deploy(AggETH_USD);
  await deployer.deploy(AggEUR_USD);
  await deployer.deploy(AggUSDT_ETH);
  await deployer.deploy(USDT_fake);

  const ETH_address = "0x0000000000000000000000000000000000000000";
  const USD_address = "0x0000000000000000000000000000000000000001";
  const EUR_address = "0x0000000000000000000000000000000000000002";
  const DAI_address = "0x0000000000000000000000000000000000000003";
  const USDT_address = USDT_fake.address;

  const conversionPathInstance = await deployer.deploy(ConversionPath);

  await conversionPathInstance.updateListAggregators( [DAI_address,         EUR_address,        ETH_address,        USDT_address], 
                                                      [USD_address,         USD_address,        USD_address,        ETH_address], 
                                                      [AggDAI_USD.address,  AggEUR_USD.address, AggETH_USD.address, AggUSDT_ETH.address]);
};
