module.exports = function merge (a, b) {
  var av = a.v
  var aw = a.w
  var bv = b.v
  var bw = b.w

  if (av.length <= 0 || bv.length <= 0) {
    return null
  }

  var aptr = 0
  var aacc = av[0]
  var bptr = 0
  var bacc = bv[0]

  var w
  var hitV = -1
  var hitW = Infinity

  while (true) {
    if (aacc < bacc) {
      aptr += 1
      if (aptr >= av.length) {
        break
      }
      aacc += av[aptr]
    } else if (aacc > bacc) {
      bptr += 1
      if (bptr >= bv.length) {
        break
      }
      bacc += bv[bptr]
    } else {
      w = aw[aptr] + bw[bptr]
      if (w < hitW) {
        hitV = aacc
        hitW = w
      }

      aptr += 1
      if (aptr < av.length) {
        aacc += av[aptr]
      }
      bptr += 1
      if (bptr < bv.length) {
        bacc += bv[bptr]
      }

      if (aptr >= av.length && bptr >= bv.length) {
        break
      }
    }

    while (aacc <= bacc) {
      if (aacc === bacc) {
        w = aw[aptr] + bw[bptr]
        if (w < hitW) {
          hitV = aacc
          hitW = w
        }
      }
      aptr += 1
      if (aptr >= av.length) {
        break
      }
      aacc += av[aptr]
    }

    while (bacc <= aacc) {
      if (aacc === bacc) {
        w = aw[aptr] + bw[bptr]
        if (w < hitW) {
          hitV = aacc
          hitW = w
        }
      }
      aptr += 1
      if (aptr >= av.length) {
        break
      }
      aacc += av[aptr]
    }

    if (hitV < 0) {
      return null
    }
    return {
      vertex: hitV,
      distance: hitW
    }
  }
}
