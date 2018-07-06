#!/bin/bash

version=$(git describe --tags --always)
header="CantusEditor"

# Generate the index for the mei folder
python3 make_index.py --header "$header" --version "$version" "./resources/mei/" > ./resources/mei/index.html
