.PHONY: install-local
install-local:
	deno install --allow-read --allow-write -f dem-local ./cmd.ts

.PHONY: test
test: test/cmd

.PHONY: test/cmd
test/cmd:
	mkdir -p tmp/welcome
	echo "import './vendor/https/deno.land/std/examples/welcome.ts'" > tmp/welcome/mod.ts
	cd tmp/welcome && \
		dem-local init && \
		dem-local add https://deno.land/std@v0.35.0 && \
		dem-local ensure \
		dem-local prune
	deno -c ./tsconfig.json tmp/welcome/mod.ts | grep -q 'Welcome to Deno'
	rm -rf tmp/welcome
