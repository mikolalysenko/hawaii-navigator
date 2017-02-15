# hawaii-navigator

A content addressable index for routing optimized for the Hawaiian archipelago.

## Example

```javascript
var createNavigator = require('hawaii-navigator')

var nav = createNaviagor(getFile)
```

## Index creation

This is pretty janky right now but to build the index, first start the IPFS daemon:

```
ipfs daemon
```

Then run the following command:

```
./run.sh
```

You can post the index to IPFS with this command:

```
ipfs add -r hub
```
