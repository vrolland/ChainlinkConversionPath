const ChainlinkConversionPath = artifacts.require("ChainlinkConversionPath");

const USDT_fake = artifacts.require("USDT_fake");


const address1 = "0x1111111111111111111111111111111111111111";
const address2 = "0x2222222222222222222222222222222222222222";
const address3 = "0x3333333333333333333333333333333333333333";
const address4 = "0x4444444444444444444444444444444444444444";
const address5 = "0x5555555555555555555555555555555555555555";
const address6 = "0x6666666666666666666666666666666666666666";

const ETH_address = "0x0000000000000000000000000000000000000000";
const USD_address = "0x0000000000000000000000000000000000000001";
const EUR_address = "0x0000000000000000000000000000000000000002";
const DAI_address = "0x0000000000000000000000000000000000000003";
let USDT_address;


let conversionPathInstance;
let USDT_Instance;

contract('ChainlinkConversionPath', (accounts) => {
  describe('updateAggregator', async () => {
    beforeEach(async () => {
      conversionPathInstance = await ChainlinkConversionPath.new();
    });

    it('can updateAggregator', async () => {
      let addressAggregator = await conversionPathInstance.allAggregators(address1, address2)
      assert.equal(addressAggregator, '0x0000000000000000000000000000000000000000', "addressAggregator must be 0x");

      await conversionPathInstance.updateAggregator(address1, address2, address3);

      addressAggregator = await conversionPathInstance.allAggregators(address1, address2)
      assert.equal(addressAggregator,address3, "addressAggregator must be 0x333..");
    }); 
  });
  
  describe('updateListAggregators', async () => {
    beforeEach(async () => {
      conversionPathInstance = await ChainlinkConversionPath.new();
    });
    
    it('can updateListAggregators', async () => {
      let addressAggregator = await conversionPathInstance.allAggregators(address1, address2)
      assert.equal(addressAggregator, '0x0000000000000000000000000000000000000000', "addressAggregator must be 0x");

      addressAggregator = await conversionPathInstance.allAggregators(address4, address5)
      assert.equal(addressAggregator, '0x0000000000000000000000000000000000000000', "addressAggregator must be 0x");

      await conversionPathInstance.updateListAggregators( [address1, address4], 
                                                          [address2, address5], 
                                                          [address3, address6]);

      addressAggregator = await conversionPathInstance.allAggregators(address1, address2)
      assert.equal(addressAggregator,address3, "addressAggregator must be 0x333..");
      addressAggregator = await conversionPathInstance.allAggregators(address4, address5)
      assert.equal(addressAggregator,address6, "addressAggregator must be 0x666..");
    }); 
  });

  describe('getOneConversion', async () => {
    beforeEach(async () => {
      conversionPathInstance = await ChainlinkConversionPath.deployed();
      USDT_Instance = await USDT_fake.deployed();
      USDT_address = USDT_Instance.address;
    });

    describe('only fiat conversion', async () => {
      it('can convert EUR to USD', async () => {
        const conversion = await conversionPathInstance.getOneConversion.call("10000000000", [EUR_address, USD_address]);
        assert.equal(conversion.result.toString(10), '11882200000', "wrong conversion");
      });

      it('can convert USD to EUR', async () => {
        const conversion = await conversionPathInstance.getOneConversion.call("10000000000", [USD_address, EUR_address]);
        assert.equal(conversion.result.toString(10), '8415949908', "wrong conversion");
      });

      it('can convert USD to EUR to USD', async () => {
        const conversion = await conversionPathInstance.getOneConversion.call("10000000000", [USD_address, EUR_address, USD_address]);
        assert.equal(conversion.result.toString(10), '9999999999', "wrong conversion");   
      });   
    });

    describe('Ethereum conversion', async () => {
      it('can convert USD to ETH', async () => {
        conversion = await conversionPathInstance.getOneConversion.call("10000000000", [USD_address, ETH_address]);
        assert.equal(conversion.result.toString(10), '209280136491393323', "wrong conversion"); 
      });   

      it('can convert ETH to USD', async () => {
        conversion = await conversionPathInstance.getOneConversion.call("209280136491393323", [ETH_address, USD_address]);
        assert.equal(conversion.result.toString(10), '9999999999', "wrong conversion");  
      });   

      it('can convert EUR to USD to ETH', async () => {
        conversion = await conversionPathInstance.getOneConversion.call("10000000000", [EUR_address, USD_address, ETH_address]);
        assert.equal(conversion.result.toString(10), '248670843781803374', "wrong conversion"); 
      });   

      it('can convert ETH to USD to EUR', async () => {
        conversion = await conversionPathInstance.getOneConversion.call("248670843781803374", [ETH_address, USD_address, EUR_address]);
        assert.equal(conversion.result.toString(10), '9999999999', "wrong conversion");
      });
    });

    describe('USDT conversion', async () => {
      it('can convert USD to ETH to USDT', async () => {
        const conversion = await conversionPathInstance.getOneConversion.call("10000000000", [USD_address, ETH_address, USDT_address]);
        assert.equal(conversion.result.toString(10), '100146471', "wrong conversion");
      }); 

      it('can convert USDT to ETH to USD', async () => {
        const conversion = await conversionPathInstance.getOneConversion.call("100146471", [USDT_address, ETH_address, USD_address]);
        assert.equal(conversion.result.toString(10), '9999999904', "wrong conversion");
      }); 
    }); 
  });

  describe('getConversions', async () => {
    beforeEach(async () => {
      conversionPathInstance = await ChainlinkConversionPath.deployed();
      USDT_Instance = await USDT_fake.deployed();
      USDT_address = USDT_Instance.address;
    });

    describe('only fiat conversion', async () => {
      it('can convert EUR to USD', async () => {
        const conversion = await conversionPathInstance.getConversions.call(["10000000000", "20000000000"], [EUR_address, USD_address]);
        assert.equal(conversion.results[0].toString(10), '11882200000', "wrong conversion");
        assert.equal(conversion.results[1].toString(10), '23764400000', "wrong conversion");
      });

      it('can convert USD to EUR', async () => {
        const conversion = await conversionPathInstance.getConversions.call(["10000000000", "20000000000"], [USD_address, EUR_address]);
        assert.equal(conversion.results[0].toString(10), '8415949908', "wrong conversion");
        assert.equal(conversion.results[1].toString(10), '16831899816', "wrong conversion");
      });

      it('can convert USD to EUR to USD', async () => {
        const conversion = await conversionPathInstance.getConversions.call(["10000000000", "20000000000"], [USD_address, EUR_address, USD_address]);
        assert.equal(conversion.results[0].toString(10), '9999999999', "wrong conversion");
        assert.equal(conversion.results[1].toString(10), '19999999999', "wrong conversion");
      });   
    });

    describe('Ethereum conversion', async () => {
      it('can convert USD to ETH', async () => {
        const conversion = await conversionPathInstance.getConversions.call(["10000000000", "20000000000"], [USD_address, ETH_address]);
        assert.equal(conversion.results[0].toString(10), '209280136491393323', "wrong conversion");
        assert.equal(conversion.results[1].toString(10), '418560272982786647', "wrong conversion");
      });   

      it('can convert ETH to USD', async () => {
        const conversion = await conversionPathInstance.getConversions.call(["209280136491393323", '418560272982786647'], [ETH_address, USD_address]);
        assert.equal(conversion.results[0].toString(10), '9999999999', "wrong conversion");
        assert.equal(conversion.results[1].toString(10), '19999999999', "wrong conversion");
      });   

      it('can convert EUR to USD to ETH', async () => {
        const conversion = await conversionPathInstance.getConversions.call(["10000000000", "20000000000"], [EUR_address, USD_address, ETH_address]);
        assert.equal(conversion.results[0].toString(10), '248670843781803374', "wrong conversion");
        assert.equal(conversion.results[1].toString(10), '497341687563606749', "wrong conversion");
      });   

      it('can convert ETH to USD to EUR', async () => {
          const conversion = await conversionPathInstance.getConversions.call(["248670843781803374", "497341687563606749"], [ETH_address, USD_address, EUR_address]);
          assert.equal(conversion.results[0].toString(10), '9999999999', "wrong conversion");
          assert.equal(conversion.results[1].toString(10), '19999999999', "wrong conversion");
      });
    });

    describe('USDT conversion', async () => {
      it('can convert USD to ETH to USDT', async () => {
        const conversion = await conversionPathInstance.getConversions.call(["10000000000", "20000000000"], [USD_address, ETH_address, USDT_address]);
        assert.equal(conversion.results[0].toString(10), '100146471', "wrong conversion");
        assert.equal(conversion.results[1].toString(10), '200292943', "wrong conversion");
      }); 

      it('can convert USDT to ETH to USD', async () => {
        const conversion = await conversionPathInstance.getConversions.call(["100146471", "200292942"], [USDT_address, ETH_address, USD_address]);
        assert.equal(conversion.results[0].toString(10), '9999999904', "wrong conversion");
        assert.equal(conversion.results[1].toString(10), '19999999809', "wrong conversion");
      }); 
    }); 
  });
});