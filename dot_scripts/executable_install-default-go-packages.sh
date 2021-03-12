#!/usr/bin/env sh

export GO111MODULE=on

go get -u github.com/projectdiscovery/proxify/cmd/proxify
go get -u github.com/DimitarPetrov/stegify
go get -u github.com/n7olkachev/imgdiff
go get -u golang.org/x/lint/golint
go get -u golang.org/x/tools/gopls

# doom go module dependencies
go get -u github.com/motemen/gore/cmd/gore
go get -u github.com/stamblerre/gocode
go get -u golang.org/x/tools/cmd/godoc
go get -u golang.org/x/tools/cmd/goimports
go get -u golang.org/x/tools/cmd/gorename
go get -u golang.org/x/tools/cmd/guru
go get -u github.com/cweill/gotests/...
go get -u github.com/fatih/gomodifytags
