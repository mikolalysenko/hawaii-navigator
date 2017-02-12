#!/bin/bash

# first download all tiles from peer maps
rm -f tiles.txt;
peermaps files -156.064270 18.9136925 -154.8093872 20.2712955 | while read FILE ; do
  mkdir -p tiles/$(dirname $FILE) ;
  ipfs cat QmNPkqYfis1XV2CcAyE9ByttxGnvvtVJ4VfFXtbBWnd7fW/$FILE | gunzip > tiles/${FILE%.gz};
  osmconvert tiles/${FILE%.gz} --out-pbf > tiles/${FILE%.o5m.gz}.pbf;
  rm tiles/${FILE%.gz};
  echo tiles/${FILE%.o5m.gz}.pbf >> tiles.txt;
done

# glue tiles to construct graph data structure from OSM data
node build-graph.js > graph.json;

# build search index
node build-index.js > index.json;

# cut into tiles
node cut-tiles.js;
