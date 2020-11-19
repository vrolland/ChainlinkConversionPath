// SPDX-License-Identifier: MIT
pragma solidity >=0.4.25 <0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";

interface ERC20fraction {
  function decimals() external view returns (uint8);
}

interface AggregatorFraction {
  function decimals() external view returns (uint8);
  function latestAnswer() external view returns (int256);
  function latestTimestamp() external view returns (uint256);
}

/**
 * @title ConversionPath
 *
 * @notice ConversionPath is a contract allowing to compute conversion from a path of Chainlink
 */
contract ConversionPath is WhitelistAdminRole {
  using SafeMath for uint256;
    
  // Mapping of Chainlink aggrefators (input currency => output currency => contract address)
  // input & output currencies are the addresses of the ERC20 contracts OR the sha3("currency code")
  mapping(address => mapping(address => address)) public allAggregators;

  // rate must have been updated before the last... 10min
  uint256 public maxTimestampDeltaAcceptable = 600;

  // declare a new aggregator
  event UpdateAggregator(address _input, address _output, address _aggregator);

  /**
    * @notice Update an aggregator
    * @param _input address representing the input currency
    * @param _output address representing the output currency
    * @param _aggregator address of the aggregator contract
  */
  function updateAggregator(address _input, address _output, address _aggregator) 
    external
    onlyWhitelistAdmin  
  {
    allAggregators[_input][_output] = _aggregator;
    emit UpdateAggregator(_input, _output, _aggregator);
  }

  /**
    * @notice Update a list of aggregators
    * @param _inputs list of addresses representing the input currencies
    * @param _outputs list of addresses representing the output currencies
    * @param _aggregators list of addresses of the aggregator contracts
  */
  function updateListAggregators(address[] calldata _inputs, address[] calldata _outputs, address[] calldata _aggregators) 
    external
    onlyWhitelistAdmin  
  {
    require(_inputs.length == _outputs.length, "arrays must have the same length");
    require(_inputs.length == _aggregators.length, "arrays must have the same length");

    // For every conversions of the path
    for (uint i; i < _inputs.length; i++) {
      allAggregators[_inputs[i]][_outputs[i]] = _aggregators[i];
      emit UpdateAggregator(_inputs[i], _outputs[i], _aggregators[i]);
    }
  }

  /**
  * @notice Computes the conversion from an amount through a list of conversion
  * @param _amountIn Amount to convert
  * @param _path List of addresses representing the currencies for the conversions
  * @return result the result after all the conversions
  */
  function getConversion(
    uint256 _amountIn,
    address[] calldata _path
  ) 
    external
    view
    returns (uint256 result)
  {
    result = _amountIn;
    
    // For every conversions of the path
    for (uint i; i < _path.length - 1; i++) {
        // Get the input and output addresses representing the currencies
        (address input, address output) = (_path[i], _path[i + 1]);
        
        // Try to get the right aggregator for the conversion
        AggregatorFraction aggregator = AggregatorFraction(allAggregators[input][output]);
        bool reverseAggregator = false;

        // if no aggregator found we try to find an aggregator in the reverse way
        if(address(aggregator) == address(0x00)) {
          aggregator = AggregatorFraction(allAggregators[output][input]);
          reverseAggregator = true;
        }

        require(address(aggregator) != address(0x00), "No aggregator found");

        // by default we assume it is FIAT so 8 decimals
        uint256 decimalsInput = 8;
        // if address is 0, then it's ETH
        if(input == address(0x0)) {
          decimalsInput = 18;
        } else if(isContract(input)) {
          // otherwise, we get the decimals from the erc20 directly
          decimalsInput = ERC20fraction(input).decimals();
        }
       
        // by default we assume it is FIAT so 8 decimals
        uint256 decimalsOutput = 8;
        // if address is 0, then it's ETH
        if(output == address(0x0)) {
          decimalsOutput = 18;
        } else if(isContract(output)) {
          // otherwise, we get the decimals from the erc20 directly
          decimalsOutput = ERC20fraction(output).decimals();
        }
         
        // Check rate timestamp
        require(now.sub(aggregator.latestTimestamp()) <= maxTimestampDeltaAcceptable, "aggregator rate is outdated");
        
        // get the rate
        uint256 rate = uint256(aggregator.latestAnswer());
        // get the number of decimal of the rate
        uint256 decimalsAggregator = uint256(aggregator.decimals());
        
        // mul with the difference of decimals before the rate computation (for more precision)
        if(decimalsAggregator > decimalsInput) {
          result = result.mul(10**(decimalsAggregator-decimalsInput));
        }
        if(decimalsAggregator < decimalsOutput) {
          result = result.mul(10**(decimalsOutput-decimalsAggregator));
        }

        // Apply the rate (if path use an aggregator in the reverse way, div instead of mul)
        if(reverseAggregator) {
          result = result.mul(10**decimalsAggregator).div(rate);
        } else {
          result = result.mul(rate).div(10**decimalsAggregator);
        }

        // div with the difference of decimals AFTER the rate computation (for more precision)
        if(decimalsAggregator < decimalsInput) {
            result = result.div(10**(decimalsInput-decimalsAggregator));
        }
        if(decimalsAggregator > decimalsOutput) {
          result = result.div(10**(decimalsAggregator-decimalsOutput));
        }
    }
  }

  /**
  * @notice Checks if an address is a contract
  * @param _addr Address to check
  * @return true if the address host a contract, false otherwise
  */
  function isContract(address _addr) private view returns (bool){
    uint32 size;
    assembly {
      size := extcodesize(_addr)
    }
    return (size > 0);
  }
}
