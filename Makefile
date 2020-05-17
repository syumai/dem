SHELL=/bin/bash
TARGET_SRC=$(shell shopt -s globstar && ls ./*.ts | grep -v ./vendor)

lint:
	deno fmt --check $(TARGET_SRC)

fmt:
	deno fmt $(TARGET_SRC)

install-local:
	deno install --allow-read --allow-write -f -n dem-local ./cmd.ts

test: test/cmd

test/cmd:
	mkdir -p tmp/welcome
	echo "import './vendor/https/deno.land/std/examples/welcome.ts'" > tmp/welcome/mod.ts
	cd tmp/welcome && \
		dem-local init && \
		dem-local add https://deno.land/std@v0.35.0 && \
		dem-local ensure \
		dem-local prune
	deno run -c ./tsconfig.json tmp/welcome/mod.ts | grep -q 'Welcome to Deno'
	rm -rf tmp/welcome

.PHONY: lint fmt install-local test test/cmd
