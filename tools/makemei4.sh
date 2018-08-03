#!/bin/bash

mei4fy=../../../tools/mei4fy.py

for file in *.mei
do
	echo $file;
	python3 $mei4fy "$file" > ${file}4
	mv ${file}4 $file
done