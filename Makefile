SHELL=/bin/bash
TARGET_SRC=$(shell shopt -s globstar && ls ./*.ts | grep -v ./vendor)

lint:
	deno fmt --check $(TARGET_SRC)
	deno lint --unstable $(TARGET_SRC)

fmt:
	deno fmt $(TARGET_SRC)

install-local:
	deno install --allow-read --allow-write --allow-net -f -n dem-local ./cmd.ts

test: test/cmd

test/cmd:
	# test ensure / prune
	mkdir -p tmp/welcome
	echo "import './vendor/welcome.ts'" > tmp/welcome/mod.ts
	cd tmp/welcome && \
		dem-local init && \
		dem-local add https://deno.land/std@0.69.0 && \
		dem-local alias https://deno.land/std/examples/welcome.ts welcome.ts && \
		dem-local ensure && \
		dem-local prune
	deno run -r -c ./tsconfig.json tmp/welcome/mod.ts | grep -q 'Welcome to Deno'

	# test unlink / link
	rm tmp/welcome/mod.ts
	echo "import './vendor/https/deno.land/std/examples/welcome.ts'" > tmp/welcome/mod.ts
	cd tmp/welcome && \
		dem-local unalias welcome.ts && \
		dem-local unlink https://deno.land/std/examples/welcome.ts && \
		dem-local remove https://deno.land/std && \
		dem-local add https://deno.land/std@0.69.0 && \
		dem-local link https://deno.land/std/examples/welcome.ts
	deno run -r -c ./tsconfig.json tmp/welcome/mod.ts | grep -q 'Welcome to Deno'

	rm -rf tmp/welcome

.PHONY: lint fmt install-local test test/cmd
