#!/usr/bin/env sh

export GO111MODULE=on

go install github.com/projectdiscovery/proxify/cmd/proxify@latest
go install github.com/DimitarPetrov/stegify@latest
go install github.com/n7olkachev/imgdiff@latest
go install golang.org/x/lint/golint@latest
go install golang.org/x/tools/gopls@latest
go install github.com/onsi/ginkgo/v2/ginkgo@latest
go install github.com/go-delve/delve/cmd/dlv@latest

# doom go module dependencies
go install github.com/x-motemen/gore/cmd/gore@latest
go install github.com/stamblerre/gocode@latest
go install golang.org/x/tools/cmd/godoc@latest
go install golang.org/x/tools/cmd/goimports@latest
go install golang.org/x/tools/cmd/gorename@latest
go install golang.org/x/tools/cmd/guru@latest
go install github.com/cweill/gotests/...@latest
go install github.com/fatih/gomodifytags@latest
