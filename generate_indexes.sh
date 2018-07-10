#!/bin/bash

version=$(git describe --tags --always)
header="CantusEditor"

# Generate the index for the mei folder
python3 make_index.py --header "$header" --version "$version" "./resources/mei/" > ./resources/mei/index.html

# Generate the index for the csg-0390 folder
# TODO: This should be done automatically by a recursive function
python3 make_index.py --header "$header" --version "$version" "./resources/mei/csg-0390" > ./resources/mei/csg-0390/index.html

