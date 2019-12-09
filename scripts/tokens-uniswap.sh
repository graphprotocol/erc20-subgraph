curl \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{ "query": "{ uniswap(id: 1) { exchanges(first: 200, orderBy: ethLiquidity, orderDirection: desc) { tokenAddress tokenSymbol tokenName tokenDecimals } } }" }' \
  https://api.thegraph.com/subgraphs/name/graphprotocol/uniswap