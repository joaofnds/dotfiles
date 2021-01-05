#!/usr/bin/env sh

export GO111MODULE=on

go get -u github.com/projectdiscovery/proxify/cmd/proxify
go get -u github.com/DimitarPetrov/stegify
go get -u github.com/n7olkachev/imgdiff
go get -u golang.org/x/tools/gopls
