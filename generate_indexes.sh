#!/bin/bash

version=$(git describe --tags)
header="Cantus Editor"

# Generate the index for the mei folder
python3 make_index.py ./resources/mei --header $header --version $version > ./resources/index.html


# Generate the index for the mei folder
python3 make_index.py ./meix.js/validation --header $header --version $version > ./meix.js/validation/index.html

